interface GreetingContext {
  name: string
  streak: number
  calories: number
  targetCalories: number
  protein: number
  targetProtein: number
}

export function getContextualGreeting(context: GreetingContext): string {
  const { name, streak, calories, targetCalories, protein, targetProtein } = context

  const hour = new Date().getHours()
  const timeOfDay =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night'

  const caloriesRemaining = targetCalories - calories
  const proteinRemaining = targetProtein - protein
  const hitCalories = calories >= targetCalories
  const hitProtein = protein >= targetProtein
  const hitBoth = hitCalories && hitProtein

  // Perfect day already
  if (hitBoth) {
    if (streak > 1) {
      return `${streak} days in a row, ${name}! You've already hit your targets today. Anything else to log?`
    }
    return `You crushed it today, ${name}! All targets hit. Anything else to log?`
  }

  // Morning greetings (5am - 12pm)
  if (timeOfDay === 'morning') {
    if (streak > 0) {
      return `Good morning ${name}! You're on a ${streak}-day streak. What's for breakfast?`
    }
    if (calories === 0) {
      return `Good morning ${name}! Let's start the day strong. What's for breakfast?`
    }
    return `Morning ${name}! You've logged ${calories} cal so far. What else have you had?`
  }

  // Afternoon greetings (12pm - 5pm)
  if (timeOfDay === 'afternoon') {
    if (proteinRemaining > 50) {
      return `Hey ${name}! You've got ${proteinRemaining}g protein to go. What did you have for lunch?`
    }
    if (caloriesRemaining < 0) {
      return `Hey ${name}! You're ${Math.abs(caloriesRemaining)} cal over target. Not a big deal - just something to keep in mind for dinner.`
    }
    return `Afternoon ${name}! Solid progress - ${protein}g protein so far. What's next?`
  }

  // Evening greetings (5pm - 10pm)
  if (timeOfDay === 'evening') {
    if (proteinRemaining > 0 && proteinRemaining <= 40) {
      return `Almost there ${name}! Just ${proteinRemaining}g protein away from hitting your target. A Greek yogurt or protein shake would do it!`
    }
    if (proteinRemaining > 40) {
      return `Evening ${name}! You need ${proteinRemaining}g more protein. What's for dinner?`
    }
    if (!hitCalories && caloriesRemaining > 0) {
      return `Hey ${name}! You've hit protein but have ${caloriesRemaining} cal left. Room for a good dinner!`
    }
    return `Hey ${name}! How's the evening going?`
  }

  // Night (10pm - 5am)
  if (calories === 0) {
    return `Hey ${name}! Logging yesterday's meals, or a late night snack?`
  }
  return `Late night, ${name}? Let me know what you had.`
}
