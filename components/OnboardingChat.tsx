'use client'

import { useState, useRef, useEffect } from 'react'
import { OnboardingProfile } from '@/lib/onboarding-tools'
import { getInitialMessage } from '@/lib/onboarding-context'
import ChatMessage from './ChatMessage'
import GoalButtons from './GoalButtons'
import PlanCard from './PlanCard'

interface OnboardingChatProps {
  profile: OnboardingProfile
  onProfileUpdate: (updates: Partial<OnboardingProfile>) => void
  step: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function OnboardingChat({ profile, onProfileUpdate, step }: OnboardingChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [adjustmentWarning, setAdjustmentWarning] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const profileRef = useRef(profile)

  // Keep profile ref updated
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  // Initialize with welcome message when entering step 2
  useEffect(() => {
    if (step === 2 && !initializedRef.current) {
      initializedRef.current = true
      const welcomeMessage = getInitialMessage(profile)
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
        },
      ])
    }
  }, [step, profile])

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
    setAdjustmentWarning(undefined)

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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage(input)
  }

  const handleGoalSelect = async (message: string) => {
    await sendMessage(message)
  }

  const handleAdjustPlan = async (direction: 'more_aggressive' | 'more_conservative') => {
    if (isLoading || !profile.daily_calories || !profile.tdee || !profile.bmr) return

    setIsLoading(true)
    setAdjustmentWarning(undefined)

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: direction === 'more_aggressive'
            ? 'Make my plan more aggressive'
            : 'Make my plan more conservative',
          profile: profileRef.current,
          step,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to adjust plan')
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
              }
              if (parsed.warning) {
                setAdjustmentWarning(parsed.warning)
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Plan adjustment error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Determine if we should show goal buttons (after first message, before goal is set)
  const showGoalButtons = messages.length === 1 && !profile.goal && !isLoading

  // Determine if we should show the plan card
  const showPlanCard = !!(profile.daily_calories && profile.daily_protein)

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
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

        {/* Plan card appears when recommendations are set */}
        {showPlanCard && (
          <PlanCard
            profile={profile}
            onAdjust={handleAdjustPlan}
            isAdjusting={isLoading}
            warning={adjustmentWarning}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-border">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={showGoalButtons ? "Describe your fitness goal..." : "Type a message..."}
              className="input-field"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary px-6 whitespace-nowrap"
            >
              Send
            </button>
          </div>
        </form>

        {/* Goal buttons appear at bottom, below input */}
        {showGoalButtons && (
          <GoalButtons onGoalSelect={handleGoalSelect} disabled={isLoading} />
        )}
      </div>
    </div>
  )
}
