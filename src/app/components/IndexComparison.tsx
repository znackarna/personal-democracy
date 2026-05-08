import { type IndexComparison } from '@/lib/external-comparison';
import { getMessages, type Locale } from '@/i18n';

interface Props {
  locale: Locale;
  comparisons: readonly IndexComparison[];
  baselineQuarter: string;
}

const INDEX_DESCRIPTION: Record<string, string> = {
  'V-DEM': 'Liberal Democracy Index — V-Dem Institute (Gothenburg)',
  EIU: 'Democracy Index — Economist Intelligence Unit',
  'FH-FITW': 'Freedom in the World — Freedom House',
  FH: 'Freedom in the World — Freedom House',
  RSF: 'Press Freedom Index — Reporters Without Borders',
  'TI-CPI': 'Corruption Perceptions Index — Transparency International',
  TI: 'Corruption Perceptions Index — Transparency International',
  WJP: 'Rule of Law Index — World Justice Project',
};

export function IndexComparisonTable({ locale, comparisons, baselineQuarter }: Props) {
  if (comparisons.length === 0) return null;
  const t = getMessages(locale);
  const tt = t.comparisonTable;

  const repoUrl = t.meta.repoUrl;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">
        {tt.intro.pre}
        <strong>{tt.intro.bold}</strong>
        {tt.intro.tail.replace('{quarter}', baselineQuarter)}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4 font-medium">{tt.headerIndex}</th>
              <th className="py-2 pr-4 text-right font-medium">{tt.headerExternal}</th>
              <th className="py-2 pr-4 font-medium">{tt.headerCompare}</th>
              <th className="py-2 pr-4 text-right font-medium">{tt.headerOurs}</th>
              <th className="py-2 pr-4 text-right font-medium">{tt.headerDelta}</th>
              <th className="py-2 pr-4 font-medium" aria-label={tt.headerStatusAria} />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comparisons.map((c) => {
              const description = INDEX_DESCRIPTION[c.index.toUpperCase()] ?? '';
              const sign = c.delta >= 0 ? '+' : '';
              const deltaColor = c.exceedsThreshold
                ? 'text-score-bad'
                : Math.abs(c.delta) < 5
                  ? 'text-slate-500'
                  : 'text-score-warn';
              const targetLabel =
                c.pillar !== null
                  ? `${tt.pillarPrefix} ${t.pillars[c.pillar].short}`
                  : tt.overallLabel;
              return (
                <tr key={c.index + c.year} className="hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-900">
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {c.index}
                      </a>{' '}
                      <span className="text-xs text-slate-500">{c.year}</span>
                    </div>
                    {description && <div className="text-xs text-slate-500">{description}</div>}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-900">
                    {c.externalNormalized.toFixed(1)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{targetLabel}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-900">
                    {c.comparisonTarget.toFixed(1)}
                  </td>
                  <td className={`py-3 pr-4 text-right font-medium tabular-nums ${deltaColor}`}>
                    {sign}
                    {c.delta.toFixed(1)}
                  </td>
                  <td className="py-3 pr-4 text-center">
                    {c.exceedsThreshold ? (
                      <span title={tt.overThresholdTitle}>⚠️</span>
                    ) : (
                      <span title={tt.inThresholdTitle} className="text-score-good">
                        ✓
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {tt.footer.pre}
        <a
          href={`${repoUrl}/blob/main/methodology/validation_${baselineQuarter}.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-900"
        >
          {tt.footer.link}
        </a>
        {tt.footer.tail}
      </p>
    </div>
  );
}
