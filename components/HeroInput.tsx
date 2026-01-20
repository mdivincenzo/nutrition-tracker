'use client'

import { useState } from 'react'

interface HeroInputProps {
  onSubmit: (goal: string) => void
  isLoading?: boolean
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

export default function HeroInput({ onSubmit, isLoading = false }: HeroInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !isLoading) {
      onSubmit(value.trim())
    }
  }

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="hero-input-wrapper">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="I want to get stronger and leaner..."
          className="hero-input"
          autoFocus
          disabled={isLoading}
        />
        <button
          type="submit"
          className="hero-submit"
          disabled={!value.trim() || isLoading}
        >
          {isLoading ? (
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          ) : (
            <ArrowRightIcon className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  )
}
