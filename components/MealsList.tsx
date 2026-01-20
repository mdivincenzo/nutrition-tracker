import { Meal } from '@/types'

interface MealsListProps {
  meals: Meal[]
}

const timeOfDayOrder = ['breakfast', 'lunch', 'dinner', 'snack']

export default function MealsList({ meals }: MealsListProps) {
  const sortedMeals = [...meals].sort((a, b) => {
    const aIndex = timeOfDayOrder.indexOf(a.time_of_day || 'snack')
    const bIndex = timeOfDayOrder.indexOf(b.time_of_day || 'snack')
    return aIndex - bIndex
  })

  return (
    <div className="space-y-3">
      {sortedMeals.map((meal) => (
        <div key={meal.id} className="glass-card p-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">{meal.name}</span>
              {meal.time_of_day && (
                <span className="ml-2 badge capitalize">
                  {meal.time_of_day}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-text-primary">{meal.calories} kcal</span>
          </div>
          <div className="text-sm text-text-secondary mt-2">
            P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
          </div>
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {meal.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-accent-violet/20 text-accent-violet border border-accent-violet/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
