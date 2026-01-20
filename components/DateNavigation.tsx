'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, addDays, subDays, parseISO, isToday } from 'date-fns'

interface DateNavigationProps {
  selectedDate: string
}

export default function DateNavigation({ selectedDate }: DateNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const currentDate = parseISO(selectedDate)
  const isTodaySelected = isToday(currentDate)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigateToDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const todayStr = format(new Date(), 'yyyy-MM-dd')

    if (dateStr === todayStr) {
      router.push('/dashboard')
    } else {
      router.push(`/dashboard?date=${dateStr}`)
    }
    setIsCalendarOpen(false)
  }

  const goToPreviousDay = () => {
    navigateToDate(subDays(currentDate, 1))
  }

  const goToNextDay = () => {
    navigateToDate(addDays(currentDate, 1))
  }

  const goToToday = () => {
    router.push('/dashboard')
  }

  const formattedDate = format(currentDate, 'EEEE, MMMM d')

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goToPreviousDay}
        className="p-2 rounded-lg bg-surface hover:bg-surface-elevated transition-colors"
        aria-label="Previous day"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="relative" ref={calendarRef}>
        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-elevated transition-colors font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-secondary"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formattedDate}</span>
        </button>

        {isCalendarOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
            <div className="glass-card p-4 shadow-xl">
              <DayPicker
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && navigateToDate(date)}
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={goToNextDay}
        className="p-2 rounded-lg bg-surface hover:bg-surface-elevated transition-colors"
        aria-label="Next day"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {!isTodaySelected && (
        <button
          onClick={goToToday}
          className="px-4 py-2 rounded-lg bg-surface border border-surface-border hover:bg-surface-elevated transition-colors text-sm font-medium"
        >
          Today
        </button>
      )}
    </div>
  )
}
