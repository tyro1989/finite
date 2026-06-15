// Simple, universal demarcations: early years (0–5), school years (5–18),
// and adult life (18 → life expectancy). The adult band's end is driven by
// the user's own life expectancy rather than fixed buckets.
export const LIFE_PHASES = [
  { name: 'Early years',  startAge: 0,  endAge: 5,   color: '#4a7fa5' },
  { name: 'School years', startAge: 5,  endAge: 18,  color: '#5a9a7a' },
  { name: 'Adult life',   startAge: 18, endAge: 200, color: '#c9a84c' },
]

export function getLifePhase(ageInYears) {
  return LIFE_PHASES.find(p => ageInYears >= p.startAge && ageInYears < p.endAge) || LIFE_PHASES[LIFE_PHASES.length - 1]
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

// Start of the real calendar week (Sunday) containing `date`.
export function getCalendarWeekStart(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // getDay(): 0 = Sunday
  return d
}

// The Sunday→Saturday calendar week that the user's current life-week falls in.
export function getCurrentCalendarWeek(now = new Date()) {
  const start = getCalendarWeekStart(now)
  const end = new Date(start)
  end.setDate(end.getDate() + 6) // Saturday
  return { start, end }
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

export function getLifeSeasons(birthday, lifeExpectancy) {
  const currentAge = getCurrentAge(birthday)
  const yearsLeft = Math.max(0, lifeExpectancy - currentAge)
  return {
    summers: Math.round(yearsLeft),
    sundayDinners: Math.round(yearsLeft * 52),
    christmases: Math.round(yearsLeft),
    birthdays: Math.round(yearsLeft),
    newYears: Math.round(yearsLeft),
    fullMoons: Math.round(yearsLeft * 12),
    springDays: Math.round(yearsLeft * 90),
  }
}

export function getBirthdaysWithPerson(personAge, personLE = 82) {
  return Math.max(0, Math.round(personLE - personAge))
}

const PERSPECTIVES = [
  (b, le) => {
    const age = getCurrentAge(b)
    const mondays = Math.round((le - age) * 52)
    return `This is one of your ${mondays.toLocaleString()} remaining Mondays. Start it like it matters.`
  },
  (b, le) => {
    const seasons = getLifeSeasons(b, le)
    return `You have ${seasons.summers} summers left. What will this one mean?`
  },
  (b, le) => {
    const seasons = getLifeSeasons(b, le)
    return `${seasons.sundayDinners.toLocaleString()} Sunday dinners remain. Who will you share them with?`
  },
  (b, le) => {
    const seasons = getLifeSeasons(b, le)
    return `Only ${seasons.christmases} more holiday seasons. Make this one count.`
  },
  (b, le) => {
    const age = getCurrentAge(b)
    const sunsets = Math.round((le - age) * 365)
    return `Roughly ${sunsets.toLocaleString()} sunsets left. How many will you actually watch?`
  },
  (b, le) => {
    const age = getCurrentAge(b)
    const mornings = Math.round((le - age) * 365)
    return `${mornings.toLocaleString()} mornings remain. Each one is a fresh start you'll never get back.`
  },
  (b, le) => {
    const seasons = getLifeSeasons(b, le)
    return `${seasons.fullMoons} full moons left in your lifetime. The next one is soon.`
  },
]

export function getWeeklyPerspective(birthday, lifeExpectancy, weekIndex) {
  const idx = weekIndex % PERSPECTIVES.length
  return PERSPECTIVES[idx](birthday, lifeExpectancy)
}
