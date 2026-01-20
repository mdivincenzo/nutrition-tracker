'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { OnboardingProfile, saveOnboardingProfile } from '@/lib/onboarding-tools'
import OnboardingChat from '@/components/OnboardingChat'

const activityLevelOptions = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
] as const

const initialProfile: OnboardingProfile = {
  name: null,
  age: null,
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
  tdee: null,
  bmr: null,
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<OnboardingProfile>(initialProfile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Pre-fill name from cookie (set during OAuth)
  useEffect(() => {
    const cookies = document.cookie.split(';')
    const nameCookie = cookies.find((c) => c.trim().startsWith('onboarding_name='))
    if (nameCookie) {
      const name = decodeURIComponent(nameCookie.split('=')[1])
      if (name && !profile.name) {
        setProfile((prev) => ({ ...prev, name }))
      }
      // Clear the cookie after use
      document.cookie = 'onboarding_name=; path=/; max-age=0'
    }
  }, [profile.name])

  const updateProfile = (updates: Partial<OnboardingProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  // Check if we have enough info for step 1 (basic profile - no goal needed here)
  const canProceedToStep2 = !!(
    profile.name &&
    profile.age &&
    profile.height_feet !== null &&
    profile.height_inches !== null &&
    profile.start_weight &&
    profile.activity_level
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
      setError('Please wait for your plan to be created.')
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
        <header className="px-8 py-4 border-b border-surface-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Nutrition Tracker</h1>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>Step {step} of 2</span>
              <div className="flex items-center gap-1.5 ml-2">
                <div className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-accent-violet' : 'bg-surface-border'}`} />
                <div className="w-6 h-px bg-surface-border" />
                <div className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-accent-violet' : 'bg-surface-border'}`} />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        {step === 1 ? (
          // Step 1: Compact form layout - no chat, fits in viewport
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold mb-2">Let&apos;s set up your profile</h2>
                <p className="text-text-secondary">We&apos;ll use this info to calculate your personalized plan</p>
              </div>

              <div className="glass-card p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="input-label">Name</label>
                  <input
                    type="text"
                    value={profile.name || ''}
                    onChange={(e) => updateProfile({ name: e.target.value || null })}
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>

                {/* Age, Height, Weight in a row */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="input-label">Age</label>
                    <input
                      type="number"
                      value={profile.age || ''}
                      onChange={(e) => updateProfile({ age: e.target.value ? parseInt(e.target.value) : null })}
                      className="input-field"
                      placeholder="32"
                      min="13"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="input-label">Height</label>
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={profile.height_feet ?? ''}
                          onChange={(e) => updateProfile({ height_feet: e.target.value ? parseInt(e.target.value) : null })}
                          className="input-field pr-7 text-center"
                          placeholder="5"
                          min="3"
                          max="8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">ft</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={profile.height_inches ?? ''}
                          onChange={(e) => updateProfile({ height_inches: e.target.value ? parseInt(e.target.value) : null })}
                          className="input-field pr-6 text-center"
                          placeholder="10"
                          min="0"
                          max="11"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">in</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Weight</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={profile.start_weight || ''}
                        onChange={(e) => updateProfile({ start_weight: e.target.value ? parseFloat(e.target.value) : null })}
                        className="input-field pr-10"
                        placeholder="180"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">lbs</span>
                    </div>
                  </div>
                </div>

                {/* Activity Level as horizontal buttons */}
                <div>
                  <label className="input-label">Activity Level</label>
                  <div className="flex gap-1.5">
                    {activityLevelOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateProfile({ activity_level: option.value })}
                        className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          profile.activity_level === option.value
                            ? 'bg-accent-violet/20 border border-accent-violet/50 text-accent-violet'
                            : 'bg-surface border border-surface-border hover:border-surface-hover text-text-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continue button */}
                <button
                  onClick={handleContinue}
                  disabled={!canProceedToStep2}
                  className="btn-primary w-full mt-2"
                >
                  Continue
                </button>

                {!canProceedToStep2 && (
                  <p className="text-xs text-text-tertiary text-center">
                    Fill in all fields to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Step 2: Full-width chat with goals conversation
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
            <OnboardingChat
              profile={profile}
              onProfileUpdate={updateProfile}
              step={step}
            />

            {/* Action buttons */}
            <div className="p-4 border-t border-surface-border">
              {error && (
                <div className="mb-3 p-3 rounded-lg bg-error-muted border border-error/30">
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="btn-secondary px-6"
                >
                  ← Back
                </button>

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
                    "Looks good! Start →"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
