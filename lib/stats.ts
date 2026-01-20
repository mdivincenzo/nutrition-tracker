import { SupabaseClient } from '@supabase/supabase-js'
import { Profile, HeroStats, Meal } from '@/types'

interface DailyMealTotals {
  date: string
  calories: number
  protein: number
}

export async function calculateHeroStats(
  profileId: string,
  profile: Profile,
  supabase: SupabaseClient
): Promise<HeroStats> {
  // Fetch all meals for this profile
  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('profile_id', profileId)
    .order('date', { ascending: true })

  // Fetch latest weigh-in
  const { data: latestWeighIn } = await supabase
    .from('weigh_ins')
    .select('weight')
    .eq('profile_id', profileId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const allMeals: Meal[] = meals || []

  // Group meals by date and sum totals
  const dailyTotals = groupMealsByDate(allMeals)

  // Parse goal from coaching_notes (format: "Goal: lose" or "Goal: gain" or "Goal: maintain")
  const goalMatch = profile.coaching_notes?.match(/Goal:\s*(lose|gain|maintain)/i)
  const goal = (goalMatch?.[1]?.toLowerCase() as 'lose' | 'gain' | 'maintain') || 'maintain'

  // Calculate streak
  const { currentStreak, bestStreak } = calculateStreak(
    dailyTotals,
    profile.daily_calories || 2000,
    profile.daily_protein || 150,
    goal
  )

  // Calculate days active (from start_date to today)
  const daysActive = calculateDaysActive(profile.start_date)

  // Calculate weight changes
  const currentWeight = latestWeighIn?.weight || profile.start_weight
  const totalWeightChange = currentWeight && profile.start_weight
    ? Math.round((currentWeight - profile.start_weight) * 10) / 10
    : null

  const weightToGoal = currentWeight && profile.goal_weight
    ? Math.round((profile.goal_weight - currentWeight) * 10) / 10
    : null

  // Calculate 7-day rolling averages
  const { avgCalories, avgProtein } = calculateWeeklyAverages(dailyTotals)

  return {
    currentStreak,
    bestStreak,
    daysActive,
    totalWeightChange,
    weightToGoal,
    weeklyAvgCalories: avgCalories,
    weeklyAvgProtein: avgProtein,
  }
}

function groupMealsByDate(meals: Meal[]): DailyMealTotals[] {
  const byDate: Record<string, DailyMealTotals> = {}

  for (const meal of meals) {
    if (!byDate[meal.date]) {
      byDate[meal.date] = { date: meal.date, calories: 0, protein: 0 }
    }
    byDate[meal.date].calories += meal.calories || 0
    byDate[meal.date].protein += meal.protein || 0
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

function calculateStreak(
  dailyTotals: DailyMealTotals[],
  targetCalories: number,
  targetProtein: number,
  goal: 'lose' | 'gain' | 'maintain'
): { currentStreak: number; bestStreak: number } {
  if (dailyTotals.length === 0) {
    return { currentStreak: 0, bestStreak: 0 }
  }

  // Check if a day meets calorie and protein goals
  // Protein: always within ±10% of target
  // Calories: depends on goal
  //   - lose: any deficit is good, up to 10% over is acceptable
  //   - gain: any surplus is good, up to 10% under is acceptable
  //   - maintain: within ±10%
  const isSuccessDay = (day: DailyMealTotals): boolean => {
    // Protein check: always ±10%
    const proteinLow = targetProtein * 0.9
    const proteinHigh = targetProtein * 1.1
    const proteinOk = day.protein >= proteinLow && day.protein <= proteinHigh

    if (!proteinOk) return false

    // Calorie check: depends on goal
    let caloriesOk = false
    if (goal === 'lose') {
      // Deficit is good: any amount under, up to 10% over
      caloriesOk = day.calories <= targetCalories * 1.1
    } else if (goal === 'gain') {
      // Surplus is good: any amount over, up to 10% under
      caloriesOk = day.calories >= targetCalories * 0.9
    } else {
      // Maintain: within ±10%
      caloriesOk = day.calories >= targetCalories * 0.9 && day.calories <= targetCalories * 1.1
    }

    return caloriesOk
  }

  // Calculate best streak (any consecutive run)
  let bestStreak = 0
  let currentRun = 0

  for (const day of dailyTotals) {
    if (isSuccessDay(day)) {
      currentRun++
      bestStreak = Math.max(bestStreak, currentRun)
    } else {
      currentRun = 0
    }
  }

  // Calculate current streak (must include today or yesterday)
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let currentStreak = 0

  // Work backwards from the most recent day
  const sortedDesc = [...dailyTotals].sort((a, b) => b.date.localeCompare(a.date))

  for (const day of sortedDesc) {
    // Only count if streak includes today or yesterday (recent activity)
    if (currentStreak === 0 && day.date !== today && day.date !== yesterday) {
      break
    }

    if (isSuccessDay(day)) {
      currentStreak++
    } else {
      break
    }
  }

  return { currentStreak, bestStreak }
}

function calculateDaysActive(startDate: string | null): number {
  if (!startDate) return 0

  const start = new Date(startDate)
  const today = new Date()
  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays + 1) // +1 to include the start day
}

function calculateWeeklyAverages(
  dailyTotals: DailyMealTotals[]
): { avgCalories: number | null; avgProtein: number | null } {
  // Get the last 7 days that have data
  const last7 = dailyTotals.slice(-7)

  if (last7.length === 0) {
    return { avgCalories: null, avgProtein: null }
  }

  const totalCalories = last7.reduce((sum, day) => sum + day.calories, 0)
  const totalProtein = last7.reduce((sum, day) => sum + day.protein, 0)

  return {
    avgCalories: Math.round(totalCalories / last7.length),
    avgProtein: Math.round(totalProtein / last7.length),
  }
}
