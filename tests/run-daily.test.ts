import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Event, PreFilteredArticle } from '../src/lib/types';

const FIXED_NOW = new Date('2026-04-29T08:00:00.000Z');

function setupRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'run-daily-test-'));
  mkdirSync(path.join(root, 'data', 'events'), { recursive: true });
  mkdirSync(path.join(root, 'data', 'scores'), { recursive: true });
  return root;
}

function makeEvent(id: string, url: string, date: string, week: string, headline?: string): Event {
  // Headlines musí být lexikálně rozdílné (NE jen číslo na konci) — dedupe.ts
  // používá 5-char prefixy tokenů, takže "Headline 001" a "Headline 002" by se
  // oba tokenizovaly jako {headl, 0001x} a vypadaly jako stejný incident.
  // Generuju unikátní lexikum z URL (různé v každém testu).
  const urlSuffix = url.slice(url.lastIndexOf('/') + 1);
  const fallback = `Unique ${urlSuffix} demokracie incident totally distinct phrasing pro dedupe`;
  return {
    id,
    date,
    headline: headline ?? fallback,
    summary: `Twenty-character minimum summary text for ${id} schema requirement.`,
    pillar: 'governance',
    severity: 2,
    direction: -1,
    duration: 'one_off',
    sources: [
      { title: 'T', url, outlet: 'Outlet', fetched_at: '2026-04-22T08:00:00.000Z' },
    ],
    score_impact: -0.5,
    rationale: `Severity 2 per rubric — sufficient text to satisfy schema validation. (${week})`,
    reviewer: 'auto',
    status: 'active',
    created_at: '2026-04-22T08:00:00.000Z',
  };
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock('../src/pipeline/fetch-sources');
  vi.doUnmock('../src/pipeline/pre-filter');
  vi.doUnmock('../src/pipeline/extract-events');
});

