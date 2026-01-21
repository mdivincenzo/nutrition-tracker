'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import TimeRangeSelector from '@/components/trends/TimeRangeSelector'
import CalorieTrendChart from '@/components/trends/CalorieTrendChart'
import ProteinTrendChart from '@/components/trends/ProteinTrendChart'
import ConsistencyCard from '@/components/trends/ConsistencyCard'
import AveragesCard from '@/components/trends/AveragesCard'
import ColdStartPlaceholder from '@/components/trends/ColdStartPlaceholder'

type TimeRange = 'week' | 'month' | '3months'

interface DailyData {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Profile {
  id: string
  daily_calories: number | null
  daily_protein: number | null
  daily_carbs: number | null
  daily_fat: number | null
}

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [daysLogged, setDaysLogged] = useState(0)

  useEffect(() => {
    const fetchTrendsData = async () => {
      setIsLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Fetch profile first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, daily_calories, daily_protein, daily_carbs, daily_fat')
        .eq('user_id', user.id)
        .single()

      if (!profileData) {
        setIsLoading(false)
        return
      }

      setProfile(profileData)

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()

      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '3months':
          startDate.setDate(startDate.getDate() - 90)
          break
      }

      // Fetch meals in range using profile_id
      const { data: meals } = await supabase
        .from('meals')
        .select('date, calories, protein, carbs, fat')
        .eq('profile_id', profileData.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      // Aggregate by date
      const dailyTotals = new Map<string, DailyData>()

      for (const meal of meals || []) {
        const existing = dailyTotals.get(meal.date) || {
          date: meal.date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }
        dailyTotals.set(meal.date, {
          date: meal.date,
          calories: existing.calories + (meal.calories || 0),
          protein: existing.protein + (meal.protein || 0),
          carbs: existing.carbs + (meal.carbs || 0),
          fat: existing.fat + (meal.fat || 0),
        })
      }

      // Convert to array and sort by date
      const sortedData = Array.from(dailyTotals.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      )

      setDailyData(sortedData)
      setDaysLogged(sortedData.length)
      setIsLoading(false)
    }

    fetchTrendsData()
  }, [timeRange])

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

  // Cold start: less than 3 days of data
  if (daysLogged < 3) {
    return (
      <div className="p-4">
        <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
        <ColdStartPlaceholder daysLogged={daysLogged} daysNeeded={7} />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-auto">
      <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />

      {profile && (
        <>
          <CalorieTrendChart
            data={dailyData}
            target={profile.daily_calories || 2000}
          />

          <ProteinTrendChart
            data={dailyData}
            target={profile.daily_protein || 150}
          />

          <ConsistencyCard
            data={dailyData}
            calorieTarget={profile.daily_calories || 2000}
            proteinTarget={profile.daily_protein || 150}
            timeRange={timeRange}
          />

          <AveragesCard data={dailyData} />
        </>
      )}
    </div>
  )
}
