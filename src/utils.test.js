import { describe, it, expect } from 'vitest'
import {
  getWeeksLived, getAgeAtWeek, getDateAtWeek, formatDate,
  getLifePhase, getCurrentAge, getSecondsSinceBirth,
  getRealityBreakdown, getFreeWeeksToGoal, getRemainingVisits,
  formatNumber, LIFE_PHASES,
} from './utils'

// test-setup.js sets system time to 2026-03-15T12:00:00Z globally
// BIRTHDAY_36 = '1990-03-15' (exactly 36 years old on test date)
const BD = '1990-03-15'

// ─── LIFE_PHASES ──────────────────────────────────────────────────────────────

describe('LIFE_PHASES', () => {
  it('has exactly 7 phases', () => expect(LIFE_PHASES).toHaveLength(7))
  it('first phase starts at age 0', () => expect(LIFE_PHASES[0].startAge).toBe(0))
  it('every phase has a name, color, startAge, endAge', () => {
    LIFE_PHASES.forEach(p => {
      expect(p).toHaveProperty('name')
      expect(p).toHaveProperty('color')
      expect(p).toHaveProperty('startAge')
      expect(p).toHaveProperty('endAge')
    })
  })
})

// ─── getLifePhase ─────────────────────────────────────────────────────────────

describe('getLifePhase', () => {
  it.each([
    [0,   'Childhood'],
    [5,   'Childhood'],
    [12,  'Childhood'],
    [13,  'Adolescence'],
    [17,  'Adolescence'],
    [18,  'Young Adult'],
    [25,  'Young Adult'],
    [26,  'Building'],
    [40,  'Building'],
    [41,  'Prime'],
    [60,  'Prime'],
    [61,  'Wisdom'],
    [75,  'Wisdom'],
    [76,  'Final Chapter'],
    [90,  'Final Chapter'],
    [200, 'Final Chapter'], // beyond range falls to last
  ])('age %i → %s', (age, name) => {
    expect(getLifePhase(age).name).toBe(name)
  })

  it('returns an object with a color', () => {
    const phase = getLifePhase(30)
    expect(phase.color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

// ─── getWeeksLived ────────────────────────────────────────────────────────────

describe('getWeeksLived', () => {
  it('returns 0 for a future birthday', () => {
    expect(getWeeksLived('2030-01-01')).toBe(0)
  })

  it('returns 0 for an empty string', () => {
    expect(getWeeksLived('')).toBe(0)
  })

  it('returns ~1878 weeks for 36-year-old (born on same calendar date)', () => {
    // 36 * 365.25 / 7 ≈ 1878.5
    const weeks = getWeeksLived(BD)
    expect(weeks).toBeGreaterThanOrEqual(1877)
    expect(weeks).toBeLessThanOrEqual(1880)
  })

  it('returns a non-negative integer', () => {
    const weeks = getWeeksLived(BD)
    expect(Number.isInteger(weeks)).toBe(true)
    expect(weeks).toBeGreaterThanOrEqual(0)
  })
})

// ─── getCurrentAge ────────────────────────────────────────────────────────────

describe('getCurrentAge', () => {
  it('returns ~36 for someone born exactly 36 years ago', () => {
    const age = getCurrentAge(BD)
    expect(age).toBeGreaterThanOrEqual(35.9)
    expect(age).toBeLessThanOrEqual(36.1)
  })

  it('returns 0 for an empty birthday', () => {
    expect(getCurrentAge('')).toBe(0)
  })

  it('returns a positive number for a past birthday', () => {
    expect(getCurrentAge(BD)).toBeGreaterThan(0)
  })
})

// ─── getAgeAtWeek ─────────────────────────────────────────────────────────────

describe('getAgeAtWeek', () => {
  it('is ~0 at week 0', () => {
    expect(getAgeAtWeek(BD, 0)).toBeCloseTo(0, 1)
  })

  it('is ~1 at week 52', () => {
    expect(getAgeAtWeek(BD, 52)).toBeCloseTo(1.0, 0)
  })

  it('is ~10 at week 520', () => {
    expect(getAgeAtWeek(BD, 520)).toBeCloseTo(10.0, 0)
  })

  it('increases monotonically', () => {
    expect(getAgeAtWeek(BD, 100)).toBeGreaterThan(getAgeAtWeek(BD, 50))
  })
})

// ─── getDateAtWeek ────────────────────────────────────────────────────────────

describe('getDateAtWeek', () => {
  it('returns a Date object', () => {
    expect(getDateAtWeek(BD, 0)).toBeInstanceOf(Date)
  })

  it('week 0 returns the birthday itself', () => {
    const d = getDateAtWeek(BD, 0)
    expect(d.getFullYear()).toBe(1990)
    expect(d.getMonth()).toBe(2) // March = 2
    expect(d.getDate()).toBe(15)
  })

  it('week 52 is approximately 1 year after birthday', () => {
    const d = getDateAtWeek(BD, 52)
    expect(d.getFullYear()).toBe(1991)
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date as "Mon DD, YYYY"', () => {
    const d = new Date('2026-03-15T12:00:00Z')
    const result = formatDate(d)
    expect(result).toMatch(/Mar/)
    expect(result).toMatch(/2026/)
  })

  it('returns a non-empty string', () => {
    expect(formatDate(new Date())).toBeTruthy()
  })
})

// ─── getSecondsSinceBirth ─────────────────────────────────────────────────────

describe('getSecondsSinceBirth', () => {
  it('returns 0 for an empty birthday', () => {
    expect(getSecondsSinceBirth('')).toBe(0)
  })

  it('returns a large positive integer for a 36-year-old', () => {
    const s = getSecondsSinceBirth(BD)
    // 36 years ≈ 1.136 billion seconds
    expect(s).toBeGreaterThan(1_000_000_000)
    expect(Number.isInteger(s)).toBe(true)
  })
})

// ─── getRealityBreakdown ──────────────────────────────────────────────────────

describe('getRealityBreakdown', () => {
  it('returns a positive remaining count', () => {
    const b = getRealityBreakdown(BD, 80)
    expect(b.remaining).toBeGreaterThan(0)
  })

  it('sleep + work + maintenance + eating + free ≈ remaining (±5 weeks rounding)', () => {
    const b = getRealityBreakdown(BD, 80)
    const sum = b.sleepWeeks + b.workWeeks + b.maintenanceWeeks + b.eatingWeeks + b.freeWeeks
    expect(Math.abs(sum - b.remaining)).toBeLessThanOrEqual(5)
  })

  it('sleep is ~33% of remaining', () => {
    const b = getRealityBreakdown(BD, 80)
    expect(b.sleepWeeks / b.remaining).toBeCloseTo(0.33, 1)
  })

  it('freeWeeks is positive', () => {
    const b = getRealityBreakdown(BD, 80)
    expect(b.freeWeeks).toBeGreaterThan(0)
  })

  it('freePercent is between 0 and 100', () => {
    const b = getRealityBreakdown(BD, 80)
    const pct = parseFloat(b.freePercent)
    expect(pct).toBeGreaterThan(0)
    expect(pct).toBeLessThan(100)
  })

  it('remaining = totalWeeks - weeksLived', () => {
    const b = getRealityBreakdown(BD, 80)
    const totalWeeks = 80 * 52
    const weeksLived = getWeeksLived(BD)
    expect(b.remaining).toBe(totalWeeks - weeksLived)
  })
})

// ─── getFreeWeeksToGoal ───────────────────────────────────────────────────────

describe('getFreeWeeksToGoal', () => {
  it('returns 0 free weeks when target age is already past', () => {
    const result = getFreeWeeksToGoal(BD, 80, 20) // 20 < 36
    expect(result.freeWeeks).toBe(0)
  })

  it('returns 0 weeksToGoal when target is past', () => {
    const result = getFreeWeeksToGoal(BD, 80, 20)
    expect(result.weeksToGoal).toBe(0)
  })

  it('returns positive values for a future target', () => {
    const result = getFreeWeeksToGoal(BD, 80, 50)
    expect(result.weeksToGoal).toBeGreaterThan(0)
    expect(result.freeWeeks).toBeGreaterThan(0)
  })

  it('freeWeeks is 25% of weeksToGoal', () => {
    const result = getFreeWeeksToGoal(BD, 80, 50)
    expect(result.freeWeeks).toBeCloseTo(result.weeksToGoal * 0.25, 0)
  })

  it('weeksToGoal is capped by lifeExpectancy', () => {
    // Target age beyond life expectancy
    const result = getFreeWeeksToGoal(BD, 80, 100)
    expect(result.weeksToGoal).toBeLessThanOrEqual((80 - 36) * 52 + 5) // ~2288 + tolerance
  })
})

// ─── getRemainingVisits ───────────────────────────────────────────────────────

describe('getRemainingVisits', () => {
  it('returns 0 when person is already past life expectancy', () => {
    expect(getRemainingVisits(85, 12, 82)).toBe(0)
  })

  it('returns (LE - age) * visitsPerYear', () => {
    // (82 - 60) * 12 = 264
    expect(getRemainingVisits(60, 12, 82)).toBe(264)
  })

  it('uses default life expectancy of 82', () => {
    expect(getRemainingVisits(60, 12)).toBe(264)
  })

  it('returns an integer', () => {
    expect(Number.isInteger(getRemainingVisits(60, 1.5))).toBe(true)
  })

  it('returns 0 (not negative) for overdue age', () => {
    expect(getRemainingVisits(100, 12, 82)).toBe(0)
  })
})

// ─── formatNumber ─────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats 1000 as "1,000"', () => {
    expect(formatNumber(1000)).toBe('1,000')
  })

  it('formats 1000000 as "1,000,000"', () => {
    expect(formatNumber(1000000)).toBe('1,000,000')
  })

  it('rounds decimals to nearest integer', () => {
    expect(formatNumber(1000.7)).toBe('1,001')
    expect(formatNumber(1000.2)).toBe('1,000')
  })

  it('handles 0', () => {
    expect(formatNumber(0)).toBe('0')
  })
})
