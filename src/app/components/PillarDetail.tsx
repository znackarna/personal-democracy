import Link from 'next/link';
import {
  PILLARS,
  PILLAR_WEIGHTS,
  type Pillar,
  type ScoreSnapshot,
  type StructuralBaseline,
} from '@/lib/types';
import {
  getMessages,
  methodologyDocPath,
  type Locale,
} from '@/i18n';
import { getPillarInfo, pillarAnchorId } from '@/i18n/pillar-info';

interface Props {
  locale: Locale;
  snapshot: ScoreSnapshot;
  baseline: StructuralBaseline;
}

const PILLAR_COLOR: Record<Pillar, { stripe: string; tag: string; tagText: string }> = {
  electoral: { stripe: 'bg-pillar-electoral', tag: 'bg-blue-100', tagText: 'text-blue-900' },
  governance: { stripe: 'bg-pillar-governance', tag: 'bg-violet-100', tagText: 'text-violet-900' },
  judicial: { stripe: 'bg-pillar-judicial', tag: 'bg-cyan-100', tagText: 'text-cyan-900' },
  media: { stripe: 'bg-pillar-media', tag: 'bg-orange-100', tagText: 'text-orange-900' },
  civil: { stripe: 'bg-pillar-civil', tag: 'bg-green-100', tagText: 'text-green-900' },
  corruption: { stripe: 'bg-pillar-corruption', tag: 'bg-red-100', tagText: 'text-red-900' },
};

export function PillarDetailGrid({ locale, snapshot, baseline }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PILLARS.map((p) => (
        <PillarDetailCard key={p} locale={locale} pillar={p} snapshot={snapshot} baseline={baseline} />
      ))}
    </div>
  );
}

function PillarDetailCard({
  locale,
  pillar,
  snapshot,
  baseline,
}: {
  locale: Locale;
  pillar: Pillar;
  snapshot: ScoreSnapshot;
  baseline: StructuralBaseline;
}) {
  const t = getMessages(locale);
  const info = getPillarInfo(locale)[pillar];
  const color = PILLAR_COLOR[pillar];
  const current = snapshot.pillars[pillar];
  const baselineValue = baseline.pillars[pillar];
  const delta = current - baselineValue;
  const deltaSign = delta >= 0 ? '+' : '';
  const deltaColor =
    Math.abs(delta) < 0.5 ? 'text-slate-500' : delta > 0 ? 'text-score-good' : 'text-score-bad';
  const weight = (PILLAR_WEIGHTS[pillar] * 100).toFixed(0);

  const fullDescriptionHref = `${methodologyDocPath('pillars', locale)}#${pillarAnchorId(pillar, locale)}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-1.5 ${color.stripe}`} aria-hidden />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <header>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{info.shortName}</h3>
              <p className="text-xs text-slate-500">{info.fullName}</p>
            </div>
            <span
              className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${color.tag} ${color.tagText}`}
              title={t.pillarDetail.weightTitle}
            >
              {t.pillarDetail.weightLabel} {weight} %
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-slate-900">
              {current.toFixed(1)}
            </span>
            <span className={`text-sm font-medium tabular-nums ${deltaColor}`}>
              {deltaSign}
              {delta.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">
              {t.pillarDetail.vsBaseline} {baselineValue.toFixed(1)}
            </span>
          </div>
        </header>

        <p className="text-sm text-slate-700">{renderInlineBold(info.description)}</p>

        <details className="text-xs text-slate-700">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-900">
            {t.pillarDetail.subcomponentsSummary}
          </summary>
          <ul className="mt-2 space-y-1 pl-4 [list-style:disc]">
            {info.subcomponents.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-score-bad">
            {t.pillarDetail.lowersHeading}
          </h4>
          <ul className="mt-1 space-y-1 text-xs text-slate-700">
            {info.lowerExamples.map((ex) => (
              <li key={ex} className="flex gap-2">
                <span className="text-score-bad" aria-hidden>
                  ↓
                </span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-score-good">
            {t.pillarDetail.raisesHeading}
          </h4>
          <ul className="mt-1 space-y-1 text-xs text-slate-700">
            {info.raiseExamples.map((ex) => (
              <li key={ex} className="flex gap-2">
                <span className="text-score-good" aria-hidden>
                  ↑
                </span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={fullDescriptionHref}
          className="mt-auto pt-2 text-xs font-medium text-slate-600 underline hover:text-slate-900"
        >
          {t.pillarDetail.fullDescriptionLink}
        </Link>
      </div>
    </article>
  );
}

/** Render text with **bold** markdown into JSX. Stupid-simple, no full MD parser. */
function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
