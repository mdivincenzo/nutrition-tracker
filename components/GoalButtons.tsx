'use client'

interface GoalButtonsProps {
  onGoalSelect: (message: string) => void
  disabled?: boolean
}

const goalOptions = [
  {
    id: 'lose_fast',
    title: 'Lose Weight Quickly',
    subtitle: 'Fast fat loss',
    message: "I want to lose weight quickly - fast fat loss is my priority. I'm ready for an aggressive approach.",
    color: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/30 hover:border-red-500/50',
  },
  {
    id: 'get_toned',
    title: 'Get Toned',
    subtitle: 'Lean & fit',
    message: "I want to get toned - lose some fat while building lean muscle. A balanced approach works for me.",
    color: 'from-violet-500/20 to-purple-500/20',
    borderColor: 'border-violet-500/30 hover:border-violet-500/50',
  },
  {
    id: 'bulk_up',
    title: 'Bulk Up',
    subtitle: 'Max muscle',
    message: "I want to bulk up and build maximum muscle. I'm focused on gaining size and strength.",
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30 hover:border-blue-500/50',
  },
]

export default function GoalButtons({ onGoalSelect, disabled }: GoalButtonsProps) {
  return (
    <div className="glass-card p-4 mb-4">
      <p className="text-sm text-text-secondary text-center mb-3">
        Pick a goal to get started:
      </p>
      <div className="grid grid-cols-3 gap-3">
        {goalOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onGoalSelect(option.message)}
            disabled={disabled}
            className={`p-4 rounded-xl border bg-gradient-to-br ${option.color} ${option.borderColor} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            <div className="text-center">
              <p className="font-semibold text-sm">{option.title}</p>
              <p className="text-xs text-text-tertiary mt-1">{option.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
