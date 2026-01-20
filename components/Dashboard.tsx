'use client'

import { Profile, Meal, Workout, WeighIn, DailyTotals } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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
  const router = useRouter()
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const handleResetProfile = async () => {
    if (!confirm('This will delete your profile and all data. You will be redirected to onboarding. Continue?')) {
      return
    }
    const res = await fetch('/api/dev/reset', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      router.push('/onboarding')
      router.refresh()
    } else {
      alert(data.error || 'Failed to reset')
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Hey, {profile.name}</h1>
        <p className="text-text-secondary mt-1">{today}</p>
      </header>

      {/* Weight Section */}
      {(weighIn || profile.start_weight) && (
        <div className="mb-8 glass-card p-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Current Weight</h2>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-semibold tracking-tight">
              {weighIn?.weight || profile.start_weight}
              <span className="text-lg text-text-secondary ml-1">lbs</span>
            </span>
            {profile.goal_weight && (
              <span className="text-text-tertiary">
                Goal: {profile.goal_weight} lbs
              </span>
            )}
          </div>
          {weighIn?.body_fat && (
            <p className="text-text-secondary mt-2">
              Body fat: <span className="text-text-primary">{weighIn.body_fat}%</span>
            </p>
          )}
        </div>
      )}

      {/* Macro Progress */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Today&apos;s Progress</h2>
        <div className="space-y-4">
          <MacroProgress
            label="Calories"
            current={totals.calories}
            target={profile.daily_calories || 2000}
            unit="kcal"
            color="indigo"
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
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Meals</h2>
        {meals.length > 0 ? (
          <MealsList meals={meals} />
        ) : (
          <div className="glass-card p-6 text-center">
            <p className="text-text-secondary">No meals logged yet today.</p>
            <p className="text-text-tertiary text-sm mt-1">Tell Claude what you ate!</p>
          </div>
        )}
      </div>

      {/* Workouts */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Workouts</h2>
        {workouts.length > 0 ? (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <div key={workout.id} className="glass-card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{workout.exercise}</span>
                    {workout.type && (
                      <span className="ml-2 badge capitalize">
                        {workout.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-text-secondary mt-2">
                  {workout.duration_minutes && `${workout.duration_minutes} min`}
                  {workout.sets && workout.reps && ` • ${workout.sets}x${workout.reps}`}
                  {workout.rpe && ` • RPE ${workout.rpe}`}
                </div>
                {workout.notes && (
                  <p className="text-sm text-text-tertiary mt-2">{workout.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <p className="text-text-secondary">No workouts logged yet today.</p>
          </div>
        )}
      </div>

      {/* Dev Tools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
          <p className="text-xs text-yellow-500 font-medium mb-3">Dev Tools</p>
          <div className="space-y-2">
            <button
              onClick={handleResetProfile}
              className="w-full py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Reset Profile (re-test onboarding)
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-2 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
