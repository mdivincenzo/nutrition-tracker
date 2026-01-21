/**
 * Get a date string in YYYY-MM-DD format using LOCAL timezone
 * This is critical - toISOString() uses UTC which can be a different day!
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's date at midnight local time
 */
export function getToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

/**
 * Check if a date is today (local time)
 */
export function isToday(date: Date): boolean {
  const today = getToday()
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return today.getTime() === compareDate.getTime()
}

/**
 * Parse a YYYY-MM-DD string as local date (not UTC)
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed
}
