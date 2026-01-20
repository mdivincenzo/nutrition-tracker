'use client'

import { CheckIcon } from '@heroicons/react/20/solid'

export type OnboardingStep = 'goal' | 'stats' | 'activity' | 'name' | 'generating'

interface OnboardingProgressProps {
  currentStep: OnboardingStep
}

const steps = [
  { id: 'goal', label: 'Goal' },
  { id: 'stats', label: 'Stats' },
  { id: 'activity', label: 'Activity' },
  { id: 'name', label: 'Name' },
] as const

export default function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const getStepStatus = (stepId: string): 'completed' | 'current' | 'pending' => {
    const stepOrder = ['goal', 'stats', 'activity', 'name', 'generating']
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(stepId)

    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  return (
    <div className="onboarding-progress">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id)
        return (
          <div
            key={step.id}
            className={`progress-step ${status}`}
          >
            <div className="progress-step-indicator">
              {status === 'completed' ? (
                <CheckIcon className="w-3 h-3" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="progress-step-label">{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
