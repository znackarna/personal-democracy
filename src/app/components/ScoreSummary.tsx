import { type ScoreSnapshot, type StructuralBaseline, PILLARS, PILLAR_WEIGHTS } from '@/lib/types';
import { getMessages, type Locale } from '@/i18n';

interface Props {
  locale: Locale;
  snapshot: ScoreSnapshot;
  baseline: StructuralBaseline;
  /**
   * Previous week, if it exists. Used to display the week-over-week delta
   * (more intuitive than the delta from the quarterly baseline).
   */
  prevSnapshot?: ScoreSnapshot;
}

export function ScoreSummary({ locale, snapshot, baseline, prevSnapshot }: Props) {
  const t = getMessages(locale);
  const baselineOverall = PILLARS.reduce(
    (s, p) => s + baseline.pillars[p] * PILLAR_WEIGHTS[p],
    0,
  );
  const baselineDelta = snapshot.overall_score - baselineOverall;

  const primaryDelta = prevSnapshot
    ? snapshot.overall_score - prevSnapshot.overall_score
    : baselineDelta;
  const primaryLabel = prevSnapshot ? t.scoreSummary.vsLastWeek : t.scoreSummary.vsBaseline;
  const primarySign = primaryDelta >= 0 ? '+' : '';
  const primaryColor =
    Math.abs(primaryDelta) < 0.1
      ? 'text-slate-500'
      : primaryDelta > 0
        ? 'text-score-good'
        : 'text-score-bad';

  const baselineDeltaText = `${baselineDelta >= 0 ? '+' : ''}${baselineDelta.toFixed(1)}`;
  const note = t.scoreSummary.weightedIndexNote
    .replace('{baseline}', baselineOverall.toFixed(1))
    .replace('{quarter}', baseline.quarter)
    .replace('{delta}', baselineDeltaText)
    .replace('{count}', String(snapshot.active_events_count));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {t.scoreSummary.weekLabel} {snapshot.week}
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
              <span className="text-xs uppercase tracking-wide text-slate-400">{primaryLabel}</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">{note}</p>
        </div>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          {PILLARS.map((p) => (
            <div key={p}>
              <dt className="font-medium capitalize text-slate-500">{t.pillars[p].short}</dt>
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
