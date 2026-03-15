export const LIFE_PHASES = [
  { name: 'Childhood',     startAge: 0,  endAge: 12, color: '#4a7fa5' },
  { name: 'Adolescence',   startAge: 13, endAge: 17, color: '#7a5fa5' },
  { name: 'Young Adult',   startAge: 18, endAge: 25, color: '#5a9a7a' },
  { name: 'Building',      startAge: 26, endAge: 40, color: '#c9a84c' },
  { name: 'Prime',         startAge: 41, endAge: 60, color: '#c97a4c' },
  { name: 'Wisdom',        startAge: 61, endAge: 75, color: '#7a9a5a' },
  { name: 'Final Chapter', startAge: 76, endAge: 120, color: '#a57a5a' },
]

export function getLifePhase(ageInYears) {
  return LIFE_PHASES.find(p => ageInYears >= p.startAge && ageInYears <= p.endAge) || LIFE_PHASES[LIFE_PHASES.length - 1]
}

export function getWeeksLived(birthday) {
  if (!birthday) return 0
  const ms = new Date() - new Date(birthday)
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)))
}

export function getAgeAtWeek(birthday, weekIndex) {
  const birth = new Date(birthday)
  const weekDate = new Date(birth.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000)
  return (weekDate - birth) / (365.25 * 24 * 60 * 60 * 1000)
}

export function getDateAtWeek(birthday, weekIndex) {
  const birth = new Date(birthday)
  return new Date(birth.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000)
}

export function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getCurrentAge(birthday) {
  if (!birthday) return 0
  return (new Date() - new Date(birthday)) / (365.25 * 24 * 60 * 60 * 1000)
}

export function getSecondsSinceBirth(birthday) {
  if (!birthday) return 0
  return Math.floor((new Date() - new Date(birthday)) / 1000)
}

export function formatNumber(n) {
  return Math.round(n).toLocaleString('en-US')
}

export function getRealityBreakdown(birthday, lifeExpectancy) {
  const weeksLived = getWeeksLived(birthday)
  const totalWeeks = lifeExpectancy * 52
  const remaining = Math.max(0, totalWeeks - weeksLived)
  const currentAge = getCurrentAge(birthday)
  const retirementAge = 65

  // Sleep: ~33% of all time (8hrs/day)
  const sleepWeeks = Math.round(remaining * 0.33)

  // Work: 40hrs/week out of ~112 waking hours ≈ 36% of waking time ≈ 24% of total time, until retirement
  const yearsToRetirement = Math.max(0, retirementAge - currentAge)
  const workWeeks = Math.min(remaining, Math.round(yearsToRetirement * 52 * 0.24))

  // Chores, errands, hygiene, commute: ~15%
  const maintenanceWeeks = Math.round(remaining * 0.15)

  // Eating & cooking: ~5%
  const eatingWeeks = Math.round(remaining * 0.05)

  const consumed = sleepWeeks + workWeeks + maintenanceWeeks + eatingWeeks
  const freeWeeks = Math.max(0, remaining - consumed)

  return {
    remaining,
    sleepWeeks,
    workWeeks,
    maintenanceWeeks,
    eatingWeeks,
    freeWeeks,
    freePercent: remaining > 0 ? (freeWeeks / remaining * 100).toFixed(1) : '0',
  }
}

export function getFreeWeeksToGoal(birthday, lifeExpectancy, targetAge) {
  const currentAge = getCurrentAge(birthday)
  const weeksLived = getWeeksLived(birthday)
  const totalWeeks = lifeExpectancy * 52
  const remaining = Math.max(0, totalWeeks - weeksLived)
  // Cap target age by life expectancy — showing weeks beyond lifespan is misleading
  const effectiveTargetAge = Math.min(targetAge, lifeExpectancy)
  const weeksToGoal = Math.max(0, (effectiveTargetAge - currentAge) * 52)
  const windowWeeks = Math.min(weeksToGoal, remaining)
  // 25% free time estimate
  return {
    weeksToGoal: Math.round(weeksToGoal),
    freeWeeks: Math.round(windowWeeks * 0.25),
  }
}

export function getRemainingVisits(personAge, visitsPerYear, personLE = 82) {
  const yearsLeft = Math.max(0, personLE - personAge)
  return Math.round(yearsLeft * visitsPerYear)
}
