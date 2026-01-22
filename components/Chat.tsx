'use client'

import { useState, useRef, useEffect } from 'react'
import { Profile } from '@/types'
import ChatMessage from './ChatMessage'
import { useRouter } from 'next/navigation'
import { Cog6ToothIcon, PaperAirplaneIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNavigation } from '@/lib/navigation-context'
import { getContextualGreeting } from '@/lib/greeting'
import { ProgressState } from '@/lib/progress-state'
import ProgressCard from './dashboard/ProgressCard'
import { createClient } from '@/lib/supabase'
import { getLocalDateString } from '@/lib/date-utils'

// Supported image types for meal photos
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
  })
}

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
  const { streak, selectedDate } = useNavigation()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const initializedRef = useRef(false)
  const loadedDateRef = useRef<string | null>(null)

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

  // Reset state when date changes
  useEffect(() => {
    const dateStr = getLocalDateString(selectedDate)
    if (loadedDateRef.current && loadedDateRef.current !== dateStr) {
      // Date changed - reset state for new date
      setMessages([])
      initializedRef.current = false
      loadedDateRef.current = null
    }
  }, [selectedDate])

  // Load today's messages from database
  useEffect(() => {
    const loadTodayMessages = async () => {
      if (!profile?.id) return

      const dateStr = getLocalDateString(selectedDate)

      // Skip if we already loaded messages for this date
      if (loadedDateRef.current === dateStr) return
      loadedDateRef.current = dateStr

      setIsLoadingMessages(true)
      const supabase = createClient()

      // Get start and end of the selected day in UTC
      const startOfDay = new Date(dateStr + 'T00:00:00')
      const endOfDay = new Date(dateStr + 'T23:59:59.999')

      const { data: savedMessages, error } = await supabase
        .from('chat_history')
        .select('id, role, content, created_at')
        .eq('profile_id', profile.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        setIsLoadingMessages(false)
        return
      }

      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })))
        initializedRef.current = true
      } else {
        // No saved messages - show greeting if on-track, or empty for progress card
        setMessages([])
        initializedRef.current = false
      }

      setIsLoadingMessages(false)
    }

    loadTodayMessages()
  }, [profile?.id, selectedDate])

  // Initialize greeting after messages load (if no saved messages)
  useEffect(() => {
    if (isLoadingMessages) return
    if (initializedRef.current) return
    if (messages.length > 0) return

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
  }, [isLoadingMessages, messages.length, progressState, todayStats, profile.name, streak])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      alert('Please select a JPEG, PNG, or WebP image.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('Image must be less than 4MB.')
      return
    }

    try {
      const base64 = await fileToBase64(file)
      const preview = URL.createObjectURL(file)
      setSelectedImage({ base64, mimeType: file.type, preview })
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading image. Please try again.')
    }
  }

  // Clear selected image
  const clearImage = () => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview)
    }
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
    if ((!input.trim() && !selectedImage) || isLoading) return

    const messageContent = input.trim() || (selectedImage ? "What's in this meal? Log it for me." : '')
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
    }

    // Store image data before clearing
    const imageData = selectedImage ? { base64: selectedImage.base64, mimeType: selectedImage.mimeType } : undefined

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    clearImage()
    setIsLoading(true)

    try {
      // Debug: Log what we're sending
      console.log('=== CHAT SENDING ===')
      console.log('Message:', userMessage.content)
      console.log('Image data:', imageData ? `Yes (${imageData.mimeType}, ${imageData.base64.length} chars)` : 'No')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          profileId: profile.id,
          image: imageData,
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
        {/* Loading state */}
        {isLoadingMessages && (
          <div className="flex justify-center py-8">
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          </div>
        )}

        {/* Progress card - shows only when no conversation has started */}
        {!isLoadingMessages && progressState && progressState !== 'on-track' && todayStats && messages.length === 0 && (
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

        {!isLoadingMessages && messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {!isLoadingMessages && isLoading && messages[messages.length - 1]?.role === 'user' && (
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
        {/* Image preview */}
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={selectedImage.preview}
              alt="Selected meal"
              className="h-20 w-auto rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 p-1 bg-surface-hover rounded-full text-text-secondary hover:text-text-primary"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-3">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          {/* Camera button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="h-10 w-10 flex items-center justify-center flex-shrink-0 mb-[2px] text-text-secondary hover:text-accent-violet hover:bg-accent-violet/10 disabled:text-text-tertiary disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Upload meal photo"
          >
            <CameraIcon className="w-5 h-5" />
          </button>
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
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="h-10 w-10 flex items-center justify-center flex-shrink-0 mb-[2px] text-accent-violet hover:bg-accent-violet/10 disabled:text-text-tertiary disabled:hover:bg-transparent rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </>
  )
}
