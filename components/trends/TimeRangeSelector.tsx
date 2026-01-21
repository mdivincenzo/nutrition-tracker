'use client'

type TimeRange = 'week' | 'month' | '3months'

interface TimeRangeSelectorProps {
  selected: TimeRange
  onChange: (range: TimeRange) => void
}

const options: { value: TimeRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Months' },
]

export default function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-2 mb-4">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${selected === option.value
              ? 'bg-accent-violet text-white'
              : 'bg-surface text-text-secondary hover:bg-surface-hover'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
