import { type Event, type Pillar } from '@/lib/types';
import { getMessages, type Locale } from '@/i18n';

interface Props {
  locale: Locale;
  event: Event;
  /** Repo URL used to build the dispute issue link. */
  repoUrl?: string;
}

const PILLAR_COLOR: Record<Pillar, string> = {
  electoral: 'bg-pillar-electoral',
  governance: 'bg-pillar-governance',
  judicial: 'bg-pillar-judicial',
  media: 'bg-pillar-media',
  civil: 'bg-pillar-civil',
  corruption: 'bg-pillar-corruption',
};

const SEVERITY_COLOR: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'bg-severity-1 text-slate-800',
  2: 'bg-severity-2 text-white',
  3: 'bg-severity-3 text-white',
  4: 'bg-severity-4 text-white',
  5: 'bg-severity-5 text-white',
};

const STATUS_STYLE: Record<Event['status'], string> = {
  active: 'border-slate-300 bg-slate-100 text-slate-700',
  resolved: 'border-slate-300 bg-slate-50 text-slate-500',
  disputed: 'border-amber-400 bg-amber-50 text-amber-800',
  needs_review: 'border-amber-400 bg-amber-50 text-amber-800',
};

export function EventCard({ locale, event, repoUrl }: Props) {
  const t = getMessages(locale);
  const repo = repoUrl ?? t.meta.repoUrl;

  // Locale-specific text fields. EN falls back to CS with a "[CS]" badge.
  const headline = locale === 'en' ? (event.headline_en ?? event.headline) : event.headline;
  const summary = locale === 'en' ? (event.summary_en ?? event.summary) : event.summary;
  const rationale = locale === 'en' ? (event.rationale_en ?? event.rationale) : event.rationale;
  const enFallback = locale === 'en' && !event.headline_en;

  const direction =
    event.direction === 1 ? t.direction.up : event.direction === -1 ? t.direction.down : t.direction.flat;
  const directionColor =
    event.direction === 1
      ? 'text-score-good'
      : event.direction === -1
        ? 'text-score-bad'
        : 'text-slate-500';

  const disputeUrl = buildDisputeUrl(event, repo, locale);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white ${PILLAR_COLOR[event.pillar]}`}
        >
          {t.pillars[event.pillar].short}
        </span>
        {event.severity !== null && (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${SEVERITY_COLOR[event.severity]}`}
          >
            {t.eventCard.severityLabel} {event.severity}
          </span>
        )}
        <span className={`text-xs font-medium ${directionColor}`}>{direction}</span>
        {event.status !== 'active' && (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[event.status]}`}
          >
            {t.status[event.status]}
          </span>
        )}
        {event.duration === 'persistent' && (
          <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
            {t.eventCard.persistent}
          </span>
        )}
        {enFallback && (
          <span
            className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500"
            title={t.eventCard.enFallbackBadgeTitle}
          >
            CS
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-slate-400">{event.id}</span>
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900">{headline}</h3>
      <div className="mt-1 text-xs text-slate-500">
        {event.date}
        {event.score_impact !== 0 && (
          <span className="ml-2 font-mono">
            {t.eventCard.impactPrefix} {event.score_impact > 0 ? '+' : ''}
            {event.score_impact.toFixed(1)} {t.eventCard.impactSuffix}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-700">{summary}</p>

      <details className="mt-3 text-sm text-slate-600">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-900">
          {t.eventCard.rationaleSummary}
        </summary>
        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed">
          {rationale}
        </p>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex flex-wrap gap-2">
          {event.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 hover:bg-slate-100"
              title={s.title}
            >
              {s.outlet} ↗
            </a>
          ))}
        </div>
        <a
          href={disputeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-slate-500 underline hover:text-slate-900"
        >
          {t.eventCard.disputeButton}
        </a>
      </div>
    </article>
  );
}

function buildDisputeUrl(event: Event, repoUrl: string, locale: Locale): string {
  const t = getMessages(locale);
  const d = t.dispute;
  const headlineForTitle = (event.headline_en ?? event.headline).slice(0, 80);
  const title = d.title.replace('{id}', event.id).replace('{headline}', headlineForTitle);
  const body = [
    d.section1,
    ``,
    `- ${d.eventIdLabel} \`${event.id}\``,
    `- ${d.pillarLabel} ${event.pillar}`,
    `- ${d.severityLabel} ${event.severity ?? d.severityNull}`,
    `- ${d.directionLabel} ${event.direction}`,
    `- ${d.statusLabel} ${event.status}`,
    `- ${d.dateLabel} ${event.date}`,
    ``,
    d.section2,
    ``,
    d.section2Body,
    ``,
    d.section3,
    ``,
    d.section3Body,
    ``,
    `---`,
    `${d.sourcesLeadIn} ${event.sources.map((s) => s.url).join(', ')}`,
  ].join('\n');
  const labels = locale === 'cs' ? 'dispute' : 'dispute,en';
  const params = new URLSearchParams({
    title,
    body,
    labels,
  });
  return `${repoUrl}/issues/new?${params.toString()}`;
}
