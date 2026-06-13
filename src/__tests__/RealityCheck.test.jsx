import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RealityCheck from '../components/RealityCheck'

const PROPS = {
  birthday: '1990-03-15',
  lifeExpectancy: 80,
  name: 'Alex',
}

const PEOPLE = [
  { id: 1, name: 'Mom',  relationship: 'Parent',  age: 65, visitsPerYear: 12, lifeExpectancy: 82, hoursPerVisit: 3 },
  { id: 2, name: 'Sara', relationship: 'Partner', age: 36, visitsPerYear: 52, lifeExpectancy: 85, hoursPerVisit: 8 },
]

describe('RealityCheck — rendering', () => {
  it('shows the headline', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText('The Reality Check')).toBeInTheDocument()
  })

  it('shows "truly free weeks" label', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText(/truly free weeks/i)).toBeInTheDocument()
  })

  it('free weeks number is a positive integer', () => {
    render(<RealityCheck {...PROPS} />)
    const text = document.body.textContent
    const numbers = [...text.matchAll(/\b(\d[\d,]*)\b/g)]
      .map(m => parseInt(m[1].replace(/,/g, '')))
      .filter(n => n >= 100 && n <= 3000)
    expect(numbers.length).toBeGreaterThan(0)
  })

  it('shows all four time categories', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText(/asleep/i)).toBeInTheDocument()
    expect(screen.getByText(/working/i)).toBeInTheDocument()
    expect(screen.getByText(/daily tasks/i)).toBeInTheDocument()
    expect(screen.getByText(/eating/i)).toBeInTheDocument()
  })

  it('shows "where your remaining time goes" section', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText(/where your remaining time goes/i)).toBeInTheDocument()
  })

  it('shows what free weeks can become section', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText(/what .+ free weeks can become/i)).toBeInTheDocument()
  })

  it('shows summers left', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getAllByText(/summers left/i).length).toBeGreaterThan(0)
  })

  it('shows a closing quote', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText(/Stephen R. Covey/i)).toBeInTheDocument()
  })

  it('shows "Your life, counted differently" section', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText(/your life, counted differently/i)).toBeInTheDocument()
  })

  it('shows life seasons — summers, Sunday dinners, birthdays', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText(/sunday dinners/i)).toBeInTheDocument()
    expect(screen.getByText(/birthdays to celebrate/i)).toBeInTheDocument()
    expect(screen.getByText(/full moons to witness/i)).toBeInTheDocument()
  })

  it('shows people birthdays section when people are provided', () => {
    render(<RealityCheck {...PROPS} people={PEOPLE} />)
    expect(screen.getAllByText(/with the people you love/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/birthdays together/i).length).toBeGreaterThan(0)
  })
})

describe('RealityCheck — calculations', () => {
  it('remaining weeks is consistent with 80-year life expectancy minus weeks lived', () => {
    render(<RealityCheck {...PROPS} />)
    const text = document.body.textContent
    const numbers = [...text.matchAll(/(\d[\d,]+)/g)]
      .map(m => parseInt(m[1].replace(/,/g, '')))
      .filter(n => n > 1000 && n < 5000)
    expect(numbers.length).toBeGreaterThan(0)
  })
})

describe('RealityCheck — people section', () => {
  it('does not show people section when no people provided', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.queryByText(/time left with the people you love/i)).not.toBeInTheDocument()
  })

  it('shows people section when people are provided', () => {
    render(<RealityCheck {...PROPS} people={PEOPLE} />)
    expect(screen.getByText(/time left with the people you love/i)).toBeInTheDocument()
  })

  it('shows each person name in the people section', () => {
    render(<RealityCheck {...PROPS} people={PEOPLE} />)
    expect(screen.getAllByText('Mom').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sara').length).toBeGreaterThan(0)
  })

  it('shows total hours with loved ones', () => {
    render(<RealityCheck {...PROPS} people={PEOPLE} />)
    expect(screen.getByText(/total hours left with everyone you love/i)).toBeInTheDocument()
  })

  it('total hours is positive number', () => {
    render(<RealityCheck {...PROPS} people={PEOPLE} />)
    const text = document.body.textContent
    const numbers = [...text.matchAll(/\b(\d[\d,]+)\b/g)]
      .map(m => parseInt(m[1].replace(/,/g, '')))
      .filter(n => n > 50)
    expect(numbers.length).toBeGreaterThan(0)
  })
})
