'use client'

import { Profile, Meal, Workout, WeighIn, DailyTotals, HeroStats as HeroStatsType } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import MacroProgress from './MacroProgress'
import MealsList from './MealsList'
import HeroStats from './HeroStats'
import DateNavigation from './DateNavigation'
import WorkoutSummary from './WorkoutSummary'
import { parseISO, isToday } from 'date-fns'

interface DashboardProps {
  profile: Profile
  meals: Meal[]
  workouts: Workout[]
  weighIn: WeighIn | null
  totals: DailyTotals
  heroStats: HeroStatsType
  selectedDate: string
}

export default function Dashboard({ profile, meals, workouts, weighIn, totals, heroStats, selectedDate }: DashboardProps) {
  const router = useRouter()
  const currentDate = parseISO(selectedDate)
  const isTodaySelected = isToday(currentDate)

  const handleResetProfile = async () => {
    if (!confirm('This will delete your profile, clear storage, and sign you out. Continue?')) {
      return
    }
    const supabase = createClient()

    // 1. Reset profile via API
    const res = await fetch('/api/dev/reset', { method: 'POST' })
    const data = await res.json()

    // 2. Clear all storage to prevent auto-restore
    sessionStorage.clear()
    localStorage.clear()

    // 3. Sign out to clear HTTP-only cookies
    await supabase.auth.signOut()

    if (res.ok) {
      window.location.href = '/login'
    } else {
      alert(data.error || 'Failed to reset')
      window.location.href = '/login'
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
        <div className="mt-3">
          <DateNavigation selectedDate={selectedDate} />
        </div>
      </header>

      {/* Hero Stats */}
      <div className="mb-8">
        <HeroStats stats={heroStats} profile={profile} weighIn={weighIn} />
      </div>

      {/* Macro Progress */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          {isTodaySelected ? "Today's Progress" : "Progress"}
        </h2>
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
            <p className="text-text-secondary">
              {isTodaySelected ? "No meals logged yet today." : "No meals logged for this day."}
            </p>
            {isTodaySelected && (
              <p className="text-text-tertiary text-sm mt-1">Tell Claude what you ate!</p>
            )}
          </div>
        )}
      </div>

      {/* Workouts */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Workouts</h2>
        <WorkoutSummary workouts={workouts} isTodaySelected={isTodaySelected} />
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
              Reset Profile & Logout (full reset)
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
