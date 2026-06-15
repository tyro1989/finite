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
  people: [],
  checkins: {},
  weeklyIntentions: {},
  weeklyGoalHours: {},
  weeklyReflections: {},
  customThemes: [],
  onCheckin: vi.fn(),
  onIntention: vi.fn(),
  onGoalHours: vi.fn(),
  onReflection: vi.fn(),
  onAddTheme: vi.fn(),
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
    // Mock "today" is Sunday 2026-03-15 — the first (and only enabled) day of the week
    fireEvent.click(screen.getByLabelText(/Sun Good/i))
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

describe('CheckIn — themes', () => {
  it('shows a theme picker in the This Week focus card', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.getByTestId('theme-pick-family')).toBeInTheDocument()
    expect(screen.getByTestId('theme-pick-career')).toBeInTheDocument()
  })

  it('records a focus theme via onReflection', () => {
    const onReflection = vi.fn()
    render(<CheckIn {...BASE_PROPS} onReflection={onReflection} />)
    fireEvent.click(screen.getByTestId('theme-pick-health'))
    expect(onReflection).toHaveBeenCalled()
    const calls = onReflection.mock.calls
    const last = calls[calls.length - 1][1]
    expect(last.focusTheme).toBe('health')
  })

  it('shows custom themes passed in props', () => {
    render(<CheckIn {...BASE_PROPS} customThemes={[{ value: 'faith', label: 'Faith', icon: '★' }]} />)
    expect(screen.getByTestId('theme-pick-faith')).toBeInTheDocument()
  })

  it('can create a custom theme inline', () => {
    const onAddTheme = vi.fn()
    render(<CheckIn {...BASE_PROPS} onAddTheme={onAddTheme} />)
    fireEvent.click(screen.getAllByRole('button', { name: /\+ custom/i })[0])
    fireEvent.change(screen.getByPlaceholderText(/name your theme/i), { target: { value: 'Fitness' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onAddTheme).toHaveBeenCalledOnce()
    const theme = onAddTheme.mock.calls[0][0]
    expect(theme.label).toBe('Fitness')
    expect(theme.value).toBe('fitness')
  })

  it('shows a theme picker in the Last Week reflection', () => {
    render(<CheckIn {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /^last week$/i }))
    expect(screen.getByText(/what did this week center on/i)).toBeInTheDocument()
    expect(screen.getByTestId('theme-pick-travel')).toBeInTheDocument()
  })
})

describe('CheckIn — attention headline', () => {
  it('shows a streak headline after 3+ good weeks', () => {
    const checkins = { 1874: 'yes', 1875: 'yes', 1876: 'yes', 1877: 'yes' }
    render(<CheckIn {...BASE_PROPS} name="Alex" checkins={checkins} />)
    expect(screen.getByText(/on a \d+-week roll/i)).toBeInTheDocument()
  })

  it('nudges about an urgent person', () => {
    const people = [{ id: 1, name: 'Mom', age: 78, visitsPerYear: 4, lifeExpectancy: 82 }]
    render(<CheckIn {...BASE_PROPS} name="Alex" people={people} />)
    expect(screen.getByText(/visits left with Mom/i)).toBeInTheDocument()
  })

  it('shows no headline for a brand-new user with no data', () => {
    render(<CheckIn {...BASE_PROPS} />)
    expect(screen.queryByText(/roll|visits left|haven't logged/i)).not.toBeInTheDocument()
  })
})

describe('CheckIn — weekly perspective', () => {
  it('shows a perspective line with rotating insight', () => {
    render(<CheckIn {...BASE_PROPS} />)
    // Perspectives all reference remaining time — match the shared phrasing
    const line = screen.getByText(/remaining|left|remain/i)
    expect(line).toBeInTheDocument()
    expect(line.textContent.length).toBeGreaterThan(20)
  })
})
