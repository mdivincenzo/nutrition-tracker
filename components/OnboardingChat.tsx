'use client'

import { useState, useRef, useEffect } from 'react'
import { OnboardingProfile } from '@/lib/onboarding-tools'
import { getInitialMessage } from '@/lib/onboarding-context'
import ChatMessage from './ChatMessage'
import OnboardingProgress, { OnboardingStep } from './OnboardingProgress'
import { ArrowRightIcon } from '@heroicons/react/20/solid'

interface OnboardingChatProps {
  profile: OnboardingProfile
  onProfileUpdate: (updates: Partial<OnboardingProfile>) => void
  step: number
  initialGoalMessage?: string | null
  onGoalMessageSent?: () => void
  adjustmentMode?: boolean
  onAdjustmentComplete?: () => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const activityChips = [
  { value: 'sedentary', label: 'Sedentary', emoji: '🪑', description: 'Desk job, little exercise' },
  { value: 'light', label: 'Light', emoji: '🚶', description: 'Light exercise 1-2x/week' },
  { value: 'moderate', label: 'Moderate', emoji: '🏃', description: 'Moderate exercise 3-4x/week' },
  { value: 'active', label: 'Active', emoji: '💪', description: 'Hard exercise 5-6x/week' },
  { value: 'very_active', label: 'Very Active', emoji: '🔥', description: 'Intense exercise daily' },
]

export default function OnboardingChat({
  profile,
  onProfileUpdate,
  step,
  initialGoalMessage,
  onGoalMessageSent,
  adjustmentMode = false,
  onAdjustmentComplete
}: OnboardingChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initializedRef = useRef(false)
  const profileRef = useRef(profile)
  const goalMessageSentRef = useRef(false)
  const adjustmentMessageSentRef = useRef(false)
  const shouldAutoTransitionRef = useRef(false)

  // Keep profile ref updated
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  // Initialize chat - either with welcome message or by processing initial goal
  useEffect(() => {
    if (step === 1 && !initializedRef.current) {
      initializedRef.current = true

      // If we have an initial goal message, don't show welcome - we'll send the goal
      if (initialGoalMessage) {
        // Start with empty messages, goal will be sent via the other effect
        return
      }

      // Otherwise show welcome message (for returning users with partial progress)
      const welcomeMessage = getInitialMessage(profile)
      if (welcomeMessage) {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: welcomeMessage,
          },
        ])
      }
    }
  }, [step, profile, initialGoalMessage])

  // Auto-send the initial goal message when it's provided
  useEffect(() => {
    if (initialGoalMessage && !goalMessageSentRef.current && initializedRef.current) {
      goalMessageSentRef.current = true
      sendMessage(initialGoalMessage)
      onGoalMessageSent?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGoalMessage, onGoalMessageSent])

  // Auto-send adjustment message when entering adjustment mode
  useEffect(() => {
    if (adjustmentMode && !adjustmentMessageSentRef.current && initializedRef.current) {
      adjustmentMessageSentRef.current = true
      sendMessage("I'd like to adjust my nutrition targets")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustmentMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Prepare chat history for API
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          profile: profileRef.current,
          step,
          messages: chatHistory,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      }

      setMessages((prev) => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              continue
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                )
              }
              if (parsed.profileUpdate) {
                onProfileUpdate(parsed.profileUpdate)
                // In adjustment mode, auto-transition when macros are updated
                if (adjustmentMode && parsed.profileUpdate.daily_calories) {
                  shouldAutoTransitionRef.current = true
                }
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Onboarding chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)

      // Handle auto-transition in adjustment mode
      if (shouldAutoTransitionRef.current) {
        shouldAutoTransitionRef.current = false
        setIsTransitioning(true)
        setTimeout(() => {
          onAdjustmentComplete?.()
        }, 800)
      } else {
        // Refocus input for continuous typing
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage(input)
  }

  // Check if stats are complete
  const hasStats = !!(
    profile.age &&
    profile.sex &&
    profile.height_feet !== null &&
    profile.height_inches !== null &&
    profile.start_weight
  )

  // Determine current step for progress indicator
  const getCurrentStep = (): OnboardingStep => {
    if (!profile.goal) return 'goal'
    if (!hasStats) return 'stats'
    if (!profile.activity_level) return 'activity'
    if (!profile.name) return 'name'
    return 'generating'
  }

  // Dynamic headline based on step
  const getHeadline = (): string => {
    if (isTransitioning) {
      return 'Updating your plan...'
    }
    if (adjustmentMode) {
      return 'Adjusting your plan'
    }
    const currentStep = getCurrentStep()
    switch (currentStep) {
      case 'goal':
        return 'Tell me your goal'
      case 'stats':
        return 'Quick details needed'
      case 'activity':
        return 'How active are you?'
      case 'name':
        return 'Almost there!'
      case 'generating':
        return 'Building your plan...'
      default:
        return 'Building your plan'
    }
  }

  // Contextual hint text below input
  const getHint = (): string => {
    if (adjustmentMode) {
      return 'Example: "I want more protein" or "Lower my calories"'
    }
    const currentStep = getCurrentStep()
    switch (currentStep) {
      case 'goal':
        return 'Example: "I want to lose 15 pounds and get stronger"'
      case 'stats':
        return 'Example: "28, female, 5\'6", 145 lbs"'
      case 'activity':
        return 'Pick below or type your own'
      case 'name':
        return 'Just your first name is fine!'
      default:
        return ''
    }
  }

  // Get contextual placeholder based on what info is needed next
  const getPlaceholder = (): string => {
    if (adjustmentMode) return "What would you like to change?"
    if (!profile.goal) return "Tell me about your fitness goal..."
    if (!hasStats) return "Age, sex, height, and weight..."
    if (!profile.activity_level) return "Type or pick below..."
    if (!profile.name) return "Your name..."
    return "Type a message..."
  }

  // Show activity chips when on activity step (not in adjustment mode)
  const showActivityChips = !adjustmentMode && hasStats && !profile.activity_level

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator (hide in adjustment mode) */}
      {!adjustmentMode && (
        <div className="px-6 pt-6">
          <OnboardingProgress currentStep={getCurrentStep()} />
        </div>
      )}

      {/* Dynamic headline */}
      <div className={`text-center py-4 ${adjustmentMode ? 'pt-6' : ''}`}>
        <h2 className="text-xl font-semibold text-text-secondary">
          {getHeadline()}
        </h2>
      </div>

      {/* Compact chat area - only show last 4 messages */}
      <div className="flex-1 overflow-y-auto px-6 space-y-3">
        {messages.slice(-4).map((message) => (
          <ChatMessage key={message.id} message={message} compact />
        ))}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="chat-bubble-assistant">
              <div className="loading-dots">
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Hero-style input */}
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="hero-input-wrapper-sm">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              className="hero-input-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="hero-submit-sm"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Contextual hint */}
        {getHint() && (
          <p className="text-center text-text-tertiary text-sm mt-3">
            {getHint()}
          </p>
        )}

        {/* Activity chips (only when on activity step) */}
        {showActivityChips && (
          <div className="flex flex-col gap-2 mt-4 max-w-sm mx-auto">
            {activityChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => sendMessage(chip.value)}
                className="goal-chip flex items-center justify-between px-4 py-2.5 w-full"
                disabled={isLoading}
              >
                <span className="flex items-center gap-2">
                  <span>{chip.emoji}</span>
                  <span className="font-medium">{chip.label}</span>
                </span>
                <span className="text-text-tertiary text-sm">{chip.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
