import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';
import { applyAuditVerdicts, auditEvents } from './audit';
import { capSeverityBySourceCount } from './cap-severity';
import { extractEvents } from './extract-events';
import { dedupeArticles } from '../lib/feeds';
import { preFilter } from './pre-filter';
import { recomputeScores } from './recompute-scores';
import { validateMany } from './validate';
import { fetchArchivedRssRange } from './wayback-fetcher';
import {
  RawArticleSchema,
  type Event,
  type IsoWeek,
  type RawArticle,
} from '../lib/types';

/**
 * Backfill pipeline for historical periods where RSS feeds no longer carry
 * the original items. Two input modes:
 *
 * 1. **Seed file** (`--seed=path.json`): pre-curated list of articles
 *    `[{date, url, headline/title, outlet, summary?}]`. Pre-filter is
 *    skipped by default — items are assumed already relevant.
 * 2. **Wayback** (`--wayback --from=YYYY-MM-DD --to=YYYY-MM-DD --sources=...`):
 *    queries archived RSS snapshots from web.archive.org for each source's
 *    feed URL, weekly. Pre-filter is run by default — Wayback returns the
 *    raw RSS dump including sport / lifestyle.
 *
 * Articles are grouped by ISO week derived from their date (or extracted
 * event.date), classified per-week, then written to data/events/<week>.json.
 * After all weeks: recomputeScores rebuilds the timeline.
 *
 * **Overwrite warning:** existing events files for the touched weeks are
 * REPLACED, not merged. Run backfill on date ranges that don't overlap with
 * the live cron output, or accept that overlap windows lose existing data.
 */

const DEFAULT_PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

/** Seed file format: lighter than RawArticle, fetched_at is auto-generated. */
const SeedItemSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: z.string().url(),
  /** Either `headline` or `title` accepted as the article title. */
  title: z.string().min(1).optional(),
  headline: z.string().min(1).optional(),
  outlet: z.string().min(1),
  summary: z.string().optional(),
});

const SeedFileSchema = z.array(SeedItemSchema);

export interface BackfillOptions {
  baselineQuarter: string;
  /** Path to seed JSON. Mutually exclusive with `wayback`. */
  seedFile?: string;
  /** Wayback mode config. Mutually exclusive with `seedFile`. */
  wayback?: {
    from: string;
    to: string;
    /** Source IDs from config/sources.yaml to backfill. */
    sourceIds: readonly string[];
  };
  projectRoot?: string;
  /** Skip pre-filter (default: true for seed mode, false for wayback). */
  skipPreFilter?: boolean;
  /** Skip auditor pass (default: true to save cost on bulk runs). */
  skipAudit?: boolean;
  onProgress?: (msg: string) => void;
}

export interface BackfillResult {
  weeksProcessed: readonly IsoWeek[];
  totalArticles: number;
  totalEvents: number;
  perWeek: Array<{ week: IsoWeek; articles: number; events: number }>;
}

