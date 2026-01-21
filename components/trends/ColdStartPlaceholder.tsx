'use client'

interface ColdStartPlaceholderProps {
  daysLogged: number
  daysNeeded: number
}

export default function ColdStartPlaceholder({ daysLogged, daysNeeded }: ColdStartPlaceholderProps) {
  const percentage = Math.round((daysLogged / daysNeeded) * 100)

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {daysLogged === 0 ? 'Start logging to see trends' : 'Almost there!'}
      </h3>
      <p className="text-text-secondary mb-6">
        {daysLogged === 0
          ? 'Log your first meal to begin tracking your progress.'
          : `${daysLogged} of ${daysNeeded} days logged`}
      </p>

      {daysLogged > 0 && (
        <div className="w-full max-w-xs">
          <div className="h-3 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-violet rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-text-tertiary text-sm mt-2">
            Keep logging to unlock your weekly trends!
          </p>
        </div>
      )}
    </div>
  )
}
