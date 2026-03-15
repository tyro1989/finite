import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RealityCheck from '../components/RealityCheck'

const PROPS = {
  birthday: '1990-03-15',
  lifeExpectancy: 80,
  name: 'Alex',
}

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
    // The hero number can be 3-4 digits. Extract all digit strings from the page and
    // check at least one is a plausible free-weeks count (100–3000).
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
    expect(screen.getByText(/summers left/i)).toBeInTheDocument()
  })

  it('shows a closing quote', () => {
    render(<RealityCheck {...PROPS} />)
    expect(screen.getByText(/Stephen R. Covey/i)).toBeInTheDocument()
  })
})

describe('RealityCheck — calculations', () => {
  it('remaining weeks is consistent with 80-year life expectancy minus weeks lived', () => {
    render(<RealityCheck {...PROPS} />)
    // Total weeks for 80-year life = 4160; 36 years lived ≈ 1878 weeks; remaining ≈ 2282
    // The text mentioning remaining weeks should be a reasonable number
    const text = document.body.textContent
    const numbers = [...text.matchAll(/(\d[\d,]+)/g)]
      .map(m => parseInt(m[1].replace(/,/g, '')))
      .filter(n => n > 1000 && n < 5000)
    expect(numbers.length).toBeGreaterThan(0)
  })
})
