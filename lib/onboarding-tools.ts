import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'

export interface OnboardingProfile {
  name: string | null
  height_feet: number | null
  height_inches: number | null
  start_weight: number | null
  goal_weight: number | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
  goal: 'lose' | 'maintain' | 'gain' | null
  dietary_restrictions: string | null
  // Calculated recommendations
  daily_calories: number | null
  daily_protein: number | null
  daily_carbs: number | null
  daily_fat: number | null
}

export const onboardingToolDefinitions: Anthropic.Tool[] = [
  {
    name: 'update_profile_field',
    description: 'Update a field in the user\'s profile. Use this to save information as the user shares it.',
    input_schema: {
      type: 'object' as const,
      properties: {
        field: {
          type: 'string',
          enum: ['name', 'height_feet', 'height_inches', 'start_weight', 'goal_weight', 'activity_level', 'goal', 'dietary_restrictions'],
          description: 'The profile field to update',
        },
        value: {
          type: ['string', 'number'],
          description: 'The value to set for the field',
        },
      },
      required: ['field', 'value'],
    },
  },
  {
    name: 'calculate_recommendations',
    description: 'Calculate personalized daily nutrition targets based on the user\'s profile. Call this once you have their height, weight, activity level, and goal.',
    input_schema: {
      type: 'object' as const,
      properties: {
        height_inches: {
          type: 'number',
          description: 'Total height in inches',
        },
        weight_lbs: {
          type: 'number',
          description: 'Current weight in pounds',
        },
        age: {
          type: 'number',
          description: 'Age in years (estimate if not provided)',
        },
        sex: {
          type: 'string',
          enum: ['male', 'female'],
          description: 'Biological sex for TDEE calculation (estimate if not provided)',
        },
        activity_level: {
          type: 'string',
          enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
          description: 'Activity level',
        },
        goal: {
          type: 'string',
          enum: ['lose', 'maintain', 'gain'],
          description: 'Weight goal',
        },
      },
      required: ['height_inches', 'weight_lbs', 'activity_level', 'goal'],
    },
  },
  {
    name: 'set_recommendations',
    description: 'Set the calculated nutrition recommendations in the profile.',
    input_schema: {
      type: 'object' as const,
      properties: {
        daily_calories: {
          type: 'number',
          description: 'Daily calorie target',
        },
        daily_protein: {
          type: 'number',
          description: 'Daily protein target in grams',
        },
        daily_carbs: {
          type: 'number',
          description: 'Daily carbs target in grams',
        },
        daily_fat: {
          type: 'number',
          description: 'Daily fat target in grams',
        },
      },
      required: ['daily_calories', 'daily_protein', 'daily_carbs', 'daily_fat'],
    },
  },
]

// Activity multipliers for TDEE calculation
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function calculateTDEE(
  heightInches: number,
  weightLbs: number,
  age: number,
  sex: 'male' | 'female',
  activityLevel: keyof typeof activityMultipliers
): number {
  // Convert to metric
  const heightCm = heightInches * 2.54
  const weightKg = weightLbs / 2.205

  // Mifflin-St Jeor equation for BMR
  let bmr: number
  if (sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  }

  // Apply activity multiplier
  return Math.round(bmr * activityMultipliers[activityLevel])
}

export function calculateMacros(
  tdee: number,
  goal: 'lose' | 'maintain' | 'gain',
  weightLbs: number
): { calories: number; protein: number; carbs: number; fat: number } {
  // Adjust calories based on goal
  let calories: number
  if (goal === 'lose') {
    calories = tdee - 500 // ~1 lb/week loss
  } else if (goal === 'gain') {
    calories = tdee + 300 // lean bulk
  } else {
    calories = tdee
  }

  // Calculate macros
  // Protein: 0.8-1g per lb of body weight (higher end for losing/gaining)
  const proteinMultiplier = goal === 'maintain' ? 0.8 : 1.0
  const protein = Math.round(weightLbs * proteinMultiplier)

  // Fat: 25-30% of calories
  const fatCalories = calories * 0.28
  const fat = Math.round(fatCalories / 9)

  // Carbs: remaining calories
  const proteinCalories = protein * 4
  const carbCalories = calories - proteinCalories - fatCalories
  const carbs = Math.round(carbCalories / 4)

  return { calories, protein, carbs, fat }
}

