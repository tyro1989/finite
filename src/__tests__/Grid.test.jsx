import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Grid from '../components/Grid'

// Use a child birthday so weeksLived << totalWeeks for predictable state.
// birthday: 2020-01-01, system time: 2026-03-15 → ~322 weeks lived
// lifeExpectancy: 10 → totalWeeks = 520
const PROPS = {
  birthday: '2020-01-01',
  lifeExpectancy: 10,
  name: 'Alex',
  milestones: {},
  checkins: {},
  weeklyIntentions: {},
  onMilestone: vi.fn(),
  onDeleteMilestone: vi.fn(),
  onIntention: vi.fn(),
}

describe('Grid — rendering', () => {
  it('renders totalWeeks cells (lifeExpectancy * 52)', () => {
    render(<Grid {...PROPS} />)
    // 10 * 52 = 520 cells — find all by their constant size style
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

  it('shows the phase legend', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText('Childhood')).toBeInTheDocument()
    expect(screen.getByText('Building')).toBeInTheDocument()
    expect(screen.getByText('Now')).toBeInTheDocument()
  })

  it('shows a hint to click/hover', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText(/click to add a milestone/i)).toBeInTheDocument()
  })
})

describe('Grid — year axis', () => {
  it('renders year labels for multiples of 5', () => {
    render(<Grid {...PROPS} />)
    expect(screen.getByText('0')).toBeInTheDocument()
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

describe('Grid — milestone modal', () => {
  it('opens a modal when a cell is clicked', () => {
    render(<Grid {...PROPS} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])
    // Modal shows "Week 1" heading
    expect(screen.getByText('Week 1')).toBeInTheDocument()
  })

  it('modal has milestone and intention inputs', () => {
    render(<Grid {...PROPS} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])
    expect(screen.getByPlaceholderText(/got married/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/what matters most this week/i)).toBeInTheDocument()
  })

  it('calls onMilestone when milestone text is saved', () => {
    const onMilestone = vi.fn()
    render(<Grid {...PROPS} onMilestone={onMilestone} />)
    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])

    fireEvent.change(screen.getByPlaceholderText(/got married/i), {
      target: { value: 'First day at school' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onMilestone).toHaveBeenCalledOnce()
    const [weekIndex, text] = onMilestone.mock.calls[0]
    expect(weekIndex).toBe(0)
    expect(text).toBe('First day at school')
  })

  it('calls onDeleteMilestone when milestone text is cleared', () => {
    const onDeleteMilestone = vi.fn()
    const milestones = { 0: 'Old memory' }
    render(<Grid {...PROPS} milestones={milestones} onDeleteMilestone={onDeleteMilestone} />)

    const cells = document.querySelectorAll('[style*="width: 8"]')
    fireEvent.click(cells[0])

    // Clear the milestone text
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
  it('renders a milestone dot on cells that have milestones', () => {
    const milestones = { 5: 'Birthday party' }
    render(<Grid {...PROPS} milestones={milestones} />)
    expect(screen.getAllByTestId('milestone-dot')).toHaveLength(1)
  })
})

describe('Grid — share', () => {
  it('copies text to clipboard when navigator.share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    })
    // Ensure no native share
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true })

    vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<Grid {...PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    expect(writeText).toHaveBeenCalledOnce()
    const [text] = writeText.mock.calls[0]
    expect(text).toMatch(/weeks/)
  })
})
