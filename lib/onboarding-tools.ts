import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'

export interface OnboardingProfile {
  name: string | null
  age: number | null
  sex: 'male' | 'female' | null
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
  // For adjustment tracking
  tdee: number | null
  bmr: number | null
}

export const onboardingToolDefinitions: Anthropic.Tool[] = [
  {
    name: 'update_profile_field',
    description: 'Update a single field in the user\'s profile. Use this to save information as the user shares it.',
    input_schema: {
      type: 'object' as const,
      properties: {
        field: {
          type: 'string',
          enum: ['name', 'age', 'height_feet', 'height_inches', 'start_weight', 'goal_weight', 'activity_level', 'goal', 'dietary_restrictions'],
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
    name: 'update_stats',
    description: 'Update age, sex, height, and weight all at once. Use this when the user provides their stats together (e.g., "33, male, 5\'10, 184 lbs").',
    input_schema: {
      type: 'object' as const,
      properties: {
        age: {
          type: 'number',
          description: 'Age in years',
        },
        sex: {
          type: 'string',
          enum: ['male', 'female'],
          description: 'Biological sex (male or female)',
        },
        height_feet: {
          type: 'number',
          description: 'Height feet component (e.g., 5 for 5\'10")',
        },
        height_inches: {
          type: 'number',
          description: 'Height inches component (e.g., 10 for 5\'10")',
        },
        weight: {
          type: 'number',
          description: 'Weight in pounds',
        },
      },
      required: ['age', 'sex', 'height_feet', 'height_inches', 'weight'],
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
        tdee: {
          type: 'number',
          description: 'Total Daily Energy Expenditure (for adjustment calculations)',
        },
        bmr: {
          type: 'number',
          description: 'Basal Metabolic Rate (minimum safe calories)',
        },
      },
      required: ['daily_calories', 'daily_protein', 'daily_carbs', 'daily_fat'],
    },
  },
  {
    name: 'adjust_plan',
    description: 'Adjust the current plan to be more aggressive or more conservative. Use this when the user clicks the adjustment buttons.',
    input_schema: {
      type: 'object' as const,
      properties: {
        direction: {
          type: 'string',
          enum: ['more_aggressive', 'more_conservative'],
          description: 'Whether to make the plan more aggressive (lower calories for cut, higher for bulk) or more conservative',
        },
        current_calories: {
          type: 'number',
          description: 'Current calorie target',
        },
        tdee: {
          type: 'number',
          description: 'Total Daily Energy Expenditure',
        },
        bmr: {
          type: 'number',
          description: 'Basal Metabolic Rate (minimum safe calories)',
        },
        goal: {
          type: 'string',
          enum: ['lose', 'maintain', 'gain'],
          description: 'User\'s goal',
        },
        weight_lbs: {
          type: 'number',
          description: 'User\'s weight in pounds (for protein calculation)',
        },
      },
      required: ['direction', 'current_calories', 'tdee', 'bmr', 'goal', 'weight_lbs'],
    },
  },
]

// Minimum safe calories (using male default as it's safer than female 1200)
const MINIMUM_CALORIES = 1500

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
): { tdee: number; bmr: number } {
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
  return {
    tdee: Math.round(bmr * activityMultipliers[activityLevel]),
    bmr: Math.round(bmr),
  }
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

  // Enforce absolute minimum floor
  if (calories < MINIMUM_CALORIES) {
    calories = MINIMUM_CALORIES
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

export function adjustPlan(
  direction: 'more_aggressive' | 'more_conservative',
  currentCalories: number,
  tdee: number,
  bmr: number,
  goal: 'lose' | 'maintain' | 'gain',
  weightLbs: number
): { calories: number; protein: number; carbs: number; fat: number; atLimit: boolean; warning?: string } {
  const ADJUSTMENT_STEP = 200
  let newCalories: number
  let atLimit = false
  let warning: string | undefined

  if (goal === 'lose') {
    // For weight loss: aggressive = lower calories, conservative = higher calories
    if (direction === 'more_aggressive') {
      newCalories = currentCalories - ADJUSTMENT_STEP
      // Safety check: never below BMR
      if (newCalories <= bmr) {
        newCalories = bmr
        atLimit = true
        warning = 'This is the most aggressive safe option. Going lower could slow your metabolism.'
      }
      // Max deficit of 1000 calories
      if (tdee - newCalories >= 1000) {
        newCalories = tdee - 1000
        atLimit = true
        warning = 'This is the most aggressive safe option (~1000 calorie deficit).'
      }
      // Absolute minimum floor
      if (newCalories < MINIMUM_CALORIES) {
        newCalories = MINIMUM_CALORIES
        atLimit = true
        warning = `${MINIMUM_CALORIES} calories is the minimum safe recommendation. Consult a healthcare provider before going lower.`
      }
    } else {
      newCalories = currentCalories + ADJUSTMENT_STEP
      // Don't go above TDEE for weight loss
      if (newCalories >= tdee) {
        newCalories = tdee
        atLimit = true
        warning = 'This is maintenance level. Any higher and you won\'t lose weight.'
      }
    }
  } else if (goal === 'gain') {
    // For muscle gain: aggressive = higher calories, conservative = lower calories
    if (direction === 'more_aggressive') {
      newCalories = currentCalories + ADJUSTMENT_STEP
      // Max surplus of 500 calories for lean bulk
      if (newCalories - tdee >= 500) {
        newCalories = tdee + 500
        atLimit = true
        warning = 'This is the maximum recommended surplus for lean muscle gain.'
      }
    } else {
      newCalories = currentCalories - ADJUSTMENT_STEP
      // Don't go below TDEE for gaining
      if (newCalories <= tdee) {
        newCalories = tdee
        atLimit = true
        warning = 'This is maintenance level. You need a surplus to build muscle efficiently.'
      }
    }
  } else {
    // Maintain - small adjustments around TDEE
    if (direction === 'more_aggressive') {
      newCalories = currentCalories - ADJUSTMENT_STEP
      if (newCalories < tdee - 300) {
        newCalories = tdee - 300
        atLimit = true
      }
    } else {
      newCalories = currentCalories + ADJUSTMENT_STEP
      if (newCalories > tdee + 300) {
        newCalories = tdee + 300
        atLimit = true
      }
    }
  }

  // Calculate macros for new calorie target
  // Higher protein for more aggressive deficit/surplus
  const deficit = tdee - newCalories
  const surplus = newCalories - tdee
  let proteinMultiplier: number

  if (goal === 'lose') {
    // Higher protein during cut to preserve muscle
    proteinMultiplier = deficit > 500 ? 1.1 : deficit > 300 ? 1.0 : 0.9
  } else if (goal === 'gain') {
    proteinMultiplier = surplus > 300 ? 1.0 : 0.85
  } else {
    proteinMultiplier = 0.8
  }

  const protein = Math.round(weightLbs * proteinMultiplier)
  const proteinCalories = protein * 4

  // Fat: 25-30% of calories
  const fatCalories = newCalories * 0.27
  const fat = Math.round(fatCalories / 9)

  // Carbs: remaining
  const carbCalories = newCalories - proteinCalories - fatCalories
  const carbs = Math.round(carbCalories / 4)

  return { calories: newCalories, protein, carbs, fat, atLimit, warning }
}

export function calculateTimeline(
  currentWeight: number,
  goalWeight: number | null,
  dailyCalories: number,
  tdee: number
): { weeks: number; weeklyChange: number; targetDate: string } | null {
  // Can't calculate without goal weight
  if (goalWeight === null) return null

  // Calculate daily deficit/surplus
  const dailyDiff = tdee - dailyCalories

  // No meaningful change expected
  if (Math.abs(dailyDiff) < 50) return null

  // Weekly weight change: (daily deficit × 7) ÷ 3500 (3500 cal = 1 lb)
  const weeklyChange = (dailyDiff * 7) / 3500

  // Weight difference
  const weightDiff = currentWeight - goalWeight

  // Check if we're going in the right direction
  // Positive weightDiff means we need to lose weight (need positive weeklyChange/deficit)
  // Negative weightDiff means we need to gain weight (need negative weeklyChange/surplus)
  if ((weightDiff > 0 && weeklyChange <= 0) || (weightDiff < 0 && weeklyChange >= 0)) {
    return null
  }

  // Weeks to goal
  const weeks = Math.round(Math.abs(weightDiff) / Math.abs(weeklyChange))

  // Calculate target date
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + weeks * 7)
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: targetDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })

  return {
    weeks,
    weeklyChange: Math.round(Math.abs(weeklyChange) * 10) / 10,
    targetDate: formattedDate,
  }
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
        case 'age':
          updates.age = Number(value)
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

    case 'update_stats': {
      const age = input.age as number
      const sex = input.sex as 'male' | 'female'
      const heightFeet = input.height_feet as number
      const heightInches = input.height_inches as number
      const weight = input.weight as number

      setProfile({
        age,
        sex,
        height_feet: heightFeet,
        height_inches: heightInches,
        start_weight: weight,
      })

      return `Updated stats: age ${age}, sex ${sex}, height ${heightFeet}'${heightInches}", weight ${weight} lbs`
    }

    case 'calculate_recommendations': {
      const heightInches = input.height_inches as number
      const weightLbs = input.weight_lbs as number
      const age = (input.age as number) || 30 // Default age if not provided
      const sex = (input.sex as 'male' | 'female') || 'male' // Default if not provided
      const activityLevel = input.activity_level as keyof typeof activityMultipliers
      const goal = input.goal as 'lose' | 'maintain' | 'gain'

      const { tdee, bmr } = calculateTDEE(heightInches, weightLbs, age, sex, activityLevel)
      const macros = calculateMacros(tdee, goal, weightLbs)

      return JSON.stringify({
        tdee,
        bmr,
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
      if (input.tdee) updates.tdee = input.tdee as number
      if (input.bmr) updates.bmr = input.bmr as number

      setProfile(updates)
      return 'Recommendations saved to profile'
    }

    case 'adjust_plan': {
      const direction = input.direction as 'more_aggressive' | 'more_conservative'
      const currentCalories = input.current_calories as number
      const tdee = input.tdee as number
      const bmr = input.bmr as number
      const goal = input.goal as 'lose' | 'maintain' | 'gain'
      const weightLbs = input.weight_lbs as number

      const result = adjustPlan(direction, currentCalories, tdee, bmr, goal, weightLbs)

      // Update profile with new values
      setProfile({
        daily_calories: result.calories,
        daily_protein: result.protein,
        daily_carbs: result.carbs,
        daily_fat: result.fat,
      })

      return JSON.stringify({
        ...result,
        message: result.atLimit
          ? result.warning
          : `Adjusted to ${result.calories} calories (${direction === 'more_aggressive' ? 'more aggressive' : 'more conservative'})`,
      })
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
  const heightInches = profile.height_feet && profile.height_inches !== null
    ? profile.height_feet * 12 + profile.height_inches
    : null

  // Build coaching notes with all relevant info
  const noteParts = [
    profile.age ? `Age: ${profile.age}` : null,
    profile.activity_level ? `Activity level: ${profile.activity_level}` : null,
    profile.goal ? `Goal: ${profile.goal}` : null,
    profile.dietary_restrictions ? `Dietary restrictions: ${profile.dietary_restrictions}` : null,
  ].filter(Boolean)

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
      coaching_notes: noteParts.join('\n'),
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
