import { fetchRssFeed } from '../lib/feeds';
import { type RawArticle } from '../lib/types';

/**
 * Fetch articles from Wayback Machine archived RSS snapshots.
 *
 * RSS feeds typically only show ~30 days of items. To backfill historical
 * weeks (e.g. 2025), we query the Wayback Machine CDX API for archived
 * snapshots of the same RSS URL, fetch one snapshot per week (the closest
 * to mid-week), parse it, and return the union of articles found.
 *
 * Rate-limited (Wayback recommends ≤ 1 req/s) and partial — not every week
 * has a snapshot, and some snapshots may be incomplete or 404. Plan for
 * 60–80 % coverage in practice.
 */

const CDX_API = 'https://web.archive.org/cdx/search/cdx';
const WAYBACK_BASE = 'https://web.archive.org/web';
const RATE_LIMIT_MS = 1100; // ~1 req/s, slight buffer

export interface WaybackOptions {
  feedUrl: string;
  outletName: string;
  /** Inclusive start date YYYY-MM-DD. */
  from: string;
  /** Inclusive end date YYYY-MM-DD. */
  to: string;
  /** Optional fetcher for tests. */
  fetchText?: (url: string) => Promise<string>;
  /** Optional CDX result list for tests (skips API call). */
  cdxResults?: CdxRow[];
  /** Throttle between fetches; defaults to 1.1 s. */
  throttleMs?: number;
  /** Logger callback for progress reporting. */
  onProgress?: (msg: string) => void;
}

export interface CdxRow {
  /** YYYYMMDDhhmmss */
  timestamp: string;
  /** Original URL captured. */
  original: string;
  statuscode: string;
}

/**
 * Query Wayback CDX for snapshots of `feedUrl` between `from` and `to`.
 * Returns one snapshot per ISO week (closest to Wednesday of that week,
 * the rough midpoint). Returns at most one row per week.
 */
export async function findWeeklySnapshots(opts: WaybackOptions): Promise<CdxRow[]> {
  if (opts.cdxResults) return pickOnePerWeek(opts.cdxResults);

  const fromCompact = opts.from.replace(/-/g, '');
  const toCompact = opts.to.replace(/-/g, '');
  const url = `${CDX_API}?url=${encodeURIComponent(opts.feedUrl)}&from=${fromCompact}&to=${toCompact}&output=json&filter=statuscode:200&filter=mimetype:application/rss%2Bxml&filter=mimetype:text/xml&filter=mimetype:application/xml&fl=timestamp,original,statuscode&collapse=timestamp:8`;
  // collapse:timestamp:8 dedupes by YYYYMMDD prefix → at most one snapshot per day

  const fetchText = opts.fetchText ?? defaultFetchText;
  const raw = await fetchText(url);
  const parsed = JSON.parse(raw) as string[][];
  // First row is column header; skip it.
  if (parsed.length === 0) return [];
  const rows: CdxRow[] = parsed.slice(1).map((r) => ({
    timestamp: r[0]!,
    original: r[1]!,
    statuscode: r[2]!,
  }));
  return pickOnePerWeek(rows);
}

/**
 * Pick the snapshot closest to the middle of each ISO week. If multiple
 * snapshots fall in the same week, prefer the one nearest to Wednesday.
 */
function pickOnePerWeek(rows: readonly CdxRow[]): CdxRow[] {
  const byWeek = new Map<string, { row: CdxRow; distance: number }>();
  for (const row of rows) {
    const date = parseTimestamp(row.timestamp);
    const week = isoWeekLabel(date);
    const dayOfWeek = date.getUTCDay() || 7; // 1=Mon, 7=Sun
    const distance = Math.abs(dayOfWeek - 3); // closest to Wednesday
    const existing = byWeek.get(week);
    if (!existing || distance < existing.distance) {
      byWeek.set(week, { row, distance });
    }
  }
  return [...byWeek.values()].map((v) => v.row);
}

/**
 * For each weekly snapshot, fetch the archived RSS XML and parse it into
 * RawArticle objects. Returns dedup'd union across snapshots.
 */
export async function fetchArchivedRssRange(opts: WaybackOptions): Promise<RawArticle[]> {
  const snapshots = await findWeeklySnapshots(opts);
  opts.onProgress?.(`Found ${snapshots.length} weekly snapshots for ${opts.outletName}`);
  const seenUrls = new Set<string>();
  const all: RawArticle[] = [];
  const throttle = opts.throttleMs ?? RATE_LIMIT_MS;

  for (let i = 0; i < snapshots.length; i += 1) {
    const snap = snapshots[i]!;
    const archivedUrl = `${WAYBACK_BASE}/${snap.timestamp}/${snap.original}`;
    try {
      const articles = await fetchRssFeed(archivedUrl, opts.outletName, {
        ...(opts.fetchText ? { fetchText: opts.fetchText } : {}),
      });
      let added = 0;
      for (const a of articles) {
        const key = stripWaybackPrefix(a.url).toLowerCase();
        if (seenUrls.has(key)) continue;
        seenUrls.add(key);
        all.push({ ...a, url: stripWaybackPrefix(a.url) });
        added += 1;
      }
      opts.onProgress?.(`  [${i + 1}/${snapshots.length}] ${snap.timestamp} → +${added} unique articles (total ${all.length})`);
    } catch (err) {
      opts.onProgress?.(`  [${i + 1}/${snapshots.length}] ${snap.timestamp} → FAIL: ${(err as Error).message}`);
    }
    if (i < snapshots.length - 1) await sleep(throttle);
  }
  return all;
}

/**
 * Wayback rewrites links inside archived RSS to also point through Wayback.
 * We strip the `https://web.archive.org/web/<timestamp>/` prefix to get the
 * original URL — the article is what we want to record as the source, not
 * the archive wrapper.
 */
function stripWaybackPrefix(url: string): string {
  const m = /^https?:\/\/web\.archive\.org\/web\/\d+(?:[a-z_]+)?\/(.+)$/i.exec(url);
  return m ? m[1]! : url;
}

function parseTimestamp(ts: string): Date {
  // YYYYMMDDhhmmss
  const y = Number(ts.slice(0, 4));
  const mo = Number(ts.slice(4, 6));
  const d = Number(ts.slice(6, 8));
  const h = Number(ts.slice(8, 10) || '12');
  const mi = Number(ts.slice(10, 12) || '0');
  return new Date(Date.UTC(y, mo - 1, d, h, mi));
}

function isoWeekLabel(date: Date): string {
  // Standard ISO week algorithm — same as src/pipeline/score.ts
  const dayNum = date.getUTCDay() || 7;
  const thursday = new Date(date.getTime() + (4 - dayNum) * 86_400_000);
  const year = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function defaultFetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'democracy-index-cz/0.1 (+https://github.com/znackarna/personal-democracy)' },
  });
  if (!res.ok) throw new Error(`Wayback fetch failed: HTTP ${res.status}`);
  return res.text();
}
