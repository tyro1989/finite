import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Goals from '../components/Goals'

const BASE_PROPS = {
  birthday: '1990-03-15',
  lifeExpectancy: 80,
  goals: [],
  onUpdate: vi.fn(),
}

const SAMPLE_GOAL = {
  id: 1,
  title: 'Write a novel',
  description: 'A lifelong dream',
  targetAge: 50,
  hoursPerWeek: 5,
}

describe('Goals — empty state', () => {
  it('renders the headline', () => {
    render(<Goals {...BASE_PROPS} />)
    expect(screen.getByRole('heading', { name: /Life Goals/i })).toBeInTheDocument()
  })

  it('shows empty-state message when no goals', () => {
    render(<Goals {...BASE_PROPS} />)
    expect(screen.getByText(/no goals yet/i)).toBeInTheDocument()
  })

  it('shows an "Add a life goal" button', () => {
    render(<Goals {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /add a life goal/i })).toBeInTheDocument()
  })

  it('shows remaining free weeks in footer', () => {
    render(<Goals {...BASE_PROPS} />)
    expect(screen.getByText(/truly free weeks/i)).toBeInTheDocument()
  })
})

describe('Goals — add goal form', () => {
  it('opens the form when clicking Add button', () => {
    render(<Goals {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add a life goal/i }))
    expect(screen.getByPlaceholderText(/write a novel/i)).toBeInTheDocument()
  })

  it('shows targetAge and hoursPerWeek fields', () => {
    render(<Goals {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add a life goal/i }))
    expect(screen.getByText(/achieve by age/i)).toBeInTheDocument()
    expect(screen.getByText(/hours\/week committed/i)).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<Goals {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add a life goal/i }))
    const addBtn = screen.getByRole('button', { name: /^add goal$/i })
    expect(addBtn).toBeDisabled()
  })

  it('calls onUpdate with the new goal when form is submitted', () => {
    const onUpdate = vi.fn()
    render(<Goals {...BASE_PROPS} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: /add a life goal/i }))

    fireEvent.change(screen.getByPlaceholderText(/write a novel/i), { target: { value: 'Run a marathon' } })
    // Set target age using the number input
    const [ageInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(ageInput, { target: { value: '45' } })

    fireEvent.click(screen.getByRole('button', { name: /^add goal$/i }))

    expect(onUpdate).toHaveBeenCalledOnce()
    const [updatedGoals] = onUpdate.mock.calls[0]
    expect(updatedGoals).toHaveLength(1)
    expect(updatedGoals[0].title).toBe('Run a marathon')
    expect(updatedGoals[0].targetAge).toBe(45)
  })

  it('closes the form on Cancel', () => {
    render(<Goals {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add a life goal/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText(/write a novel/i)).not.toBeInTheDocument()
  })
})

describe('Goals — existing goals', () => {
  const props = { ...BASE_PROPS, goals: [SAMPLE_GOAL] }

  it('renders the goal title', () => {
    render(<Goals {...props} />)
    expect(screen.getByText('Write a novel')).toBeInTheDocument()
  })

  it('shows weeks to deadline', () => {
    render(<Goals {...props} />)
    expect(screen.getByText(/weeks to deadline/i)).toBeInTheDocument()
  })

  it('shows free weeks stat label', () => {
    render(<Goals {...props} />)
    // Multiple "free weeks" labels exist (stat + footer); assert at least one is present
    expect(screen.getAllByText(/free weeks/i).length).toBeGreaterThan(0)
  })

  it('shows free hours', () => {
    render(<Goals {...props} />)
    expect(screen.getByText(/free hours/i)).toBeInTheDocument()
  })

  it('shows the insight line with target age', () => {
    render(<Goals {...props} />)
    expect(screen.getByText(/by age/i)).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('calls onUpdate without the deleted goal when × is clicked', () => {
    const onUpdate = vi.fn()
    render(<Goals {...props} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: /×/i }))
    expect(onUpdate).toHaveBeenCalledWith([])
  })

  it('marks past goals as faded (past deadline)', () => {
    const pastGoal = { ...SAMPLE_GOAL, targetAge: 20 } // already past 36
    render(<Goals {...BASE_PROPS} goals={[pastGoal]} />)
    expect(screen.getByText(/this deadline has passed/i)).toBeInTheDocument()
  })
})
