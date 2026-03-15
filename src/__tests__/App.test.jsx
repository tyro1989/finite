import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

const ONBOARDED_STATE = {
  onboarded: true,
  name: 'Alex',
  birthday: '1990-03-15',
  lifeExpectancy: 80,
  goals: [],
  milestones: {},
  checkins: {},
  people: [],
  weeklyIntentions: {},
}

function saveState(state) {
  localStorage.setItem('lifeinweeks_v1', JSON.stringify(state))
}

describe('App — initial load', () => {
  it('shows Onboarding when localStorage is empty', () => {
    render(<App />)
    // The welcome screen shows the iconic 4,680 number
    expect(screen.getByText('4,680')).toBeInTheDocument()
  })

  it('shows the main app when a saved state exists', () => {
    saveState(ONBOARDED_STATE)
    render(<App />)
    expect(screen.getByText('Finite')).toBeInTheDocument()
  })
})

describe('App — navigation', () => {
  beforeEach(() => saveState(ONBOARDED_STATE))

  it('renders all 5 navigation tabs', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Your Life/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reality Check/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Goals/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /People/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /This Week/i })).toBeInTheDocument()
  })

  it('defaults to the Grid (Your Life) tab', () => {
    render(<App />)
    // Grid shows the seconds counter
    expect(screen.getByText(/seconds alive/i)).toBeInTheDocument()
  })

  it('switches to Reality Check tab', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Reality Check/i }))
    expect(screen.getByText('The Reality Check')).toBeInTheDocument()
  })

  it('switches to Goals tab', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Goals/i }))
    expect(screen.getByRole('heading', { name: /Life Goals/i })).toBeInTheDocument()
  })

  it('switches to People tab', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /People/i }))
    expect(screen.getByText('The People Who Matter')).toBeInTheDocument()
  })

  it('switches to This Week tab', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /This Week/i }))
    expect(screen.getByText(/What matters most this week/i)).toBeInTheDocument()
  })
})

describe('App — state persistence', () => {
  it('persists onboarding data to localStorage', () => {
    saveState(ONBOARDED_STATE)
    render(<App />)
    const stored = JSON.parse(localStorage.getItem('lifeinweeks_v1'))
    expect(stored.name).toBe('Alex')
    expect(stored.birthday).toBe('1990-03-15')
  })
})
