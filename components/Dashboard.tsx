'use client'

import { Profile, Meal, Workout, WeighIn, DailyTotals } from '@/types'
import MacroProgress from './MacroProgress'
import MealsList from './MealsList'

interface DashboardProps {
  profile: Profile
  meals: Meal[]
  workouts: Workout[]
  weighIn: WeighIn | null
  totals: DailyTotals
}

export default function Dashboard({ profile, meals, workouts, weighIn, totals }: DashboardProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Hey, {profile.name}</h1>
        <p className="text-gray-400">{today}</p>
      </header>

      {/* Weight Section */}
      {(weighIn || profile.start_weight) && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-sm font-medium text-gray-400 mb-2">Weight</h2>
          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold">
              {weighIn?.weight || profile.start_weight} lbs
            </span>
            {profile.goal_weight && (
              <span className="text-gray-400">
                Goal: {profile.goal_weight} lbs
              </span>
            )}
          </div>
          {weighIn?.body_fat && (
            <p className="text-gray-400 mt-1">Body fat: {weighIn.body_fat}%</p>
          )}
        </div>
      )}

      {/* Macro Progress */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Today&apos;s Progress</h2>
        <div className="space-y-3">
          <MacroProgress
            label="Calories"
            current={totals.calories}
            target={profile.daily_calories || 2000}
            unit="kcal"
            color="blue"
          />
          <MacroProgress
            label="Protein"
            current={totals.protein}
            target={profile.daily_protein || 150}
            unit="g"
            color="green"
          />
          <MacroProgress
            label="Carbs"
            current={totals.carbs}
            target={profile.daily_carbs || 200}
            unit="g"
            color="yellow"
          />
          <MacroProgress
            label="Fat"
            current={totals.fat}
            target={profile.daily_fat || 65}
            unit="g"
            color="pink"
          />
        </div>
      </div>

      {/* Meals List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Meals</h2>
        {meals.length > 0 ? (
          <MealsList meals={meals} />
        ) : (
          <p className="text-gray-400 text-sm">No meals logged yet. Tell me what you ate!</p>
        )}
      </div>

      {/* Workouts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Workouts</h2>
        {workouts.length > 0 ? (
          <div className="space-y-2">
            {workouts.map((workout) => (
              <div key={workout.id} className="p-3 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{workout.exercise}</span>
                    {workout.type && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-gray-700 rounded-full">
                        {workout.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {workout.duration_minutes && `${workout.duration_minutes} min`}
                  {workout.sets && workout.reps && ` • ${workout.sets}x${workout.reps}`}
                  {workout.rpe && ` • RPE ${workout.rpe}`}
                </div>
                {workout.notes && (
                  <p className="text-sm text-gray-500 mt-1">{workout.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No workouts logged yet.</p>
        )}
      </div>
    </div>
  )
}
