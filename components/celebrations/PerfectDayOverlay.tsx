'use client'

import { useEffect, useState } from 'react'

interface PerfectDayOverlayProps {
  isVisible: boolean
  onComplete: () => void
}

export default function PerfectDayOverlay({ isVisible, onComplete }: PerfectDayOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onComplete, 300) // Wait for fade out
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  if (!isVisible && !isAnimating) return null

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-black/80 backdrop-blur-sm
        transition-opacity duration-300
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="confetti-particle"
            style={{
              left: `${10 + i * 7}%`,
              animationDelay: `${i * 0.1}s`,
              backgroundColor:
                i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#34d399' : '#fb923c',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="text-center z-10 animate-celebration-pop">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-3xl font-bold text-white mb-2">Perfect Day!</h2>
        <p className="text-text-secondary text-lg">You hit all your targets</p>
      </div>
    </div>
  )
}
