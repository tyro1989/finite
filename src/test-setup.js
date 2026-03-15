import '@testing-library/jest-dom'
import { afterEach, beforeEach, vi } from 'vitest'

// Fixed point in time for all tests: March 15, 2026 12:00 UTC
export const FIXED_NOW = new Date('2026-03-15T12:00:00.000Z')

// A birthday exactly 36 years before FIXED_NOW
export const BIRTHDAY_36 = '1990-03-15'

// A birthday for a 6-year-old child (used in Grid tests with small lifeExpectancy)
export const BIRTHDAY_6 = '2020-01-01'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
