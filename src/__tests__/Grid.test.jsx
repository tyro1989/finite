import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Grid from '../components/Grid'

// birthday: 2020-01-01, system time: 2026-03-15 → ~322 weeks lived
// lifeExpectancy: 10 → totalWeeks = 520
const PROPS = {
  birthday: '2020-01-01',
  lifeExpectancy: 10,
  name: 'Alex',
  milestones: {},
  checkins: {},
  weeklyIntentions: {},
  goals: [],
  people: [],
  onMilestone: vi.fn(),
  onDeleteMilestone: vi.fn(),
  onIntention: vi.fn(),
  onNavigate: vi.fn(),
}

describe('Grid — rendering', () => {
  it('renders totalWeeks cells (lifeExpectancy * 52)', () => {
    render(<Grid {...PROPS} />)
    const cells = document.querySelectorAll('[style*="width: 8"][style*="height: 8"]')
    expect(cells.length).toBe(520)
  })

  it('shows seconds alive counter', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText(/seconds alive/i)).toBeInTheDocument()
  })

  it('shows weeks lived counter', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText(/weeks lived/i)).toBeInTheDocument()
  })

  it('shows weeks remain counter', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText(/weeks remain/i)).toBeInTheDocument()
  })

  it('shows the share button', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
  })

  it('shows a simplified legend with Now, Memory, Intention', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText('Now')).toBeInTheDocument()
    expect(screen.getByText('Memory')).toBeInTheDocument()
    expect(screen.getByText('Intention')).toBeInTheDocument()
  })

  it('shows the three simplified life stages in the legend', () => {
    render(<Grid {...PROPS} />)
    // Stage names can also appear in the current-phase badge, so allow >= 1
    expect(screen.getAllByText('Early years').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('School years').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Adult life').length).toBeGreaterThanOrEqual(1)
  })

  it('shows a prominent Add a life event button', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByRole('button', { name: /add a life event/i })).toBeInTheDocument()
  })
})

describe('Grid — year axis', () => {
  it('renders year labels for multiples of 5', () => {
    render(<Grid {...PROPS} />)
    // '0' also appears in the moments counts (0 enjoyed, 0 regrets) — use getAllByText
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})

describe('Grid — current week', () => {
  it('exactly one cell has the pulse animation', () => {
    render(<Grid {...PROPS} />)
    const pulsing = document.querySelectorAll('[style*="pulse"]')
    expect(pulsing.length).toBe(1)
  })

  it('the current week cell has the accent color background', () => {
    render(<Grid {...PROPS} />)
    const pulsing = document.querySelector('[style*="pulse"]')
    expect(pulsing.style.background).toContain('accent')
  })
})

describe('Grid — add-by-date modal', () => {
  function openAddModal() {
    fireEvent.click(screen.getByRole('button', { name: /add a life event/i }))
  }

  it('opens a modal titled "Add a life event by date"', () => {
    render(<Grid {...PROPS} />)
    openAddModal()
    expect(screen.getByText(/add a life event by date/i)).toBeInTheDocument()
  })

  it('has a date input in the modal', () => {
    render(<Grid {...PROPS} />)
    openAddModal()
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument()
  })

  it('shows event and sentiment fields for a past date', () => {
    render(<Grid {...PROPS} />)
    openAddModal()
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2021-06-01' } })
    expect(screen.getByPlaceholderText(/first day at new job/i)).toBeInTheDocument()
    expect(screen.getAllByText(/enjoyed/i).length).toBeGreaterThan(0)
  })

  it('shows intention field for a future date', () => {
    render(<Grid {...PROPS} />)
    openAddModal()
    const dateInput = document.querySelector('input[type="date"]')
    // lifeExpectancy 10 years from 2020 → grid goes to ~2030
    fireEvent.change(dateInput, { target: { value: '2028-01-01' } })
    expect(screen.getByPlaceholderText(/what matters most this week/i)).toBeInTheDocument()
  })

  it('calls onMilestone with sentiment when past event is submitted', () => {
    const onMilestone = vi.fn()
    render(<Grid {...PROPS} onMilestone={onMilestone} />)
    openAddModal()
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2021-06-01' } })
    fireEvent.change(screen.getByPlaceholderText(/first day at new job/i), {
      target: { value: 'Started coding' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onMilestone).toHaveBeenCalledOnce()
    const [, text, sentiment] = onMilestone.mock.calls[0]
    expect(text).toBe('Started coding')
    expect(sentiment).toBe('enjoyed')
  })

  it('calls onIntention when future event is submitted', () => {
    const onIntention = vi.fn()
    render(<Grid {...PROPS} onIntention={onIntention} />)
    openAddModal()
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2028-01-01' } })
    fireEvent.change(screen.getByPlaceholderText(/what matters most this week/i), {
      target: { value: 'Finish the book' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onIntention).toHaveBeenCalledOnce()
    const [, text] = onIntention.mock.calls[0]
    expect(text).toBe('Finish the book')
  })

  it('closes the add modal on Cancel', () => {
    render(<Grid {...PROPS} />)
    openAddModal()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/add a life event by date/i)).not.toBeInTheDocument()
  })
})

describe('Grid — right info panel', () => {
  it('shows life progress section', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText(/life progress/i)).toBeInTheDocument()
  })

  it('shows % lived', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText(/%/)).toBeInTheDocument()
  })

  it('shows moments section with enjoyed/regret counts', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText(/your moments/i)).toBeInTheDocument()
    expect(screen.getAllByText(/enjoyed/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/regrets/i)).toBeInTheDocument()
  })

  it('shows goals quick link when goals exist', () => {
    const onNavigate = vi.fn()
    render(<Grid {...PROPS} goals={[{ id: 1, title: 'Learn piano' }]} onNavigate={onNavigate} />)
    const btn = screen.getByRole('button', { name: /1 goal/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onNavigate).toHaveBeenCalledWith('goals')
  })

  it('shows people quick link when people exist', () => {
    const onNavigate = vi.fn()
    render(<Grid {...PROPS} people={[{ id: 1, name: 'Mom', age: 65, visitsPerYear: 4, lifeExpectancy: 82 }]} onNavigate={onNavigate} />)
    const btn = screen.getByRole('button', { name: /1 people who matter/i })
    fireEvent.click(btn)
    expect(onNavigate).toHaveBeenCalledWith('people')
  })

  it('reality check quick link navigates correctly', () => {
    const onNavigate = vi.fn()
    render(<Grid {...PROPS} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /reality check/i }))
    expect(onNavigate).toHaveBeenCalledWith('reality')
  })

  it('the intentions moment button navigates to This Week', () => {
    const onNavigate = vi.fn()
    render(<Grid {...PROPS} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /intentions/i }))
    expect(onNavigate).toHaveBeenCalledWith('checkin')
  })
})

