
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

  
  it('permette di creare un nuovo progetto', () => {
    render(<App />)

    fireEvent.click(
      screen.getByRole('button', { name: /nuovo progetto/i }),
    )

    fireEvent.change(screen.getByLabelText('Nome del progetto'), {
      target: { value: 'Progetto di prova' },
    })

    fireEvent.change(screen.getByLabelText('Categoria'), {
      target: { value: 'Scripting' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: /crea progetto/i }),
    )

    expect(screen.getByText('Progetto di prova')).toBeInTheDocument()
    expect(
      screen.getByText('Progetto "Progetto di prova" creato.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Progetti' }),
    ).toBeInTheDocument()
  })

  it('filtra i progetti in base alla ricerca', () => {
  render(<App />)

  fireEvent.click(
    screen.getByRole('button', { name: 'Apri ricerca' }),
  )

  fireEvent.change(
    screen.getByRole('textbox', {
      name: 'Cerca progetti e attività',
    }),
    { target: { value: 'Python' } },
  )

  expect(screen.getAllByText('Automazioni Python').length).toBeGreaterThan(0)
  expect(screen.queryByText('Portfolio personale')).not.toBeInTheDocument()
})

it('salva i nuovi progetti in localStorage', async () => {
  render(<App />)

  fireEvent.click(
    screen.getByRole('button', { name: /nuovo progetto/i }),
  )

  fireEvent.change(screen.getByLabelText('Nome del progetto'), {
    target: { value: 'Progetto persistente' },
  })

  fireEvent.click(
    screen.getByRole('button', { name: /crea progetto/i }),
  )

  expect(
    await screen.findByText('Progetto persistente'),
  ).toBeInTheDocument()

  const savedWorkspace = JSON.parse(
    localStorage.getItem('afterlight-workspace-v1')!,
  )

  expect(savedWorkspace.projects).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'Progetto persistente',
        category: 'Sviluppo web',
        status: 'In corso',
      }),
    ]),
  )
})

it('ripristina i progetti salvati al caricamento', () => {
  localStorage.setItem(
    'afterlight-workspace-v1',
    JSON.stringify({
      projects: [
        {
          id: 'saved-1',
          name: 'Progetto recuperato',
          category: 'Scripting',
          progress: 0,
          color: 'purple',
          status: 'In corso',
        },
      ],
      tasks: [],
    }),
  )

  render(<App />)

  expect(
    screen.getByText('Progetto recuperato'),
  ).toBeInTheDocument()

  expect(
    screen.queryByText('Portfolio personale'),
  ).not.toBeInTheDocument()
})


it('gestisce dati salvati non validi senza bloccare la dashboard', () => {
  localStorage.setItem('afterlight-workspace-v1', '{json non valido')

  render(<App />)

  expect(screen.getAllByText('Portfolio personale').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Imparare React').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Automazioni Python').length).toBeGreaterThan(0)
})


it('salva in localStorage lo stato aggiornato delle attività', () => {
  render(<App />)

  fireEvent.click(
    screen.getByRole('button', {
      name: 'Completa Completare la dashboard',
    }),
  )

  const savedWorkspace = JSON.parse(
    localStorage.getItem('afterlight-workspace-v1')!,
  )

  expect(savedWorkspace.tasks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: 'Completare la dashboard',
        completed: true,
      }),
    ]),
  )
})


})
