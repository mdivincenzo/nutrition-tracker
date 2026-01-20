'use client'

import { OnboardingProfile } from '@/lib/onboarding-tools'

interface ProfilePreviewProps {
  profile: OnboardingProfile
  onProfileUpdate: (updates: Partial<OnboardingProfile>) => void
  step: number
}

const activityLevelOptions = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'light', label: 'Light', description: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: '3-5 days/week' },
  { value: 'active', label: 'Active', description: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Intense daily training' },
]

const goalOptions = [
  { value: 'lose', label: 'Lose weight', description: 'Fat loss focus' },
  { value: 'maintain', label: 'Maintain', description: 'Keep current weight' },
  { value: 'gain', label: 'Build muscle', description: 'Lean mass gain' },
]

export default function ProfilePreview({ profile, onProfileUpdate, step }: ProfilePreviewProps) {
  const updateField = <K extends keyof OnboardingProfile>(
    field: K,
    value: OnboardingProfile[K]
  ) => {
    onProfileUpdate({ [field]: value })
  }

  if (step === 2) {
    // Step 2: Show recommendations
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-surface-border">
          <h3 className="text-lg font-semibold">Your Plan</h3>
          <p className="text-sm text-text-secondary mt-1">Personalized nutrition targets</p>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Macro cards */}
          <div className="glass-card p-6">
            <div className="text-center mb-6">
              <span className="text-5xl font-semibold gradient-text">
                {profile.daily_calories || '—'}
              </span>
              <p className="text-text-secondary mt-1">Daily Calories</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-surface">
                <span className="text-2xl font-semibold text-green-400">
                  {profile.daily_protein || '—'}
                </span>
                <p className="text-xs text-text-secondary mt-1">Protein (g)</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-surface">
                <span className="text-2xl font-semibold text-yellow-400">
                  {profile.daily_carbs || '—'}
                </span>
                <p className="text-xs text-text-secondary mt-1">Carbs (g)</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-surface">
                <span className="text-2xl font-semibold text-pink-400">
                  {profile.daily_fat || '—'}
                </span>
                <p className="text-xs text-text-secondary mt-1">Fat (g)</p>
              </div>
            </div>
          </div>

          {/* Profile summary */}
          <div className="glass-card p-6 space-y-4">
            <h4 className="font-medium text-text-secondary">Your Profile</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-tertiary">Height</span>
                <p className="font-medium">{profile.height_feet}&apos;{profile.height_inches}&quot;</p>
              </div>
              <div>
                <span className="text-text-tertiary">Current Weight</span>
                <p className="font-medium">{profile.start_weight} lbs</p>
              </div>
              <div>
                <span className="text-text-tertiary">Goal Weight</span>
                <p className="font-medium">{profile.goal_weight || 'Not set'} lbs</p>
              </div>
              <div>
                <span className="text-text-tertiary">Activity</span>
                <p className="font-medium capitalize">{profile.activity_level?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 1: Profile form
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-surface-border">
        <h3 className="text-lg font-semibold">Your Profile</h3>
        <p className="text-sm text-text-secondary mt-1">Info updates as you chat</p>
      </div>

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Name */}
        <div>
          <label className="input-label">Name</label>
          <input
            type="text"
            value={profile.name || ''}
            onChange={(e) => updateField('name', e.target.value || null)}
            className="input-field"
            placeholder="Your name"
          />
        </div>

        {/* Height */}
        <div>
          <label className="input-label">Height</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  value={profile.height_feet || ''}
                  onChange={(e) => updateField('height_feet', e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field pr-10"
                  placeholder="5"
                  min="3"
                  max="8"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">ft</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  value={profile.height_inches || ''}
                  onChange={(e) => updateField('height_inches', e.target.value ? parseInt(e.target.value) : null)}
                  className="input-field pr-10"
                  placeholder="10"
                  min="0"
                  max="11"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Current Weight</label>
            <div className="relative">
              <input
                type="number"
                value={profile.start_weight || ''}
                onChange={(e) => updateField('start_weight', e.target.value ? parseFloat(e.target.value) : null)}
                className="input-field pr-12"
                placeholder="180"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">lbs</span>
            </div>
          </div>
          <div>
            <label className="input-label">Goal Weight</label>
            <div className="relative">
              <input
                type="number"
                value={profile.goal_weight || ''}
                onChange={(e) => updateField('goal_weight', e.target.value ? parseFloat(e.target.value) : null)}
                className="input-field pr-12"
                placeholder="165"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">lbs</span>
            </div>
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <label className="input-label">Activity Level</label>
          <div className="grid grid-cols-1 gap-2">
            {activityLevelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('activity_level', option.value as OnboardingProfile['activity_level'])}
                className={`p-3 rounded-xl text-left transition-all duration-200 ${
                  profile.activity_level === option.value
                    ? 'bg-accent-violet/20 border border-accent-violet/50'
                    : 'bg-surface border border-surface-border hover:border-surface-hover'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-text-tertiary">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div>
          <label className="input-label">Goal</label>
          <div className="grid grid-cols-3 gap-2">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('goal', option.value as OnboardingProfile['goal'])}
                className={`p-3 rounded-xl text-center transition-all duration-200 ${
                  profile.goal === option.value
                    ? 'bg-accent-violet/20 border border-accent-violet/50'
                    : 'bg-surface border border-surface-border hover:border-surface-hover'
                }`}
              >
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div>
          <label className="input-label">Dietary Notes (optional)</label>
          <textarea
            value={profile.dietary_restrictions || ''}
            onChange={(e) => updateField('dietary_restrictions', e.target.value || null)}
            className="input-field resize-none"
            rows={2}
            placeholder="e.g., vegetarian, lactose intolerant..."
          />
        </div>
      </div>
    </div>
  )
}
