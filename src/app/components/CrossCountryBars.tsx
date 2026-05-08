'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type CrossCountry, type CrossIndex, type CrossSubPillar } from '@/lib/types';

interface Props {
  countries: readonly CrossCountry[];
  indexes: readonly CrossIndex[];
  /** Pre-resolved labels — keeps i18n imports out of this client component. */
  labels: {
    multiDimension: string;
    singleDimension: string;
    scaleLabel: string;
    sourceLink: string;
    subPillarsHeading: string;
    scoreTooltip: string;
  };
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  CZ: '#1d4ed8',
  SK: '#0891b2',
};
const NEUTRAL_COLOR = '#94a3b8';

export function CrossCountryBars({ countries, indexes, labels }: Props) {
  return (
    <div className="space-y-12">
      {indexes.map((idx) => (
        <IndexSection key={idx.id} index={idx} countries={countries} labels={labels} />
      ))}
    </div>
  );
}

function IndexSection({
  index,
  countries,
  labels,
}: {
  index: CrossIndex;
  countries: readonly CrossCountry[];
  labels: Props['labels'];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {index.label} <span className="text-sm font-normal text-slate-500">({index.year})</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {index.type === 'multi_dimension' ? labels.multiDimension : labels.singleDimension} ·{' '}
            {labels.scaleLabel}
            {index.scale_max}
          </p>
        </div>
        <a
          href={index.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 underline hover:text-slate-900"
        >
          {labels.sourceLink}
        </a>
      </header>

      <CountryBarChart
        countries={countries}
        values={index.values}
        scaleMax={index.scale_max}
        ariaLabel={`${index.label} ${index.year}`}
        scoreTooltip={labels.scoreTooltip}
      />

      {index.sub_pillars && index.sub_pillars.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">{labels.subPillarsHeading}</h4>
          <div className="grid gap-6 md:grid-cols-2">
            {index.sub_pillars.map((sp) => (
              <SubPillarChart
                key={sp.id}
                subPillar={sp}
                countries={countries}
                scaleMax={index.scale_max}
                scoreTooltip={labels.scoreTooltip}
              />
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{index.source_note}</p>
    </section>
  );
}

function SubPillarChart({
  subPillar,
  countries,
  scaleMax,
  scoreTooltip,
}: {
  subPillar: CrossSubPillar;
  countries: readonly CrossCountry[];
  scaleMax: number;
  scoreTooltip: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-700">{subPillar.label}</p>
      <CountryBarChart
        countries={countries}
        values={subPillar.values}
        scaleMax={scaleMax}
        height={180}
        ariaLabel={subPillar.label}
        scoreTooltip={scoreTooltip}
      />
    </div>
  );
}

function CountryBarChart({
  countries,
  values,
  scaleMax,
  height = 240,
  ariaLabel,
  scoreTooltip,
}: {
  countries: readonly CrossCountry[];
  values: Record<string, number>;
  scaleMax: number;
  height?: number;
  ariaLabel: string;
  scoreTooltip: string;
}) {
  const sorted = [...countries]
    .map((c) => ({ country: c, value: values[c.code] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const data = sorted.map((row) => ({
    code: row.country.code,
    name: row.country.name,
    value: row.value,
    color: HIGHLIGHT_COLORS[row.country.code] ?? NEUTRAL_COLOR,
  }));

  const yTicks =
    scaleMax === 1
      ? [0, 0.25, 0.5, 0.75, 1.0]
      : scaleMax === 10
        ? [0, 2.5, 5, 7.5, 10]
        : [0, 25, 50, 75, 100];

  return (
    <div className="w-full" style={{ height }} aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
          <YAxis
            domain={[0, scaleMax]}
            ticks={yTicks}
            stroke="#64748b"
            fontSize={11}
            tickFormatter={(v: number) => (scaleMax === 1 ? v.toFixed(2) : v.toString())}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [
              scaleMax === 1 ? value.toFixed(2) : scaleMax === 10 ? value.toFixed(2) : value.toFixed(0),
              scoreTooltip,
            ]}
            labelFormatter={(code: string) => {
              const c = countries.find((x) => x.code === code);
              return c ? `${c.name} (${c.code})` : code;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.code} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
