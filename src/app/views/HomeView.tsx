import Link from 'next/link';
import { ScoreSummary } from '../components/ScoreSummary';
import { ScoreTimeline } from '../components/ScoreTimeline';
import { PillarBreakdown } from '../components/PillarBreakdown';
import { PillarDetailGrid } from '../components/PillarDetail';
import { IndexComparisonTable } from '../components/IndexComparison';
import { EventCard } from '../components/EventCard';
import { InfoBox } from '../components/InfoBox';
import { PublicOpinion } from '../components/PublicOpinion';
import {
  readAllEvents,
  readIndexComparisons,
  readLatest,
  readPollSeries,
  readTimeline,
  readTopicalFindings,
} from '../lib/data';
import { eventsPath, getMessages, methodologyDocPath, type Locale } from '@/i18n';
import { PILLARS, type Pillar } from '@/lib/types';

interface Props {
  locale: Locale;
}

export async function HomeView({ locale }: Props) {
  const t = getMessages(locale);
  const [{ snapshot, baseline }, timeline, allEvents, comparisons, pollSeries, topical] =
    await Promise.all([
      readLatest(),
      readTimeline(),
      readAllEvents(),
      readIndexComparisons(),
      readPollSeries(),
      readTopicalFindings(),
    ]);

  const recentEvents = allEvents.slice(0, 5);
  const prevSnapshot = timeline.length >= 2 ? timeline[timeline.length - 2] : undefined;

  const pillarLabels = Object.fromEntries(
    PILLARS.map((p) => [p, t.pillars[p].short]),
  ) as Record<Pillar, string>;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">{t.home.title}</h1>
        <p className="max-w-3xl text-slate-600">
          {t.home.introBeforeModel}{' '}
          <span className="font-mono text-sm">claude-sonnet-4-6</span>
          {t.home.introAfterModel}
        </p>
      </section>

      {snapshot && baseline ? (
        <>
          <ScoreSummary
            locale={locale}
            snapshot={snapshot}
            baseline={baseline}
            {...(prevSnapshot ? { prevSnapshot } : {})}
          />

          <InfoBox locale={locale} title={t.home.scoreInfoTitle} readMore={{ doc: 'weights' }}>
            <p>
              <strong>{t.home.scoreInfoP1.baselineBold}</strong> ({baseline.quarter})
              {t.home.scoreInfoP1.afterQuarter}
              <strong>{t.home.scoreInfoP1.weeklyBold}</strong>
              {t.home.scoreInfoP1.afterWeekly}
              <Link
                href={methodologyDocPath('severity', locale)}
                className="underline hover:text-slate-900"
              >
                {t.home.scoreInfoP1.rubricLink}
              </Link>
              {t.home.scoreInfoP1.tail}
            </p>
            <p>
              <strong>{t.home.scoreInfoP2.overallBold}</strong>
              {t.home.scoreInfoP2.tail}
            </p>
          </InfoBox>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">{t.home.timelineHeading}</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ScoreTimeline
                snapshots={timeline}
                emptyLabel={t.scoreTimeline.empty}
                tooltipLabel={t.scoreTimeline.tooltipLabel}
              />
              {timeline.length === 1 && (
                <p className="mt-2 text-xs text-slate-500">
                  {t.home.timelineFirstSnapshot} {timeline[0]?.week}.
                </p>
              )}
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <strong className="font-semibold text-slate-700">
                  {t.home.timelineComparabilityWarn}
                </strong>{' '}
                {t.home.timelineComparability}{' '}
                <Link
                  href={methodologyDocPath('openIssues', locale)}
                  className="underline hover:text-slate-700"
                >
                  {t.home.timelineComparabilityLink}
                </Link>
                .
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              {t.home.pillarBreakdownHeading}
            </h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <PillarBreakdown
                snapshot={snapshot}
                baseline={baseline}
                pillarLabels={pillarLabels}
                tooltipCurrentLabel={t.pillarBreakdown.tooltipCurrent}
              />
              <p className="mt-2 text-xs text-slate-500">
                {t.home.pillarBreakdownNotePre}
                {baseline.quarter}
                {t.home.pillarBreakdownNotePost}
              </p>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">{t.home.pillarDetailHeading}</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">{t.home.pillarDetailIntro}</p>
            </div>
            <PillarDetailGrid locale={locale} snapshot={snapshot} baseline={baseline} />
            <div className="mt-3">
              <InfoBox locale={locale} title={t.home.pillarReadingTitle}>
                <p>
                  {t.home.pillarReadingP1.pre}
                  <strong>{t.home.pillarReadingP1.bold1}</strong>
                  {t.home.pillarReadingP1.mid}
                  <strong>{t.home.pillarReadingP1.bold2}</strong>
                  {t.home.pillarReadingP1.tail}
                </p>
                <p>
                  {t.home.pillarReadingP2.pre}
                  <strong>{t.home.pillarReadingP2.bold}</strong>
                  {t.home.pillarReadingP2.tail}
                </p>
                <p>
                  <strong>{t.home.pillarReadingP3.bold1}</strong>
                  {t.home.pillarReadingP3.mid1}
                  <strong>{t.home.pillarReadingP3.bold2}</strong>
                  {t.home.pillarReadingP3.mid2}
                  <strong>{t.home.pillarReadingP3.bold3}</strong>
                  {t.home.pillarReadingP3.tail}
                </p>
              </InfoBox>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          <p>{t.home.noSnapshot}</p>
        </section>
      )}

      {comparisons.baselineQuarter && comparisons.comparisons.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">{t.home.comparisonHeading}</h2>
          <IndexComparisonTable
            locale={locale}
            comparisons={comparisons.comparisons}
            baselineQuarter={comparisons.baselineQuarter}
          />
          <div className="mt-3">
            <InfoBox
              locale={locale}
              title={t.home.comparisonInfoTitle}
              readMore={{ doc: 'structuralMapping' }}
            >
              <p>
                {t.home.comparisonInfoP1.pre}
                <strong>{t.home.comparisonInfoP1.bold}</strong>
                {t.home.comparisonInfoP1.tail}
              </p>
              <p>
                <strong>{t.home.comparisonInfoP2.bold1}</strong>
                {t.home.comparisonInfoP2.mid1}
                <strong>{t.home.comparisonInfoP2.bold2}</strong>
                {t.home.comparisonInfoP2.tail}
              </p>
              <p>
                <strong>{t.home.comparisonInfoP3.bold}</strong>
                {t.home.comparisonInfoP3.tail}
              </p>
            </InfoBox>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{t.home.recentEventsHeading}</h2>
          <Link
            href={eventsPath(locale)}
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            {t.home.recentEventsAll}
          </Link>
        </div>
        <InfoBox locale={locale} title={t.home.eventsInfoTitle} readMore={{ doc: 'governance' }}>
          <p>
            <strong>{t.home.eventsInfoLead.bold}</strong>
            {t.home.eventsInfoLead.tail}
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <strong>{t.home.eventsInfoSteps.collection.bold}</strong>
              {t.home.eventsInfoSteps.collection.tail}
            </li>
            <li>
              <strong>{t.home.eventsInfoSteps.preFilter.bold}</strong>
              {t.home.eventsInfoSteps.preFilter.tail}
            </li>
            <li>
              <strong>{t.home.eventsInfoSteps.classify.bold}</strong>
              {t.home.eventsInfoSteps.classify.mid}
              <Link
                href={methodologyDocPath('severity', locale)}
                className="underline hover:text-slate-900"
              >
                {t.home.eventsInfoSteps.classify.link}
              </Link>
              {t.home.eventsInfoSteps.classify.tail}
            </li>
            <li>
              <strong>{t.home.eventsInfoSteps.dedupe.bold}</strong>
              {t.home.eventsInfoSteps.dedupe.midA}
              <code>{t.home.eventsInfoSteps.dedupe.code}</code>
              {t.home.eventsInfoSteps.dedupe.tail}
            </li>
            <li>
              <strong>{t.home.eventsInfoSteps.cap.bold}</strong>
              {t.home.eventsInfoSteps.cap.tail}
            </li>
            <li>
              <strong>{t.home.eventsInfoSteps.audit.bold}</strong>
              {t.home.eventsInfoSteps.audit.midA}
              <code>{t.home.eventsInfoSteps.audit.code}</code>
              {t.home.eventsInfoSteps.audit.tail}
            </li>
            <li>
              <strong>{t.home.eventsInfoSteps.anomaly.bold}</strong>
              {t.home.eventsInfoSteps.anomaly.midA}
              <strong>{t.home.eventsInfoSteps.anomaly.bold2}</strong>
              {t.home.eventsInfoSteps.anomaly.tail}
            </li>
          </ol>
          <p>
            {t.home.eventsInfoFooter.pre}
            <em>{t.home.eventsInfoFooter.em}</em>
            {t.home.eventsInfoFooter.tail}
          </p>
        </InfoBox>
        {recentEvents.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {t.home.noEvents}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {recentEvents.map((e) => (
              <EventCard key={e.id} locale={locale} event={e} />
            ))}
          </div>
        )}
      </section>

      {(pollSeries.length > 0 || (topical && topical.items.length > 0)) && (
        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">{t.home.publicOpinionHeading}</h2>
          <p className="mb-4 max-w-3xl text-sm text-slate-600">
            {t.home.publicOpinionIntro.pre}
            <strong>{t.home.publicOpinionIntro.bold}</strong>
            {t.home.publicOpinionIntro.mid}
            <Link
              href={methodologyDocPath('publicOpinion', locale)}
              className="underline hover:text-slate-900"
            >
              {t.home.publicOpinionIntro.link}
            </Link>
            {t.home.publicOpinionIntro.tail}
          </p>
          <PublicOpinion
            series={pollSeries}
            topical={topical?.items ?? null}
            {...(topical?.description ? { topicalDescription: topical.description } : {})}
            labels={{
              sourceLink: t.publicOpinion.sourceLink,
              methodologyChangeLabel: t.publicOpinion.methodologyChangeLabel,
              methodologyChangeNotePrefix: t.publicOpinion.methodologyChangeNotePrefix,
              topicalHeading: t.publicOpinion.topicalHeading,
              topicalReportLink: t.publicOpinion.topicalReportLink,
            }}
          />
        </section>
      )}
    </div>
  );
}
