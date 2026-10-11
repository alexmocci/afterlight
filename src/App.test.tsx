
import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import {
  getLocalDate,
  serializeWorkspace,
  storageKey,
  type WorkspaceData,
} from './lib/workspace'

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

    fireEvent.click(screen.getByRole('button', { name: /^Attività/ }))

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
      name: 'Cerca progetti, attività e idee',
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
  const corruptedWorkspace = '{json non valido'
  localStorage.setItem('afterlight-workspace-v1', corruptedWorkspace)

  render(<App />)

  expect(screen.getAllByText('Portfolio personale').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Imparare React').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Automazioni Python').length).toBeGreaterThan(0)
  expect(screen.getByRole('alert')).toHaveTextContent('non sono leggibili')
  expect(localStorage.getItem('afterlight-workspace-v1')).toBe(corruptedWorkspace)
})

it('conserva i dati corrotti prima di sovrascriverli dopo una modifica esplicita', () => {
  const corruptedWorkspace = '{json non valido'
  localStorage.setItem('afterlight-workspace-v1', corruptedWorkspace)

  render(<App />)
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Completa Completare la dashboard',
    }),
  )

  const recoveryKeys = Object.keys(localStorage).filter((key) =>
    key.startsWith('afterlight-workspace-v1-recovery-'),
  )
  expect(recoveryKeys).toHaveLength(1)
  expect(localStorage.getItem(recoveryKeys[0])).toBe(corruptedWorkspace)
  expect(
    JSON.parse(localStorage.getItem('afterlight-workspace-v1')!).tasks,
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: 'Completare la dashboard',
        completed: true,
      }),
    ]),
  )
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

it('crea un’attività con data reale, priorità e progetto facoltativo', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /^Attività/ }))
  fireEvent.click(screen.getByText('Aggiungi attività'))

  fireEvent.change(screen.getByLabelText('Titolo attività'), {
    target: { value: 'Preparare la release' },
  })
  fireEvent.change(screen.getByLabelText('Progetto nuova attività'), {
    target: { value: '' },
  })
  fireEvent.change(screen.getByLabelText('Scadenza nuova attività'), {
    target: { value: '2026-10-20' },
  })
  fireEvent.change(screen.getByLabelText('Priorità nuova attività'), {
    target: { value: 'Urgente' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Crea attività/i }))

  expect(screen.getByText('Preparare la release')).toBeInTheDocument()
  expect(screen.getByText('Urgente', { selector: '.task-priority' })).toBeInTheDocument()
  expect(screen.getByText('Senza progetto', { selector: '.task-project' })).toBeInTheDocument()
  const savedWorkspace = JSON.parse(
    localStorage.getItem('afterlight-workspace-v1')!,
  )
  expect(savedWorkspace.tasks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: 'Preparare la release',
        projectId: '',
        dueDate: '2026-10-20',
        priority: 'Urgente',
      }),
    ]),
  )
})

it('modifica e salva titolo, scadenza e priorità di un’attività', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /^Attività/ }))
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Modifica Completare la dashboard',
    }),
  )
  fireEvent.change(screen.getByPlaceholderText('Titolo attività'), {
    target: { value: 'Dashboard aggiornata' },
  })
  fireEvent.change(screen.getByLabelText('Scadenza attività'), {
    target: { value: '2026-10-30' },
  })
  fireEvent.change(screen.getByLabelText('Priorità attività'), {
    target: { value: 'Urgente' },
  })
  fireEvent.click(screen.getByRole('button', { name: /^Salva$/i }))

  expect(screen.getByText('Dashboard aggiornata')).toBeInTheDocument()
  const savedWorkspace = JSON.parse(
    localStorage.getItem(storageKey)!,
  )
  expect(savedWorkspace.tasks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: 'Dashboard aggiornata',
        dueDate: '2026-10-30',
        priority: 'Urgente',
      }),
    ]),
  )
})

it('modifica stato e avanzamento del progetto', () => {
  render(<App />)
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Modifica progetto Portfolio personale',
    }),
  )
  fireEvent.change(screen.getByLabelText('Nome del progetto'), {
    target: { value: 'Portfolio aggiornato' },
  })
  fireEvent.change(screen.getByLabelText('Stato'), {
    target: { value: 'Completato' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Salva modifiche/i }))

  expect(screen.getAllByText('Portfolio aggiornato').length).toBeGreaterThan(0)
  expect(screen.getByText('100%')).toBeInTheDocument()
  const savedWorkspace = JSON.parse(
    localStorage.getItem('afterlight-workspace-v1')!,
  )
  expect(savedWorkspace.projects).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'Portfolio aggiornato',
        status: 'Completato',
        progress: 100,
      }),
    ]),
  )
  fireEvent.click(screen.getByRole('button', { name: /^Progetti/ }))
  fireEvent.change(screen.getByLabelText('Filtra progetti per stato'), {
    target: { value: 'Completato' },
  })
  expect(screen.getAllByText('Portfolio aggiornato').length).toBeGreaterThan(0)
})