export async function runBackfill(options: BackfillOptions): Promise<BackfillResult> {
  const root = options.projectRoot ?? DEFAULT_PROJECT_ROOT;
  const log = options.onProgress ?? (() => {});

  // 1. Source: seed file or Wayback
  let articles: RawArticle[];
  let defaultSkipPreFilter = false;
  if (options.seedFile) {
    articles = await loadSeed(options.seedFile);
    defaultSkipPreFilter = true;
    log(`Loaded ${articles.length} articles from seed ${options.seedFile}`);
  } else if (options.wayback) {
    articles = await fetchFromWaybackForSources(root, options.wayback, log);
    log(`Fetched ${articles.length} unique articles from Wayback`);
  } else {
    throw new Error('Backfill requires either --seed or --wayback');
  }
  const skipPreFilter = options.skipPreFilter ?? defaultSkipPreFilter;
  if (articles.length === 0) {
    log('No articles to process — done.');
    return { weeksProcessed: [], totalArticles: 0, totalEvents: 0, perWeek: [] };
  }

  // 2. Group by ISO week of article date
  const articlesByWeek = groupByWeek(articles);
  const weeks = [...articlesByWeek.keys()].sort();
  log(`Articles span ${weeks.length} weeks: ${weeks[0]} → ${weeks[weeks.length - 1]}`);

  // 3. Per-week: pre-filter (optional) → classify → cap → audit (optional) → write
  const perWeek: BackfillResult['perWeek'] = [];
  let totalEvents = 0;

  for (const week of weeks) {
    const weekArticles = articlesByWeek.get(week)!;
    log(`\n▶ ${week} — ${weekArticles.length} articles`);

    // Per-week try/catch — jeden zlomený týden nesmí zabít celý backfill běh.
    // Typický důvod selhání: Sonnet vrátí malformed JSON na konkrétní batch
    // článků (i přes messages.parse + jsonSchemaOutputFormat se to občas
    // stane, hlavně u větších batchů). Ten týden se přeskočí, ostatní pokračují.
    try {
      const preFiltered = skipPreFilter
        ? weekArticles.map((a) => ({
            ...a,
            candidate_pillar: null,
            reason_kept: 'curated seed',
          }))
        : await preFilter(weekArticles);
      log(`  pre-filtered: ${preFiltered.length} kept`);

      if (preFiltered.length === 0) {
        perWeek.push({ week, articles: weekArticles.length, events: 0 });
        continue;
      }

      // Classify with the week label that matches event.date's week (already
      // grouped). The week serves to build IDs (e.g. 2025-W17-001).
      const weekDate = mondayOfWeek(week);
      const candidates = await extractEvents(preFiltered, { week, now: weekDate });

      const { valid: validEvents } = await validateMany<Event>('event', candidates);
      const { events: capped, capped: capAdjustments } = capSeverityBySourceCount(validEvents);
      log(`  classified: ${validEvents.length} valid, ${capAdjustments.length} severity capped`);

      let finalEvents = capped;
      if (!options.skipAudit && capped.length > 0) {
        const audit = await auditEvents(capped);
        finalEvents = applyAuditVerdicts(capped, audit);
        const flagged = audit.per_event.filter((v) => v.verdict !== 'pass').length;
        log(`  audit: ${flagged} flagged/downgraded of ${audit.per_event.length}`);
      }

      await writeEventsFile(root, week, finalEvents);
      perWeek.push({ week, articles: weekArticles.length, events: finalEvents.length });
      totalEvents += finalEvents.length;
    } catch (err) {
      log(`  ✗ FAILED: ${(err as Error).message.slice(0, 200)}`);
      perWeek.push({ week, articles: weekArticles.length, events: 0 });
      // Continue to next week — caller can re-run for failed weeks separately.
    }
  }

  // 4. Recompute timeline across all events
  log('\n▶ Recomputing timeline');
  const recompute = await recomputeScores({
    baselineQuarter: options.baselineQuarter,
    projectRoot: root,
  });
  log(`Wrote timeline with ${recompute.weeksProcessed} snapshot(s)`);

  return {
    weeksProcessed: weeks as IsoWeek[],
    totalArticles: articles.length,
    totalEvents,
    perWeek,
  };
}

async function loadSeed(file: string): Promise<RawArticle[]> {
  const raw = await readFile(file, 'utf-8');
  const parsed = SeedFileSchema.parse(JSON.parse(raw));
  const fetchedAt = new Date().toISOString();
  return parsed.map((s) => {
    const title = s.title ?? s.headline;
    if (!title) throw new Error(`Seed item missing title: ${JSON.stringify(s)}`);
    const item: RawArticle = {
      url: s.url,
      title,
      outlet: s.outlet,
      published_at: `${s.date}T00:00:00.000Z`,
      fetched_at: fetchedAt,
      ...(s.summary ? { summary: s.summary } : {}),
    };
    return RawArticleSchema.parse(item);
  });
}

async function fetchFromWaybackForSources(
  root: string,
  wayback: NonNullable<BackfillOptions['wayback']>,
  log: (msg: string) => void,
): Promise<RawArticle[]> {
  // Re-use sources.yaml; require source IDs to map to feed URLs.
  const { loadSources } = await import('./fetch-sources');
  const allSources = await loadSources(path.join(root, 'config', 'sources.yaml'));
  const selected = allSources.filter(
    (s) => s.type === 'rss' && wayback.sourceIds.includes(s.id),
  );
  if (selected.length === 0) {
    throw new Error(`No RSS sources matched: ${wayback.sourceIds.join(',')}`);
  }
  const all: RawArticle[] = [];
  for (const source of selected) {
    log(`\n▶ Wayback: ${source.id} (${source.url})`);
    // Per-source try/catch — Wayback CDX API občas vrací HTTP 503 (transient
    // archive.org infra). Jeden takový výpadek nesmí zabít celý backfill —
    // ostatní zdroje pokračují, ten chybějící lze doplnit re-runem.
    try {
      const items = await fetchArchivedRssRange({
        feedUrl: source.url,
        outletName: source.name,
        from: wayback.from,
        to: wayback.to,
        onProgress: log,
      });
      all.push(...items);
    } catch (err) {
      log(`  ✗ ${source.id} FAILED: ${(err as Error).message.slice(0, 200)}`);
    }
  }
  return dedupeArticles(all);
}

