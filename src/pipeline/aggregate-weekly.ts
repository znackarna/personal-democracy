import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyAuditVerdicts, auditEvents, type AuditResult } from './audit';
import { detectAnomalies, type Anomaly } from './detect-anomalies';
import { writeDailyReport } from './report';
import { computeScoreSnapshot } from './score';
import { validateOrThrow } from './validate';
import {
  type Event,
  type IsoWeek,
  type ScoreSnapshot,
  type StructuralBaseline,
} from '../lib/types';

/**
 * Weekly aggregation orchestrator (varianta B z 2026-04-29).
 *
 * Předpokládá, že events za daný týden už jsou na disku (nasypal je
 * `run-daily.ts` během uplynulého týdne). Tento modul:
 *  1. Načte accumulated events za target week
 *  2. Spustí audit pass nad nimi (Sonnet anti-bias check)
 *  3. Spočítá score snapshot
 *  4. Detekuje anomálie
 *  5. Napíše daily report
 *  6. Aktualizuje timeline.json
 *
 * Žádný fetch ani klasifikace — to dělá daily orchestrátor. Tahle separace
 * znamená, že weekly cron nemůže způsobit duplicate fetch overhead, a že
 * jednotlivé fáze jsou testovatelné izolovaně.
 */

const DEFAULT_PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

export interface AggregateWeeklyOptions {
  /** Target week k uzavření (typicky uplynulý kompletní ISO týden). */
  week: IsoWeek;
  /** Quarter pro structural baseline. */
  baselineQuarter: string;
  projectRoot?: string;
  /** Skip audit pass (cheap re-run nebo tests). */
  skipAudit?: boolean;
  /** Override `now` pro deterministické testy. */
  now?: Date;
  /** Aktivní zdrojů pro per-source anomaly threshold. Pokud chybí, použije
   *  legacy threshold > 5. Daily/aggregate split činí spočítat z fetch
   *  výsledku obtížné — `run-daily` to ví, `aggregate-weekly` ne. Lze
   *  předat z workflow přes flag, nebo nechat fallback. */
  activeSourceCount?: number;
}

export interface AggregateWeeklyResult {
  week: IsoWeek;
  events: Event[];
  audit: AuditResult | null;
  scoreSnapshot: ScoreSnapshot;
  anomalies: Anomaly[];
  outputs: { eventsPath: string; scoresPath: string; reportPath: string | null };
}

export async function aggregateWeekly(
  options: AggregateWeeklyOptions,
): Promise<AggregateWeeklyResult> {
  const root = options.projectRoot ?? DEFAULT_PROJECT_ROOT;
  const now = options.now ?? new Date();
  const eventsDir = path.join(root, 'data', 'events');
  const eventsPath = path.join(eventsDir, `${options.week}.json`);

  // 1. Load existing events for target week.
  const events = await readEventsFile(eventsPath);

  // 2. Audit pass — anti-bias check by separátní Sonnet call. Vede k
  // možnému downgradu na needs_review, neoverwrituje severity ručně.
  const audit =
    options.skipAudit || events.length === 0 ? null : await auditEvents(events);
  const finalEvents = audit ? applyAuditVerdicts(events, audit) : events;

  // 3. Persist audited events back (audit může změnit status na needs_review
  // u některých events). Pokud žádný audit neběžel, write je no-op
  // (obsahuje stejná data, jaká už na disku jsou).
  if (audit) {
    await writeFile(eventsPath, JSON.stringify(finalEvents, null, 2) + '\n', 'utf-8');
  }

  // 4. Score snapshot — recompute napříč všemi events files (current + history).
  const baseline = await loadBaseline(root, options.baselineQuarter);
  const allEvents = await loadAllEvents(eventsDir);
  const snapshot = computeScoreSnapshot(baseline, allEvents, options.week, { now });

  // 5. Update timeline.json — replace any prior entry for this week.
  const scoresDir = path.join(root, 'data', 'scores');
  const scoresPath = path.join(scoresDir, 'timeline.json');
  await mkdir(scoresDir, { recursive: true });
  const timeline = await loadTimeline(scoresPath);
  const prevSnapshot = timeline.find((s) => s.week !== options.week && s.week < options.week);
  const filtered = timeline.filter((s) => s.week !== options.week);
  filtered.push(snapshot);
  filtered.sort((a, b) => a.week.localeCompare(b.week));
  await writeFile(scoresPath, JSON.stringify(filtered, null, 2) + '\n', 'utf-8');

  // 6. Detect anomalies.
  const anomalies = detectAnomalies({
    events: finalEvents,
    newSnapshot: snapshot,
    ...(options.activeSourceCount !== undefined
      ? { activeSourceCount: options.activeSourceCount }
      : {}),
    ...(prevSnapshot ? { prevSnapshot } : {}),
    ...(audit ? { audit } : {}),
  });

  // 7. Write report. Pro variantu B nemáme po ruce per-source statistiku
  // (tu měl run-daily ze svého fetch resultu). Předáme prázdné pole —
  // report.ts si poradí; účelem je narrative summary, per-source counts
  // nejsou kritické pro reviewera, ten je vidí v denním logu workflow.
  let reportPath: string | null = null;
  if (events.length > 0) {
    reportPath = await writeDailyReport(
      {
        date: now,
        week: options.week,
        perSource: [],
        fetched: 0,
        preFiltered: 0,
        events: finalEvents,
        cappedEvents: [],
        ...(audit ? { audit } : {}),
        ...(prevSnapshot ? { prevSnapshot } : {}),
        newSnapshot: snapshot,
        anomalies,
      },
      root,
    );
  }

  return {
    week: options.week,
    events: finalEvents,
    audit,
    scoreSnapshot: snapshot,
    anomalies,
    outputs: { eventsPath, scoresPath, reportPath },
  };
}

