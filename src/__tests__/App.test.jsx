import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import App from '../App'

const mockLoadUser = vi.fn()

vi.mock('../api', () => ({
  register:    vi.fn().mockResolvedValue({ userId: 'test-uuid-1234' }),
  login:       vi.fn().mockResolvedValue({ userId: 'test-uuid-1234' }),
  linkAccount: vi.fn().mockResolvedValue({ ok: true }),
  createUser:  vi.fn().mockResolvedValue({ userId: 'test-uuid-1234' }),
  loadUser:    (...args) => mockLoadUser(...args),
  saveUser:    vi.fn().mockResolvedValue(undefined),
}))

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
  localStorage.setItem('finite_user_id', 'test-uuid-1234')
  mockLoadUser.mockResolvedValue({ userId: 'test-uuid-1234', email: 'test@example.com', ...state })
}

describe('App — initial load', () => {
  it('shows Auth screen when no user ID in localStorage', async () => {
    mockLoadUser.mockResolvedValue(null)
    render(<App />)
    await waitFor(() => expect(screen.getByText(/use email instead/i)).toBeInTheDocument())
  })

  it('shows Onboarding when user is authenticated but not onboarded', async () => {
    localStorage.setItem('finite_user_id', 'test-uuid-1234')
    mockLoadUser.mockResolvedValue({ userId: 'test-uuid-1234', email: 'test@example.com', onboarded: false })
    render(<App />)
    await waitFor(() => expect(screen.getByText('3,900')).toBeInTheDocument())
  })

  it('shows the main app when a saved state exists and user is authenticated', async () => {
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

  it('defaults to the This Week (checkin) tab', async () => {
    await renderAndWait()
    expect(screen.getByText(/what matters this week/i)).toBeInTheDocument()
  })

  it('switches to Your Life tab', async () => {
    const nav = await renderAndWait()
    fireEvent.click(within(nav).getByRole('button', { name: /Your Life/i }))
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
