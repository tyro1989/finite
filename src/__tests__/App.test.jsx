import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import App from '../App'

// Prevent real HTTP calls in tests
vi.mock('../api', () => ({
  createUser: vi.fn().mockResolvedValue({ userId: 'test-uuid-1234' }),
  loadUser:   vi.fn().mockResolvedValue(null),
  saveUser:   vi.fn().mockResolvedValue(undefined),
}))

// waitFor uses setTimeout internally — it breaks under vi.useFakeTimers().
// The global beforeEach (test-setup.js) enables fake timers; we undo that here
// so async loading resolves correctly. App tests don't need a fixed date.
beforeEach(() => vi.useRealTimers())

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
  it('shows Onboarding when localStorage is empty', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('3,900')).toBeInTheDocument())
  })

  it('shows the main app when a saved state exists', async () => {
    saveState(ONBOARDED_STATE)
    render(<App />)
    await waitFor(() => expect(screen.getByText('Finite')).toBeInTheDocument())
  })
})

describe('App — navigation', () => {
  beforeEach(() => saveState(ONBOARDED_STATE))

  async function renderAndWait() {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Finite')).toBeInTheDocument())
    return screen.getByRole('navigation')
  }

  it('renders all 5 navigation tabs', async () => {
    const nav = await renderAndWait()
    expect(within(nav).getByRole('button', { name: /Your Life/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /Reality Check/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /Goals/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /People/i })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /This Week/i })).toBeInTheDocument()
  })

  it('defaults to the Grid (Your Life) tab', async () => {
    await renderAndWait()
    expect(screen.getByText(/seconds alive/i)).toBeInTheDocument()
  })

  it('switches to Reality Check tab', async () => {
    const nav = await renderAndWait()
    fireEvent.click(within(nav).getByRole('button', { name: /Reality Check/i }))
    expect(screen.getByText('The Reality Check')).toBeInTheDocument()
  })

  it('switches to Goals tab', async () => {
    const nav = await renderAndWait()
    fireEvent.click(within(nav).getByRole('button', { name: /Goals/i }))
    expect(screen.getByRole('heading', { name: /Life Goals/i })).toBeInTheDocument()
  })

  it('switches to People tab', async () => {
    const nav = await renderAndWait()
    fireEvent.click(within(nav).getByRole('button', { name: /People/i }))
    expect(screen.getByText('The People Who Matter')).toBeInTheDocument()
  })

  it('switches to This Week tab', async () => {
    const nav = await renderAndWait()
    fireEvent.click(within(nav).getByRole('button', { name: /This Week/i }))
    expect(screen.getByText(/Weekly focus/i)).toBeInTheDocument()
  })
})

describe('App — state persistence', () => {
  it('persists onboarding data to localStorage', async () => {
    saveState(ONBOARDED_STATE)
    render(<App />)
    await waitFor(() => expect(screen.getByText('Finite')).toBeInTheDocument())
    const stored = JSON.parse(localStorage.getItem('lifeinweeks_v1'))
    expect(stored.name).toBe('Alex')
    expect(stored.birthday).toBe('1990-03-15')
  })
})