async function readEventsFile(file: string): Promise<Event[]> {
  try {
    const raw = await readFile(file, 'utf-8');
    const parsed = JSON.parse(raw) as Event[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

async function loadBaseline(root: string, quarter: string): Promise<StructuralBaseline> {
  const file = path.join(root, 'data', 'structural', `${quarter}.json`);
  const raw = await readFile(file, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  return validateOrThrow<StructuralBaseline>('structural', parsed);
}

async function loadAllEvents(eventsDir: string): Promise<Event[]> {
  let entries: string[];
  try {
    entries = await readdir(eventsDir);
  } catch {
    return [];
  }
  const eventFiles = entries.filter((f) => /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])\.json$/.test(f));
  const events: Event[] = [];
  for (const f of eventFiles) {
    const raw = await readFile(path.join(eventsDir, f), 'utf-8');
    const parsed = JSON.parse(raw) as Event[];
    events.push(...parsed);
  }
  return events;
}

async function loadTimeline(file: string): Promise<ScoreSnapshot[]> {
  try {
    const raw = await readFile(file, 'utf-8');
    return JSON.parse(raw) as ScoreSnapshot[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

// ---------------------------------------------------------------------------
// CLI entry — `npm run pipeline:aggregate -- --week=2026-W17 --baseline=2026-Q2`
// ---------------------------------------------------------------------------

interface CliArgs {
  week?: string;
  baseline?: string;
  skipAudit?: boolean;
  emitAnomaliesJson?: string;
  activeSourceCount?: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = {};
  for (const arg of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (m) {
      const rawKey = m[1] ?? '';
      const value = m[2] ?? '';
      const key = rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) as keyof CliArgs;
      if (key === 'skipAudit') (out[key] as boolean) = value === 'true';
      else (out[key] as string) = value;
    } else if (arg === '--skip-audit') {
      out.skipAudit = true;
    }
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.week || !args.baseline) {
    console.error(
      'Usage: pipeline:aggregate --week=2026-W17 --baseline=2026-Q2 [--skip-audit] [--active-source-count=N] [--emit-anomalies-json=path]',
    );
    process.exit(2);
  }

  const opts: AggregateWeeklyOptions = {
    week: args.week as IsoWeek,
    baselineQuarter: args.baseline,
    ...(args.skipAudit ? { skipAudit: true } : {}),
    ...(args.activeSourceCount
      ? { activeSourceCount: Number.parseInt(args.activeSourceCount, 10) }
      : {}),
  };

  console.log(`▶ aggregating ${args.week} (baseline ${args.baseline})`);
  const result = await aggregateWeekly(opts);

  console.log('');
  console.log(`events:         ${result.events.length}`);
  if (result.audit) {
    const counts = result.audit.per_event.reduce<Record<string, number>>((acc, v) => {
      acc[v.verdict] = (acc[v.verdict] ?? 0) + 1;
      return acc;
    }, {});
    console.log(
      `audit:          pass=${counts['pass'] ?? 0} flag=${counts['flag'] ?? 0} downgrade=${counts['downgrade'] ?? 0}`,
    );
  }
  console.log(`overall score:  ${result.scoreSnapshot.overall_score}`);
  console.log('per-pillar:');
  for (const [k, v] of Object.entries(result.scoreSnapshot.pillars)) {
    console.log(`  ${k.padEnd(11)} ${v}`);
  }
  if (result.anomalies.length > 0) {
    console.log(`anomalies:      ${result.anomalies.length}`);
    for (const a of result.anomalies) {
      console.log(`  [${a.level}] ${a.trigger}: ${a.details}`);
    }
  }
  console.log('');
  console.log(`wrote ${result.outputs.eventsPath}`);
  console.log(`wrote ${result.outputs.scoresPath}`);
  if (result.outputs.reportPath) console.log(`wrote ${result.outputs.reportPath}`);

  if (args.emitAnomaliesJson) {
    await writeFile(
      args.emitAnomaliesJson,
      JSON.stringify(result.anomalies, null, 2),
      'utf-8',
    );
    console.log(`wrote ${args.emitAnomaliesJson} (${result.anomalies.length} anomalies)`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error('FAIL:', err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) console.error(err.stack);
    process.exit(1);
  });
}
