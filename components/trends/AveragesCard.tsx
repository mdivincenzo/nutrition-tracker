'use client'

interface AveragesCardProps {
  data: { calories: number; protein: number; carbs: number; fat: number }[]
}

export default function AveragesCard({ data }: AveragesCardProps) {
  if (data.length === 0) return null

  const avg = {
    calories: Math.round(data.reduce((sum, d) => sum + d.calories, 0) / data.length),
    protein: Math.round(data.reduce((sum, d) => sum + d.protein, 0) / data.length),
    carbs: Math.round(data.reduce((sum, d) => sum + d.carbs, 0) / data.length),
    fat: Math.round(data.reduce((sum, d) => sum + d.fat, 0) / data.length),
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Averages</h3>
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-text-primary font-semibold">{avg.calories.toLocaleString()}</span>
          <span className="text-text-tertiary ml-1">cal</span>
        </div>
        <div>
          <span className="text-text-primary font-semibold">{avg.protein}g</span>
          <span className="text-text-tertiary ml-1">protein</span>
        </div>
        <div>
          <span className="text-text-primary font-semibold">{avg.carbs}g</span>
          <span className="text-text-tertiary ml-1">carbs</span>
        </div>
        <div>
          <span className="text-text-primary font-semibold">{avg.fat}g</span>
          <span className="text-text-tertiary ml-1">fat</span>
        </div>
      </div>
    </div>
  )
}
