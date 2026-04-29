import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Event, ScoreSnapshot, StructuralBaseline } from '../src/lib/types';

const FIXED_NOW = new Date('2026-04-29T08:00:00.000Z');

function setupRoot(): { root: string; baseline: StructuralBaseline } {
  const root = mkdtempSync(path.join(tmpdir(), 'aggregate-weekly-test-'));
  mkdirSync(path.join(root, 'data', 'events'), { recursive: true });
  mkdirSync(path.join(root, 'data', 'scores'), { recursive: true });
  mkdirSync(path.join(root, 'data', 'structural'), { recursive: true });
  mkdirSync(path.join(root, 'data', 'reports'), { recursive: true });
  const baseline: StructuralBaseline = {
    quarter: '2026-Q2',
    computed_at: '2026-04-01T00:00:00.000Z',
    pillars: { electoral: 80, governance: 70, judicial: 75, media: 70, civil: 78, corruption: 65 },
    sources: [{ index: 'V-Dem', year: 2024, value: 0.8, url: 'https://v-dem.net/' }],
  };
  writeFileSync(
    path.join(root, 'data', 'structural', '2026-Q2.json'),
    JSON.stringify(baseline),
  );
  return { root, baseline };
}

function makeEvent(id: string, week: string): Event {
  return {
    id,
    date: '2026-04-22',
    headline: 'Existing event',
    summary: 'Twenty-character minimum summary text for the schema requirement.',
    pillar: 'governance',
    severity: 2,
    direction: -1,
    duration: 'one_off',
    sources: [
      { title: 'T', url: `https://o.test/${id}`, outlet: 'A', fetched_at: '2026-04-22T08:00:00.000Z' },
      { title: 'T2', url: `https://o.test/${id}-2`, outlet: 'B', fetched_at: '2026-04-22T08:00:00.000Z' },
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
  vi.doUnmock('../src/pipeline/audit');
});

describe('aggregateWeekly', () => {
  it('reads existing events for week, computes snapshot, writes timeline', async () => {
    const { root } = setupRoot();
    writeFileSync(
      path.join(root, 'data', 'events', '2026-W17.json'),
      JSON.stringify([
        makeEvent('2026-W17-001', '2026-W17'),
        makeEvent('2026-W17-002', '2026-W17'),
      ]),
    );

    // Skip audit — žádné Sonnet calls.
    const { aggregateWeekly } = await import('../src/pipeline/aggregate-weekly');
    const result = await aggregateWeekly({
      week: '2026-W17',
      baselineQuarter: '2026-Q2',
      projectRoot: root,
      skipAudit: true,
      now: FIXED_NOW,
    });

    expect(result.events).toHaveLength(2);
    expect(result.audit).toBeNull();
    expect(result.scoreSnapshot.week).toBe('2026-W17');

    // Timeline written.
    const timeline = JSON.parse(
      readFileSync(path.join(root, 'data', 'scores', 'timeline.json'), 'utf-8'),
    ) as ScoreSnapshot[];
    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.week).toBe('2026-W17');
  });

  it('replaces existing snapshot for same week (idempotent re-runs)', async () => {
    const { root } = setupRoot();
    writeFileSync(
      path.join(root, 'data', 'events', '2026-W17.json'),
      JSON.stringify([makeEvent('2026-W17-001', '2026-W17')]),
    );
    // Pre-existing timeline with stale snapshot for W17.
    writeFileSync(
      path.join(root, 'data', 'scores', 'timeline.json'),
      JSON.stringify([
        {
          week: '2026-W17',
          computed_at: '2026-04-22T00:00:00.000Z',
          overall_score: 99,
          pillars: { electoral: 99, governance: 99, judicial: 99, media: 99, civil: 99, corruption: 99 },
          active_events_count: 0,
          structural_baseline: '2026-Q2',
        },
      ]),
    );

    const { aggregateWeekly } = await import('../src/pipeline/aggregate-weekly');
    const result = await aggregateWeekly({
      week: '2026-W17',
      baselineQuarter: '2026-Q2',
      projectRoot: root,
      skipAudit: true,
      now: FIXED_NOW,
    });

    const timeline = JSON.parse(
      readFileSync(path.join(root, 'data', 'scores', 'timeline.json'), 'utf-8'),
    ) as ScoreSnapshot[];
    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.overall_score).toBe(result.scoreSnapshot.overall_score);
    expect(timeline[0]?.overall_score).not.toBe(99); // staré skóre přepsáno
  });

  it('detects anomalies based on resulting events + activeSourceCount', async () => {
    const { root } = setupRoot();
    // 16 events trigne too_many_events při activeSourceCount=4 (threshold 15).
    const events = Array.from({ length: 16 }, (_, i) =>
      makeEvent(`2026-W17-${String(i + 1).padStart(3, '0')}`, '2026-W17'),
    );
    writeFileSync(
      path.join(root, 'data', 'events', '2026-W17.json'),
      JSON.stringify(events),
    );

    const { aggregateWeekly } = await import('../src/pipeline/aggregate-weekly');
    const result = await aggregateWeekly({
      week: '2026-W17',
      baselineQuarter: '2026-Q2',
      projectRoot: root,
      skipAudit: true,
      activeSourceCount: 4,
      now: FIXED_NOW,
    });

    const tooMany = result.anomalies.find((a) => a.trigger === 'too_many_events');
    expect(tooMany).toBeDefined();
    expect(tooMany?.details).toContain('16 events');
  });

  it('skipAudit=true neuvolává auditEvents', async () => {
    const { root } = setupRoot();
    writeFileSync(
      path.join(root, 'data', 'events', '2026-W17.json'),
      JSON.stringify([makeEvent('2026-W17-001', '2026-W17')]),
    );

    const auditMock = vi.fn();
    vi.doMock('../src/pipeline/audit', () => ({
      auditEvents: auditMock,
      applyAuditVerdicts: vi.fn(),
    }));

    const { aggregateWeekly } = await import('../src/pipeline/aggregate-weekly');
    await aggregateWeekly({
      week: '2026-W17',
      baselineQuarter: '2026-Q2',
      projectRoot: root,
      skipAudit: true,
      now: FIXED_NOW,
    });

    expect(auditMock).not.toHaveBeenCalled();
  });

  it('returns empty events when week file does not exist', async () => {
    const { root } = setupRoot();

    const { aggregateWeekly } = await import('../src/pipeline/aggregate-weekly');
    const result = await aggregateWeekly({
      week: '2025-W42',
      baselineQuarter: '2026-Q2',
      projectRoot: root,
      skipAudit: true,
      now: FIXED_NOW,
    });
    expect(result.events).toEqual([]);
    expect(result.outputs.reportPath).toBeNull(); // žádný report při 0 events
  });
});
