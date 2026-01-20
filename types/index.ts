export interface Profile {
  id: string
  user_id: string
  created_at: string
  name: string | null
  height_inches: number | null
  start_weight: number | null
  goal_weight: number | null
  start_bf: number | null
  goal_bf: number | null
  daily_calories: number | null
  daily_protein: number | null
  daily_carbs: number | null
  daily_fat: number | null
  start_date: string | null
  coaching_notes: string | null
}

export interface Meal {
  id: string
  created_at: string
  profile_id: string
  date: string
  name: string
  time_of_day: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  tags: string[] | null
}

export interface Workout {
  id: string
  created_at: string
  profile_id: string
  date: string
  type: 'cardio' | 'strength' | null
  exercise: string | null
  duration_minutes: number | null
  rpe: number | null
  sets: number | null
  reps: number | null
  notes: string | null
  calories_burned: number | null
}

export interface WeighIn {
  id: string
  created_at: string
  profile_id: string
  date: string
  weight: number
  body_fat: number | null
}

export interface ChatMessage {
  id: string
  profile_id: string
  created_at: string
  role: 'user' | 'assistant'
  content: string
}

export interface UserInsight {
  id: string
  profile_id: string
  created_at: string
  updated_at: string
  last_referenced: string | null
  category: 'pattern' | 'preference' | 'constraint' | 'goal_context'
  insight: string
  active: boolean
}

export interface DailyTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface DailyLog {
  date: string
  meals: Meal[]
  workouts: Workout[]
  weigh_in: WeighIn | null
  totals: DailyTotals
}

export interface HeroStats {
  currentStreak: number
  bestStreak: number
  daysActive: number
  totalWeightChange: number | null
  weightToGoal: number | null
  weeklyAvgCalories: number | null
  weeklyAvgProtein: number | null
}
