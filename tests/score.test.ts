import { describe, expect, it } from 'vitest';
import {
  ONE_OFF_DECAY_WEEKS,
  PILLAR_WEIGHTS,
  agedImpact,
  computeOverall,
  computePillarScores,
  computeScoreSnapshot,
  countActiveEvents,
  weeksBetween,
} from '../src/pipeline/score';
import {
  ScoreSnapshotSchema,
  type Event,
  type IsoWeek,
  type StructuralBaseline,
} from '../src/lib/types';

const FIXED_NOW = new Date('2026-04-28T06:00:00.000Z');

const baseline: StructuralBaseline = {
  quarter: '2026-Q2',
  computed_at: '2026-04-01T00:00:00.000Z',
  pillars: {
    electoral: 80,
    governance: 70,
    judicial: 75,
    media: 70,
    civil: 78,
    corruption: 65,
  },
  sources: [
    {
      index: 'V-Dem',
      year: 2025,
      value: 0.78,
      url: 'https://v-dem.net/',
    },
  ],
};

function makeEvent(overrides: Partial<Event> = {}): Event {
  const base: Event = {
    id: '2026-W17-001',
    date: '2026-04-22',
    headline: 'Test event headline',
    summary: 'A paraphrased summary of a hypothetical event used for unit testing the scoring function.',
    pillar: 'governance',
    severity: 3,
    direction: -1,
    duration: 'one_off',
    sources: [
      {
        title: 'Test source',
        url: 'https://example.com/article',
        outlet: 'Example Outlet',
        fetched_at: '2026-04-23T08:00:00.000Z',
      },
    ],
    score_impact: -1.5,
    rationale: 'Severity 3 per rubric §3 — significant institutional impact with broad consequences.',
    reviewer: 'manual',
    status: 'active',
    created_at: '2026-04-23T08:00:00.000Z',
  };
  return { ...base, ...overrides };
}

describe('weeksBetween', () => {
  it('returns 0 for the same ISO week', () => {
    expect(weeksBetween('2026-04-27', '2026-W18')).toBe(0);
    expect(weeksBetween('2026-05-03', '2026-W18')).toBe(0); // Sunday end of W18
  });

  it('counts a one-week gap', () => {
    expect(weeksBetween('2026-04-22', '2026-W18')).toBe(1);
  });

  it('handles the year boundary (W52 2025 → W01 2026)', () => {
    expect(weeksBetween('2025-12-22', '2026-W01')).toBe(1);
  });

  it('handles a long gap across months', () => {
    expect(weeksBetween('2026-01-26', '2026-W17')).toBe(12);
    expect(weeksBetween('2026-01-19', '2026-W17')).toBe(13);
  });

  it('throws on malformed inputs', () => {
    expect(() => weeksBetween('not-a-date', '2026-W17')).toThrow(/Invalid ISO date/);
    expect(() => weeksBetween('2026-04-22', 'invalid' as IsoWeek)).toThrow(/Invalid ISO week/);
  });
});

describe('agedImpact', () => {
  it('returns 0 for non-active events', () => {
    expect(agedImpact(makeEvent({ status: 'resolved' }), '2026-W17')).toBe(0);
    expect(agedImpact(makeEvent({ status: 'disputed' }), '2026-W17')).toBe(0);
    expect(agedImpact(makeEvent({ status: 'needs_review' }), '2026-W17')).toBe(0);
  });

  it('returns full impact for persistent events regardless of age', () => {
    const e = makeEvent({ duration: 'persistent', date: '2024-01-01', score_impact: -3 });
    expect(agedImpact(e, '2026-W17')).toBe(-3);
  });

  it('returns full impact for a one_off event in the same week', () => {
    const e = makeEvent({ date: '2026-04-22', score_impact: -1.5 }); // W17
    expect(agedImpact(e, '2026-W17')).toBe(-1.5);
  });

  it('halves the impact at 6 weeks elapsed', () => {
    const e = makeEvent({ date: '2026-03-09', score_impact: -1.5 }); // Mon W11
    // W17 - W11 = 6 → remaining = (12-6)/12 = 0.5
    expect(agedImpact(e, '2026-W17')).toBeCloseTo(-0.75, 10);
  });

  it('returns 0 once 12 or more weeks have elapsed', () => {
    const e12 = makeEvent({ date: '2026-01-26', score_impact: -1.5 }); // Mon W5, 12w to W17
    const e13 = makeEvent({ date: '2026-01-19', score_impact: -1.5 }); // Mon W4, 13w to W17
    expect(agedImpact(e12, '2026-W17')).toBe(0);
    expect(agedImpact(e13, '2026-W17')).toBe(0);
  });

  it('returns 0 for future-dated events (haven\'t happened yet at snapshot time)', () => {
    // Critical for historical backfill: snapshot for week N must ignore events
    // dated > N. For live pipeline future dates are typos → should be 0 too.
    const e = makeEvent({ date: '2026-05-25', score_impact: 2 }); // > 2026-W17
    expect(agedImpact(e, '2026-W17')).toBe(0);
  });

  it('returns 0 for persistent events that are still in the future', () => {
    const e = makeEvent({
      date: '2026-12-01',
      duration: 'persistent',
      score_impact: -3,
    });
    expect(agedImpact(e, '2026-W17')).toBe(0);
  });
});

