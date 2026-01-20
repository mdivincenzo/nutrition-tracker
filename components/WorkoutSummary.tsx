'use client'

import { Workout } from '@/types'

interface WorkoutSummaryProps {
  workouts: Workout[]
  isTodaySelected: boolean
}

export default function WorkoutSummary({ workouts, isTodaySelected }: WorkoutSummaryProps) {
  if (workouts.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-text-secondary">
          {isTodaySelected ? "No workouts logged yet today." : "No workouts logged for this day."}
        </p>
      </div>
    )
  }

  const cardioWorkouts = workouts.filter(w => w.type === 'cardio')
  const strengthWorkouts = workouts.filter(w => w.type === 'strength')
  const otherWorkouts = workouts.filter(w => !w.type)

  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
  const cardioCalories = cardioWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
  const strengthCalories = strengthWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)

  return (
    <div className="glass-card p-6">
      {/* Header with total calories */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Workout Summary</h3>
        {totalCaloriesBurned > 0 && (
          <span className="text-text-secondary">~{totalCaloriesBurned} kcal</span>
        )}
      </div>

      <div className="space-y-6">
        {/* Cardio Section */}
        {cardioWorkouts.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏃</span>
                <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                  Cardio
                </span>
              </div>
              {cardioCalories > 0 && (
                <span className="text-sm text-text-tertiary">{cardioCalories} kcal</span>
              )}
            </div>
            <div className="border-t border-surface-border pt-3 space-y-3">
              {cardioWorkouts.map((workout) => (
                <div key={workout.id} className="flex justify-between items-start">
                  <span className="font-medium">{workout.exercise}</span>
                  <div className="text-sm text-text-secondary text-right">
                    {workout.duration_minutes && <span>{workout.duration_minutes} min</span>}
                    {workout.rpe && <span className="ml-2">RPE {workout.rpe}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strength Section */}
        {strengthWorkouts.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏋️</span>
                <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                  Strength
                </span>
              </div>
              {strengthCalories > 0 && (
                <span className="text-sm text-text-tertiary">{strengthCalories} kcal</span>
              )}
            </div>
            <div className="border-t border-surface-border pt-3 space-y-3">
              {strengthWorkouts.map((workout) => (
                <div key={workout.id} className="flex justify-between items-start">
                  <span className="font-medium">{workout.exercise}</span>
                  <div className="text-sm text-text-secondary text-right">
                    {workout.sets && workout.reps && <span>{workout.sets}x{workout.reps}</span>}
                    {workout.rpe && <span className="ml-2">RPE {workout.rpe}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other/Untyped Section */}
        {otherWorkouts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💪</span>
              <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Other
              </span>
            </div>
            <div className="border-t border-surface-border pt-3 space-y-3">
              {otherWorkouts.map((workout) => (
                <div key={workout.id} className="flex justify-between items-start">
                  <span className="font-medium">{workout.exercise}</span>
                  <div className="text-sm text-text-secondary text-right">
                    {workout.duration_minutes && <span>{workout.duration_minutes} min</span>}
                    {workout.sets && workout.reps && <span>{workout.sets}x{workout.reps}</span>}
                    {workout.rpe && <span className="ml-2">RPE {workout.rpe}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes section if any workouts have notes */}
      {workouts.some(w => w.notes) && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          {workouts
            .filter(w => w.notes)
            .map(workout => (
              <p key={workout.id} className="text-sm text-text-tertiary">
                <span className="font-medium">{workout.exercise}:</span> {workout.notes}
              </p>
            ))}
        </div>
      )}
    </div>
  )
}
