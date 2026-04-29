import { type AuditResult } from './audit';
import { PILLARS, type Event, type Pillar, type ScoreSnapshot } from '../lib/types';

/**
 * Anomaly trigger codes per methodology/governance.md, vrstva 4.
 *
 * Anomálie nezablokuje publikaci — orchestrátor index commituje normálně.
 * Jejich účel je informační kanál pro reviewera (v iteraci 8 GH Actions
 * otevře GitHub issue per anomalie).
 */
export type AnomalyTrigger =
  | 'too_many_events'
  | 'severity_5'
  | 'pillar_shift'
  | 'auditor_high_flag_rate'
  | 'single_outlet_dominance';

export interface Anomaly {
  trigger: AnomalyTrigger;
  /** One-line human-readable summary suitable for issue title or report bullet. */
  details: string;
  /** info = noteworthy but normal range; warn = clearly outside norm. */
  level: 'info' | 'warn';
}

export interface DetectInput {
  events: readonly Event[];
  newSnapshot: ScoreSnapshot;
  /** Previous week's snapshot for pillar-shift detection. Optional (first run). */
  prevSnapshot?: ScoreSnapshot;
  audit?: AuditResult;
  /**
   * Počet zdrojů, ze kterých se v daném týdnu reálně přečetla data
   * (`perSource.count > 0`). Použije se pro normalizaci "too_many_events"
   * thresholdu — bez něj má smysl jen statický odhad. Optional (test compat).
   */
  activeSourceCount?: number;
}

/**
 * Per-source kvóta: kolik events za týden je horní hranice "normálu" na jeden
 * aktivní zdroj. 3.5 odráží empirické pozorování dosavadních běhů
 * (19 zdrojů → 47 events → ~2.5/zdroj jako typický týden, headroom k 3.5).
 *
 * Zvyš toto číslo, pokud zařazení nového zdroje opakovaně triggeruje false
 * positive. Sniž, pokud chceš citlivější detekci špiček.
 */
const TOO_MANY_EVENTS_PER_SOURCE = 3.5;

/**
 * Spodní podlaha, aby se na malém source listu (např. dev nebo backfill
 * testy se 2-3 zdroji) nehlásilo "too_many" už při běžných 6 events.
 */
const TOO_MANY_EVENTS_FLOOR = 15;

/**
 * Fallback threshold použitý, když caller nedodal activeSourceCount.
 * Drží zpětnou kompatibilitu s existujícími testy a externími callery.
 */
const TOO_MANY_EVENTS_LEGACY_THRESHOLD = 5;

const PILLAR_SHIFT_THRESHOLD = 5.0;
const AUDITOR_FLAG_RATE_THRESHOLD = 0.5;
const SINGLE_OUTLET_DOMINANCE_THRESHOLD = 0.5;

export function detectAnomalies(input: DetectInput): Anomaly[] {
  const { events, newSnapshot, prevSnapshot, audit, activeSourceCount } = input;
  const anomalies: Anomaly[] = [];

  // 1. Too many events for the week — threshold škáluje s počtem aktivních
  //    zdrojů, aby se source list mohl rozšiřovat bez triggerování warningů.
  const tooManyThreshold = computeTooManyEventsThreshold(activeSourceCount);
  if (events.length > tooManyThreshold) {
    const sourcesNote =
      activeSourceCount !== undefined
        ? `Práh > ${tooManyThreshold} (= ${TOO_MANY_EVENTS_PER_SOURCE} events × ${activeSourceCount} aktivních zdrojů, min ${TOO_MANY_EVENTS_FLOOR}).`
        : `Práh > ${tooManyThreshold} (legacy, bez normalizace na zdroje).`;
    anomalies.push({
      trigger: 'too_many_events',
      details: `Týden má ${events.length} events. ${sourcesNote}`,
      level: 'warn',
    });
  }

  // 2. Any severity 5
  const severity5 = events.filter((e) => e.severity === 5);
  if (severity5.length > 0) {
    anomalies.push({
      trigger: 'severity_5',
      details: `Severity 5 events (${severity5.length}): ${severity5.map((e) => e.id).join(', ')}. Strukturální posun vyžaduje druhý pár očí.`,
      level: 'warn',
    });
  }

  // 3. Pillar shift > 5 points week-over-week
  if (prevSnapshot) {
    const shifted: Array<{ pillar: Pillar; delta: number }> = [];
    for (const p of PILLARS) {
      const delta = newSnapshot.pillars[p] - prevSnapshot.pillars[p];
      if (Math.abs(delta) > PILLAR_SHIFT_THRESHOLD) {
        shifted.push({ pillar: p, delta });
      }
    }
    if (shifted.length > 0) {
      anomalies.push({
        trigger: 'pillar_shift',
        details: `Pillar shift > ${PILLAR_SHIFT_THRESHOLD} bodů: ${shifted
          .map((s) => `${s.pillar} ${s.delta > 0 ? '+' : ''}${s.delta.toFixed(1)}`)
          .join(', ')}`,
        level: 'warn',
      });
    }
  }

  // 4. Auditor high flag rate
  if (audit && audit.per_event.length > 0) {
    const flagged = audit.per_event.filter(
      (v) => v.verdict === 'flag' || v.verdict === 'downgrade',
    );
    const rate = flagged.length / audit.per_event.length;
    if (rate >= AUDITOR_FLAG_RATE_THRESHOLD) {
      anomalies.push({
        trigger: 'auditor_high_flag_rate',
        details: `Auditor označil ${flagged.length}/${audit.per_event.length} events (${Math.round(rate * 100)}%). Práh ≥ ${Math.round(AUDITOR_FLAG_RATE_THRESHOLD * 100)}% — systematický problém klasifikace.`,
        level: 'warn',
      });
    }
  }

  // 5. Single outlet dominance — outlet appearing in > 50 % of events
  if (events.length > 0) {
    const outletCounts = new Map<string, number>();
    for (const e of events) {
      const seen = new Set<string>();
      for (const s of e.sources) {
        const key = s.outlet.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        outletCounts.set(key, (outletCounts.get(key) ?? 0) + 1);
      }
    }
    let topOutlet: string | null = null;
    let topCount = 0;
    for (const [outlet, count] of outletCounts) {
      if (count > topCount) {
        topOutlet = outlet;
        topCount = count;
      }
    }
    const share = topCount / events.length;
    if (topOutlet !== null && share > SINGLE_OUTLET_DOMINANCE_THRESHOLD) {
      anomalies.push({
        trigger: 'single_outlet_dominance',
        details: `Outlet "${topOutlet}" pokrývá ${topCount}/${events.length} events (${Math.round(share * 100)}%). Práh > ${Math.round(SINGLE_OUTLET_DOMINANCE_THRESHOLD * 100)}% — porušení source diversity.`,
        level: 'warn',
      });
    }
  }

  return anomalies;
}

function computeTooManyEventsThreshold(activeSourceCount: number | undefined): number {
  if (activeSourceCount === undefined) return TOO_MANY_EVENTS_LEGACY_THRESHOLD;
  return Math.max(
    TOO_MANY_EVENTS_FLOOR,
    Math.ceil(activeSourceCount * TOO_MANY_EVENTS_PER_SOURCE),
  );
}
