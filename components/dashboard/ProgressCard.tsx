'use client'

import { ProgressState, proteinSuggestions, calorieSuggestions } from '@/lib/progress-state'

interface ProgressCardProps {
  state: ProgressState
  name: string
  streak: number
  calories: number
  targetCalories: number
  protein: number
  targetProtein: number
  coachingInsights?: string[]
}

export default function ProgressCard({
  state,
  name,
  streak,
  calories,
  targetCalories,
  protein,
  targetProtein,
  coachingInsights,
}: ProgressCardProps) {
  const proteinGap = Math.max(0, targetProtein - protein)
  const calorieGap = Math.max(0, targetCalories - calories)
  const needsProtein = protein < targetProtein
  const needsCalories = calories < targetCalories

  // Shared card classes - flat surface, consistent with design system
  const cardClasses = 'bg-surface border border-surface-border rounded-2xl p-5'

  if (state === 'victory') {
    return (
      <div className={cardClasses}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">🎯</span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">You crushed it today!</h3>
            {streak > 0 && (
              <p className="text-orange-400 text-sm font-medium">🔥 {streak} day streak</p>
            )}
          </div>
        </div>

        <p className="text-text-tertiary text-sm mt-4 italic">
          💡 Building a habit. One day at a time.
        </p>
      </div>
    )
  }

  if (state === 'almost') {
    const showProteinGap = needsProtein && (!needsCalories || proteinGap > 0)
    const gapText = showProteinGap ? `${proteinGap}g protein` : `${calorieGap} calories`
    const suggestions = showProteinGap
      ? proteinSuggestions.slice(0, 3)
      : calorieSuggestions.slice(0, 3)

    return (
      <div className={cardClasses}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">💪</span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">So close!</h3>
            <p className="text-text-secondary text-sm">{gapText} away from a perfect day</p>
          </div>
        </div>

        <div className="border-t border-surface-border mt-4 pt-4">
          <p className="text-text-secondary text-sm mb-2">Quick wins:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <span
                key={s.food}
                className="px-3 py-1.5 bg-surface-hover rounded-full text-sm text-text-primary"
              >
                {s.food} <span className="text-text-tertiary">({s.amount})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (state === 'struggling') {
    return (
      <div className={cardClasses}>
        <div className="flex items-center gap-4">
          <span className="text-3xl">🌙</span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Light day today</h3>
            <p className="text-text-secondary text-sm">And that&apos;s okay.</p>
          </div>
        </div>

        <p className="text-text-tertiary text-sm mt-4">
          Tomorrow&apos;s a clean slate. Rest up tonight.
        </p>
      </div>
    )
  }

  if (state === 'fresh-start') {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
      <div className={cardClasses}>
        <div className="flex items-center gap-4">
          <span className="text-3xl">☀️</span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {greeting}, {name}!
            </h3>
            {streak > 0 ? (
              <p className="text-orange-400 text-sm">Day {streak + 1} of your streak starts now</p>
            ) : (
              <p className="text-text-secondary text-sm">Let&apos;s make today count</p>
            )}
          </div>
        </div>

        <div className="border-t border-surface-border mt-4 pt-4">
          <p className="text-text-secondary text-sm mb-2">📋 Today&apos;s game plan:</p>
          <ul className="text-text-secondary text-sm space-y-1 ml-4 list-disc">
            {coachingInsights && coachingInsights.length > 0 ? (
              coachingInsights.map((insight, i) => <li key={i}>{insight}</li>)
            ) : (
              <li>Focus on hitting your protein early—it&apos;s easier than catching up at dinner.</li>
            )}
          </ul>
        </div>
      </div>
    )
  }

  return null
}
