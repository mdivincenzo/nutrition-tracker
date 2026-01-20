import { SupabaseClient } from '@supabase/supabase-js'
import { Profile, Meal, Workout, WeighIn, UserInsight, ChatMessage } from '@/types'

interface ContextData {
  profile: Profile
  todaysMeals: Meal[]
  todaysWorkouts: Workout[]
  todaysWeighIn: WeighIn | null
  todaysTotals: { calories: number; protein: number; carbs: number; fat: number }
  weekTotals: { calories: number; protein: number; carbs: number; fat: number; days: number }
  recentMessages: ChatMessage[]
  activeInsights: UserInsight[]
}

export async function buildContext(
  profileId: string,
  supabase: SupabaseClient
): Promise<ContextData> {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Fetch all data in parallel
  const [
    profileResult,
    todaysMealsResult,
    todaysWorkoutsResult,
    todaysWeighInResult,
    weekMealsResult,
    messagesResult,
    insightsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', profileId).single(),
    supabase.from('meals').select('*').eq('profile_id', profileId).eq('date', today).order('created_at'),
    supabase.from('workouts').select('*').eq('profile_id', profileId).eq('date', today),
    supabase.from('weigh_ins').select('*').eq('profile_id', profileId).eq('date', today).single(),
    supabase.from('meals').select('date, calories, protein, carbs, fat').eq('profile_id', profileId).gte('date', weekAgo),
    supabase.from('chat_history').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
    supabase.from('user_insights').select('*').eq('profile_id', profileId).eq('active', true).order('updated_at', { ascending: false }).limit(20),
  ])

  const profile = profileResult.data as Profile
  const todaysMeals = (todaysMealsResult.data || []) as Meal[]
  const todaysWorkouts = (todaysWorkoutsResult.data || []) as Workout[]
  const todaysWeighIn = todaysWeighInResult.data as WeighIn | null
  const weekMeals = (weekMealsResult.data || []) as Meal[]
  const recentMessages = ((messagesResult.data || []) as ChatMessage[]).reverse()
  const activeInsights = (insightsResult.data || []) as UserInsight[]

  // Calculate today's totals
  const todaysTotals = todaysMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Calculate week totals (by day, then sum)
  const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {}
  for (const meal of weekMeals) {
    if (!dailyTotals[meal.date]) {
      dailyTotals[meal.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }
    dailyTotals[meal.date].calories += meal.calories || 0
    dailyTotals[meal.date].protein += meal.protein || 0
    dailyTotals[meal.date].carbs += meal.carbs || 0
    dailyTotals[meal.date].fat += meal.fat || 0
  }

  const days = Object.keys(dailyTotals).length
  const weekTotals = {
    calories: Object.values(dailyTotals).reduce((s, d) => s + d.calories, 0),
    protein: Object.values(dailyTotals).reduce((s, d) => s + d.protein, 0),
    carbs: Object.values(dailyTotals).reduce((s, d) => s + d.carbs, 0),
    fat: Object.values(dailyTotals).reduce((s, d) => s + d.fat, 0),
    days,
  }

  return {
    profile,
    todaysMeals,
    todaysWorkouts,
    todaysWeighIn,
    todaysTotals,
    weekTotals,
    recentMessages,
    activeInsights,
  }
}

export function buildSystemPrompt(context: ContextData): string {
  const { profile, todaysMeals, todaysWorkouts, todaysWeighIn, todaysTotals, weekTotals, activeInsights } = context
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  let prompt = `You are a friendly, knowledgeable nutrition and fitness coach helping ${profile.name} achieve their health goals. Today is ${today}.

## User Profile
- Name: ${profile.name}
- Height: ${profile.height_inches ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"` : 'Not set'}
- Starting weight: ${profile.start_weight || 'Not set'} lbs
- Goal weight: ${profile.goal_weight || 'Not set'} lbs
- Starting body fat: ${profile.start_bf ? `${profile.start_bf}%` : 'Not set'}
- Goal body fat: ${profile.goal_bf ? `${profile.goal_bf}%` : 'Not set'}

## Daily Targets
- Calories: ${profile.daily_calories || 2000} kcal
- Protein: ${profile.daily_protein || 150}g
- Carbs: ${profile.daily_carbs || 200}g
- Fat: ${profile.daily_fat || 65}g

${profile.coaching_notes ? `## Coaching Notes (from user)\n${profile.coaching_notes}\n` : ''}

## Today's Progress
Calories: ${todaysTotals.calories}/${profile.daily_calories || 2000} kcal (${Math.round((todaysTotals.calories / (profile.daily_calories || 2000)) * 100)}%)
Protein: ${Math.round(todaysTotals.protein)}/${profile.daily_protein || 150}g
Carbs: ${Math.round(todaysTotals.carbs)}/${profile.daily_carbs || 200}g
Fat: ${Math.round(todaysTotals.fat)}/${profile.daily_fat || 65}g

${todaysMeals.length > 0 ? `### Today's Meals
${todaysMeals.map(m => `- ${m.name} (${m.time_of_day || 'meal'}): ${m.calories} kcal, P:${m.protein}g C:${m.carbs}g F:${m.fat}g [ID: ${m.id}]`).join('\n')}` : 'No meals logged today yet.'}

${todaysWorkouts.length > 0 ? `### Today's Workouts
${todaysWorkouts.map(w => `- ${w.exercise}${w.type ? ` (${w.type})` : ''}${w.duration_minutes ? `: ${w.duration_minutes} min` : ''}${w.sets && w.reps ? `: ${w.sets}x${w.reps}` : ''}`).join('\n')}` : ''}

${todaysWeighIn ? `### Today's Weigh-in: ${todaysWeighIn.weight} lbs${todaysWeighIn.body_fat ? ` (${todaysWeighIn.body_fat}% BF)` : ''}` : ''}

## This Week (Last 7 Days)
${weekTotals.days > 0 ? `- Days tracked: ${weekTotals.days}
- Average daily calories: ${Math.round(weekTotals.calories / weekTotals.days)}
- Average daily protein: ${Math.round(weekTotals.protein / weekTotals.days)}g` : 'No data from the past week.'}

${activeInsights.length > 0 ? `## What I Remember About ${profile.name}
${activeInsights.map(i => `- [${i.category}] ${i.insight} [ID: ${i.id}]`).join('\n')}` : ''}

## Guidelines
- When the user mentions food they ate, use log_meal to record it. Estimate macros if not provided.
- When they mention exercise, use log_workout to record it.
- When they mention their weight, use log_weight to record it.
- Provide brief, encouraging feedback after logging.
- Offer coaching tips when relevant (e.g., if protein is low, suggest high-protein foods).
- For queries about past data, use the appropriate query tools.
- Add insights sparingly - only for patterns observed over 3+ days or stated long-term preferences.
- If at 20 active insights and need to add one, deactivate a less relevant one first.
- Keep responses concise and conversational.
- When estimating calories/macros, be reasonable and explain your estimation briefly.

## Nutrition Reference (for estimation)
- Protein powder: ~10g protein per scoop (Orgain, most plant-based), ~25g protein per scoop (whey). Scale accordingly for multiple scoops.
- Most protein shakes with 3 scoops: 25-30g protein total for plant-based, 60-75g for whey.
- When user specifies scoops/servings, multiply per-scoop values rather than estimating the total.`

  return prompt
}
