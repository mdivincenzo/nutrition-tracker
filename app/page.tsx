'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { OnboardingProfile, saveOnboardingProfile } from '@/lib/onboarding-tools'
import OnboardingChat from '@/components/OnboardingChat'
import PlanPreview from '@/components/PlanPreview'
import HeroInput from '@/components/HeroInput'
import Link from 'next/link'

const STORAGE_KEY = 'onboarding_profile'

const goalChips = [
  { emoji: '💪', label: 'Lose fat', goal: 'I want to lose fat and get leaner' },
  { emoji: '🏋️', label: 'Build muscle', goal: 'I want to build muscle and get stronger' },
  { emoji: '⚡', label: 'Get fit', goal: 'I want to improve my overall fitness and health' },
]

const initialProfile: OnboardingProfile = {
  name: null,
  age: null,
  sex: null,
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

export default function Home() {
  const [showPlan, setShowPlan] = useState(false)
  const [profile, setProfile] = useState<OnboardingProfile>(initialProfile)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [hasSubmittedGoal, setHasSubmittedGoal] = useState(false)
  const [pendingGoalMessage, setPendingGoalMessage] = useState<string | null>(null)
  const router = useRouter()

  // Check auth on mount and redirect if logged in with profile
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()

        // Handle OAuth code if present in URL (fallback if redirectTo didn't work)
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('OAuth code exchange failed:', error)
          }
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname)
        }

        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Check if user has a complete profile
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('name, daily_calories')
            .eq('user_id', user.id)
            .single()

          if (existingProfile?.name && existingProfile?.daily_calories) {
            // User is logged in with complete profile, redirect to dashboard
            router.replace('/dashboard')
            return
          }

          // User is authenticated but no profile - check if we have onboarding data to save
          const stored = sessionStorage.getItem(STORAGE_KEY)
          if (stored) {
            try {
              const storedProfile: OnboardingProfile = JSON.parse(stored)
              if (storedProfile.daily_calories && storedProfile.daily_protein && storedProfile.name) {
                // Auto-save the profile
                const result = await saveOnboardingProfile(storedProfile, user.id, supabase)
                if (result.success) {
                  sessionStorage.removeItem(STORAGE_KEY)
                  router.replace('/dashboard')
                  return
                }
              }
            } catch {
              // Ignore parse errors, continue to onboarding
            }
          }

          // User is authenticated but needs to complete onboarding
          // This is fine - they'll see the onboarding flow
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        // Always stop loading, even if there was an error
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // Load profile from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    let loadedProfile: OnboardingProfile | null = null

    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        loadedProfile = parsed
        setProfile(parsed)
        // If they had recommendations, show the plan
        if (parsed.daily_calories && parsed.daily_protein) {
          setShowPlan(true)
        }
        // If they had a goal, show the chat
        if (parsed.goal) {
          setHasSubmittedGoal(true)
        }
      } catch {
        // Invalid stored data, start fresh
      }
    }

    // Check for name cookie (from OAuth)
    const cookies = document.cookie.split(';')
    const nameCookie = cookies.find((c) => c.trim().startsWith('onboarding_name='))
    if (nameCookie) {
      const name = decodeURIComponent(nameCookie.split('=')[1])
      // Only use cookie name if we don't have one from storage
      if (name && !loadedProfile?.name) {
        setProfile((prev) => ({ ...prev, name }))
      }
      // Clear the cookie after use
      document.cookie = 'onboarding_name=; path=/; max-age=0'
    }
  }, [])

  // Save profile to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  const updateProfile = (updates: Partial<OnboardingProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  // Check if we have recommendations set
  const hasRecommendations = !!(
    profile.daily_calories &&
    profile.daily_protein &&
    profile.daily_carbs &&
    profile.daily_fat
  )

  // Auto-transition to plan view when recommendations are ready
  useEffect(() => {
    if (hasRecommendations && !showPlan) {
      setShowPlan(true)
    }
  }, [hasRecommendations, showPlan])

  const handleBack = () => {
    setShowPlan(false)
  }

  const handleGoalSubmit = (goalText: string) => {
    setPendingGoalMessage(goalText)
    setHasSubmittedGoal(true)
  }

  const handleChipClick = (goalText: string) => {
    setPendingGoalMessage(goalText)
    setHasSubmittedGoal(true)
  }

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="floating-orb purple w-96 h-96 -top-48 -left-48 animate-float opacity-15" />
      <div className="floating-orb pink w-80 h-80 bottom-20 -right-40 animate-float opacity-15" style={{ animationDelay: '-3s' }} />

      <div className="min-h-screen flex flex-col relative z-10">
        {/* Header */}
        <header className="px-8 py-4 border-b border-surface-border relative z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Macro</h1>
            </div>

            {/* Login link */}
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-accent-violet transition-colors"
            >
              Log in →
            </Link>
          </div>
        </header>

        {/* Main content */}
        {showPlan ? (
          <PlanPreview
            profile={profile}
            onBack={handleBack}
          />
        ) : hasSubmittedGoal ? (
          // Chat view after goal is submitted
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
            <OnboardingChat
              profile={profile}
              onProfileUpdate={updateProfile}
              step={1}
              initialGoalMessage={pendingGoalMessage}
              onGoalMessageSent={() => setPendingGoalMessage(null)}
            />
          </div>
        ) : (
          // Gravity Well - Initial landing view
          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
            {/* Statement */}
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-2 tracking-tight">
              Your body.
            </h2>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-10 tracking-tight gradient-text">
              Your rules.
            </h2>

            {/* Hero Input */}
            <HeroInput onSubmit={handleGoalSubmit} />

            {/* Quick-tap chips */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {goalChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.goal)}
                  className="goal-chip"
                >
                  {chip.emoji} {chip.label}
                </button>
              ))}
            </div>

            {/* Trust signal */}
            <p className="text-text-tertiary text-sm mt-8">
              AI-powered • 60 second setup
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