it('conferma la cancellazione del progetto e conserva le attività scollegate', () => {
  render(<App />)
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Elimina progetto Portfolio personale',
    }),
  )
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Elimina progetto' }))

  expect(screen.queryByText('Portfolio personale')).not.toBeInTheDocument()
  expect(
    screen.getByText('Senza progetto', { selector: '.task-project' }),
  ).toBeInTheDocument()
  const savedWorkspace = JSON.parse(
    localStorage.getItem('afterlight-workspace-v1')!,
  )
  expect(savedWorkspace.projects).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'p1' }),
    ]),
  )
  expect(savedWorkspace.tasks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 't1',
        projectId: '',
      }),
    ]),
  )
})

it('gestisce focus e chiusura da tastiera nel dialog di conferma', () => {
  render(<App />)
  const trigger = screen.getByRole('button', {
    name: 'Elimina progetto Portfolio personale',
  })
  fireEvent.click(trigger)

  const dialog = screen.getByRole('alertdialog')
  const cancelButton = screen.getByRole('button', { name: 'Annulla' })
  const closeButton = screen.getByRole('button', { name: 'Chiudi dialog' })
  const confirmButton = screen.getByRole('button', { name: 'Elimina progetto' })
  expect(cancelButton).toHaveFocus()

  confirmButton.focus()
  fireEvent.keyDown(confirmButton, { key: 'Tab' })
  expect(closeButton).toHaveFocus()

  fireEvent.keyDown(window, { key: 'Escape' })
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
  expect(dialog).not.toBeInTheDocument()
})

it('filtra le attività per stato, progetto e priorità', () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      projects: [
        {
          id: 'p1',
          name: 'Progetto uno',
          category: 'Personale',
          progress: 10,
          color: 'purple',
          status: 'In corso',
        },
        {
          id: 'p2',
          name: 'Progetto due',
          category: 'Personale',
          progress: 10,
          color: 'purple',
          status: 'In corso',
        },
      ],
      tasks: [
        {
          id: 'late',
          title: 'Attività urgente scaduta',
          projectId: 'p1',
          dueDate: getLocalDate(-1),
          priority: 'Urgente',
          completed: false,
        },
        {
          id: 'future',
          title: 'Attività bassa futura',
          projectId: 'p2',
          dueDate: getLocalDate(2),
          priority: 'Bassa',
          completed: false,
        },
        {
          id: 'done',
          title: 'Attività completata',
          projectId: 'p1',
          dueDate: getLocalDate(-2),
          priority: 'Alta',
          completed: true,
        },
      ],
    }),
  )

  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /^Attività/ }))
  fireEvent.change(screen.getByLabelText('Filtra attività per stato'), {
    target: { value: 'Scadute' },
  })

  expect(screen.getByText('Attività urgente scaduta')).toBeInTheDocument()
  expect(screen.queryByText('Attività bassa futura')).not.toBeInTheDocument()
  expect(screen.queryByText('Attività completata')).not.toBeInTheDocument()

  fireEvent.change(screen.getByLabelText('Filtra attività per stato'), {
    target: { value: 'Da fare' },
  })
  fireEvent.change(screen.getByLabelText('Filtra attività per progetto'), {
    target: { value: 'p2' },
  })
  fireEvent.change(screen.getByLabelText('Filtra attività per priorità'), {
    target: { value: 'Bassa' },
  })

  expect(screen.getByText('Attività bassa futura')).toBeInTheDocument()
  expect(screen.queryByText('Attività urgente scaduta')).not.toBeInTheDocument()
})

it('mostra l’anteprima di importazione e sostituisce i dati solo dopo la conferma', async () => {
  const currentWorkspace = {
    projects: [
      {
        id: 'current',
        name: 'Workspace attuale',
        category: 'Personale',
        progress: 10,
        color: 'purple',
        status: 'In corso',
      },
    ],
    tasks: [],
    ideas: [],
  }
  localStorage.setItem(storageKey, JSON.stringify(currentWorkspace))
  const existingData = localStorage.getItem(storageKey)
  const importedWorkspace: WorkspaceData = {
    projects: [
      {
        id: 'imported',
        name: 'Workspace importato',
        category: 'Scripting',
        progress: 40,
        color: 'blue',
        status: 'In corso',
      },
    ],
    tasks: [],
    ideas: [],
  }
  const file = new File(
    [serializeWorkspace(importedWorkspace)],
    'afterlight-backup.json',
    { type: 'application/json' },
  )

  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Dati' }))
  fireEvent.change(screen.getByLabelText('Seleziona file workspace JSON'), {
    target: { files: [file] },
  })

  const preview = await screen.findByRole('region', {
    name: 'Anteprima workspace da importare',
  })
  expect(preview).toHaveTextContent('1 progetto')
  expect(localStorage.getItem(storageKey)).toBe(existingData)

  fireEvent.click(
    screen.getByRole('button', { name: 'Importa e sostituisci' }),
  )
  expect(
    JSON.parse(localStorage.getItem(storageKey)!).projects[0].name,
  ).toBe('Workspace importato')
})

