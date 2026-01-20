'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { OnboardingProfile, saveOnboardingProfile } from '@/lib/onboarding-tools'
import OnboardingChat from '@/components/OnboardingChat'
import PlanPreview from '@/components/PlanPreview'
import Link from 'next/link'

const STORAGE_KEY = 'onboarding_profile'

const inspirationalQuotes = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "The body achieves what the mind believes.", author: "Napoleon Hill" },
  { text: "Strength does not come from the body. It comes from the will.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
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
  const router = useRouter()

  // Check auth on mount and redirect if logged in with profile
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
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
      }

      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  // Select a random quote on mount (stable for the session)
  const randomQuote = useMemo(() => {
    return inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]
  }, [])

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
        <header className="px-8 py-4 border-b border-surface-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">1K A Day</h1>
            </div>

            {/* Login link */}
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-accent-violet transition-colors"
            >
              Already have an account? <span className="text-accent-violet">Log in</span>
            </Link>
          </div>
        </header>

        {/* Main content */}
        {showPlan ? (
          <PlanPreview
            profile={profile}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
            {/* Hero Section */}
            <div className="text-center py-8 px-4">
              <h2 className="text-3xl font-bold mb-2">1K Mission Control Panel</h2>
              <p className="text-text-secondary mb-6">Conversational fitness tracking and coaching.</p>
              <blockquote className="text-text-tertiary italic">
                &ldquo;{randomQuote.text}&rdquo;
                <footer className="mt-1 text-sm not-italic">&mdash; {randomQuote.author}</footer>
              </blockquote>
            </div>

            {/* AI Chat */}
            <OnboardingChat
              profile={profile}
              onProfileUpdate={updateProfile}
              step={1}
            />
          </div>
        )}
      </div>
    </main>
  )
}
