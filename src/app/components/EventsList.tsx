'use client';

import { useMemo, useState } from 'react';
import { EventCard } from './EventCard';
import type { Event, Pillar, Severity } from '@/lib/types';
import { PILLARS } from '@/lib/types';
import type { Locale } from '@/i18n';

const SEVERITIES: readonly Severity[] = [1, 2, 3, 4, 5];

const PAGE_SIZE = 15;

interface Props {
  locale: Locale;
  events: readonly Event[];
  /** Pre-resolved labels passed from server. Avoids importing the i18n module client-side. */
  labels: {
    pillars: Record<Pillar, string>;
    filterPillar: string;
    filterSeverity: string;
    filterYear: string;
    filterAllYears: string;
    filterClear: string;
    countSummaryTotal: string;
    countSummaryFiltered: string;
    countSummaryOf: string;
    pageLabel: string;
    pageOf: string;
    weekHeading: string;
    emptyFiltered: string;
    emptyAll: string;
    paginationPrev: string;
    paginationNext: string;
  };
}

/**
 * Klientský filtr + paginace nad seznamem všech klasifikovaných událostí.
 * Stav je lokální (useState) — sdílení filtru přes URL můžeme přidat až
 * bude potřeba. Server component předá kompletní pole eventů; filtrace
 * probíhá in-memory.
 */
export function EventsList({ locale, events, labels }: Props) {
  const [pillarFilter, setPillarFilter] = useState<ReadonlySet<Pillar>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<ReadonlySet<Severity>>(new Set());
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const years = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) s.add(e.date.slice(0, 4));
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (pillarFilter.size > 0 && !pillarFilter.has(e.pillar)) return false;
      if (severityFilter.size > 0) {
        if (e.severity == null) return false;
        if (!severityFilter.has(e.severity)) return false;
      }
      if (yearFilter !== 'all' && !e.date.startsWith(yearFilter)) return false;
      return true;
    });
  }, [events, pillarFilter, severityFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageEvents = filtered.slice(start, start + PAGE_SIZE);

  const byWeek = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of pageEvents) {
      const week = /^(\d{4}-W\d{2})-/.exec(e.id)?.[1] ?? 'unknown';
      const arr = m.get(week) ?? [];
      arr.push(e);
      m.set(week, arr);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [pageEvents]);

  const togglePillar = (p: Pillar) => {
    const next = new Set(pillarFilter);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setPillarFilter(next);
    setPage(1);
  };

  const toggleSeverity = (s: Severity) => {
    const next = new Set(severityFilter);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setSeverityFilter(next);
    setPage(1);
  };

  const changeYear = (year: string) => {
    setYearFilter(year);
    setPage(1);
  };

  const resetAll = () => {
    setPillarFilter(new Set());
    setSeverityFilter(new Set());
    setYearFilter('all');
    setPage(1);
  };

  const hasActiveFilter =
    pillarFilter.size > 0 || severityFilter.size > 0 || yearFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <FilterRow label={labels.filterPillar}>
            {PILLARS.map((p) => (
              <Chip
                key={p}
                active={pillarFilter.has(p)}
                onClick={() => togglePillar(p)}
              >
                {labels.pillars[p]}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label={labels.filterSeverity}>
            {SEVERITIES.map((s) => (
              <Chip
                key={s}
                active={severityFilter.has(s)}
                onClick={() => toggleSeverity(s)}
              >
                {s}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label={labels.filterYear}>
            <select
              value={yearFilter}
              onChange={(e) => changeYear(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
            >
              <option value="all">{labels.filterAllYears}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetAll}
                className="ml-auto text-xs text-slate-500 underline hover:text-slate-900"
              >
                {labels.filterClear}
              </button>
            )}
          </FilterRow>
        </div>
      </div>

      <div className="flex items-baseline justify-between text-sm text-slate-500">
        <div>
          <span className="font-semibold text-slate-900 tabular-nums">{filtered.length}</span>{' '}
          {filtered.length === events.length ? (
            <>{labels.countSummaryTotal}</>
          ) : (
            <>
              {labels.countSummaryOf}{' '}
              <span className="tabular-nums">{events.length}</span> {labels.countSummaryFiltered}
            </>
          )}
        </div>
        <div>
          {labels.pageLabel} <span className="tabular-nums">{safePage}</span> {labels.pageOf}{' '}
          <span className="tabular-nums">{totalPages}</span>
        </div>
      </div>

      {byWeek.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          {hasActiveFilter ? labels.emptyFiltered : labels.emptyAll}
        </div>
      ) : (
        byWeek.map(([week, evs]) => (
          <section key={week}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {labels.weekHeading} {week}
            </h2>
            <div className="space-y-4">
              {evs.map((e) => (
                <EventCard key={e.id} locale={locale} event={e} />
              ))}
            </div>
          </section>
        ))
      )}

      {totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          prevLabel={labels.paginationPrev}
          nextLabel={labels.paginationNext}
          onChange={(p) => {
            setPage(p);
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-[5rem] text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white transition'
          : 'rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900'
      }
    >
      {children}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  prevLabel,
  nextLabel,
  onChange,
}: {
  page: number;
  totalPages: number;
  prevLabel: string;
  nextLabel: string;
  onChange: (page: number) => void;
}) {
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i += 1) pageNumbers.push(i);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 pt-4">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {prevLabel}
      </button>
      {pageNumbers.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={
            n === page
              ? 'rounded-lg border border-slate-900 bg-slate-900 px-3 py-1 text-sm font-medium text-white tabular-nums'
              : 'rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 tabular-nums hover:border-slate-400 hover:text-slate-900'
          }
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </nav>
  );
}
