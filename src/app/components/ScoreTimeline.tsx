'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { type ScoreSnapshot } from '@/lib/types';

interface Props {
  /** Pre-resolved labels so this client component doesn't import the i18n module. */
  emptyLabel: string;
  tooltipLabel: string;
  snapshots: readonly ScoreSnapshot[];
}

export function ScoreTimeline({ snapshots, emptyLabel, tooltipLabel }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    week: s.week,
    overall: s.overall_score,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
          <YAxis
            domain={[0, 100]}
            stroke="#64748b"
            fontSize={12}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
            formatter={(value: number) => [value.toFixed(1), tooltipLabel]}
          />
          <Line
            type="monotone"
            dataKey="overall"
            stroke="#0f172a"
            strokeWidth={2}
            dot={{ r: 4, fill: '#0f172a' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
