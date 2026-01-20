'use client'

import { OnboardingProfile } from '@/lib/onboarding-tools'

interface PlanCardProps {
  profile: OnboardingProfile
  onAdjust: (direction: 'more_aggressive' | 'more_conservative') => void
  isAdjusting?: boolean
  warning?: string
}

export default function PlanCard({ profile, onAdjust, isAdjusting, warning }: PlanCardProps) {
  const { daily_calories, daily_protein, daily_carbs, daily_fat, goal, tdee } = profile

  if (!daily_calories) return null

  // Determine the deficit/surplus description
  let deficitDescription = ''
  if (tdee && daily_calories) {
    const diff = tdee - daily_calories
    if (diff > 0) {
      deficitDescription = `${diff} calorie deficit for steady fat loss`
    } else if (diff < 0) {
      deficitDescription = `${Math.abs(diff)} calorie surplus for muscle gain`
    } else {
      deficitDescription = 'Maintenance calories'
    }
  }

  // Determine if we're at a limit
  const atAggressiveLimit = warning?.includes('aggressive') || warning?.includes('maximum')
  const atConservativeLimit = warning?.includes('maintenance') || warning?.includes('won\'t lose')

  return (
    <div className="glass-card p-5 border-2 border-accent-violet/30 bg-gradient-to-br from-accent-violet/5 to-accent-pink/5">
      <h3 className="text-center text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Your Personalized Plan
      </h3>

      {/* Main calories display */}
      <div className="text-center mb-4">
        <span className="text-5xl font-bold gradient-text">{daily_calories}</span>
        <p className="text-text-secondary text-sm mt-1">calories per day</p>
      </div>

      {/* Macro breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <span className="text-2xl font-semibold text-green-400">{daily_protein}</span>
          <p className="text-xs text-text-tertiary mt-0.5">protein (g)</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <span className="text-2xl font-semibold text-yellow-400">{daily_carbs}</span>
          <p className="text-xs text-text-tertiary mt-0.5">carbs (g)</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
          <span className="text-2xl font-semibold text-pink-400">{daily_fat}</span>
          <p className="text-xs text-text-tertiary mt-0.5">fat (g)</p>
        </div>
      </div>

      {/* Description */}
      {deficitDescription && (
        <p className="text-center text-sm text-text-secondary mb-4">
          {deficitDescription}
        </p>
      )}

      {/* Warning message */}
      {warning && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-amber-400 text-xs text-center">{warning}</p>
        </div>
      )}

      {/* Adjustment buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onAdjust('more_aggressive')}
          disabled={isAdjusting || atAggressiveLimit}
          className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            atAggressiveLimit
              ? 'bg-surface/50 text-text-tertiary cursor-not-allowed'
              : 'bg-surface border border-surface-border hover:border-surface-hover hover:bg-surface-hover'
          }`}
        >
          {atAggressiveLimit ? (
            <span className="text-xs">At limit</span>
          ) : (
            <>
              More Aggressive
              <span className="block text-xs text-text-tertiary mt-0.5">
                {goal === 'gain' ? '+200 cal' : '-200 cal'}
              </span>
            </>
          )}
        </button>
        <button
          onClick={() => onAdjust('more_conservative')}
          disabled={isAdjusting || atConservativeLimit}
          className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            atConservativeLimit
              ? 'bg-surface/50 text-text-tertiary cursor-not-allowed'
              : 'bg-surface border border-surface-border hover:border-surface-hover hover:bg-surface-hover'
          }`}
        >
          {atConservativeLimit ? (
            <span className="text-xs">At limit</span>
          ) : (
            <>
              More Conservative
              <span className="block text-xs text-text-tertiary mt-0.5">
                {goal === 'gain' ? '-200 cal' : '+200 cal'}
              </span>
            </>
          )}
        </button>
      </div>

      {isAdjusting && (
        <div className="mt-3 flex justify-center">
          <div className="loading-dots">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        </div>
      )}
    </div>
  )
}
