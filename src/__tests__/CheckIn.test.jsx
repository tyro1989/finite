import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CheckIn from '../components/CheckIn'

// System time = 2026-03-15 (from test-setup.js)
// Birthday 1990-03-15 → weeksLived ≈ 1878

const BASE_PROPS = {
  birthday: '1990-03-15',
  goals: [],
  checkins: {},
  weeklyIntentions: {},
  weeklyGoalHours: {},
  onCheckin: vi.fn(),
  onIntention: vi.fn(),
  onGoalHours: vi.fn(),
}

describe('CheckIn — rendering', () => {
  it('shows "This Week" h1 heading', () => {
    render(<CheckIn {...BASE_PROPS} />)
    // Use level:1 to target only the h1, not the h2s that also contain "this week"
    expect(screen.getByRole('heading', { level: 1, name: /^This Week$/ })).toBeInTheDocument()
  })

  it('shows the current week number', () => {
    render(<CheckIn {...BASE_PROPS} />)
    // Week badge should say "Week 1879" (1878 + 1 for display)
    expect(screen.getByText(/Week \d+/)).toBeInTheDocument()
  })

  it('shows the formatted date', () => {
    render(<CheckIn {...BASE_PROPS} />)
    // Should show "Mar" somewhere in the date
    expect(screen.getByText(/Mar/)).toBeInTheDocument()
  })

  it('shows a motivational quote with author attribution', () => {
    render(<CheckIn {...BASE_PROPS} />)
    // Every quote ends with an author "— Author Name"
    expect(screen.getByText(/^—\s+\w/)).toBeInTheDocument()
  })

  it('shows the "Weekly focus" prompt', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/weekly focus/i)).toBeInTheDocument()
  })

  it('shows intention input', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByPlaceholderText(/one sentence/i)).toBeInTheDocument()
  })

  it('shows "Did this week move you forward?" prompt', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/did this week move you forward/i)).toBeInTheDocument()
  })

  it('shows all three check-in options', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /somewhat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })
})

describe('CheckIn — intention', () => {
  it('calls onIntention when Save is clicked with text', () => {
    const onIntention = vi.fn()
    render(<CheckIn {...BASE_PROPS} onIntention={onIntention} />)

    fireEvent.change(screen.getByPlaceholderText(/one sentence/i), {
      target: { value: 'Write 1000 words' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onIntention).toHaveBeenCalledOnce()
    const [weekIndex, text] = onIntention.mock.calls[0]
    expect(typeof weekIndex).toBe('number')
    expect(text).toBe('Write 1000 words')
  })

  it('pre-fills intention from weeklyIntentions prop', () => {
    // getWeeksLived('1990-03-15') on 2026-03-15 ≈ 1878
    const intentions = { 1878: 'Be present' }
    render(<CheckIn {...BASE_PROPS} weeklyIntentions={intentions} />)
    expect(screen.getByDisplayValue('Be present')).toBeInTheDocument()
  })
})

describe('CheckIn — check-in buttons', () => {
  it('calls onCheckin with "yes" when Yes is clicked', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByRole('button', { name: /yes/i }))
    expect(onCheckin).toHaveBeenCalledOnce()
    const [, value] = onCheckin.mock.calls[0]
    expect(value).toBe('yes')
  })

  it('calls onCheckin with "somewhat" when Somewhat is clicked', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByRole('button', { name: /somewhat/i }))
    const [, value] = onCheckin.mock.calls[0]
    expect(value).toBe('somewhat')
  })

  it('calls onCheckin with "no" when No is clicked', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByRole('button', { name: /no/i }))
    const [, value] = onCheckin.mock.calls[0]
    expect(value).toBe('no')
  })

  it('passes the current week index to onCheckin', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByRole('button', { name: /yes/i }))
    const [weekIndex] = onCheckin.mock.calls[0]
    expect(weekIndex).toBeGreaterThan(0)
  })
})

describe('CheckIn — streak and stats', () => {
  it('shows streak count', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/week streak/i)).toBeInTheDocument()
  })

  it('shows great weeks count', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/great weeks/i)).toBeInTheDocument()
  })

  it('calculates streak from consecutive yes/somewhat checkins', () => {
    // weeks 1875, 1876, 1877 all "yes" → streak = 3 (going back from current week 1878)
    const checkins = { 1875: 'yes', 1876: 'yes', 1877: 'yes' }
    render(<CheckIn {...BASE_PROPS} checkins={checkins} />)
    expect(screen.getByTestId('streak-value')).toHaveTextContent('3')
  })

  it('streak resets at a "no" gap', () => {
    // week 1875 = no, weeks 1876-1877 = yes → streak = 2
    const checkins = { 1875: 'no', 1876: 'yes', 1877: 'yes' }
    render(<CheckIn {...BASE_PROPS} checkins={checkins} />)
    expect(screen.getByTestId('streak-value')).toHaveTextContent('2')
  })

  it('shows goal tracker when goals are provided', () => {
    const goals = [{ id: 1, title: 'Write a novel', targetAge: 50, hoursPerWeek: 5 }]
    render(<CheckIn {...BASE_PROPS} goals={goals} />)
    expect(screen.getByText(/write a novel/i)).toBeInTheDocument()
    expect(screen.getByText(/5h\/week target/i)).toBeInTheDocument()
  })

  it('shows recent weeks grid when checkins exist', () => {
    const checkins = { 1877: 'yes', 1876: 'somewhat' }
    render(<CheckIn {...BASE_PROPS} checkins={checkins} />)
    expect(screen.getByText(/recent weeks/i)).toBeInTheDocument()
  })
})
