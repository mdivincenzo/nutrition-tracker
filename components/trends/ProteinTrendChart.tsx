'use client'

import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts'

interface ProteinTrendChartProps {
  data: { date: string; protein: number }[]
  target: number
}

export default function ProteinTrendChart({ data, target }: ProteinTrendChartProps) {
  const formattedData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }))

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">Protein</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a24',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#f8fafc' }}
              formatter={(value) => [`${value}g`, 'Protein']}
            />
            <ReferenceLine
              y={target}
              stroke="rgba(255,255,255,0.3)"
              strokeDasharray="4 4"
              label={{
                value: 'Target',
                position: 'right',
                fontSize: 10,
                fill: '#64748b',
              }}
            />
            <Line
              type="monotone"
              dataKey="protein"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ fill: '#34d399', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#34d399' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
