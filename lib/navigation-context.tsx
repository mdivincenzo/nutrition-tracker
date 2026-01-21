'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { calculateStreak } from '@/lib/streak'

interface NavigationContextType {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  streak: number
  refreshStreak: () => Promise<void>
  earliestDate: Date | null
}

const NavigationContext = createContext<NavigationContextType | null>(null)

// Get today's date normalized to midnight
const getToday = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  // Always start with TODAY's date - fresh on every mount/refresh
  const [selectedDate, setSelectedDate] = useState<Date>(() => getToday())
  const [streak, setStreak] = useState(0)
  const [earliestDate, setEarliestDate] = useState<Date | null>(null)

  const refreshStreak = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, daily_calories, daily_protein, created_at')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    // Set earliest date from profile creation
    if (profile.created_at) {
      setEarliestDate(new Date(profile.created_at))
    }

    const newStreak = await calculateStreak(supabase, profile)
    setStreak(newStreak)
  }, [])

  // Calculate streak on mount
  useEffect(() => {
    refreshStreak()
  }, [refreshStreak])

  // Handle visibility change - update to new day when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const today = getToday()
        const selected = new Date(selectedDate)
        selected.setHours(0, 0, 0, 0)

        // If it's now a new day and selected is in the past, reset to today
        if (selected.getTime() < today.getTime()) {
          setSelectedDate(today)
          refreshStreak()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [selectedDate, refreshStreak])

  return (
    <NavigationContext.Provider value={{
      selectedDate,
      setSelectedDate,
      streak,
      refreshStreak,
      earliestDate,
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