describe('Grid — milestone modal', () => {
  it('opens a modal when a cell is clicked', () => {
    render(<Grid {...PROPS} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])
    expect(screen.getByText('Week 1')).toBeInTheDocument()
  })

  it('past week modal has milestone input and sentiment buttons', () => {
    render(<Grid {...PROPS} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])  // week 0 is in the past
    expect(screen.getByPlaceholderText(/got married/i)).toBeInTheDocument()
    expect(screen.getAllByText(/enjoyed/i).length).toBeGreaterThan(0)
  })

  it('future week modal has intention input', () => {
    render(<Grid {...PROPS} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    // click a future cell (index 400 is past 322 weeks lived, within 520 total)
    fireEvent.click(cells[400])
    expect(screen.getByPlaceholderText(/what matters most this week/i)).toBeInTheDocument()
  })

  it('calls onMilestone with text and sentiment when saved', () => {
    const onMilestone = vi.fn()
    render(<Grid {...PROPS} onMilestone={onMilestone} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])
    fireEvent.change(screen.getByPlaceholderText(/got married/i), {
      target: { value: 'First day at school' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onMilestone).toHaveBeenCalledOnce()
    const [weekIndex, text, sentiment] = onMilestone.mock.calls[0]
    expect(weekIndex).toBe(0)
    expect(text).toBe('First day at school')
    expect(['enjoyed', 'neutral', 'regret']).toContain(sentiment)
  })

  it('calls onDeleteMilestone when milestone text is cleared', () => {
    const onDeleteMilestone = vi.fn()
    const milestones = { 0: 'Old memory' }
    render(<Grid {...PROPS} milestones={milestones} onDeleteMilestone={onDeleteMilestone} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])
    fireEvent.change(screen.getByPlaceholderText(/got married/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onDeleteMilestone).toHaveBeenCalledWith(0)
  })

  it('closes the modal on Cancel click', () => {
    render(<Grid {...PROPS} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Week 1')).not.toBeInTheDocument()
  })

  it('closes the modal when clicking the overlay backdrop', () => {
    render(<Grid {...PROPS} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])
    fireEvent.click(screen.getByTestId('modal-overlay'))
    expect(screen.queryByText('Week 1')).not.toBeInTheDocument()
  })
})

