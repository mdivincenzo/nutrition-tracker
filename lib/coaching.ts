export interface CoachingContext {
  // Yesterday's data
  yesterdayCalories: number
  yesterdayTargetCalories: number
  yesterdayProtein: number
  yesterdayTargetProtein: number

  // Workout history
  daysSinceLastWorkout: number
  lastWorkoutType?: string

  // Patterns (from recent history)
  averageProteinDeficit: number // How much they typically miss by
  streak: number
}

export function generateCoachingInsights(ctx: CoachingContext): string[] {
  const insights: string[] = []

  // Calorie insight based on yesterday
  const yesterdayCalorieDiff = ctx.yesterdayCalories - ctx.yesterdayTargetCalories
  if (yesterdayCalorieDiff > 200) {
    insights.push(
      `You were ${Math.round(yesterdayCalorieDiff)} cal over yesterday—a lighter breakfast could help balance things out.`
    )
  } else if (yesterdayCalorieDiff < -300) {
    insights.push(`You were under target yesterday. Don't skip meals today.`)
  }

  // Workout insight
  if (ctx.daysSinceLastWorkout >= 3 && ctx.daysSinceLastWorkout < 999) {
    insights.push(
      `You haven't lifted in ${ctx.daysSinceLastWorkout} days—good day for a workout if you're feeling it.`
    )
  } else if (ctx.daysSinceLastWorkout === 1 && ctx.lastWorkoutType === 'upper') {
    insights.push(`Lower body day? You did upper yesterday.`)
  } else if (ctx.daysSinceLastWorkout === 1 && ctx.lastWorkoutType === 'lower') {
    insights.push(`Upper body day? You did lower yesterday.`)
  }

  // Protein insight
  if (ctx.averageProteinDeficit > 20) {
    insights.push(
      `You've been averaging ${Math.round(ctx.averageProteinDeficit)}g under on protein. Try front-loading it at breakfast.`
    )
  }

  // Streak motivation
  if (ctx.streak >= 3) {
    insights.push(`${ctx.streak} days strong. Keep the momentum going.`)
  }

  // Default if no specific insights
  if (insights.length === 0) {
    insights.push(`Focus on hitting your protein early—it's easier than catching up at dinner.`)
  }

  // Return max 3 insights to keep it scannable
  return insights.slice(0, 3)
}
