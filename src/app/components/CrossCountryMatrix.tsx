import { type CrossCountryData, type CrossIndex } from '@/lib/types';
import { getMessages, type Locale } from '@/i18n';

interface Props {
  locale: Locale;
  data: CrossCountryData;
}

/**
 * Heatmap matice: řádky = země, sloupce = indexy. Všechny hodnoty normalizované
 * do 0-100 stupnice (přes scale_max), aby se daly porovnat. Barva buňky podle
 * skóre — green (≥80), light green (60-79), yellow (40-59), orange (20-39),
 * red (<20).
 */
export function CrossCountryMatrix({ locale, data }: Props) {
  const t = getMessages(locale);
  const noData = t.comparison.matrixNoData;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
            <th className="sticky left-0 bg-slate-50 px-4 py-3 font-medium">
              {t.comparison.matrixCountryColumn}
            </th>
            {data.indexes.map((idx) => (
              <th key={idx.id} className="px-3 py-3 text-center font-medium" title={idx.source_note}>
                <div className="flex flex-col items-center">
                  <span>{idx.id}</span>
                  <span className="text-[10px] font-normal text-slate-500">{idx.year}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.countries.map((country) => (
            <tr key={country.code} className={country.highlight ? 'bg-blue-50/30' : 'hover:bg-slate-50'}>
              <td
                className={`sticky left-0 px-4 py-3 ${
                  country.highlight ? 'bg-blue-50/30' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {country.highlight && (
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: country.code === 'CZ' ? '#1d4ed8' : '#0891b2' }}
                      aria-hidden
                    />
                  )}
                  <span className={country.highlight ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                    {country.name}
                  </span>
                  <span className="text-xs text-slate-400">{country.code}</span>
                </div>
              </td>
              {data.indexes.map((idx) => {
                const raw = idx.values[country.code];
                if (raw === undefined) {
                  return (
                    <td key={idx.id} className="px-3 py-3 text-center text-slate-400">
                      {noData}
                    </td>
                  );
                }
                const normalized = (raw / idx.scale_max) * 100;
                const bg = heatmapColor(normalized);
                return (
                  <td
                    key={idx.id}
                    className="px-3 py-3 text-center"
                    title={`${formatRaw(raw, idx)} (${normalized.toFixed(0)}/100)`}
                  >
                    <div
                      className="mx-auto inline-flex min-w-[3rem] items-center justify-center rounded-md px-2 py-1 text-sm font-medium tabular-nums text-slate-900"
                      style={{ backgroundColor: bg }}
                    >
                      {formatRaw(raw, idx)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatRaw(value: number, idx: CrossIndex): string {
  if (idx.scale_max === 1) return value.toFixed(2);
  if (idx.scale_max === 10) return value.toFixed(2);
  return value.toFixed(0);
}

function heatmapColor(normalized: number): string {
  if (normalized >= 80) return '#bbf7d0';
  if (normalized >= 70) return '#d9f99d';
  if (normalized >= 60) return '#fef3c7';
  if (normalized >= 50) return '#fed7aa';
  if (normalized >= 40) return '#fecaca';
  return '#fca5a5';
}
