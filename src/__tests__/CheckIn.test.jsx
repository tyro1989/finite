import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CheckIn from '../components/CheckIn'

// System time = 2026-03-15 (from test-setup.js)
// Birthday 1990-03-15 → weeksLived ≈ 1878, lastWeek ≈ 1877

const BASE_PROPS = {
  birthday: '1990-03-15',
  lifeExpectancy: 75,
  name: '',
  goals: [],
  checkins: {},
  weeklyIntentions: {},
  weeklyGoalHours: {},
  weeklyReflections: {},
  onCheckin: vi.fn(),
  onIntention: vi.fn(),
  onGoalHours: vi.fn(),
  onReflection: vi.fn(),
}

describe('CheckIn — view switching', () => {
  it('defaults to the This Week view', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/how are your days going/i)).toBeInTheDocument()
  })

  it('shows segmented controls for both weeks', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /^this week$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^last week$/i })).toBeInTheDocument()
  })

  it('switches to Last Week view', () => {
    render(<CheckIn {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /^last week$/i }))
    expect(screen.getByText(/did last week move you forward/i)).toBeInTheDocument()
  })
})

describe('CheckIn — This Week view', () => {
  it('shows the daily mood tracker with day initials', () => {
    render(<CheckIn {...BASE_PROPS} />)
    // Mon..Sun initials: M T W T F S S
    expect(screen.getAllByText('M').length).toBeGreaterThan(0)
    expect(screen.getAllByText('W').length).toBeGreaterThan(0)
  })

  it('shows the "What matters most this week?" focus input', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/what matters most this week/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/one thing worth protecting/i)).toBeInTheDocument()
  })

  it('saves intention on blur', () => {
    const onIntention = vi.fn()
    render(<CheckIn {...BASE_PROPS} onIntention={onIntention} />)
    const input = screen.getByPlaceholderText(/one thing worth protecting/i)
    fireEvent.change(input, { target: { value: 'Ship the redesign' } })
    fireEvent.blur(input)
    expect(onIntention).toHaveBeenCalledOnce()
    const [weekIndex, text] = onIntention.mock.calls[0]
    expect(typeof weekIndex).toBe('number')
    expect(text).toBe('Ship the redesign')
  })

  it('pre-fills intention from weeklyIntentions prop', () => {
    const intentions = { 1878: 'Be present' }
    render(<CheckIn {...BASE_PROPS} weeklyIntentions={intentions} />)
    expect(screen.getByDisplayValue('Be present')).toBeInTheDocument()
  })

  it('records a daily mood via onReflection', () => {
    const onReflection = vi.fn()
    render(<CheckIn {...BASE_PROPS} onReflection={onReflection} />)
    // First enabled mood button (Monday "Good")
    fireEvent.click(screen.getByLabelText(/Mon Good/i))
    expect(onReflection).toHaveBeenCalled()
    const [, payload] = onReflection.mock.calls[0]
    expect(payload.dailySentiments).toBeTruthy()
  })

  it('shows goal hours only when goals exist', () => {
    const { rerender } = render(<CheckIn {...BASE_PROPS} />)
    expect(screen.queryByText(/hours on your goals/i)).not.toBeInTheDocument()

    const goals = [{ id: 1, title: 'Write a novel', targetAge: 50, hoursPerWeek: 5 }]
    rerender(<CheckIn {...BASE_PROPS} goals={goals} />)
    expect(screen.getByText(/hours on your goals/i)).toBeInTheDocument()
    expect(screen.getByText('Write a novel')).toBeInTheDocument()
  })
})

describe('CheckIn — Last Week view', () => {
  function renderLastWeek(props = {}) {
    render(<CheckIn {...BASE_PROPS} {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /^last week$/i }))
  }

  it('shows all three verdict options', () => {
    renderLastWeek()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('Somewhat')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('calls onCheckin for the last week index', () => {
    const onCheckin = vi.fn()
    renderLastWeek({ onCheckin })
    fireEvent.click(screen.getByText('Yes').closest('button'))
    expect(onCheckin).toHaveBeenCalledOnce()
    const [weekIndex, value] = onCheckin.mock.calls[0]
    expect(value).toBe('yes')
    expect(weekIndex).toBe(1877)
  })

  it('shows reflection fields and saves on blur', () => {
    const onReflection = vi.fn()
    renderLastWeek({ onReflection })
    const wins = screen.getByPlaceholderText(/wins, progress/i)
    fireEvent.change(wins, { target: { value: 'Closed a big deal' } })
    fireEvent.blur(wins)
    expect(onReflection).toHaveBeenCalled()
    const [weekIndex, payload] = onReflection.mock.calls[0]
    expect(weekIndex).toBe(1877)
    expect(payload.wins).toBe('Closed a big deal')
  })

  it('shows an impression when last week has recorded moods', () => {
    const weeklyReflections = { 1877: { dailySentiments: { 0: 'positive', 1: 'positive', 2: 'positive', 3: 'positive', 4: 'positive' } } }
    renderLastWeek({ weeklyReflections })
    expect(screen.getByText(/great stretch/i)).toBeInTheDocument()
  })
})

describe('CheckIn — weekly perspective', () => {
  it('shows a perspective line with rotating insight', () => {
    render(<CheckIn {...BASE_PROPS} />)
    const banner = document.querySelector('[style*="font-style: italic"]')
    expect(banner).not.toBeNull()
    expect(banner.textContent.length).toBeGreaterThan(20)
  })
})
