import { type ScoreSnapshot, type StructuralBaseline, PILLARS, PILLAR_WEIGHTS } from '@/lib/types';

interface Props {
  snapshot: ScoreSnapshot;
  baseline: StructuralBaseline;
  /**
   * Předchozí týden, pokud existuje. Slouží k zobrazení week-over-week
   * delty (intuitivnější než delta od kvartálního baseline).
   */
  prevSnapshot?: ScoreSnapshot;
}

export function ScoreSummary({ snapshot, baseline, prevSnapshot }: Props) {
  // Baseline weighted overall — co by skóre bylo s nulou aktivních eventů.
  const baselineOverall =
    PILLARS.reduce((s, p) => s + baseline.pillars[p] * PILLAR_WEIGHTS[p], 0);
  const baselineDelta = snapshot.overall_score - baselineOverall;

  // Hlavní delta zobrazená vedle čísla = WoW (week-over-week). Když máme
  // předchozí snapshot, je tohle to, co uživatel intuitivně očekává jako
  // „směr pohybu". Bez předchozího snapshotu fallbackuje na baseline-delta.
  const primaryDelta = prevSnapshot
    ? snapshot.overall_score - prevSnapshot.overall_score
    : baselineDelta;
  const primaryLabel = prevSnapshot ? `vs. minulý týden` : `vs. baseline`;
  const primarySign = primaryDelta >= 0 ? '+' : '';
  const primaryColor =
    Math.abs(primaryDelta) < 0.1
      ? 'text-slate-500'
      : primaryDelta > 0
        ? 'text-score-good'
        : 'text-score-bad';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Týden {snapshot.week}
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <div className="text-6xl font-bold tabular-nums text-slate-900">
              {snapshot.overall_score.toFixed(1)}
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-semibold tabular-nums ${primaryColor}`}>
                {primarySign}
                {primaryDelta.toFixed(1)}
              </span>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {primaryLabel}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Vážený index 0–100. Baseline {baselineOverall.toFixed(1)} ({baseline.quarter}){' '}
            {baselineDelta >= 0 ? '+' : ''}
            {baselineDelta.toFixed(1)} z {snapshot.active_events_count} aktivních událostí.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          {PILLARS.map((p) => (
            <div key={p}>
              <dt className="font-medium capitalize text-slate-500">{czechPillar(p)}</dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">
                {snapshot.pillars[p].toFixed(1)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function czechPillar(p: (typeof PILLARS)[number]): string {
  return {
    electoral: 'Volby',
    governance: 'Vládnutí',
    judicial: 'Justice',
    media: 'Média',
    civil: 'Svobody',
    corruption: 'Korupce',
  }[p];
}
