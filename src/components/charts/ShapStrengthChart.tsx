'use client'

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ShapFactor } from '@/lib/types'
import { shapColor } from '@/lib/utils'

const tip = {
  backgroundColor: '#1e1b16',
  border: '1px solid #4a4338',
  borderRadius: '6px',
  fontSize: '11px',
  color: '#fafafa',
}

interface Props {
  factors: ShapFactor[]
}

/** Small horizontal bars: absolute SHAP strength (same values as waterfall, easier to scan at a glance). */
export default function ShapStrengthChart({ factors }: Props) {
  const data = factors.map((f, i) => ({
    id: i,
    label: f.feature.length > 22 ? `${f.feature.slice(0, 20)}…` : f.feature,
    strength: Math.abs(f.shap_value),
    direction: f.direction,
    plain: f.plain_english,
  }))

  const maxS = Math.max(...data.map((d) => d.strength), 1e-6)

  return (
    <div className="w-full">
      <p className="mb-1.5 text-[10px] text-[var(--muted)]">Driver strength (|SHAP|), same model outputs as the waterfall</p>
      <ResponsiveContainer width="100%" height={Math.min(220, 36 + factors.length * 28)}>
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 8, left: 4, bottom: 2 }} barSize={10}>
          <XAxis
            type="number"
            domain={[0, maxS * 1.05]}
            tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`}
            fontSize={9}
            stroke="#71717a"
            tick={{ fill: '#a1a1aa' }}
          />
          <YAxis type="category" dataKey="label" width={108} fontSize={9} tick={{ fill: '#a1a1aa' }} interval={0} />
          <Tooltip
            contentStyle={tip}
            formatter={(value: unknown) => {
              const n = Number(value)
              return [`${(n * 100).toFixed(2)}%`, '|SHAP|']
            }}
            labelFormatter={(_, payload) => (payload?.[0] as { payload?: { plain?: string } })?.payload?.plain ?? ''}
          />
          <Bar dataKey="strength" radius={[0, 3, 3, 0]}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={shapColor(entry.direction)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
