import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CheckIn from '../components/CheckIn'

// System time = 2026-03-15 (from test-setup.js)
// Birthday 1990-03-15 → weeksLived ≈ 1878

const BASE_PROPS = {
  birthday: '1990-03-15',
  lifeExpectancy: 75,
  name: '',
  goals: [],
  people: [],
  checkins: {},
  weeklyIntentions: {},
  weeklyGoalHours: {},
  weeklyReflections: {},
  onCheckin: vi.fn(),
  onIntention: vi.fn(),
  onGoalHours: vi.fn(),
  onReflection: vi.fn(),
  onNavigate: vi.fn(),
}

describe('CheckIn — rendering', () => {
  it('shows "Did this week move you forward?" as primary question', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/did this week move you forward/i)).toBeInTheDocument()
  })

  it('shows the current week number with dates', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/Week \d+/)).toBeInTheDocument()
    expect(screen.getByText(/Week \d+ — .+ to .+/)).toBeInTheDocument()
  })

  it('shows all three check-in options', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('Somewhat')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('shows the weekly focus prompt', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/what matters most this week/i)).toBeInTheDocument()
  })

  it('shows intention input', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByPlaceholderText(/one sentence/i)).toBeInTheDocument()
  })
})

describe('CheckIn — intention', () => {
  it('calls onIntention when Save is clicked with text', () => {
    const onIntention = vi.fn()
    render(<CheckIn {...BASE_PROPS} onIntention={onIntention} />)

    fireEvent.change(screen.getByPlaceholderText(/one sentence/i), {
      target: { value: 'Write 1000 words' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: /save/i })[0])

    expect(onIntention).toHaveBeenCalledOnce()
    const [weekIndex, text] = onIntention.mock.calls[0]
    expect(typeof weekIndex).toBe('number')
    expect(text).toBe('Write 1000 words')
  })

  it('pre-fills intention from weeklyIntentions prop', () => {
    const intentions = { 1878: 'Be present' }
    render(<CheckIn {...BASE_PROPS} weeklyIntentions={intentions} />)
    expect(screen.getByDisplayValue('Be present')).toBeInTheDocument()
  })
})

describe('CheckIn — check-in buttons', () => {
  it('calls onCheckin with "yes" when Yes is clicked', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByText('Yes').closest('button'))
    expect(onCheckin).toHaveBeenCalledOnce()
    const [, value] = onCheckin.mock.calls[0]
    expect(value).toBe('yes')
  })

  it('calls onCheckin with "somewhat" when Somewhat is clicked', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByText('Somewhat').closest('button'))
    const [, value] = onCheckin.mock.calls[0]
    expect(value).toBe('somewhat')
  })

  it('calls onCheckin with "no" when No is clicked', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByText('No').closest('button'))
    const [, value] = onCheckin.mock.calls[0]
    expect(value).toBe('no')
  })

  it('passes the current week index to onCheckin', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByText('Yes').closest('button'))
    const [weekIndex] = onCheckin.mock.calls[0]
    expect(weekIndex).toBeGreaterThan(0)
  })
})

describe('CheckIn — collapsible sections', () => {
  it('shows goal section as expandable when goals exist', () => {
    const goals = [{ id: 1, title: 'Write a novel', targetAge: 50, hoursPerWeek: 5 }]
    render(<CheckIn {...BASE_PROPS} goals={goals} />)
    expect(screen.getByText(/log goal hours/i)).toBeInTheDocument()
  })

  it('shows goal details when expanded', () => {
    const goals = [{ id: 1, title: 'Write a novel', targetAge: 50, hoursPerWeek: 5 }]
    render(<CheckIn {...BASE_PROPS} goals={goals} />)
    fireEvent.click(screen.getByText(/log goal hours/i).closest('button'))
    expect(screen.getByText('Write a novel')).toBeInTheDocument()
    expect(screen.getByText(/5h\/wk target/i)).toBeInTheDocument()
  })

  it('shows last week section with dates', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/last week/i)).toBeInTheDocument()
  })

  it('shows reflection section as expandable', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/reflect on this week/i)).toBeInTheDocument()
  })
})

describe('CheckIn — weekly perspective', () => {
  it('shows a perspective banner with rotating insight', () => {
    render(<CheckIn {...BASE_PROPS} />)
    const banner = document.querySelector('[style*="font-style: italic"]')
    expect(banner).not.toBeNull()
    expect(banner.textContent.length).toBeGreaterThan(20)
  })
})
