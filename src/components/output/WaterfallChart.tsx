'use client'

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ShapFactor } from '@/lib/types'
import { formatPercent, shapColor } from '@/lib/utils'

interface Props {
  factors: ShapFactor[]
  baseValue: number
}

const tooltipStyle = {
  backgroundColor: '#1e1b16',
  border: '1px solid #4a4338',
  borderRadius: '6px',
  fontSize: '11px',
  color: '#fafafa',
}

export default function WaterfallChart({ factors, baseValue }: Props) {
  const data = factors.map((factor) => ({
    name: factor.feature,
    value: factor.shap_value,
    direction: factor.direction,
    plain: factor.plain_english,
  }))

  return (
    <div className="w-full">
      <p className="mb-2 text-[10px] text-[var(--muted)]">
        Baseline {formatPercent(baseValue)} · bars = contribution to default risk
      </p>
      <ResponsiveContainer width="100%" height={Math.min(320, 56 + factors.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 10, left: 2, bottom: 4 }}>
          <XAxis
            type="number"
            tickFormatter={(value) => `${value > 0 ? '+' : ''}${(Number(value) * 100).toFixed(0)}%`}
            fontSize={10}
            stroke="#71717a"
            tick={{ fill: '#a1a1aa' }}
          />
          <YAxis type="category" dataKey="name" width={132} fontSize={9} tick={{ fill: '#a1a1aa' }} interval={0} />
          <ReferenceLine x={0} stroke="#52525b" />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${Number(value) > 0 ? '+' : ''}${(Number(value) * 100).toFixed(2)}%`, 'Δ']}
            labelFormatter={(_, payload) => {
              const row = payload?.[0] as { payload?: { plain?: string } } | undefined
              return row?.payload?.plain ?? ''
            }}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${index}-${entry.name}`} fill={shapColor(entry.direction)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
