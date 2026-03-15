import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Onboarding from '../components/Onboarding'

describe('Onboarding — welcome step', () => {
  it('shows the iconic 4,680 number', () => {
    render(<Onboarding onComplete={vi.fn()} />)
    expect(screen.getByText('4,680')).toBeInTheDocument()
  })

  it('shows a Begin button', () => {
    render(<Onboarding onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /begin/i })).toBeInTheDocument()
  })

  it('explains this is a mirror, not a productivity app', () => {
    render(<Onboarding onComplete={vi.fn()} />)
    expect(screen.getByText(/mirror/i)).toBeInTheDocument()
  })
})

describe('Onboarding — step navigation', () => {
  it('advances from welcome to name step on Begin click', () => {
    render(<Onboarding onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
  })

  it('advances from name to birthday step', () => {
    render(<Onboarding onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))

    const input = screen.getByPlaceholderText(/your name/i)
    fireEvent.change(input, { target: { value: 'Alex' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByDisplayValue('')).toBeInTheDocument() // date input
    expect(screen.getByText(/when were you born/i)).toBeInTheDocument()
  })

  it('does not advance from name step when name is empty', () => {
    render(<Onboarding onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))

    // Continue button is disabled — clicking does nothing
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    expect(continueBtn).toBeDisabled()
  })

  it('advances through all steps to reveal', () => {
    render(<Onboarding onComplete={vi.fn()} />)

    // Step 1: welcome
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))

    // Step 2: name
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Alex' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: birthday
    const dateInput = screen.getByDisplayValue('')
    fireEvent.change(dateInput, { target: { value: '1990-03-15' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 4: life expectancy
    expect(screen.getByText(/how long do you intend to live/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /show me my life/i }))

    // Step 5: reveal — shows weeks lived + remaining
    expect(screen.getByText(/weeks remain/i)).toBeInTheDocument()
  })

  it('calls onComplete with name, birthday, and lifeExpectancy', () => {
    const onComplete = vi.fn()
    render(<Onboarding onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Alex' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '1990-03-15' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /show me my life/i }))
    fireEvent.click(screen.getByRole('button', { name: /see your grid/i }))

    expect(onComplete).toHaveBeenCalledOnce()
    const [arg] = onComplete.mock.calls[0]
    expect(arg.name).toBe('Alex')
    expect(arg.birthday).toBe('1990-03-15')
    expect(typeof arg.lifeExpectancy).toBe('number')
    expect(arg.lifeExpectancy).toBeGreaterThan(0)
  })
})

describe('Onboarding — reveal step', () => {
  function reachReveal(onComplete = vi.fn()) {
    render(<Onboarding onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: /begin/i }))
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Alex' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '1990-03-15' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /show me my life/i }))
    return onComplete
  }

  it('shows "weeks remain"', () => {
    reachReveal()
    expect(screen.getByText(/weeks remain/i)).toBeInTheDocument()
  })

  it('shows a non-zero weeks-lived number', () => {
    reachReveal()
    // The big number on the reveal page should be > 1000
    const bigNumbers = screen.getAllByText(/[\d,]+/)
    const values = bigNumbers.map(el => parseInt(el.textContent.replace(/,/g, ''))).filter(n => !isNaN(n))
    expect(values.some(v => v > 1000)).toBe(true)
  })
})
