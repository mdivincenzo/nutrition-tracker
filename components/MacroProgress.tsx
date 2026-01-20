interface MacroProgressProps {
  label: string
  current: number
  target: number
  unit: string
  color: 'blue' | 'green' | 'yellow' | 'pink'
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  pink: 'bg-pink-500',
}

export default function MacroProgress({ label, current, target, unit, color }: MacroProgressProps) {
  const percentage = Math.min((current / target) * 100, 100)
  const remaining = target - current

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-gray-400">
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {remaining > 0 ? `${Math.round(remaining)} ${unit} remaining` : 'Target reached!'}
      </div>
    </div>
  )
}
