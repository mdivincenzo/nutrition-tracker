interface MacroProgressProps {
  label: string
  current: number
  target: number
  unit: string
  color: 'indigo' | 'green' | 'yellow' | 'pink'
}

export default function MacroProgress({ label, current, target, unit, color }: MacroProgressProps) {
  const percentage = Math.min((current / target) * 100, 100)
  const remaining = target - current

  return (
    <div className="glass-card p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-text-secondary">
          <span className="text-text-primary font-medium">{Math.round(current)}</span> / {target} {unit}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-bar-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-text-tertiary mt-2">
        {remaining > 0 ? (
          `${Math.round(remaining)} ${unit} remaining`
        ) : (
          <span className="text-success">Target reached!</span>
        )}
      </div>
    </div>
  )
}
