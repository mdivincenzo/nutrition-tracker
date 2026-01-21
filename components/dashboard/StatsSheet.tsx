'use client'

import { Profile, Meal, Workout, DailyTotals } from '@/types'
import BottomSheet from '@/components/ui/BottomSheet'
import { format, parseISO } from 'date-fns'

interface StatsSheetProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  meals: Meal[]
  workouts: Workout[]
  totals: DailyTotals
  selectedDate: string
}

// Color based on percentage toward goal
const getProgressColor = (current: number, target: number): string => {
  const pct = (current / target) * 100
  if (pct >= 100) return '#34d399' // Green - target reached
  if (pct >= 67) return '#facc15'  // Yellow - almost there
  if (pct >= 34) return '#fb923c'  // Orange - getting there
  return '#f87171'                  // Red - behind
}

const timeOfDayOrder = ['breakfast', 'lunch', 'dinner', 'snack']
const timeOfDayEmoji: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

export default function StatsSheet({
  isOpen,
  onClose,
  profile,
  meals,
  workouts,
  totals,
  selectedDate,
}: StatsSheetProps) {
  const dateDisplay = format(parseISO(selectedDate), 'EEEE, MMMM d')

  const macros = [
    {
      label: 'Calories',
      emoji: '🔥',
      current: totals.calories,
      target: profile.daily_calories || 2000,
      unit: 'kcal',
    },
    {
      label: 'Protein',
      emoji: '💪',
      current: totals.protein,
      target: profile.daily_protein || 150,
      unit: 'g',
    },
    {
      label: 'Carbs',
      emoji: '🍞',
      current: totals.carbs,
      target: profile.daily_carbs || 200,
      unit: 'g',
    },
    {
      label: 'Fat',
      emoji: '🥑',
      current: totals.fat,
      target: profile.daily_fat || 65,
      unit: 'g',
    },
  ]

  const sortedMeals = [...meals].sort((a, b) => {
    const aIndex = timeOfDayOrder.indexOf(a.time_of_day || 'snack')
    const bIndex = timeOfDayOrder.indexOf(b.time_of_day || 'snack')
    return aIndex - bIndex
  })

  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={dateDisplay}>
      <div className="px-6 py-4 space-y-6">
        {/* Full Macro Breakdown */}
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Progress</h3>
          <div className="space-y-4">
            {macros.map((macro) => {
              const pct = Math.min((macro.current / macro.target) * 100, 100)
              const color = getProgressColor(macro.current, macro.target)
              const isReached = macro.current >= macro.target

              return (
                <div key={macro.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{macro.emoji}</span>
                      <span className="text-sm font-medium">{macro.label}</span>
                      {isReached && <span className="text-xs text-success">✓</span>}
                    </div>
                    <span className="text-sm text-text-secondary">
                      {macro.current} / {macro.target} {macro.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <div className="text-xs text-text-tertiary mt-1">
                    {isReached ? (
                      <span className="text-success">Target reached!</span>
                    ) : (
                      <span>{macro.target - macro.current} {macro.unit} remaining</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Meals */}
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Meals ({meals.length})
          </h3>
          {sortedMeals.length > 0 ? (
            <div className="space-y-2">
              {sortedMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between py-2 border-b border-surface-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {timeOfDayEmoji[meal.time_of_day || 'snack']}
                    </span>
                    <span className="text-sm">{meal.name}</span>
                  </div>
                  <span className="text-sm text-text-secondary">{meal.calories} kcal</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">No meals logged</p>
          )}
        </section>

        {/* Workouts */}
        <section>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Workouts ({workouts.length})
          </h3>
          {workouts.length > 0 ? (
            <div className="space-y-2">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between py-2 border-b border-surface-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {workout.type === 'cardio' ? '🏃' : workout.type === 'strength' ? '🏋️' : '💪'}
                    </span>
                    <span className="text-sm">{workout.exercise}</span>
                  </div>
                  <span className="text-sm text-text-secondary">
                    {workout.calories_burned ? `${workout.calories_burned} kcal` : '-'}
                  </span>
                </div>
              ))}
              {totalCaloriesBurned > 0 && (
                <div className="pt-2 text-sm text-text-secondary">
                  Total burned: <span className="font-medium text-success">{totalCaloriesBurned} kcal</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">No workouts logged</p>
          )}
        </section>
      </div>
    </BottomSheet>
  )
}
