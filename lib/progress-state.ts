export type ProgressState =
  | 'victory' // Hit both targets
  | 'almost' // Close to hitting (≥80% both, or one hit + other ≥70%)
  | 'on-track' // Normal progress, show regular chat
  | 'struggling' // Evening + <40% on either
  | 'fresh-start' // Morning + little/no data

interface ProgressContext {
  calories: number
  targetCalories: number
  protein: number
  targetProtein: number
  hour: number // 0-23
}

export function getProgressState(ctx: ProgressContext): ProgressState {
  const calPct = ctx.calories / ctx.targetCalories
  const protPct = ctx.protein / ctx.targetProtein

  // Victory: both targets hit
  if (calPct >= 1 && protPct >= 1) {
    return 'victory'
  }

  // Almost there: ≥80% on both, OR one hit + other ≥70%
  if (
    (calPct >= 0.8 && protPct >= 0.8) ||
    (calPct >= 1 && protPct >= 0.7) ||
    (protPct >= 1 && calPct >= 0.7)
  ) {
    return 'almost'
  }

  // Fresh start: before noon and <20% logged
  if (ctx.hour < 12 && calPct < 0.2) {
    return 'fresh-start'
  }

  // Struggling: after 6pm and <40% on either
  if (ctx.hour >= 18 && (calPct < 0.4 || protPct < 0.4)) {
    return 'struggling'
  }

  // Default: on track, show normal chat
  return 'on-track'
}

// Pro tips - pick based on date so it's consistent for the day
export const proTips = [
  'Prep breakfast tonight to start strong tomorrow',
  'High-protein breakfast = easier target by dinner',
  "You're building a habit. One day at a time.",
  'Rest well - recovery is part of the process',
  'Consistency beats perfection. You showed up today.',
  "Tomorrow's a new opportunity to crush it",
]

export function getTodaysTip(): string {
  const tipIndex = new Date().getDate() % proTips.length
  return proTips[tipIndex]
}

// Quick win suggestions
export const proteinSuggestions = [
  { food: 'Greek yogurt', amount: '15g' },
  { food: 'Protein shake', amount: '25g' },
  { food: '3 eggs', amount: '18g' },
  { food: 'Cheese stick + almonds', amount: '12g' },
  { food: 'Cottage cheese cup', amount: '14g' },
]

export const calorieSuggestions = [
  { food: 'Handful of nuts', amount: '180 cal' },
  { food: 'Avocado toast', amount: '250 cal' },
  { food: 'Banana with peanut butter', amount: '200 cal' },
]
