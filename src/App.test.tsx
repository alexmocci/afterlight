
import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('Afterlight dashboard', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('mostra i progetti iniziali', () => {
    render(<App />)

    expect(screen.getAllByText('Portfolio personale').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Imparare React').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Automazioni Python').length).toBeGreaterThan(0)
  })

  it('aggiorna lo stato dell’attività quando si clicca', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Attività/ }))

    const taskButton = screen.getByRole('button', {
      name: 'Completa Completare la dashboard',
    })

    expect(taskButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(taskButton)

    const updatedButton = screen.getByRole('button', {
      name: 'Segna Completare la dashboard come da fare',
    })

    expect(updatedButton).toHaveAttribute('aria-pressed', 'true')
  })
})
