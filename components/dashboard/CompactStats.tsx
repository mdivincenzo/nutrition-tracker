'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

interface CompactStatsProps {
  calories: { current: number; target: number }
  protein: { current: number; target: number }
  onTap: () => void
}

// Color based on percentage toward goal
const getProgressColor = (current: number, target: number): string => {
  const pct = (current / target) * 100
  if (pct >= 100) return '#34d399' // Green - target reached
  if (pct >= 67) return '#facc15'  // Yellow - almost there
  if (pct >= 34) return '#fb923c'  // Orange - getting there
  return '#f87171'                  // Red - behind
}

// Check if goal is reached (≥100%)
const isGoalReached = (current: number, target: number): boolean => {
  return current >= target
}

export default function CompactStats({ calories, protein, onTap }: CompactStatsProps) {
  const [caloriesReached, setCaloriesReached] = useState(false)
  const [proteinReached, setProteinReached] = useState(false)
  const [caloriesCelebrating, setCaloriesCelebrating] = useState(false)
  const [proteinCelebrating, setProteinCelebrating] = useState(false)

  const prevCaloriesRef = useRef(calories.current)
  const prevProteinRef = useRef(protein.current)

  // Track goal reached state and trigger celebrations
  useEffect(() => {
    const wasCaloriesReached = isGoalReached(prevCaloriesRef.current, calories.target)
    const isCaloriesNowReached = isGoalReached(calories.current, calories.target)

    // Trigger celebration when crossing 100% threshold
    if (!wasCaloriesReached && isCaloriesNowReached) {
      setCaloriesCelebrating(true)
      setTimeout(() => setCaloriesCelebrating(false), 600)
    }

    setCaloriesReached(isCaloriesNowReached)
    prevCaloriesRef.current = calories.current
  }, [calories.current, calories.target])

  useEffect(() => {
    const wasProteinReached = isGoalReached(prevProteinRef.current, protein.target)
    const isProteinNowReached = isGoalReached(protein.current, protein.target)

    if (!wasProteinReached && isProteinNowReached) {
      setProteinCelebrating(true)
      setTimeout(() => setProteinCelebrating(false), 600)
    }

    setProteinReached(isProteinNowReached)
    prevProteinRef.current = protein.current
  }, [protein.current, protein.target])

  const caloriesPct = Math.min((calories.current / calories.target) * 100, 100)
  const proteinPct = Math.min((protein.current / protein.target) * 100, 100)

  const caloriesColor = getProgressColor(calories.current, calories.target)
  const proteinColor = getProgressColor(protein.current, protein.target)

  return (
    <button
      onClick={onTap}
      className="w-full glass-card p-4 hover:bg-surface-hover transition-colors group"
    >
      <div className="flex items-center gap-4">
        {/* Calories */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-medium">
                {calories.current.toLocaleString()} / {calories.target.toLocaleString()} cal
              </span>
              {caloriesReached && (
                <span className="text-xs text-success ml-1">✓</span>
              )}
            </div>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${caloriesCelebrating ? 'goal-pulse' : ''}`}
              style={{
                width: `${caloriesPct}%`,
                backgroundColor: caloriesColor,
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-surface-border" />

        {/* Protein */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💪</span>
              <span className="text-sm font-medium">
                {protein.current} g / {protein.target} g
              </span>
              {proteinReached && (
                <span className="text-xs text-success ml-1">✓</span>
              )}
            </div>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${proteinCelebrating ? 'goal-pulse' : ''}`}
              style={{
                width: `${proteinPct}%`,
                backgroundColor: proteinColor,
              }}
            />
          </div>
        </div>

        {/* Chevron */}
        <ChevronRightIcon className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition-colors flex-shrink-0" />
      </div>
    </button>
  )
}
