import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import People from '../components/People'

const BASE_PROPS = {
  people: [],
  onUpdate: vi.fn(),
}

const SAMPLE_PERSON = {
  id: 1,
  name: 'Mom',
  relationship: 'Parent',
  age: 65,
  visitsPerYear: 12,
  lifeExpectancy: 82,
  hoursPerVisit: 3,
}

describe('People — empty state', () => {
  it('renders the headline', () => {
    render(<People {...BASE_PROPS} />)
    expect(screen.getByText('The People Who Matter')).toBeInTheDocument()
  })

  it('shows empty-state message', () => {
    render(<People {...BASE_PROPS} />)
    expect(screen.getByText(/no one added yet/i)).toBeInTheDocument()
  })

  it('shows "Add someone" button', () => {
    render(<People {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /add someone who matters/i })).toBeInTheDocument()
  })

  it('shows the insight quote', () => {
    render(<People {...BASE_PROPS} />)
    expect(screen.getByText(/call them today/i)).toBeInTheDocument()
  })
})

describe('People — add person form', () => {
  it('opens the form on button click', () => {
    render(<People {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add someone who matters/i }))
    expect(screen.getByPlaceholderText(/mom, dad/i)).toBeInTheDocument()
  })

  it('shows relationship, age, visits/year, hours/visit, life expectancy fields', () => {
    render(<People {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add someone who matters/i }))
    expect(screen.getByText(/their current age/i)).toBeInTheDocument()
    expect(screen.getByText(/visits per year/i)).toBeInTheDocument()
    expect(screen.getByText(/hours per visit/i)).toBeInTheDocument()
    expect(screen.getByText(/their life expectancy/i)).toBeInTheDocument()
  })

  it('add button is disabled when name/age are empty', () => {
    render(<People {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add someone who matters/i }))
    expect(screen.getByRole('button', { name: /^add person$/i })).toBeDisabled()
  })

  it('calls onUpdate with the new person including hoursPerVisit on submit', () => {
    const onUpdate = vi.fn()
    render(<People {...BASE_PROPS} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: /add someone who matters/i }))

    fireEvent.change(screen.getByPlaceholderText(/mom, dad/i), { target: { value: 'Dad' } })
    const [ageInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(ageInput, { target: { value: '70' } })

    fireEvent.click(screen.getByRole('button', { name: /^add person$/i }))

    expect(onUpdate).toHaveBeenCalledOnce()
    const [updatedPeople] = onUpdate.mock.calls[0]
    expect(updatedPeople).toHaveLength(1)
    expect(updatedPeople[0].name).toBe('Dad')
    expect(updatedPeople[0].age).toBe(70)
    expect(updatedPeople[0].hoursPerVisit).toBeGreaterThan(0)
  })

  it('closes form on Cancel', () => {
    render(<People {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add someone who matters/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText(/mom, dad/i)).not.toBeInTheDocument()
  })
})

describe('People — existing person card', () => {
  const props = { ...BASE_PROPS, people: [SAMPLE_PERSON] }

  it('shows the person name', () => {
    render(<People {...props} />)
    expect(screen.getByText('Mom')).toBeInTheDocument()
  })

  it('shows relationship and age', () => {
    render(<People {...props} />)
    expect(screen.getByText(/Parent · Age 65/i)).toBeInTheDocument()
  })

  it('shows "visits remaining"', () => {
    render(<People {...props} />)
    expect(screen.getByText(/visits remaining/i)).toBeInTheDocument()
  })

  it('shows correct visit count — (82-65)*12 = 204', () => {
    render(<People {...props} />)
    expect(screen.getByText('204')).toBeInTheDocument()
  })

  it('shows "hours together" label', () => {
    render(<People {...props} />)
    expect(screen.getByText(/hours together/i)).toBeInTheDocument()
  })

  it('shows correct total hours — 204 visits * 3h = 612', () => {
    render(<People {...props} />)
    expect(screen.getByText('612')).toBeInTheDocument()
  })

  it('shows hours perspective message', () => {
    render(<People {...props} />)
    // 612 hours = ~25 days — should show "days" perspective
    expect(screen.getByText(/days/i)).toBeInTheDocument()
  })

  it('shows urgency message for low visit count', () => {
    const criticalPerson = { ...SAMPLE_PERSON, age: 80, visitsPerYear: 2, lifeExpectancy: 82 }
    render(<People people={[criticalPerson]} onUpdate={vi.fn()} />)
    expect(screen.getByText(/make every visit sacred/i)).toBeInTheDocument()
  })

  it('removes person when × is clicked', () => {
    const onUpdate = vi.fn()
    render(<People people={[SAMPLE_PERSON]} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: /×/i }))
    expect(onUpdate).toHaveBeenCalledWith([])
  })
})
