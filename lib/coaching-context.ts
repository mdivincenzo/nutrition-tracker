import { SupabaseClient } from '@supabase/supabase-js'
import { getLocalDateString } from '@/lib/date-utils'
import { Profile, Meal, Workout } from '@/types'

export interface MealData {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time_of_day: string | null
  date: string
}

export interface WorkoutData {
  id: string
  type: string | null
  exercise: string
  duration_minutes: number | null
  calories_burned: number | null
  date: string
}

export interface DailySnapshot {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  targetCalories: number
  targetProtein: number
  hitCalorieTarget: boolean
  hitProteinTarget: boolean
  hitBothTargets: boolean
  workouts: WorkoutData[]
  meals: MealData[]
}

export interface CoachingContext {
  // User profile
  profile: Profile
  name: string
  goal: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number

  // Today
  today: {
    date: string
    hour: number
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    meals: MealData[]
    workouts: WorkoutData[]
    totals: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
    remaining: {
      calories: number
      protein: number
    }
    mealsRemaining: number
    mealsLogged: {
      breakfast: boolean
      lunch: boolean
      dinner: boolean
      snacks: number
    }
    caloriesBurned: number
    workoutCredit: number
  }

  // Yesterday
  yesterday: DailySnapshot

  // Last 7 days (excluding today)
  lastWeek: {
    days: DailySnapshot[]
    averages: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
    consistency: {
      daysHitCalories: number
      daysHitProtein: number
      daysHitBoth: number
      workoutCount: number
      daysTracked: number
    }
    patterns: string[]
  }

  // Streak
  streak: number
}