it('non modifica i dati correnti con un file non valido o un import annullato', async () => {
  const currentWorkspace = {
    projects: [],
    tasks: [],
    ideas: [],
  }
  localStorage.setItem(storageKey, JSON.stringify(currentWorkspace))
  const originalData = localStorage.getItem(storageKey)
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Dati' }))
  const fileInput = screen.getByLabelText('Seleziona file workspace JSON')

  fireEvent.change(fileInput, {
    target: { files: [new File(['non json'], 'broken.json')] },
  })
  expect(await screen.findByRole('alert')).toHaveTextContent('JSON valido')
  expect(localStorage.getItem(storageKey)).toBe(originalData)

  const candidate: WorkspaceData = {
    projects: [],
    tasks: [],
    ideas: [
      {
        id: 'candidate',
        title: 'Idea non importata',
        description: '',
        createdAt: '2026-10-01T10:00:00.000Z',
      },
    ],
  }
  fireEvent.change(fileInput, {
    target: { files: [new File([serializeWorkspace(candidate)], 'valid.json')] },
  })
  expect(
    await screen.findByRole('region', { name: 'Anteprima workspace da importare' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Annulla' }))

  expect(localStorage.getItem(storageKey)).toBe(originalData)
  expect(screen.queryByText('Idea non importata')).not.toBeInTheDocument()
})

it('include le idee nei risultati della ricerca globale', () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      projects: [],
      tasks: [],
      ideas: [
        {
          id: 'idea-search',
          title: 'App per leggere',
          description: 'Un diario di lettura personale.',
          createdAt: '2026-10-01T10:00:00.000Z',
        },
      ],
    }),
  )
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Apri ricerca' }))
  fireEvent.change(
    screen.getByRole('textbox', {
      name: 'Cerca progetti, attività e idee',
    }),
    { target: { value: 'diario di lettura' } },
  )

  expect(screen.getByRole('region', { name: 'Risultati idee' })).toHaveTextContent(
    'App per leggere',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Apri idee' }))
  expect(screen.getByRole('heading', { level: 1, name: 'Idee' })).toBeInTheDocument()
  expect(screen.getByText('App per leggere')).toBeInTheDocument()
})

it('gestisce il drawer mobile con tastiera, backdrop e selezione sezione', async () => {
  const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  const mediaListeners = new Set<EventListener>()
  let isMobileViewport = true
  const mediaQueryList = {
    get matches() {
      return isMobileViewport
    },
    media: '(max-width: 700px)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === 'function') mediaListeners.add(listener)
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === 'function') mediaListeners.delete(listener)
    },
    dispatchEvent: (event: Event) => {
      mediaListeners.forEach((listener) => listener(event))
      return true
    },
  } satisfies MediaQueryList
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => mediaQueryList,
  })

  try {
    const { container } = render(<App />)
    const menuButton = container.querySelector<HTMLButtonElement>(
      '.mobile-menu-toggle',
    )!
    const drawerCloseButton = container.querySelector<HTMLButtonElement>(
      '.mobile-nav-close',
    )!
    menuButton.style.display = 'grid'
    drawerCloseButton.style.display = 'grid'

    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(drawerCloseButton).toHaveFocus())
    expect(document.querySelector('main')).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(drawerCloseButton, { key: 'Tab', shiftKey: true })
    expect(container.querySelector('.focus-link')).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(drawerCloseButton).toHaveFocus()

    fireEvent.keyDown(drawerCloseButton, { key: 'Escape' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveFocus()
    expect(document.body.style.overflow).toBe('')

    fireEvent.click(menuButton)
    const backdrop = container.querySelector<HTMLButtonElement>(
      '.mobile-nav-backdrop',
    )!
    backdrop.style.display = 'block'
    fireEvent.click(backdrop)
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(menuButton)
    fireEvent.click(container.querySelectorAll('.nav-item')[1])
    expect(screen.getByRole('heading', { level: 1, name: 'Progetti' })).toBeInTheDocument()
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(menuButton)
    isMobileViewport = false
    mediaQueryList.dispatchEvent(new Event('change'))
    await waitFor(() => {
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(document.querySelector('main')).not.toHaveAttribute('inert')
      expect(document.body.style.overflow).toBe('')
    })

    isMobileViewport = true
    mediaQueryList.dispatchEvent(new Event('change'))
    await waitFor(() => expect(menuButton).toHaveAttribute('aria-expanded', 'false'))
  } finally {
    cleanup()
    if (matchMediaDescriptor) {
      Object.defineProperty(window, 'matchMedia', matchMediaDescriptor)
    } else {
      Reflect.deleteProperty(window, 'matchMedia')
    }
  }
})

})
