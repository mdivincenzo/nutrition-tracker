'use client'

import { useState, useRef, useEffect } from 'react'
import { Profile } from '@/types'
import ChatMessage from './ChatMessage'
import { useRouter } from 'next/navigation'
import { Cog6ToothIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useNavigation } from '@/lib/navigation-context'
import { getContextualGreeting } from '@/lib/greeting'
import { ProgressState } from '@/lib/progress-state'
import ProgressCard from './dashboard/ProgressCard'

interface TodayStats {
  calories: number
  protein: number
  targetCalories: number
  targetProtein: number
}

interface ChatProps {
  profile: Profile
  compactHeader?: boolean
  onDataChanged?: () => void
  todayStats?: TodayStats
  progressState?: ProgressState
  coachingInsights?: string[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function Chat({ profile, compactHeader = false, onDataChanged, todayStats, progressState, coachingInsights }: ChatProps) {
  const { streak } = useNavigation()
  const [messages, setMessages] = useState<Message[]>([])
  const initializedRef = useRef(false)

  // Get contextual placeholder based on progress state
  const getPlaceholder = () => {
    switch (progressState) {
      case 'victory':
        return 'Anything else on your mind?'
      case 'almost':
        return 'Want some dinner ideas?'
      case 'struggling':
        return 'Want to talk through tomorrow?'
      case 'fresh-start':
        return "What's your plan for today?"
      default:
        return 'Tell me what you ate...'
    }
  }

  // Initialize greeting ONLY ONCE on mount
  // Use ref to track initialization (persists across re-renders better than state)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // If showing a progress card, start with empty messages
    // The card IS the greeting
    if (progressState && progressState !== 'on-track') {
      return // Don't set any messages, the progress card is the greeting
    }

    // Only for 'on-track' state - add a greeting message
    const greeting = todayStats
      ? getContextualGreeting({
          name: profile.name || 'there',
          streak,
          calories: todayStats.calories,
          targetCalories: todayStats.targetCalories,
          protein: todayStats.protein,
          targetProtein: todayStats.targetProtein,
        })
      : `Hey ${profile.name || 'there'}! I'm your nutrition coach. What did you eat today?`

    setMessages([
      {
        id: 'greeting',
        role: 'assistant',
        content: greeting,
      },
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    setInput(textarea.value)
  }

  // Reset textarea height on submit
  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          profileId: profile.id,
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
              // Refresh the dashboard data
              router.refresh()
              onDataChanged?.()
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
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
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
      resetTextareaHeight()
      // Refocus input for continuous typing
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }

  // Handle Enter key (submit on Enter, new line on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <>
      {/* Header */}
      {!compactHeader && (
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Macro</h1>
          </div>
          <button
            className="p-2 text-text-tertiary hover:text-text-secondary transition-colors rounded-lg hover:bg-surface"
            title="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Progress card - shows only when no conversation has started */}
        {progressState && progressState !== 'on-track' && todayStats && messages.length === 0 && (
          <ProgressCard
            state={progressState}
            name={profile.name || 'there'}
            streak={streak}
            calories={todayStats.calories}
            targetCalories={todayStats.targetCalories}
            protein={todayStats.protein}
            targetProtein={todayStats.targetProtein}
            coachingInsights={coachingInsights}
          />
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
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

      {/* Auto-expanding Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-surface-border">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="input-field flex-1 resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 flex items-center justify-center flex-shrink-0 mb-[2px] text-accent-violet hover:bg-accent-violet/10 disabled:text-text-tertiary disabled:hover:bg-transparent rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </>
  )
}