export async function executeOnboardingTool(
  name: string,
  input: Record<string, unknown>,
  profile: OnboardingProfile,
  setProfile: (updates: Partial<OnboardingProfile>) => void
): Promise<string> {
  switch (name) {
    case 'update_profile_field': {
      const field = input.field as keyof OnboardingProfile
      const value = input.value

      // Validate and update the profile
      const updates: Partial<OnboardingProfile> = {}

      switch (field) {
        case 'name':
          updates.name = String(value)
          break
        case 'height_feet':
          updates.height_feet = Number(value)
          break
        case 'height_inches':
          updates.height_inches = Number(value)
          break
        case 'start_weight':
          updates.start_weight = Number(value)
          break
        case 'goal_weight':
          updates.goal_weight = Number(value)
          break
        case 'activity_level':
          updates.activity_level = value as OnboardingProfile['activity_level']
          break
        case 'goal':
          updates.goal = value as OnboardingProfile['goal']
          break
        case 'dietary_restrictions':
          updates.dietary_restrictions = String(value)
          break
      }

      setProfile(updates)
      return `Updated ${field} to ${value}`
    }

    case 'calculate_recommendations': {
      const heightInches = input.height_inches as number
      const weightLbs = input.weight_lbs as number
      const age = (input.age as number) || 30 // Default age if not provided
      const sex = (input.sex as 'male' | 'female') || 'male' // Default if not provided
      const activityLevel = input.activity_level as keyof typeof activityMultipliers
      const goal = input.goal as 'lose' | 'maintain' | 'gain'

      const tdee = calculateTDEE(heightInches, weightLbs, age, sex, activityLevel)
      const macros = calculateMacros(tdee, goal, weightLbs)

      return JSON.stringify({
        tdee,
        recommendations: macros,
        explanation: {
          tdee: `Your Total Daily Energy Expenditure is approximately ${tdee} calories`,
          calories: goal === 'lose'
            ? `${macros.calories} calories puts you in a ~500 calorie deficit for steady fat loss`
            : goal === 'gain'
              ? `${macros.calories} calories gives you a moderate surplus for lean muscle gain`
              : `${macros.calories} calories maintains your current weight`,
          protein: `${macros.protein}g protein (${Math.round(macros.protein / weightLbs * 100) / 100}g/lb) to support ${goal === 'maintain' ? 'muscle maintenance' : 'muscle preservation and recovery'}`,
          carbs: `${macros.carbs}g carbs for energy and workout performance`,
          fat: `${macros.fat}g fat for hormone function and satiety`,
        },
      })
    }

    case 'set_recommendations': {
      const updates: Partial<OnboardingProfile> = {
        daily_calories: input.daily_calories as number,
        daily_protein: input.daily_protein as number,
        daily_carbs: input.daily_carbs as number,
        daily_fat: input.daily_fat as number,
      }

      setProfile(updates)
      return 'Recommendations saved to profile'
    }

    default:
      return `Unknown tool: ${name}`
  }
}

export async function saveOnboardingProfile(
  profile: OnboardingProfile,
  userId: string,
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string; profileId?: string }> {
  // Convert height to total inches
  const heightInches = profile.height_feet && profile.height_inches
    ? profile.height_feet * 12 + profile.height_inches
    : null

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      name: profile.name,
      height_inches: heightInches,
      start_weight: profile.start_weight,
      goal_weight: profile.goal_weight,
      daily_calories: profile.daily_calories,
      daily_protein: profile.daily_protein,
      daily_carbs: profile.daily_carbs,
      daily_fat: profile.daily_fat,
      start_date: new Date().toISOString().split('T')[0],
      coaching_notes: profile.dietary_restrictions
        ? `Activity level: ${profile.activity_level}\nGoal: ${profile.goal}\nDietary restrictions: ${profile.dietary_restrictions}`
        : `Activity level: ${profile.activity_level}\nGoal: ${profile.goal}`,
    }, {
      onConflict: 'user_id',
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, profileId: data.id }
}
