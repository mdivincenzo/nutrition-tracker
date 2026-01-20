'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface FormData {
  name: string
  height_feet: string
  height_inches: string
  start_weight: string
  goal_weight: string
  start_bf: string
  goal_bf: string
  daily_calories: string
  daily_protein: string
  daily_carbs: string
  daily_fat: string
  coaching_notes: string
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    height_feet: '',
    height_inches: '',
    start_weight: '',
    goal_weight: '',
    start_bf: '',
    goal_bf: '',
    daily_calories: '',
    daily_protein: '',
    daily_carbs: '',
    daily_fat: '',
    coaching_notes: '',
  })
  const router = useRouter()

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const heightInches = formData.height_feet && formData.height_inches
      ? parseInt(formData.height_feet) * 12 + parseInt(formData.height_inches)
      : null

    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        name: formData.name,
        height_inches: heightInches,
        start_weight: formData.start_weight ? parseFloat(formData.start_weight) : null,
        goal_weight: formData.goal_weight ? parseFloat(formData.goal_weight) : null,
        start_bf: formData.start_bf ? parseFloat(formData.start_bf) : null,
        goal_bf: formData.goal_bf ? parseFloat(formData.goal_bf) : null,
        daily_calories: formData.daily_calories ? parseInt(formData.daily_calories) : null,
        daily_protein: formData.daily_protein ? parseInt(formData.daily_protein) : null,
        daily_carbs: formData.daily_carbs ? parseInt(formData.daily_carbs) : null,
        daily_fat: formData.daily_fat ? parseInt(formData.daily_fat) : null,
        start_date: new Date().toISOString().split('T')[0],
        coaching_notes: formData.coaching_notes || null,
      }, {
        onConflict: 'user_id',
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1/3 h-1 rounded ${i <= step ? 'bg-blue-500' : 'bg-gray-700'} ${i < 3 ? 'mr-2' : ''}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400 text-center">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center">Let&apos;s get to know you</h1>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                What should we call you?
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Your height
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.height_feet}
                    onChange={(e) => updateField('height_feet', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Feet"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.height_inches}
                    onChange={(e) => updateField('height_inches', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Inches"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Current weight (lbs)
                </label>
                <input
                  type="number"
                  value={formData.start_weight}
                  onChange={(e) => updateField('start_weight', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="180"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Goal weight (lbs)
                </label>
                <input
                  type="number"
                  value={formData.goal_weight}
                  onChange={(e) => updateField('goal_weight', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="165"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Current body fat % (optional)
                </label>
                <input
                  type="number"
                  value={formData.start_bf}
                  onChange={(e) => updateField('start_bf', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Goal body fat % (optional)
                </label>
                <input
                  type="number"
                  value={formData.goal_bf}
                  onChange={(e) => updateField('goal_bf', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="15"
                />
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!formData.name}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center">Your daily targets</h1>
            <p className="text-gray-400 text-center text-sm">
              Set your daily nutrition goals. You can adjust these later.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Daily calories
              </label>
              <input
                type="number"
                value={formData.daily_calories}
                onChange={(e) => updateField('daily_calories', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="2000"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={formData.daily_protein}
                  onChange={(e) => updateField('daily_protein', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={formData.daily_carbs}
                  onChange={(e) => updateField('daily_carbs', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={formData.daily_fat}
                  onChange={(e) => updateField('daily_fat', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="65"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={prevStep}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.daily_calories}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center">Coaching preferences</h1>
            <p className="text-gray-400 text-center text-sm">
              Tell Claude about your preferences, restrictions, or anything else that would help with coaching.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes for your AI coach (optional)
              </label>
              <textarea
                value={formData.coaching_notes}
                onChange={(e) => updateField('coaching_notes', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="e.g., I'm vegetarian, I workout in the mornings, I'm trying to build muscle while losing fat..."
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-4">
              <button
                onClick={prevStep}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Saving...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
