'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useNavigation } from '@/lib/navigation-context'

const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const isYesterday = (date: Date) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

const formatDateLabel = (date: Date) => {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Header() {
  const { selectedDate, setSelectedDate, streak, earliestDate } = useNavigation()
  const prevStreakRef = useRef(streak)
  const [isAnimating, setIsAnimating] = useState(false)

  // Detect streak increment and trigger animation
  useEffect(() => {
    if (streak > prevStreakRef.current && prevStreakRef.current !== 0) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 600)
    }
    prevStreakRef.current = streak
  }, [streak])

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const canGoNext = !isToday(selectedDate)

  // Check if we can go to previous day (not before signup date)
  const canGoPrev = !earliestDate || selectedDate.toDateString() !== earliestDate.toDateString()

  const streakText = streak === 0
    ? 'Start streak'
    : streak === 1
      ? '1 day'
      : `${streak} days`

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#0a0a0f',
      }}
    >
      {/* Date Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          onClick={goToPreviousDay}
          disabled={!canGoPrev}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: canGoPrev ? '#94a3b8' : 'rgba(100, 116, 139, 0.3)',
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (canGoPrev) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.color = '#f8fafc'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = canGoPrev ? '#94a3b8' : 'rgba(100, 116, 139, 0.3)'
          }}
          aria-label="Previous day"
        >
          <ChevronLeftIcon style={{ width: '18px', height: '18px' }} />
        </button>

        <span
          style={{
            fontWeight: 600,
            fontSize: '15px',
            color: '#f8fafc',
          }}
        >
          {formatDateLabel(selectedDate)}
        </span>

        <button
          onClick={goToNextDay}
          disabled={!canGoNext}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: canGoNext ? '#94a3b8' : 'rgba(100, 116, 139, 0.3)',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (canGoNext) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.color = '#f8fafc'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = canGoNext ? '#94a3b8' : 'rgba(100, 116, 139, 0.3)'
          }}
          aria-label="Next day"
        >
          <ChevronRightIcon style={{ width: '18px', height: '18px' }} />
        </button>
      </div>

      {/* Streak + Settings */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Streak Pill */}
        <div
          className={isAnimating ? 'streak-pulse' : ''}
          style={
            streak > 0
              ? {
                  padding: '4px 10px',
                  fontSize: '13px',
                  borderRadius: '16px',
                  background: 'rgba(251, 146, 60, 0.15)',
                  border: '1px solid rgba(251, 146, 60, 0.3)',
                  color: '#fb923c',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }
              : {
                  padding: '4px 10px',
                  fontSize: '13px',
                  borderRadius: '16px',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                }
          }
        >
          🔥 {streakText}
        </div>

        {/* Settings Icon */}
        <Link
          href="/dashboard/settings"
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            color: '#64748b',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
            e.currentTarget.style.color = '#94a3b8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#64748b'
          }}
          aria-label="Settings"
        >
          <Cog6ToothIcon style={{ width: '18px', height: '18px' }} />
        </Link>
      </div>
    </header>
  )
}
