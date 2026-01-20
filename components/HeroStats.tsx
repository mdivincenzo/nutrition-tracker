'use client'

import { HeroStats as HeroStatsType, Profile, WeighIn } from '@/types'

interface HeroStatsProps {
  stats: HeroStatsType
  profile: Profile
  weighIn: WeighIn | null
}

export default function HeroStats({ stats, profile, weighIn }: HeroStatsProps) {
  const currentWeight = weighIn?.weight || profile.start_weight
  const showBestStreak = stats.bestStreak > stats.currentStreak && stats.bestStreak > 0

  return (
    <div className="glass-card p-6">
      {/* Primary: Streak with Weight on the side */}
      <div className="flex items-start justify-between mb-6">
        {/* Streak */}
        <div>
          <h2 className="text-sm font-medium text-text-secondary mb-1">Current Streak</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight">
              {stats.currentStreak}
            </span>
            <span className="text-3xl">🔥</span>
          </div>
          {showBestStreak && (
            <p className="text-text-tertiary text-sm mt-1">
              Best: {stats.bestStreak} days
            </p>
          )}
          {stats.currentStreak === 0 && (
            <p className="text-text-tertiary text-xs mt-1">
              Hit your calorie & protein targets to start a streak!
            </p>
          )}
        </div>

        {/* Weight Progress */}
        {currentWeight && (
          <div className="text-right">
            <p className="text-sm text-text-secondary mb-1">Weight</p>
            <p className="text-2xl font-semibold">
              {currentWeight}
              <span className="text-sm text-text-tertiary ml-1">lbs</span>
            </p>
            {stats.totalWeightChange !== null && stats.totalWeightChange !== 0 && (
              <p className={`text-sm ${stats.totalWeightChange < 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                {stats.totalWeightChange > 0 ? '+' : ''}{stats.totalWeightChange} lbs
              </p>
            )}
            {stats.weightToGoal !== null && (
              <p className="text-xs text-text-tertiary">
                {Math.abs(stats.weightToGoal)} lbs to goal
              </p>
            )}
          </div>
        )}
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-xl bg-surface/50">
          <p className="text-2xl font-semibold">{stats.daysActive}</p>
          <p className="text-xs text-text-tertiary">Days Active</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface/50">
          <p className="text-2xl font-semibold">
            {stats.weeklyAvgCalories !== null ? stats.weeklyAvgCalories : '—'}
          </p>
          <p className="text-xs text-text-tertiary">Avg Cal/Day</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface/50">
          <p className="text-2xl font-semibold">
            {stats.weeklyAvgProtein !== null ? `${stats.weeklyAvgProtein}g` : '—'}
          </p>
          <p className="text-xs text-text-tertiary">Avg Protein</p>
        </div>
      </div>
    </div>
  )
}
