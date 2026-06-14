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
  it('shows "Did last week move you forward?" as primary question', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/did last week move you forward/i)).toBeInTheDocument()
  })

  it('shows date range for last week', () => {
    render(<CheckIn {...BASE_PROPS} />)
    // Should have dates displayed
    const dateElements = screen.getAllByText(/Mar/)
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('shows all three check-in options', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('Somewhat')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('shows "Reflect on last week" section', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/reflect on last week/i)).toBeInTheDocument()
  })

  it('shows "How\'s this week going?" sentiment tracker', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/how's this week going/i)).toBeInTheDocument()
  })

  it('shows "What matters this week?" at the end', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText(/what matters this week/i)).toBeInTheDocument()
  })

  it('shows intention input', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByPlaceholderText(/one sentence/i)).toBeInTheDocument()
  })

  it('shows day labels for sentiment tracker', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Fri')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })
})

describe('CheckIn — intention', () => {
  it('calls onIntention when Save is clicked with text', () => {
    const onIntention = vi.fn()
    render(<CheckIn {...BASE_PROPS} onIntention={onIntention} />)

    fireEvent.change(screen.getByPlaceholderText(/one sentence/i), {
      target: { value: 'Write 1000 words' },
    })
    // The intention Save button is the last one (after "Save reflection")
    const saveButtons = screen.getAllByRole('button', { name: /^save$/i })
    fireEvent.click(saveButtons[saveButtons.length - 1])

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
  it('calls onCheckin with "yes" for last week when Yes is clicked', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByText('Yes').closest('button'))
    expect(onCheckin).toHaveBeenCalledOnce()
    const [weekIndex, value] = onCheckin.mock.calls[0]
    expect(value).toBe('yes')
    expect(weekIndex).toBe(1877) // last week
  })

  it('calls onCheckin with "no" when No is clicked', () => {
    const onCheckin = vi.fn()
    render(<CheckIn {...BASE_PROPS} onCheckin={onCheckin} />)
    fireEvent.click(screen.getByText('No').closest('button'))
    const [, value] = onCheckin.mock.calls[0]
    expect(value).toBe('no')
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
})

describe('CheckIn — sentiment impression', () => {
  it('shows impression when last week has sentiments recorded', () => {
    const weeklyReflections = { 1877: { dailySentiments: { 0: 'positive', 1: 'positive', 2: 'positive', 3: 'positive', 4: 'positive' } } }
    render(<CheckIn {...BASE_PROPS} weeklyReflections={weeklyReflections} />)
    expect(screen.getByText(/great week/i)).toBeInTheDocument()
  })

  it('shows negative impression for tough weeks', () => {
    const weeklyReflections = { 1877: { dailySentiments: { 0: 'negative', 1: 'negative', 2: 'negative', 3: 'negative', 4: 'negative' } } }
    render(<CheckIn {...BASE_PROPS} weeklyReflections={weeklyReflections} />)
    expect(screen.getByText(/tough week/i)).toBeInTheDocument()
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