export async function buildCoachingContext(
  profileId: string,
  supabase: SupabaseClient
): Promise<CoachingContext> {
  const today = getLocalDateString()
  const dates = getLastNDays(8) // Today + 7 previous days

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (!profile) {
    throw new Error('Profile not found')
  }

  // Fetch all meals for the period
  const { data: allMeals } = await supabase
    .from('meals')
    .select('*')
    .eq('profile_id', profileId)
    .in('date', dates)
    .order('created_at', { ascending: true })

  // Fetch all workouts for the period
  const { data: allWorkouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('profile_id', profileId)
    .in('date', dates)

  const targetCalories = profile.daily_calories || 2000
  const targetProtein = profile.daily_protein || 150

  // Organize by date
  const mealsByDate = groupBy(allMeals || [], 'date')
  const workoutsByDate = groupBy(allWorkouts || [], 'date')

  // Build daily snapshots
  const dailySnapshots: DailySnapshot[] = dates.map(date => {
    const meals = (mealsByDate[date] || []) as MealData[]
    const workouts = (workoutsByDate[date] || []) as WorkoutData[]
    const totals = aggregateMeals(meals)

    return {
      date,
      ...totals,
      targetCalories,
      targetProtein,
      hitCalorieTarget: totals.calories >= targetCalories * 0.9 && totals.calories <= targetCalories * 1.1,
      hitProteinTarget: totals.protein >= targetProtein * 0.9,
      hitBothTargets: totals.calories >= targetCalories * 0.9 &&
                      totals.calories <= targetCalories * 1.1 &&
                      totals.protein >= targetProtein * 0.9,
      workouts,
      meals,
    }
  })

  const todayData = dailySnapshots.find(d => d.date === today) || createEmptySnapshot(today, targetCalories, targetProtein)
  const yesterdayData = dailySnapshots.find(d => d.date === dates[1]) || createEmptySnapshot(dates[1], targetCalories, targetProtein)
  const lastWeekData = dailySnapshots.filter(d => d.date !== today && d.meals.length > 0)

  // Calculate averages (only from days with data)
  const averages = lastWeekData.length > 0 ? {
    calories: Math.round(avg(lastWeekData.map(d => d.calories))),
    protein: Math.round(avg(lastWeekData.map(d => d.protein))),
    carbs: Math.round(avg(lastWeekData.map(d => d.carbs))),
    fat: Math.round(avg(lastWeekData.map(d => d.fat))),
  } : { calories: 0, protein: 0, carbs: 0, fat: 0 }

  // Calculate consistency
  const consistency = {
    daysHitCalories: lastWeekData.filter(d => d.hitCalorieTarget).length,
    daysHitProtein: lastWeekData.filter(d => d.hitProteinTarget).length,
    daysHitBoth: lastWeekData.filter(d => d.hitBothTargets).length,
    workoutCount: lastWeekData.reduce((sum, d) => sum + d.workouts.length, 0),
    daysTracked: lastWeekData.length,
  }

  // Detect patterns
  const patterns = detectPatterns(lastWeekData, profile)

  // Determine time of day
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

  // Calculate meals remaining
  const mealsRemaining = hour < 10 ? 3 : hour < 14 ? 2 : hour < 20 ? 1 : 0

  // Check which meals are logged today
  const mealsLogged = {
    breakfast: todayData.meals.some(m =>
      m.time_of_day === 'breakfast' ||
      m.name?.toLowerCase().includes('breakfast')
    ),
    lunch: todayData.meals.some(m =>
      m.time_of_day === 'lunch' ||
      m.name?.toLowerCase().includes('lunch')
    ),
    dinner: todayData.meals.some(m =>
      m.time_of_day === 'dinner' ||
      m.name?.toLowerCase().includes('dinner')
    ),
    snacks: todayData.meals.filter(m =>
      m.time_of_day === 'snack' ||
      m.name?.toLowerCase().includes('snack')
    ).length,
  }

  // Calculate calories burned today
  const caloriesBurned = todayData.workouts.reduce(
    (sum, w) => sum + (w.calories_burned || 0), 0
  )
  const workoutCredit = Math.round(caloriesBurned * 0.5)

  // Parse goal from coaching_notes
  const goalMatch = profile.coaching_notes?.match(/Goal:\s*(lose|gain|maintain)/i)
  const goal = goalMatch?.[1]?.toLowerCase() || 'maintain'

  return {
    profile,
    name: profile.name || 'there',
    goal,
    targetCalories,
    targetProtein,
    targetCarbs: profile.daily_carbs || 200,
    targetFat: profile.daily_fat || 65,

    today: {
      date: today,
      hour,
      timeOfDay,
      meals: todayData.meals,
      workouts: todayData.workouts,
      totals: {
        calories: todayData.calories,
        protein: todayData.protein,
        carbs: todayData.carbs,
        fat: todayData.fat,
      },
      remaining: {
        calories: targetCalories + workoutCredit - todayData.calories,
        protein: targetProtein - todayData.protein,
      },
      mealsRemaining,
      mealsLogged,
      caloriesBurned,
      workoutCredit,
    },

    yesterday: yesterdayData,

    lastWeek: {
      days: lastWeekData,
      averages,
      consistency,
      patterns,
    },

    streak: calculateStreak(dailySnapshots),
  }
}

function detectPatterns(days: DailySnapshot[], profile: Profile): string[] {
  const patterns: string[] = []

  if (days.length < 3) return patterns // Need at least 3 days of data

  // Pattern: Consistently low protein at breakfast
  const breakfastProteins = days.map(d => {
    const breakfast = d.meals.filter(m =>
      m.time_of_day === 'breakfast' ||
      m.name?.toLowerCase().includes('breakfast')
    )
    return breakfast.reduce((sum, m) => sum + (m.protein || 0), 0)
  }).filter(p => p > 0)

  if (breakfastProteins.length >= 3) {
    const avgBreakfastProtein = avg(breakfastProteins)
    if (avgBreakfastProtein < 20) {
      patterns.push(`Breakfast protein averaging ${Math.round(avgBreakfastProtein)}g—under the 25g threshold for muscle protein synthesis.`)
    }
  }

  // Pattern: Dinner doing heavy lifting on protein
  const dinnerProteinShare = days.map(d => {
    const dinner = d.meals.filter(m =>
      m.time_of_day === 'dinner' ||
      m.name?.toLowerCase().includes('dinner')
    )
    const dinnerProtein = dinner.reduce((sum, m) => sum + (m.protein || 0), 0)
    return d.protein > 0 ? dinnerProtein / d.protein : 0
  }).filter(p => p > 0)

  if (dinnerProteinShare.length >= 3 && avg(dinnerProteinShare) > 0.5) {
    patterns.push(`Dinner carrying ${Math.round(avg(dinnerProteinShare) * 100)}% of daily protein—front-loading would improve absorption.`)
  }

  // Pattern: Weekend calorie spikes
  const weekendDays = days.filter(d => {
    const dayOfWeek = new Date(d.date + 'T12:00:00').getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  })
  const weekdayDays = days.filter(d => {
    const dayOfWeek = new Date(d.date + 'T12:00:00').getDay()
    return dayOfWeek > 0 && dayOfWeek < 6
  })

  if (weekendDays.length >= 1 && weekdayDays.length >= 2) {
    const weekendAvg = avg(weekendDays.map(d => d.calories))
    const weekdayAvg = avg(weekdayDays.map(d => d.calories))
    if (weekendAvg > weekdayAvg + 300) {
      patterns.push(`Weekends averaging ${Math.round(weekendAvg - weekdayAvg)} cal higher than weekdays.`)
    }
  }

  // Pattern: Calories consistently under
  const targetCal = profile.daily_calories || 2000
  const underDays = days.filter(d => d.calories < targetCal * 0.85)
  if (underDays.length >= 4 && days.length >= 5) {
    patterns.push(`Under target 4+ days this week—if intentional, great. If not, may be under-fueling.`)
  }

  // Pattern: Protein consistently under
  const targetPro = profile.daily_protein || 150
  const lowProteinDays = days.filter(d => d.protein < targetPro * 0.85)
  if (lowProteinDays.length >= 4 && days.length >= 5) {
    patterns.push(`Protein under target most days—this limits muscle retention/growth.`)
  }

  // Pattern: Great consistency
  const perfectDays = days.filter(d => d.hitBothTargets)
  if (perfectDays.length >= 5 && days.length >= 5) {
    patterns.push(`${perfectDays.length}/${days.length} days on target—consistency is dialed in.`)
  }

  // Pattern: Workout recovery
  const workoutDays = days.filter(d => d.workouts.length > 0)
  if (workoutDays.length >= 2) {
    const avgWorkoutDayProtein = avg(workoutDays.map(d => d.protein))
    if (avgWorkoutDayProtein < targetPro * 0.9) {
      patterns.push(`Workout days averaging ${Math.round(avgWorkoutDayProtein)}g protein—aim higher on training days for recovery.`)
    }
  }

  return patterns.slice(0, 4) // Max 4 patterns
}

function createEmptySnapshot(date: string, targetCalories: number, targetProtein: number): DailySnapshot {
  return {
    date,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    targetCalories,
    targetProtein,
    hitCalorieTarget: false,
    hitProteinTarget: false,
    hitBothTargets: false,
    workouts: [],
    meals: [],
  }
}

function getLastNDays(n: number): string[] {
  const dates: string[] = []
  for (let i = 0; i < n; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(getLocalDateString(date))
  }
  return dates
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    acc[k] = acc[k] || []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

function aggregateMeals(meals: MealData[]) {
  return {
    calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
    protein: meals.reduce((sum, m) => sum + (m.protein || 0), 0),
    carbs: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    fat: meals.reduce((sum, m) => sum + (m.fat || 0), 0),
  }
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function calculateStreak(days: DailySnapshot[]): number {
  let streak = 0
  // Sort by date descending
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date))

  // Skip today if no meals logged
  const startIndex = sorted[0]?.meals.length === 0 ? 1 : 0

  for (let i = startIndex; i < sorted.length; i++) {
    if (sorted[i].hitBothTargets) {
      streak++
    } else {
      break
    }
  }
  return streak
}
