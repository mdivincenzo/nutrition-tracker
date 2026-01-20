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
    <div className="space-y-2">
      {sortedMeals.map((meal) => (
        <div key={meal.id} className="p-3 bg-gray-800 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">{meal.name}</span>
              {meal.time_of_day && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-gray-700 rounded-full capitalize">
                  {meal.time_of_day}
                </span>
              )}
            </div>
            <span className="text-sm font-medium">{meal.calories} kcal</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
          </div>
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {meal.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full"
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
