'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useNavigation } from '@/lib/navigation-context'
import { Profile, Meal, Workout, DailyTotals } from '@/types'
import CompactStats from '@/components/dashboard/CompactStats'
import StatsSheet from '@/components/dashboard/StatsSheet'
import Chat from '@/components/Chat'
import PerfectDayOverlay from '@/components/celebrations/PerfectDayOverlay'
import { getProgressState } from '@/lib/progress-state'
import { generateCoachingInsights } from '@/lib/coaching'

export default function LogPage() {
  const { selectedDate, refreshStreak, streak } = useNavigation()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [totals, setTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [coachingInsights, setCoachingInsights] = useState<string[]>([])
  const prevStatsRef = useRef<{ hitCalories: boolean; hitProtein: boolean } | null>(null)
  const isInitialLoadRef = useRef(true)

  // Check if viewing today
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Format date for query (YYYY-MM-DD)
  const dateStr = selectedDate.toISOString().split('T')[0]

  // Reset to initial load when date changes
  useEffect(() => {
    isInitialLoadRef.current = true
  }, [dateStr])

  // Fetch data when selectedDate changes or after logging
  useEffect(() => {
    const fetchDayData = async () => {
      // Only show loading spinner on initial load or date change, not on data refreshes
      // This prevents Chat from unmounting and losing messages
      if (isInitialLoadRef.current) {
        setIsLoading(true)
      }
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Fetch profile for targets
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!profileData) {
        setIsLoading(false)
        return
      }

      setProfile(profileData)

      // Calculate yesterday's date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // Fetch meals, workouts for selected date, yesterday's meals, and last workout
      const [mealsResult, workoutsResult, yesterdayMealsResult, lastWorkoutResult] = await Promise.all([
        supabase
          .from('meals')
          .select('*')
          .eq('profile_id', profileData.id)
          .eq('date', dateStr)
          .order('created_at', { ascending: true }),
        supabase
          .from('workouts')
          .select('*')
          .eq('profile_id', profileData.id)
          .eq('date', dateStr),
        supabase
          .from('meals')
          .select('calories, protein')
          .eq('profile_id', profileData.id)
          .eq('date', yesterdayStr),
        supabase
          .from('workouts')
          .select('date, type')
          .eq('profile_id', profileData.id)
          .order('date', { ascending: false })
          .limit(1),
      ])

      const mealsData = mealsResult.data || []
      const workoutsData = workoutsResult.data || []
      const yesterdayMeals = yesterdayMealsResult.data || []
      const lastWorkout = lastWorkoutResult.data?.[0]

      // Calculate day totals from meals
      const dayTotals = mealsData.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein || 0),
          carbs: acc.carbs + (meal.carbs || 0),
          fat: acc.fat + (meal.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )

      // Calculate yesterday's totals
      const yesterdayTotals = yesterdayMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + (m.protein || 0),
        }),
        { calories: 0, protein: 0 }
      )

      // Calculate days since last workout
      const daysSinceLastWorkout = lastWorkout
        ? Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      // Generate coaching insights for fresh-start state
      const insights = generateCoachingInsights({
        yesterdayCalories: yesterdayTotals.calories,
        yesterdayTargetCalories: profileData.daily_calories || 2000,
        yesterdayProtein: yesterdayTotals.protein,
        yesterdayTargetProtein: profileData.daily_protein || 150,
        daysSinceLastWorkout,
        lastWorkoutType: lastWorkout?.type,
        averageProteinDeficit: 0, // TODO: calculate from last 7 days
        streak,
      })

      setMeals(mealsData)
      setWorkouts(workoutsData)
      setTotals(dayTotals)
      setCoachingInsights(insights)
      setIsLoading(false)
      isInitialLoadRef.current = false
    }

    fetchDayData()
  }, [dateStr, refreshKey, streak])

  // Callback for Chat to trigger refresh after logging
  const handleDataChanged = async () => {
    setRefreshKey((k) => k + 1)
    await refreshStreak()
  }

  // Check if we should celebrate (only on today)
  useEffect(() => {
    if (!profile || !isToday) return

    const targetCalories = profile.daily_calories || 2000
    const targetProtein = profile.daily_protein || 150

    const hitCalories = totals.calories >= targetCalories
    const hitProtein = totals.protein >= targetProtein
    const hitBoth = hitCalories && hitProtein

    // Check if we just crossed the threshold
    const prev = prevStatsRef.current
    const wasHittingBoth = prev?.hitCalories && prev?.hitProtein

    if (hitBoth && !wasHittingBoth) {
      // Check if we already celebrated today
      const todayStr = new Date().toISOString().split('T')[0]
      const celebratedKey = `celebrated_${todayStr}`

      if (!localStorage.getItem(celebratedKey)) {
        setShowCelebration(true)
        localStorage.setItem(celebratedKey, 'true')
      }
    }

    prevStatsRef.current = { hitCalories, hitProtein }
  }, [totals, profile, isToday])

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        Unable to load profile
      </div>
    )
  }

  // Compute todayStats for Chat greeting
  const todayStats = profile
    ? {
        calories: totals.calories,
        protein: totals.protein,
        targetCalories: profile.daily_calories || 2000,
        targetProtein: profile.daily_protein || 150,
      }
    : undefined

  // Determine progress state for today
  const progressState = todayStats
    ? getProgressState({
        calories: todayStats.calories,
        targetCalories: todayStats.targetCalories,
        protein: todayStats.protein,
        targetProtein: todayStats.targetProtein,
        hour: new Date().getHours(),
      })
    : 'on-track'

  return (
    <div className="flex flex-col h-full">
      {/* Celebration overlay */}
      <PerfectDayOverlay
        isVisible={showCelebration}
        onComplete={handleCelebrationComplete}
      />

      {/* Compact Stats Bar */}
      <div className="flex-shrink-0">
        <CompactStats
          calories={{
            current: totals.calories,
            target: profile.daily_calories || 2000,
          }}
          protein={{
            current: totals.protein,
            target: profile.daily_protein || 150,
          }}
          onTap={() => setIsSheetOpen(true)}
        />
      </div>

      {/* Content area */}
      {isToday ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Chat
            profile={profile}
            compactHeader
            onDataChanged={handleDataChanged}
            todayStats={todayStats}
            progressState={progressState}
            coachingInsights={coachingInsights}
          />
        </div>
      ) : (
        /* Historical view - no chat, just summary */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-text-secondary mb-2">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-text-tertiary text-sm">
            {meals.length > 0
              ? `${meals.length} meal${meals.length > 1 ? 's' : ''} logged`
              : 'No meals logged this day'}
          </p>
          <button
            onClick={() => setIsSheetOpen(true)}
            className="mt-4 text-accent-violet text-sm hover:underline"
          >
            View details
          </button>
        </div>
      )}

      {/* Stats Bottom Sheet */}
      <StatsSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        profile={profile}
        meals={meals}
        workouts={workouts}
        totals={totals}
        selectedDate={dateStr}
      />
    </div>
  )
}
