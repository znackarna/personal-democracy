import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Event, StructuralBaseline } from '../src/lib/types';

const FIXED_NOW = new Date('2026-04-29T08:00:00.000Z');

function setupRoot(): { root: string; baseline: StructuralBaseline } {
  const root = mkdtempSync(path.join(tmpdir(), 'backfill-test-'));
  mkdirSync(path.join(root, 'data', 'events'), { recursive: true });
  mkdirSync(path.join(root, 'data', 'scores'), { recursive: true });
  mkdirSync(path.join(root, 'data', 'structural'), { recursive: true });
  const baseline: StructuralBaseline = {
    quarter: '2025-Q1',
    computed_at: '2025-01-01T00:00:00.000Z',
    pillars: { electoral: 80, governance: 70, judicial: 75, media: 70, civil: 78, corruption: 65 },
    sources: [{ index: 'V-Dem', year: 2024, value: 0.8, url: 'https://v-dem.net/' }],
  };
  writeFileSync(
    path.join(root, 'data', 'structural', '2025-Q1.json'),
    JSON.stringify(baseline),
  );
  return { root, baseline };
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock('../src/pipeline/extract-events');
  vi.doUnmock('../src/pipeline/audit');
  vi.doUnmock('../src/pipeline/pre-filter');
});

describe('runBackfill — seed mode', () => {
  it('rejects when neither seed nor wayback given', async () => {
    const { runBackfill } = await import('../src/pipeline/backfill');
    await expect(
      runBackfill({ baselineQuarter: '2025-Q1' }),
    ).rejects.toThrow(/either --seed or --wayback/);
  });

  it('groups seed articles by ISO week of date and writes per-week events files', async () => {
    const { root } = setupRoot();
    const seedFile = path.join(root, 'seed.json');
    writeFileSync(
      seedFile,
      JSON.stringify([
        { date: '2025-01-15', url: 'https://o.test/a', title: 'A', outlet: 'Outlet' },
        { date: '2025-01-16', url: 'https://o.test/b', title: 'B', outlet: 'Outlet' },
        { date: '2025-02-10', url: 'https://o.test/c', title: 'C', outlet: 'Outlet' },
      ]),
    );

    // Mock extract-events to return one event per article (skipping LLM).
    vi.doMock('../src/pipeline/extract-events', () => ({
      extractEvents: vi.fn(async (articles: Array<{ url: string; title: string }>, opts: { week: string }) => {
        return articles.map((a, i) => ({
          id: `${opts.week}-${String(i + 1).padStart(3, '0')}`,
          date: '2025-01-15',
          headline: `Event from ${a.title}`,
          summary: 'Twenty-character minimum summary text for the schema requirement.',
          pillar: 'governance',
          severity: 2,
          direction: -1,
          duration: 'one_off',
          sources: [
            { title: a.title, url: a.url, outlet: 'Outlet', fetched_at: '2026-04-29T08:00:00.000Z' },
          ],
          score_impact: -0.5,
          rationale: 'Severity 2 per rubric — sufficient text to satisfy schema validation.',
          reviewer: 'auto' as const,
          status: 'active' as const,
          created_at: FIXED_NOW.toISOString(),
        } as Event));
      }),
    }));

    const { runBackfill } = await import('../src/pipeline/backfill');
    const result = await runBackfill({
      baselineQuarter: '2025-Q1',
      seedFile,
      projectRoot: root,
      skipAudit: true,
    });

    // 2025-01-15 is Wednesday → ISO W03; 2025-01-16 is Thursday → W03; 2025-02-10 is Monday → W07
    expect([...result.weeksProcessed].sort()).toEqual(['2025-W03', '2025-W07']);
    expect(result.totalArticles).toBe(3);
    expect(result.totalEvents).toBe(3);

    const w03 = JSON.parse(readFileSync(path.join(root, 'data', 'events', '2025-W03.json'), 'utf-8'));
    const w07 = JSON.parse(readFileSync(path.join(root, 'data', 'events', '2025-W07.json'), 'utf-8'));
    expect(w03).toHaveLength(2);
    expect(w07).toHaveLength(1);
  });

  it('skips pre-filter for seed mode by default (curated input)', async () => {
    const { root } = setupRoot();
    const seedFile = path.join(root, 'seed.json');
    writeFileSync(
      seedFile,
      JSON.stringify([
        { date: '2025-03-15', url: 'https://o.test/a', title: 'A', outlet: 'Outlet' },
      ]),
    );

    const preFilterMock = vi.fn();
    vi.doMock('../src/pipeline/pre-filter', () => ({ preFilter: preFilterMock }));
    vi.doMock('../src/pipeline/extract-events', () => ({
      extractEvents: vi.fn(async () => []),
    }));

    const { runBackfill } = await import('../src/pipeline/backfill');
    await runBackfill({
      baselineQuarter: '2025-Q1',
      seedFile,
      projectRoot: root,
      skipAudit: true,
    });
    expect(preFilterMock).not.toHaveBeenCalled();
  });

  it('returns empty when no seed articles', async () => {
    const { root } = setupRoot();
    const seedFile = path.join(root, 'seed.json');
    writeFileSync(seedFile, JSON.stringify([]));

    const { runBackfill } = await import('../src/pipeline/backfill');
    const result = await runBackfill({
      baselineQuarter: '2025-Q1',
      seedFile,
      projectRoot: root,
      skipAudit: true,
    });
    expect(result.totalArticles).toBe(0);
    expect(result.weeksProcessed).toEqual([]);
  });

  it('rejects malformed seed', async () => {
    const { root } = setupRoot();
    const seedFile = path.join(root, 'seed.json');
    writeFileSync(seedFile, JSON.stringify([{ date: 'not-a-date', url: 'https://o.test/a', title: 'A', outlet: 'O' }]));
    const { runBackfill } = await import('../src/pipeline/backfill');
    await expect(
      runBackfill({ baselineQuarter: '2025-Q1', seedFile, projectRoot: root }),
    ).rejects.toThrow();
  });
});
