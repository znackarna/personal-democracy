import {
  PILLARS,
  PILLAR_WEIGHTS,
  ScoreSnapshotSchema,
  type Event,
  type IsoWeek,
  type Pillar,
  type PillarScores,
  type ScoreSnapshot,
  type StructuralBaseline,
} from '../lib/types';

export { PILLAR_WEIGHTS };

// One_off events lose 1/12 of their impact each ISO week. After 12 weeks the impact is zero.
// Discrete by ISO week (not by day) — keeps the math aligned with the weekly pipeline cadence.
export const ONE_OFF_DECAY_WEEKS = 12;

const ISO_WEEK_RE = /^(\d{4})-W(0[1-9]|[1-4]\d|5[0-3])$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function parseIsoWeekLabel(week: IsoWeek): { year: number; week: number } {
  const m = ISO_WEEK_RE.exec(week);
  if (!m) throw new Error(`Invalid ISO week label: ${week}`);
  return { year: Number(m[1]), week: Number(m[2]) };
}

function isoWeekToMondayUtc(year: number, week: number): Date {
  // ISO 8601: week 1 is the week containing Jan 4. Find Monday of that week, then offset.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - (jan4Dow - 1)));
  return new Date(week1Monday.getTime() + (week - 1) * 7 * MS_PER_DAY);
}

function dateToIsoWeek(isoDate: string): { year: number; week: number } {
  const m = ISO_DATE_RE.exec(isoDate);
  if (!m) throw new Error(`Invalid ISO date: ${isoDate}`);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const dayNum = d.getUTCDay() || 7;
  // ISO week is determined by the Thursday of the same week.
  const thursday = new Date(d.getTime() + (4 - dayNum) * MS_PER_DAY);
  const year = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
  return { year, week };
}

export function weeksBetween(fromIsoDate: string, toIsoWeek: IsoWeek): number {
  const from = dateToIsoWeek(fromIsoDate);
  const to = parseIsoWeekLabel(toIsoWeek);
  const mondayFrom = isoWeekToMondayUtc(from.year, from.week);
  const mondayTo = isoWeekToMondayUtc(to.year, to.week);
  return Math.round((mondayTo.getTime() - mondayFrom.getTime()) / (7 * MS_PER_DAY));
}

export function agedImpact(event: Event, currentWeek: IsoWeek): number {
  if (event.status !== 'active') return 0;
  if (event.duration === 'persistent') return event.score_impact;
  const elapsed = weeksBetween(event.date, currentWeek);
  // Future-dated events (negative elapsed) get full impact — same as elapsed === 0.
  if (elapsed <= 0) return event.score_impact;
  if (elapsed >= ONE_OFF_DECAY_WEEKS) return 0;
  const remaining = (ONE_OFF_DECAY_WEEKS - elapsed) / ONE_OFF_DECAY_WEEKS;
  return event.score_impact * remaining;
}

const clamp = (x: number, min: number, max: number): number => Math.min(max, Math.max(min, x));
const round1 = (x: number): number => Math.round(x * 10) / 10;

export function computePillarScores(
  baseline: StructuralBaseline,
  events: readonly Event[],
  currentWeek: IsoWeek,
): PillarScores {
  const accum: Record<Pillar, number> = { ...baseline.pillars };
  for (const event of events) {
    const impact = agedImpact(event, currentWeek);
    if (impact === 0) continue;
    accum[event.pillar] = accum[event.pillar] + impact;
  }
  return {
    electoral: round1(clamp(accum.electoral, 0, 100)),
    governance: round1(clamp(accum.governance, 0, 100)),
    judicial: round1(clamp(accum.judicial, 0, 100)),
    media: round1(clamp(accum.media, 0, 100)),
    civil: round1(clamp(accum.civil, 0, 100)),
    corruption: round1(clamp(accum.corruption, 0, 100)),
  };
}

export function computeOverall(pillars: PillarScores): number {
  let sum = 0;
  for (const pillar of PILLARS) {
    sum += pillars[pillar] * PILLAR_WEIGHTS[pillar];
  }
  return round1(clamp(sum, 0, 100));
}

export function countActiveEvents(events: readonly Event[], currentWeek: IsoWeek): number {
  let n = 0;
  for (const event of events) {
    if (event.status !== 'active') continue;
    if (agedImpact(event, currentWeek) === 0) continue;
    n += 1;
  }
  return n;
}

export function computeScoreSnapshot(
  baseline: StructuralBaseline,
  events: readonly Event[],
  week: IsoWeek,
  options: { now?: Date } = {},
): ScoreSnapshot {
  const pillars = computePillarScores(baseline, events, week);
  const snapshot: ScoreSnapshot = {
    week,
    computed_at: (options.now ?? new Date()).toISOString(),
    overall_score: computeOverall(pillars),
    pillars,
    active_events_count: countActiveEvents(events, week),
    structural_baseline: baseline.quarter,
  };
  return ScoreSnapshotSchema.parse(snapshot);
}
