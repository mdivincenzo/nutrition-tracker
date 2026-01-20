'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { OnboardingProfile, saveOnboardingProfile } from '@/lib/onboarding-tools'
import OnboardingChat from '@/components/OnboardingChat'
import ProfilePreview from '@/components/ProfilePreview'

const initialProfile: OnboardingProfile = {
  name: null,
  height_feet: null,
  height_inches: null,
  start_weight: null,
  goal_weight: null,
  activity_level: null,
  goal: null,
  dietary_restrictions: null,
  daily_calories: null,
  daily_protein: null,
  daily_carbs: null,
  daily_fat: null,
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<OnboardingProfile>(initialProfile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const updateProfile = (updates: Partial<OnboardingProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  // Check if we have enough info to proceed to step 2
  const canProceedToStep2 = !!(
    profile.name &&
    profile.height_feet &&
    profile.height_inches &&
    profile.start_weight &&
    profile.activity_level &&
    profile.goal
  )

  // Check if we have recommendations set
  const hasRecommendations = !!(
    profile.daily_calories &&
    profile.daily_protein &&
    profile.daily_carbs &&
    profile.daily_fat
  )

  const handleContinue = () => {
    if (step === 1 && canProceedToStep2) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleComplete = async () => {
    if (!hasRecommendations) {
      setError('Please wait for your recommendations to be calculated.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const result = await saveOnboardingProfile(profile, user.id, supabase)

    if (!result.success) {
      setError(result.error || 'Failed to save profile')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="floating-orb purple w-96 h-96 -top-48 -left-48 animate-float opacity-15" />
      <div className="floating-orb pink w-80 h-80 bottom-20 -right-40 animate-float opacity-15" style={{ animationDelay: '-3s' }} />

      <div className="min-h-screen flex flex-col relative z-10">
        {/* Header */}
        <header className="px-8 py-6 border-b border-surface-border">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                Step {step} of 2: {step === 1 ? "Let's get to know you" : 'Your personalized plan'}
              </h1>
              <p className="text-text-secondary mt-1">
                {step === 1
                  ? 'Chat with Claude or fill in the form directly'
                  : 'Review your recommended nutrition targets'}
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-3">
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
              <div className="w-12 h-px bg-surface-border" />
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex">
          {/* Chat panel */}
          <div className="w-1/2 border-r border-surface-border flex flex-col">
            <OnboardingChat
              profile={profile}
              onProfileUpdate={updateProfile}
              step={step}
            />
          </div>

          {/* Profile preview panel */}
          <div className="w-1/2 flex flex-col">
            <ProfilePreview
              profile={profile}
              onProfileUpdate={updateProfile}
              step={step}
            />

            {/* Action buttons */}
            <div className="p-6 border-t border-surface-border">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-error-muted border border-error/30">
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                {step === 2 && (
                  <button
                    onClick={handleBack}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                )}

                {step === 1 ? (
                  <button
                    onClick={handleContinue}
                    disabled={!canProceedToStep2}
                    className="btn-primary flex-1"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={loading || !hasRecommendations}
                    className="btn-primary flex-1"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="loading-dots">
                          <div className="loading-dot" />
                          <div className="loading-dot" />
                          <div className="loading-dot" />
                        </div>
                      </span>
                    ) : (
                      "Looks good! Let's start"
                    )}
                  </button>
                )}
              </div>

              {step === 1 && !canProceedToStep2 && (
                <p className="text-xs text-text-tertiary mt-3 text-center">
                  Share your name, height, weight, activity level, and goal to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
