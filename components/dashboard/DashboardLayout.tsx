'use client'

import { useState } from 'react'
import { Profile, Meal, Workout, DailyTotals } from '@/types'
import Chat from '@/components/Chat'
import CompactStats from './CompactStats'
import StatsSheet from './StatsSheet'

interface DashboardLayoutProps {
  profile: Profile
  meals: Meal[]
  workouts: Workout[]
  totals: DailyTotals
  selectedDate: string
}

export default function DashboardLayout({
  profile,
  meals,
  workouts,
  totals,
  selectedDate,
}: DashboardLayoutProps) {
  const [isStatsSheetOpen, setIsStatsSheetOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      {/* Compact Stats Bar - tappable to expand */}
      <div className="flex-shrink-0 border-b border-surface-border">
        <CompactStats
          calories={{
            current: totals.calories,
            target: profile.daily_calories || 2000,
          }}
          protein={{
            current: totals.protein,
            target: profile.daily_protein || 150,
          }}
          onTap={() => setIsStatsSheetOpen(true)}
        />
      </div>

      {/* Chat - fills remaining space */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Chat profile={profile} compactHeader />
      </div>

      {/* Stats Bottom Sheet */}
      <StatsSheet
        isOpen={isStatsSheetOpen}
        onClose={() => setIsStatsSheetOpen(false)}
        profile={profile}
        meals={meals}
        workouts={workouts}
        totals={totals}
        selectedDate={selectedDate}
      />
    </div>
  )
}
