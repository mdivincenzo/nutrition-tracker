import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'
import { getLocalDateString } from '@/lib/date-utils'

export const toolDefinitions: Anthropic.Tool[] = [
  // Logging Tools
  {
    name: 'log_meal',
    description: 'Log a meal that the user ate. Use this when they tell you about food they consumed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Name/description of the meal or food item',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to today if not specified.',
        },
        time_of_day: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'When the meal was eaten',
        },
        calories: {
          type: 'number',
          description: 'Estimated calories',
        },
        protein: {
          type: 'number',
          description: 'Grams of protein',
        },
        carbs: {
          type: 'number',
          description: 'Grams of carbohydrates',
        },
        fat: {
          type: 'number',
          description: 'Grams of fat',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags like "high-protein", "homemade", etc.',
        },
      },
      required: ['name', 'calories', 'protein', 'carbs', 'fat'],
    },
  },
  {
    name: 'log_workout',
    description: 'Log a workout or exercise session.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to today.',
        },
        type: {
          type: 'string',
          enum: ['cardio', 'strength'],
          description: 'Type of workout',
        },
        exercise: {
          type: 'string',
          description: 'Name of the exercise or workout',
        },
        duration_minutes: {
          type: 'number',
          description: 'Duration in minutes',
        },
        rpe: {
          type: 'number',
          description: 'Rate of perceived exertion (1-10)',
        },
        sets: {
          type: 'number',
          description: 'Number of sets (for strength training)',
        },
        reps: {
          type: 'number',
          description: 'Number of reps per set',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the workout',
        },
        calories_burned: {
          type: 'number',
          description: 'Estimated calories burned during the workout',
        },
      },
      required: ['exercise'],
    },
  },
  {
    name: 'log_weight',
    description: 'Log a weigh-in measurement.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to today.',
        },
        weight: {
          type: 'number',
          description: 'Weight in pounds',
        },
        body_fat: {
          type: 'number',
          description: 'Body fat percentage (optional)',
        },
      },
      required: ['weight'],
    },
  },
  {
    name: 'update_meal',
    description: 'Update an existing meal entry.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meal_id: {
          type: 'string',
          description: 'The ID of the meal to update',
        },
        name: { type: 'string' },
        calories: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fat: { type: 'number' },
        time_of_day: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        },
      },
      required: ['meal_id'],
    },
  },
  {
    name: 'delete_meal',
    description: 'Delete a meal entry.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meal_id: {
          type: 'string',
          description: 'The ID of the meal to delete',
        },
      },
      required: ['meal_id'],
    },
  },
  // Query Tools
  {
    name: 'get_daily_log',
    description: 'Get all meals, workouts, and weigh-in for a specific date.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'get_date_range_summary',
    description: 'Get aggregated stats for a date range (averages, totals).',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_weight_trend',
    description: 'Get weight measurements for a date range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'search_meals',
    description: 'Search for meals by name or tags.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for meal names',
        },
        start_date: {
          type: 'string',
          description: 'Optional start date filter',
        },
        end_date: {
          type: 'string',
          description: 'Optional end date filter',
        },
      },
      required: ['query'],
    },
  },
  // Memory Tools
  {
    name: 'add_insight',
    description: 'Add a new insight about the user to remember for future conversations. Use sparingly for important patterns, preferences, or constraints.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['pattern', 'preference', 'constraint', 'goal_context'],
          description: 'Category of the insight',
        },
        insight: {
          type: 'string',
          description: 'The insight to remember',
        },
      },
      required: ['category', 'insight'],
    },
  },
  {
    name: 'update_insight',
    description: 'Update or deactivate an existing insight.',
    input_schema: {
      type: 'object' as const,
      properties: {
        insight_id: {
          type: 'string',
          description: 'The ID of the insight to update',
        },
        insight: {
          type: 'string',
          description: 'New insight text (optional)',
        },
        active: {
          type: 'boolean',
          description: 'Whether the insight should be active',
        },
      },
      required: ['insight_id'],
    },
  },
]

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  profileId: string,
  supabase: SupabaseClient
): Promise<string> {
  const today = getLocalDateString()

  switch (name) {
    case 'log_meal': {
      const { data, error } = await supabase
        .from('meals')
        .insert({
          profile_id: profileId,
          date: (input.date as string) || today,
          name: input.name,
          time_of_day: input.time_of_day,
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          tags: input.tags,
        })
        .select()
        .single()

      if (error) return `Error logging meal: ${error.message}`
      return `Meal logged: ${input.name} (${input.calories} kcal, P:${input.protein}g C:${input.carbs}g F:${input.fat}g)`
    }

    case 'log_workout': {
      const { error } = await supabase.from('workouts').insert({
        profile_id: profileId,
        date: (input.date as string) || today,
        type: input.type,
        exercise: input.exercise,
        duration_minutes: input.duration_minutes,
        rpe: input.rpe,
        sets: input.sets,
        reps: input.reps,
        notes: input.notes,
        calories_burned: input.calories_burned,
      })

      if (error) return `Error logging workout: ${error.message}`
      const caloriesInfo = input.calories_burned ? ` (~${input.calories_burned} cal burned)` : ''
      return `Workout logged: ${input.exercise}${caloriesInfo}`
    }

    case 'log_weight': {
      const { error } = await supabase.from('weigh_ins').upsert(
        {
          profile_id: profileId,
          date: (input.date as string) || today,
          weight: input.weight,
          body_fat: input.body_fat,
        },
        { onConflict: 'profile_id,date' }
      )

      if (error) return `Error logging weight: ${error.message}`
      return `Weight logged: ${input.weight} lbs${input.body_fat ? ` (${input.body_fat}% body fat)` : ''}`
    }

    case 'update_meal': {
      const updates: Record<string, unknown> = {}
      if (input.name) updates.name = input.name
      if (input.calories) updates.calories = input.calories
      if (input.protein) updates.protein = input.protein
      if (input.carbs) updates.carbs = input.carbs
      if (input.fat) updates.fat = input.fat
      if (input.time_of_day) updates.time_of_day = input.time_of_day

      const { error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', input.meal_id)
        .eq('profile_id', profileId)

      if (error) return `Error updating meal: ${error.message}`
      return 'Meal updated successfully'
    }

    case 'delete_meal': {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', input.meal_id)
        .eq('profile_id', profileId)

      if (error) return `Error deleting meal: ${error.message}`
      return 'Meal deleted successfully'
    }

    case 'get_daily_log': {
      const date = input.date as string
      const [meals, workouts, weighIn] = await Promise.all([
        supabase
          .from('meals')
          .select('*')
          .eq('profile_id', profileId)
          .eq('date', date)
          .order('created_at'),
        supabase.from('workouts').select('*').eq('profile_id', profileId).eq('date', date),
        supabase.from('weigh_ins').select('*').eq('profile_id', profileId).eq('date', date).single(),
      ])

      const totals = (meals.data || []).reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories || 0),
          protein: acc.protein + (m.protein || 0),
          carbs: acc.carbs + (m.carbs || 0),
          fat: acc.fat + (m.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )

      return JSON.stringify({
        date,
        meals: meals.data || [],
        workouts: workouts.data || [],
        weigh_in: weighIn.data,
        totals,
      })
    }

    case 'get_date_range_summary': {
      const { data: meals } = await supabase
        .from('meals')
        .select('date, calories, protein, carbs, fat')
        .eq('profile_id', profileId)
        .gte('date', input.start_date)
        .lte('date', input.end_date)

      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('profile_id', profileId)
        .gte('date', input.start_date)
        .lte('date', input.end_date)

      const { data: weighIns } = await supabase
        .from('weigh_ins')
        .select('*')
        .eq('profile_id', profileId)
        .gte('date', input.start_date)
        .lte('date', input.end_date)
        .order('date')

      // Group meals by date and calculate daily totals
      const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {}
      for (const meal of meals || []) {
        if (!dailyTotals[meal.date]) {
          dailyTotals[meal.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
        }
        dailyTotals[meal.date].calories += meal.calories || 0
        dailyTotals[meal.date].protein += meal.protein || 0
        dailyTotals[meal.date].carbs += meal.carbs || 0
        dailyTotals[meal.date].fat += meal.fat || 0
      }

      const days = Object.keys(dailyTotals).length || 1
      const avgCalories = Object.values(dailyTotals).reduce((s, d) => s + d.calories, 0) / days
      const avgProtein = Object.values(dailyTotals).reduce((s, d) => s + d.protein, 0) / days

      const weightChange =
        weighIns && weighIns.length >= 2
          ? weighIns[weighIns.length - 1].weight - weighIns[0].weight
          : null

      return JSON.stringify({
        start_date: input.start_date,
        end_date: input.end_date,
        days_tracked: days,
        avg_daily_calories: Math.round(avgCalories),
        avg_daily_protein: Math.round(avgProtein),
        workout_count: workouts?.length || 0,
        weight_change: weightChange,
      })
    }

    case 'get_weight_trend': {
      const { data } = await supabase
        .from('weigh_ins')
        .select('*')
        .eq('profile_id', profileId)
        .gte('date', input.start_date)
        .lte('date', input.end_date)
        .order('date')

      return JSON.stringify(data || [])
    }

    case 'search_meals': {
      let query = supabase
        .from('meals')
        .select('*')
        .eq('profile_id', profileId)
        .ilike('name', `%${input.query}%`)

      if (input.start_date) query = query.gte('date', input.start_date)
      if (input.end_date) query = query.lte('date', input.end_date)

      const { data } = await query.order('date', { ascending: false }).limit(20)
      return JSON.stringify(data || [])
    }

    case 'add_insight': {
      // Check count of active insights
      const { count } = await supabase
        .from('user_insights')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('active', true)

      if (count && count >= 20) {
        return 'Cannot add insight: maximum of 20 active insights reached. Deactivate an existing insight first.'
      }

      const { error } = await supabase.from('user_insights').insert({
        profile_id: profileId,
        category: input.category,
        insight: input.insight,
      })

      if (error) return `Error adding insight: ${error.message}`
      return `Insight added: "${input.insight}"`
    }

    case 'update_insight': {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (input.insight) updates.insight = input.insight
      if (typeof input.active === 'boolean') updates.active = input.active

      const { error } = await supabase
        .from('user_insights')
        .update(updates)
        .eq('id', input.insight_id)
        .eq('profile_id', profileId)

      if (error) return `Error updating insight: ${error.message}`
      return 'Insight updated'
    }

    default:
      return `Unknown tool: ${name}`
  }
}
