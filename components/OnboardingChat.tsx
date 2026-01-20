'use client'

import { useState, useRef, useEffect } from 'react'
import { OnboardingProfile } from '@/lib/onboarding-tools'
import { getInitialMessage } from '@/lib/onboarding-context'
import ChatMessage from './ChatMessage'

interface OnboardingChatProps {
  profile: OnboardingProfile
  onProfileUpdate: (updates: Partial<OnboardingProfile>) => void
  step: number
  initialGoalMessage?: string | null
  onGoalMessageSent?: () => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function OnboardingChat({
  profile,
  onProfileUpdate,
  step,
  initialGoalMessage,
  onGoalMessageSent
}: OnboardingChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const profileRef = useRef(profile)
  const goalMessageSentRef = useRef(false)

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
  }, [initialGoalMessage, onGoalMessageSent])

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

  // Check if stats are complete
  const hasStats = !!(
    profile.age &&
    profile.sex &&
    profile.height_feet !== null &&
    profile.height_inches !== null &&
    profile.start_weight
  )

  // Get contextual placeholder based on what info is needed next (new flow order)
  const getPlaceholder = (): string => {
    if (!profile.goal) return "Tell me about your fitness goal..."
    if (!hasStats) return "Enter your age, sex, height, and weight..."
    if (!profile.activity_level) return "What's your activity level?"
    if (!profile.name) return "What's your name?"
    return "Type a message..."
  }

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
              placeholder={getPlaceholder()}
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

      </div>
    </div>
  )
}
