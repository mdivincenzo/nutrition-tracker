'use client'

interface ConsistencyCardProps {
  data: { date: string; calories: number; protein: number }[]
  calorieTarget: number
  proteinTarget: number
  timeRange: 'week' | 'month' | '3months'
}

export default function ConsistencyCard({
  data,
  calorieTarget,
  proteinTarget,
  timeRange,
}: ConsistencyCardProps) {
  // Count days where BOTH targets were hit
  const daysHit = data.filter(
    d => d.calories >= calorieTarget && d.protein >= proteinTarget
  ).length

  const totalDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
  const percentage = Math.round((daysHit / totalDays) * 100)

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-2">Consistency</h3>
      <p className="text-text-primary mb-3">
        You hit your targets{' '}
        <span className="font-semibold text-accent-violet">{daysHit}</span> of {totalDays} days
        <span className="text-text-secondary"> ({percentage}%)</span>
      </p>

      {/* Progress bar */}
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-violet rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