describe('Grid — milestone indicator', () => {
  it('renders a milestone dot for string milestones (backward compat)', () => {
    const milestones = { 5: 'Birthday party' }
    render(<Grid {...PROPS} milestones={milestones} />)
    expect(screen.getAllByTestId('milestone-dot')).toHaveLength(1)
  })

  it('renders a milestone dot for object milestones', () => {
    const milestones = { 5: { text: 'Birthday party', sentiment: 'enjoyed' } }
    render(<Grid {...PROPS} milestones={milestones} />)
    expect(screen.getAllByTestId('milestone-dot')).toHaveLength(1)
  })

  it('uses a single gold marker color regardless of sentiment (no color noise)', () => {
    const milestones = {
      5: { text: 'Great trip', sentiment: 'enjoyed' },
      6: { text: 'Bad choice', sentiment: 'regret' },
    }
    render(<Grid {...PROPS} milestones={milestones} />)
    const dots = screen.getAllByTestId('milestone-dot')
    expect(dots).toHaveLength(2)
    // Both dots share the same gold color — sentiment is NOT encoded on the grid
    expect(dots[0].style.background).toBe(dots[1].style.background)
    expect(dots[0].style.background).toBe('rgb(184, 134, 11)')
  })
})

describe('Grid — memories panel', () => {
  const milestones = {
    5:  { text: 'Started new job', sentiment: 'enjoyed', theme: 'career' },
    10: { text: 'Hospital stay',   sentiment: 'regret',  theme: 'health' },
    20: { text: 'Trip to Japan',   sentiment: 'enjoyed', theme: 'travel' },
  }

  it('lists added memories with their text', () => {
    render(<Grid {...PROPS} milestones={milestones} />)
    expect(screen.getByText('Started new job')).toBeInTheDocument()
    expect(screen.getByText('Hospital stay')).toBeInTheDocument()
    expect(screen.getByText('Trip to Japan')).toBeInTheDocument()
  })

  it('shows an empty state when there are no memories', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText(/no memories yet/i)).toBeInTheDocument()
  })

  it('shows theme breakdown chips with counts', () => {
    render(<Grid {...PROPS} milestones={milestones} />)
    expect(screen.getByText(/themes/i)).toBeInTheDocument()
    expect(screen.getByTestId('theme-chip-career')).toBeInTheDocument()
    expect(screen.getByTestId('theme-chip-travel')).toBeInTheDocument()
    expect(screen.getByTestId('theme-chip-health')).toBeInTheDocument()
  })

  it('filters memories by theme when a theme chip is tapped', () => {
    render(<Grid {...PROPS} milestones={milestones} />)
    fireEvent.click(screen.getByTestId('theme-chip-travel'))
    expect(screen.getByText('Trip to Japan')).toBeInTheDocument()
    expect(screen.queryByText('Started new job')).not.toBeInTheDocument()
    expect(screen.queryByText('Hospital stay')).not.toBeInTheDocument()
  })

  it('filters memories by sentiment when a moment button is tapped', () => {
    render(<Grid {...PROPS} milestones={milestones} />)
    fireEvent.click(screen.getByRole('button', { name: /regrets/i }))
    expect(screen.getByText('Hospital stay')).toBeInTheDocument()
    expect(screen.queryByText('Trip to Japan')).not.toBeInTheDocument()
  })

  it('clears the filter via Clear filter', () => {
    render(<Grid {...PROPS} milestones={milestones} />)
    fireEvent.click(screen.getByTestId('theme-chip-travel'))
    fireEvent.click(screen.getByRole('button', { name: /clear filter/i }))
    expect(screen.getByText('Started new job')).toBeInTheDocument()
    expect(screen.getByText('Trip to Japan')).toBeInTheDocument()
  })

  it('opens the edit modal when a memory row is clicked', () => {
    render(<Grid {...PROPS} milestones={milestones} />)
    fireEvent.click(screen.getByText('Trip to Japan'))
    // week 20 → "Week 21"
    expect(screen.getByText('Week 21')).toBeInTheDocument()
  })

  it('saves a theme with the milestone from the cell modal', () => {
    const onMilestone = vi.fn()
    render(<Grid {...PROPS} onMilestone={onMilestone} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])
    fireEvent.change(screen.getByPlaceholderText(/got married/i), { target: { value: 'New memory' } })
    // pick the Travel theme
    fireEvent.click(screen.getByRole('button', { name: /travel/i }))
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onMilestone).toHaveBeenCalledOnce()
    const [, text, sentiment, theme] = onMilestone.mock.calls[0]
    expect(text).toBe('New memory')
    expect(theme).toBe('travel')
    expect(['enjoyed', 'neutral', 'regret']).toContain(sentiment)
  })
})

describe('Grid — share', () => {
  it('copies text to clipboard when navigator.share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true })
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true })
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<Grid {...PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    expect(writeText).toHaveBeenCalledOnce()
    const [text] = writeText.mock.calls[0]
    expect(text).toMatch(/weeks/)
  })
})
