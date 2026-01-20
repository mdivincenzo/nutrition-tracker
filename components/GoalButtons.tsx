'use client'

interface GoalButtonsProps {
  onGoalSelect: (message: string) => void
  disabled?: boolean
}

const goalOptions = [
  {
    id: 'lose_fast',
    emoji: '🔥',
    title: 'Lose Weight Quickly',
    message: "I want to lose weight quickly - fast fat loss is my priority. I'm ready for an aggressive approach.",
  },
  {
    id: 'get_toned',
    emoji: '💪',
    title: 'Get Toned',
    message: "I want to get toned - lose some fat while building lean muscle. A balanced approach works for me.",
  },
  {
    id: 'bulk_up',
    emoji: '🏋️',
    title: 'Bulk Up',
    message: "I want to bulk up and build maximum muscle. I'm focused on gaining size and strength.",
  },
]

export default function GoalButtons({ onGoalSelect, disabled }: GoalButtonsProps) {
  return (
    <div className="pt-3 border-t border-surface-border/50">
      <p className="text-xs text-text-tertiary text-center mb-2">
        or pick a quick option:
      </p>
      <div className="flex justify-center gap-2">
        {goalOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onGoalSelect(option.message)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-surface-border hover:border-surface-hover text-text-secondary hover:text-text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-1">{option.emoji}</span>
            {option.title}
          </button>
        ))}
      </div>
    </div>
  )
}
