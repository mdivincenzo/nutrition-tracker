'use client'

import Link from 'next/link'
import { OnboardingProfile } from '@/lib/onboarding-tools'

interface PlanPreviewProps {
  profile: OnboardingProfile
  onBack: () => void
}

export default function PlanPreview({ profile, onBack }: PlanPreviewProps) {
  const { name, daily_calories, daily_protein, daily_carbs, daily_fat } = profile

  const features = [
    {
      icon: '💬',
      title: 'Just tell me what you ate',
      example: '"I had a chicken burrito for lunch"',
      benefit: "I'll log it and track your macros automatically",
    },
    {
      icon: '🧠',
      title: 'Get personalized coaching',
      example: '"You\'re 40g short on protein—try Greek yogurt or a protein shake before bed"',
      benefit: null,
    },
    {
      icon: '📈',
      title: 'Track your progress',
      example: null,
      benefit: 'Daily streaks • Weight trends • Weekly averages',
    },
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Personalized header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-1">
            🎯 Your plan is ready{name ? `, ${name}` : ''}!
          </h2>
        </div>

        {/* Compact macro summary */}
        <div className="glass-card p-4 mb-6">
          <p className="text-sm text-text-secondary mb-3">Daily Targets</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span>🔥</span>
              <span className="font-semibold">{daily_calories || 0}</span>
              <span className="text-text-secondary text-sm">kcal</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💪</span>
              <span className="font-semibold">{daily_protein || 0}g</span>
              <span className="text-text-secondary text-sm">protein</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🍞</span>
              <span className="font-semibold">{daily_carbs || 0}g</span>
              <span className="text-text-secondary text-sm">carbs</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🥑</span>
              <span className="font-semibold">{daily_fat || 0}g</span>
              <span className="text-text-secondary text-sm">fat</span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <p className="text-center text-text-secondary text-sm mb-4">Here&apos;s how it works</p>

        {/* Feature cards */}
        <div className="space-y-3 mb-6">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">{feature.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{feature.title}</p>
                  {feature.example && (
                    <p className="text-sm text-text-secondary mt-1 italic">
                      {feature.example}
                    </p>
                  )}
                  {feature.benefit && (
                    <p className="text-sm text-text-secondary mt-1">
                      {feature.benefit}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust signal */}
        <p className="text-center text-xs text-text-tertiary mb-4">
          Your targets are calculated using evidence-based nutrition science, powered by Claude AI.
        </p>

        {/* CTA */}
        <Link href="/signup" className="btn-primary w-full text-center block py-3.5">
          Start Your Journey →
        </Link>

        <p className="text-center text-sm text-text-secondary mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-violet hover:underline">
            Log in
          </Link>
        </p>

        {/* Back link */}
        <button
          onClick={onBack}
          className="w-full text-center text-text-tertiary text-sm mt-4 hover:text-text-secondary"
        >
          ← Adjust my plan
        </button>
      </div>
    </div>
  )
}