describe('runDaily', () => {
  it('writes new events to per-week files when no existing data', async () => {
    const root = setupRoot();

    vi.doMock('../src/pipeline/fetch-sources', () => ({
      fetchAllSources: vi.fn(async () => ({
        articles: [
          {
            url: 'https://o.test/a',
            title: 'Vláda navrhla zákon o ÚS',
            outlet: 'Test Outlet',
            fetched_at: FIXED_NOW.toISOString(),
            published_at: '2026-04-22T10:00:00.000Z', // 2026-W17 (Wed)
          },
        ],
        perSource: [{ id: 'test', type: 'rss', count: 1 }],
      })),
    }));
    vi.doMock('../src/pipeline/pre-filter', () => ({
      preFilter: vi.fn(async (articles: Array<{ url: string; title: string }>) =>
        articles.map(
          (a): PreFilteredArticle => ({
            url: a.url,
            title: a.title,
            outlet: 'Test Outlet',
            fetched_at: FIXED_NOW.toISOString(),
            published_at: '2026-04-22T10:00:00.000Z',
            candidate_pillar: 'governance',
            reason_kept: 'pre-filter test',
          }),
        ),
      ),
    }));
    vi.doMock('../src/pipeline/extract-events', () => ({
      extractEvents: vi.fn(
        async (articles: PreFilteredArticle[], opts: { week: string; startSeq?: number }) => {
          const seq = opts.startSeq ?? 1;
          return articles.map((a, i) => makeEvent(
            `${opts.week}-${String(seq + i).padStart(3, '0')}`,
            a.url,
            '2026-04-22',
            opts.week,
          ));
        },
      ),
    }));

    const { runDaily } = await import('../src/pipeline/run-daily');
    const result = await runDaily({
      week: '2026-W18',
      projectRoot: root,
      now: FIXED_NOW,
    });

    expect(result.fetched).toBe(1);
    expect(result.alreadyClassified).toBe(0);
    expect(result.touchedWeeks).toEqual(['2026-W17']);

    const w17 = JSON.parse(
      readFileSync(path.join(root, 'data', 'events', '2026-W17.json'), 'utf-8'),
    ) as Event[];
    expect(w17).toHaveLength(1);
    expect(w17[0]?.id).toBe('2026-W17-001');
    expect(w17[0]?.sources[0]?.url).toBe('https://o.test/a');
  });

  it('URL-dedupe: skips articles already classified in recent weeks (no API calls)', async () => {
    const root = setupRoot();

    // Pre-existing event covers https://o.test/a in 2026-W17. Headline volím
    // tematicky odlišný od událostí, které mock extractor vyrábí pro `/b` —
    // jinak by je dedupeEvents (Jaccard threshold 0.3) sloučil jako stejný incident.
    writeFileSync(
      path.join(root, 'data', 'events', '2026-W17.json'),
      JSON.stringify([
        makeEvent(
          '2026-W17-001',
          'https://o.test/a',
          '2026-04-22',
          '2026-W17',
          'Vláda projednala zákon o ústavním soudu',
        ),
      ]),
    );

    const fetchMock = vi.fn(async () => ({
      articles: [
        {
          url: 'https://o.test/a', // duplicate
          title: 'A',
          outlet: 'O',
          fetched_at: FIXED_NOW.toISOString(),
          published_at: '2026-04-22T10:00:00.000Z',
        },
        {
          url: 'https://o.test/b', // new
          title: 'B',
          outlet: 'O',
          fetched_at: FIXED_NOW.toISOString(),
          published_at: '2026-04-23T10:00:00.000Z',
        },
      ],
      perSource: [{ id: 'test', type: 'rss', count: 2 }],
    }));
    const preFilterMock = vi.fn(async (articles: Array<{ url: string; title: string }>) =>
      articles.map(
        (a): PreFilteredArticle => ({
          url: a.url,
          title: a.title,
          outlet: 'O',
          fetched_at: FIXED_NOW.toISOString(),
          published_at: '2026-04-23T10:00:00.000Z',
          candidate_pillar: 'governance',
          reason_kept: 'kept',
        }),
      ),
    );
    const extractMock = vi.fn(
      async (articles: PreFilteredArticle[], opts: { week: string; startSeq?: number }) => {
        const seq = opts.startSeq ?? 1;
        return articles.map((a, i) => makeEvent(
          `${opts.week}-${String(seq + i).padStart(3, '0')}`,
          a.url,
          '2026-04-23',
          opts.week,
          'Senát schválil rozpočtové opatření obrany', // jiné lexikum než pre-existing
        ));
      },
    );

    vi.doMock('../src/pipeline/fetch-sources', () => ({ fetchAllSources: fetchMock }));
    vi.doMock('../src/pipeline/pre-filter', () => ({ preFilter: preFilterMock }));
    vi.doMock('../src/pipeline/extract-events', () => ({ extractEvents: extractMock }));

    const { runDaily } = await import('../src/pipeline/run-daily');
    const result = await runDaily({
      week: '2026-W18',
      projectRoot: root,
      now: FIXED_NOW,
    });

    expect(result.fetched).toBe(2);
    expect(result.alreadyClassified).toBe(1); // /a was deduped
    expect(result.newArticles).toBe(1);

    // Pre-filter saw only 1 (the new one), classifier same.
    expect(preFilterMock).toHaveBeenCalledTimes(1);
    const preFilteredArg = preFilterMock.mock.calls[0]![0] as Array<{ url: string }>;
    expect(preFilteredArg).toHaveLength(1);
    expect(preFilteredArg[0]?.url).toBe('https://o.test/b');

    // W17 events file now has both events (existing + new appended).
    const w17 = JSON.parse(
      readFileSync(path.join(root, 'data', 'events', '2026-W17.json'), 'utf-8'),
    ) as Event[];
    expect(w17).toHaveLength(2);
    expect(w17.map((e) => e.id)).toEqual(['2026-W17-001', '2026-W17-002']);
  });

  it('groups by published_at week: routes Sunday article to previous week file', async () => {
    const root = setupRoot();

    vi.doMock('../src/pipeline/fetch-sources', () => ({
      fetchAllSources: vi.fn(async () => ({
        articles: [
          {
            url: 'https://o.test/sun',
            title: 'Sunday article',
            outlet: 'O',
            fetched_at: FIXED_NOW.toISOString(),
            published_at: '2026-04-26T22:00:00.000Z', // Sun = W17
          },
          {
            url: 'https://o.test/mon',
            title: 'Monday article',
            outlet: 'O',
            fetched_at: FIXED_NOW.toISOString(),
            published_at: '2026-04-27T08:00:00.000Z', // Mon = W18
          },
        ],
        perSource: [{ id: 'test', type: 'rss', count: 2 }],
      })),
    }));
    vi.doMock('../src/pipeline/pre-filter', () => ({
      preFilter: vi.fn(async (articles: Array<{ url: string; title: string; published_at?: string }>) =>
        articles.map(
          (a): PreFilteredArticle => ({
            url: a.url,
            title: a.title,
            outlet: 'O',
            fetched_at: FIXED_NOW.toISOString(),
            ...(a.published_at ? { published_at: a.published_at } : {}),
            candidate_pillar: 'governance',
            reason_kept: 'kept',
          }),
        ),
      ),
    }));
    vi.doMock('../src/pipeline/extract-events', () => ({
      extractEvents: vi.fn(
        async (articles: PreFilteredArticle[], opts: { week: string; startSeq?: number }) => {
          const seq = opts.startSeq ?? 1;
          // Map article date to event date, simulating the classifier.
          return articles.map((a, i) => makeEvent(
            `${opts.week}-${String(seq + i).padStart(3, '0')}`,
            a.url,
            (a.published_at ?? '').slice(0, 10),
            opts.week,
          ));
        },
      ),
    }));

    const { runDaily } = await import('../src/pipeline/run-daily');
    const result = await runDaily({
      week: '2026-W18',
      projectRoot: root,
      now: FIXED_NOW,
    });

    expect(new Set(result.touchedWeeks)).toEqual(new Set(['2026-W17', '2026-W18']));

    const w17 = JSON.parse(
      readFileSync(path.join(root, 'data', 'events', '2026-W17.json'), 'utf-8'),
    ) as Event[];
    const w18 = JSON.parse(
      readFileSync(path.join(root, 'data', 'events', '2026-W18.json'), 'utf-8'),
    ) as Event[];
    expect(w17).toHaveLength(1);
    expect(w18).toHaveLength(1);
    expect(w17[0]?.id).toBe('2026-W17-001');
    expect(w18[0]?.id).toBe('2026-W18-001');
  });

  it('idempotency: re-running same day adds zero events (URL-dedupe drops everything)', async () => {
    const root = setupRoot();

    writeFileSync(
      path.join(root, 'data', 'events', '2026-W17.json'),
      JSON.stringify([
        makeEvent('2026-W17-001', 'https://o.test/a', '2026-04-22', '2026-W17'),
      ]),
    );

    const fetchMock = vi.fn(async () => ({
      articles: [
        {
          url: 'https://o.test/a',
          title: 'A',
          outlet: 'O',
          fetched_at: FIXED_NOW.toISOString(),
          published_at: '2026-04-22T10:00:00.000Z',
        },
      ],
      perSource: [{ id: 'test', type: 'rss', count: 1 }],
    }));
    const preFilterMock = vi.fn();
    const extractMock = vi.fn();

    vi.doMock('../src/pipeline/fetch-sources', () => ({ fetchAllSources: fetchMock }));
    vi.doMock('../src/pipeline/pre-filter', () => ({ preFilter: preFilterMock }));
    vi.doMock('../src/pipeline/extract-events', () => ({ extractEvents: extractMock }));

    const { runDaily } = await import('../src/pipeline/run-daily');
    const result = await runDaily({
      week: '2026-W18',
      projectRoot: root,
      now: FIXED_NOW,
    });

    expect(result.alreadyClassified).toBe(1);
    expect(result.newArticles).toBe(0);
    expect(result.touchedWeeks).toEqual([]);
    // Žádná Anthropic volání.
    expect(preFilterMock).not.toHaveBeenCalled();
    expect(extractMock).not.toHaveBeenCalled();

    // Soubor zůstává nezměněn (1 event jako předtím).
    const w17 = JSON.parse(
      readFileSync(path.join(root, 'data', 'events', '2026-W17.json'), 'utf-8'),
    ) as Event[];
    expect(w17).toHaveLength(1);
  });

  it('skipLlm mode: counts articles ale neklasifikuje', async () => {
    const root = setupRoot();

    vi.doMock('../src/pipeline/fetch-sources', () => ({
      fetchAllSources: vi.fn(async () => ({
        articles: [
          {
            url: 'https://o.test/a',
            title: 'A',
            outlet: 'O',
            fetched_at: FIXED_NOW.toISOString(),
            published_at: '2026-04-22T10:00:00.000Z',
          },
        ],
        perSource: [{ id: 'test', type: 'rss', count: 1 }],
      })),
    }));
    const preFilterMock = vi.fn();
    const extractMock = vi.fn();
    vi.doMock('../src/pipeline/pre-filter', () => ({ preFilter: preFilterMock }));
    vi.doMock('../src/pipeline/extract-events', () => ({ extractEvents: extractMock }));

    const { runDaily } = await import('../src/pipeline/run-daily');
    const result = await runDaily({
      week: '2026-W18',
      projectRoot: root,
      now: FIXED_NOW,
      skipLlm: true,
    });

    expect(result.fetched).toBe(1);
    expect(result.newArticles).toBe(1);
    expect(result.preFiltered).toBe(0);
    expect(result.touchedWeeks).toEqual([]);
    expect(preFilterMock).not.toHaveBeenCalled();
    expect(extractMock).not.toHaveBeenCalled();
  });
});