function groupByWeek(articles: readonly RawArticle[]): Map<string, RawArticle[]> {
  const out = new Map<string, RawArticle[]>();
  for (const a of articles) {
    const dateStr = a.published_at?.slice(0, 10) ?? a.fetched_at.slice(0, 10);
    const week = isoWeekLabelFromDate(dateStr);
    const list = out.get(week) ?? [];
    list.push(a);
    out.set(week, list);
  }
  return out;
}

function isoWeekLabelFromDate(dateStr: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) throw new Error(`Invalid date: ${dateStr}`);
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const dayNum = date.getUTCDay() || 7;
  const thursday = new Date(date.getTime() + (4 - dayNum) * 86_400_000);
  const year = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function mondayOfWeek(week: string): Date {
  const m = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!m) throw new Error(`Invalid week: ${week}`);
  const year = Number(m[1]);
  const w = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1Mon = new Date(Date.UTC(year, 0, 4 - (jan4Dow - 1)));
  return new Date(week1Mon.getTime() + (w - 1) * 7 * 86_400_000);
}

async function writeEventsFile(root: string, week: string, events: readonly Event[]): Promise<void> {
  const dir = path.join(root, 'data', 'events');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${week}.json`), JSON.stringify(events, null, 2) + '\n', 'utf-8');
}

// ---------------------------------------------------------------------------
// CLI entry — `npm run pipeline:backfill -- --seed=...` or `--wayback ...`
// ---------------------------------------------------------------------------

interface CliArgs {
  seed?: string;
  baseline?: string;
  wayback?: boolean;
  from?: string;
  to?: string;
  sources?: string;
  skipPreFilter?: boolean;
  skipAudit?: boolean;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = {};
  for (const arg of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (m) {
      const rawKey = m[1] ?? '';
      const value = m[2] ?? '';
      const key = rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) as keyof CliArgs;
      if (key === 'wayback' || key === 'skipPreFilter' || key === 'skipAudit') {
        (out[key] as boolean) = value === 'true';
      } else {
        (out[key] as string) = value;
      }
    } else if (arg === '--wayback') out.wayback = true;
    else if (arg === '--skip-pre-filter') out.skipPreFilter = true;
    else if (arg === '--skip-audit') out.skipAudit = true;
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.baseline) {
    console.error('Usage: pipeline:backfill --baseline=YYYY-Qx (--seed=path.json | --wayback --from=YYYY-MM-DD --to=YYYY-MM-DD --sources=id1,id2)');
    process.exit(2);
  }

  const opts: BackfillOptions = {
    baselineQuarter: args.baseline,
    onProgress: (msg) => console.log(msg),
    ...(args.skipPreFilter !== undefined ? { skipPreFilter: args.skipPreFilter } : {}),
    ...(args.skipAudit !== undefined ? { skipAudit: args.skipAudit } : {}),
  };

  if (args.seed) {
    opts.seedFile = args.seed;
  } else if (args.wayback) {
    if (!args.from || !args.to || !args.sources) {
      console.error('--wayback requires --from=YYYY-MM-DD --to=YYYY-MM-DD --sources=id1,id2,...');
      process.exit(2);
    }
    opts.wayback = {
      from: args.from,
      to: args.to,
      sourceIds: args.sources.split(',').map((s) => s.trim()).filter(Boolean),
    };
  } else {
    console.error('Pick a mode: --seed=path.json or --wayback ...');
    process.exit(2);
  }

  const result = await runBackfill(opts);
  console.log('\n=== summary ===');
  console.log(`weeks processed: ${result.weeksProcessed.length}`);
  console.log(`articles total:  ${result.totalArticles}`);
  console.log(`events total:    ${result.totalEvents}`);
  for (const w of result.perWeek) {
    console.log(`  ${w.week}: ${w.events} events from ${w.articles} articles`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error('FAIL:', err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) console.error(err.stack);
    process.exit(1);
  });
}
