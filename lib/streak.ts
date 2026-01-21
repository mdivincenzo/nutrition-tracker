import { SupabaseClient } from '@supabase/supabase-js'

interface Profile {
  id: string
  daily_calories: number | null
  daily_protein: number | null
}

export async function calculateStreak(
  supabase: SupabaseClient,
  profile: Profile
): Promise<number> {
  // Need targets to calculate streak
  if (!profile.daily_calories || !profile.daily_protein) {
    return 0
  }

  // Fetch last 60 days of meals (enough for any reasonable streak)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { data: meals, error } = await supabase
    .from('meals')
    .select('date, calories, protein')
    .eq('profile_id', profile.id)
    .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  if (error || !meals) return 0

  // Aggregate by date
  const dailyTotals = new Map<string, { calories: number; protein: number }>()

  for (const meal of meals) {
    const existing = dailyTotals.get(meal.date) || { calories: 0, protein: 0 }
    dailyTotals.set(meal.date, {
      calories: existing.calories + (meal.calories || 0),
      protein: existing.protein + (meal.protein || 0),
    })
  }

  // Check consecutive days starting from today, going backwards
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 60; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]

    const dayTotals = dailyTotals.get(dateStr)

    // If no data for this day
    if (!dayTotals) {
      // If it's today and no meals yet, skip to yesterday
      if (i === 0) continue
      // Otherwise, streak is broken
      break
    }

    // Check if targets were hit
    const hitTargets =
      dayTotals.calories >= profile.daily_calories &&
      dayTotals.protein >= profile.daily_protein

    if (hitTargets) {
      streak++
    } else {
      // If it's today and targets not hit yet, skip to yesterday
      if (i === 0) continue
      // Otherwise, streak is broken
      break
    }
  }

  return streak
}
