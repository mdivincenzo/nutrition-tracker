'use client'

import Link from 'next/link'
import { OnboardingProfile } from '@/lib/onboarding-tools'

interface PlanPreviewProps {
  profile: OnboardingProfile
  onBack: () => void
}

export default function PlanPreview({ profile, onBack }: PlanPreviewProps) {
  const { daily_calories, daily_protein, daily_carbs, daily_fat, goal, tdee } = profile

  // Calculate deficit/surplus info
  const getGoalDescription = () => {
    if (!tdee || !daily_calories) return null

    const diff = tdee - daily_calories
    const goalLabel = goal === 'lose' ? 'lose weight' : goal === 'gain' ? 'build muscle' : 'maintain weight'

    if (goal === 'lose') {
      return `Based on your goal to ${goalLabel}, we recommend a ${Math.abs(diff)} calorie deficit from your TDEE of ${tdee} calories.`
    } else if (goal === 'gain') {
      return `Based on your goal to ${goalLabel}, we recommend a ${Math.abs(diff)} calorie surplus above your TDEE of ${tdee} calories.`
    } else {
      return `Based on your goal to ${goalLabel}, we've set your daily target at your TDEE of ${tdee} calories.`
    }
  }

  const macros = [
    {
      label: 'Calories',
      value: daily_calories || 0,
      unit: 'kcal',
      icon: '🔥',
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Protein',
      value: daily_protein || 0,
      unit: 'g',
      icon: '💪',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      label: 'Carbs',
      value: daily_carbs || 0,
      unit: 'g',
      icon: '🍞',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      label: 'Fat',
      value: daily_fat || 0,
      unit: 'g',
      icon: '🥑',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Your Personalized Plan</h2>
          <p className="text-text-secondary">Here&apos;s what we recommend based on your goals</p>
        </div>

        <div className="glass-card p-6 space-y-6">
          {/* Daily Targets Header */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Daily Targets</h3>

            {/* Macro targets */}
            <div className="space-y-4">
              {macros.map((macro) => (
                <div key={macro.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{macro.icon}</span>
                      <span className="font-medium text-text-primary">{macro.label}</span>
                    </div>
                    <span className="text-text-secondary">
                      <span className="text-text-primary font-semibold">{macro.value}</span> {macro.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${macro.color} rounded-full`}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal explanation */}
          {getGoalDescription() && (
            <div className="pt-4 border-t border-surface-border">
              <p className="text-sm text-text-secondary leading-relaxed">
                {getGoalDescription()}
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="pt-4 space-y-3">
            <Link
              href="/signup"
              className="btn-primary w-full text-center block py-3.5"
            >
              Create Account to Start
            </Link>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="text-accent-violet hover:text-accent-fuchsia transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-6">
          <button
            onClick={onBack}
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            &larr; Go back and adjust
          </button>
        </div>
      </div>
    </div>
  )
}