describe('computePillarScores', () => {
  it('returns the baseline pillars (rounded) when there are no events', () => {
    expect(computePillarScores(baseline, [], '2026-W17')).toEqual({
      electoral: 80,
      governance: 70,
      judicial: 75,
      media: 70,
      civil: 78,
      corruption: 65,
    });
  });

  it('subtracts a persistent event impact from the right pillar', () => {
    const e = makeEvent({
      duration: 'persistent',
      pillar: 'governance',
      score_impact: -3,
      date: '2025-01-01',
    });
    const scores = computePillarScores(baseline, [e], '2026-W17');
    expect(scores.governance).toBe(67);
    expect(scores.judicial).toBe(75); // unaffected
  });

  it('aggregates multiple events in the same pillar additively', () => {
    const a = makeEvent({ id: '2026-W17-001', score_impact: -1.5, pillar: 'judicial' });
    const b = makeEvent({ id: '2026-W17-002', score_impact: -3, pillar: 'judicial' });
    const scores = computePillarScores(baseline, [a, b], '2026-W17');
    // -1.5 + -3 = -4.5 → 75 - 4.5 = 70.5
    expect(scores.judicial).toBe(70.5);
  });

  it('clamps pillar scores into [0, 100]', () => {
    const lowBaseline: StructuralBaseline = {
      ...baseline,
      pillars: { ...baseline.pillars, civil: 2 },
    };
    const negative = makeEvent({ pillar: 'civil', score_impact: -6, duration: 'persistent' });
    expect(computePillarScores(lowBaseline, [negative], '2026-W17').civil).toBe(0);

    const highBaseline: StructuralBaseline = {
      ...baseline,
      pillars: { ...baseline.pillars, electoral: 99 },
    };
    const positive = makeEvent({ pillar: 'electoral', score_impact: 6, duration: 'persistent', direction: 1 });
    expect(computePillarScores(highBaseline, [positive], '2026-W17').electoral).toBe(100);
  });

  it('skips resolved events', () => {
    const e = makeEvent({ status: 'resolved', score_impact: -3, duration: 'persistent' });
    const scores = computePillarScores(baseline, [e], '2026-W17');
    expect(scores.governance).toBe(70);
  });
});

describe('computeOverall', () => {
  it('is the weight-respecting weighted average of pillar scores', () => {
    // 80*0.15 + 70*0.20 + 75*0.20 + 70*0.15 + 78*0.15 + 65*0.15
    // = 12 + 14 + 15 + 10.5 + 11.7 + 9.75 = 72.95 → round1 = 73.0
    expect(computeOverall(baseline.pillars)).toBe(73);
  });

  it('weights sum to 1.0', () => {
    const sum = Object.values(PILLAR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe('countActiveEvents', () => {
  it('counts only active events with non-zero aged impact', () => {
    const events: Event[] = [
      makeEvent({ id: '2026-W17-001', status: 'active', date: '2026-04-22' }), // counts
      makeEvent({ id: '2026-W17-002', status: 'resolved' }), // skipped
      makeEvent({ id: '2026-W05-001', status: 'active', date: '2026-01-26' }), // 12w → impact 0
      makeEvent({ id: '2026-W17-003', status: 'needs_review' }), // skipped
    ];
    expect(countActiveEvents(events, '2026-W17')).toBe(1);
  });
});

describe('computeScoreSnapshot', () => {
  it('produces a snapshot that validates against ScoreSnapshotSchema', () => {
    const snapshot = computeScoreSnapshot(baseline, [], '2026-W18', { now: FIXED_NOW });
    expect(() => ScoreSnapshotSchema.parse(snapshot)).not.toThrow();
    expect(snapshot.week).toBe('2026-W18');
    expect(snapshot.computed_at).toBe(FIXED_NOW.toISOString());
    expect(snapshot.structural_baseline).toBe('2026-Q2');
    expect(snapshot.overall_score).toBe(73);
    expect(snapshot.active_events_count).toBe(0);
  });

  it('reflects a single persistent governance event end-to-end', () => {
    const e = makeEvent({
      duration: 'persistent',
      pillar: 'governance',
      score_impact: -3,
      date: '2025-06-01',
    });
    const snapshot = computeScoreSnapshot(baseline, [e], '2026-W18', { now: FIXED_NOW });
    expect(snapshot.pillars.governance).toBe(67);
    // Only governance changes: 80*0.15 + 67*0.20 + 75*0.20 + 70*0.15 + 78*0.15 + 65*0.15
    // = 12 + 13.4 + 15 + 10.5 + 11.7 + 9.75 = 72.35 → round1 = 72.4 (or 72.3 depending on rounding mode)
    expect(snapshot.overall_score).toBeCloseTo(72.4, 1);
    expect(snapshot.active_events_count).toBe(1);
  });

  it('exposes the decay constant', () => {
    expect(ONE_OFF_DECAY_WEEKS).toBe(12);
  });
});
