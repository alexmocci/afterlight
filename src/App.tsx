
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Command,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'

import './index.css'

type Project = {
  id: string
  name: string
  category: string
  progress: number
  color: string
  status: 'In corso' | 'In pausa' | 'Completato'
}

type Task = {
  id: string
  title: string
  projectId: string
  due: string
  completed: boolean
}

const initialProjects: Project[] = [
  {
    id: 'p1',
    name: 'Portfolio personale',
    category: 'Sviluppo web',
    progress: 72,
    color: 'purple',
    status: 'In corso',
  },
  {
    id: 'p2',
    name: 'Imparare React',
    category: 'Apprendimento',
    progress: 48,
    color: 'blue',
    status: 'In corso',
  },
  {
    id: 'p3',
    name: 'Automazioni Python',
    category: 'Scripting',
    progress: 25,
    color: 'orange',
    status: 'In corso',
  },
]

const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Completare la dashboard',
    projectId: 'p1',
    due: 'Oggi',
    completed: false,
  },
  {
    id: 't2',
    title: 'Ripassare gli hook di React',
    projectId: 'p2',
    due: 'Oggi',
    completed: false,
  },
  {
    id: 't3',
    title: 'Sistemare la documentazione',
    projectId: 'p1',
    due: 'Domani',
    completed: true,
  },
  {
    id: 't4',
    title: 'Scrivere uno script di backup',
    projectId: 'p3',
    due: 'Domani',
    completed: false,
  },
]

const storageKey = 'afterlight-workspace-v1'

type WorkspaceData = {
  projects: Project[]
  tasks: Task[]
}

function loadWorkspace(): WorkspaceData {
  try {
    const saved = localStorage.getItem(storageKey)

    if (saved) {
      const parsed: unknown = JSON.parse(saved)

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'projects' in parsed &&
        'tasks' in parsed &&
        Array.isArray(parsed.projects) &&
        Array.isArray(parsed.tasks)
      ) {
        return parsed as WorkspaceData
      }
    }
  } catch {
    // Se i dati salvati non sono leggibili, usiamo i dati iniziali.
  }

  return {
    projects: initialProjects,
    tasks: initialTasks,
  }
}

function App() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(loadWorkspace)
  const [activePage, setActivePage] = useState('Panoramica')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectCategory, setNewProjectCategory] = useState('Sviluppo web')

  const { projects, tasks } = workspace

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(workspace))
    } catch {
      setToast('Salvataggio locale non disponibile in questo browser.')
    }
  }, [workspace])

  useEffect(() => {
    if (!toast) return

    const timeout = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const activeProjects = projects.filter(
    (project) => project.status === 'In corso',
  )

  const completedTasks = tasks.filter((task) => task.completed).length

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesQuery =
        !normalizedQuery ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.category.toLowerCase().includes(normalizedQuery)

      const matchesPage =
        activePage !== 'Completati' || project.status === 'Completato'

      return matchesQuery && matchesPage
    })
  }, [projects, query, activePage])

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return tasks.filter((task) => {
      const projectName =
        projects.find((project) => project.id === task.projectId)?.name ?? ''

      const matchesQuery =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        projectName.toLowerCase().includes(normalizedQuery)

      const matchesPage =
        activePage !== 'Completati' || task.completed

      return matchesQuery && matchesPage
    })
  }, [tasks, projects, query, activePage])

  function showPage(page: string) {
    setActivePage(page)
    setQuery('')
    setSearchOpen(false)
  }

  function toggleTask(taskId: string) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task,
      ),
    }))
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = newProjectName.trim()
    if (!name) return

    const project: Project = {
      id: crypto.randomUUID(),
      name,
      category: newProjectCategory,
      progress: 0,
      color: 'purple',
      status: 'In corso',
    }

    setWorkspace((current) => ({
      ...current,
      projects: [project, ...current.projects],
    }))

    setNewProjectName('')
    setNewProjectCategory('Sviluppo web')
    setModalOpen(false)
    setActivePage('Progetti')
    setQuery('')
    setToast(`Progetto "${name}" creato.`)
  }

  const pageDescription: Record<string, string> = {
    Panoramica: 'Uno spazio tutto tuo, per dare forma alle idee.',
    Progetti: 'Tutto quello su cui stai costruendo qualcosa.',
    Attività: 'Piccoli passi, progressi concreti.',
    Completati: 'Guarda quanta strada hai già fatto.',
    Idee: 'Ogni grande progetto comincia da un pensiero.',
  }

  const visibleTasks =
    activePage === 'Attività' || activePage === 'Completati'
      ? filteredTasks
      : filteredTasks.filter((task) => !task.completed)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={19} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-name">afterlight</div>
            <div className="brand-caption">Personal workspace</div>
          </div>
        </div>

        <div className="nav-label">Workspace</div>

        <nav className="nav-list" aria-label="Navigazione principale">
          <button
            className={`nav-item ${activePage === 'Panoramica' ? 'active' : ''}`}
            onClick={() => showPage('Panoramica')}
          >
            <LayoutDashboard size={16} />
            Panoramica
          </button>
          <button
            className={`nav-item ${activePage === 'Progetti' ? 'active' : ''}`}
            onClick={() => showPage('Progetti')}
          >
            <FolderKanban size={16} />
            Progetti
            <span className="nav-count">{activeProjects.length}</span>
          </button>
          <button
            className={`nav-item ${activePage === 'Attività' ? 'active' : ''}`}
            onClick={() => showPage('Attività')}
          >
            <ListTodo size={16} />
            Attività
            <span className="nav-count">
              {tasks.filter((task) => !task.completed).length}
            </span>
          </button>
          <button
            className={`nav-item ${activePage === 'Completati' ? 'active' : ''}`}
            onClick={() => showPage('Completati')}
          >
            <CheckCheck size={16} />
            Completati
          </button>
          <button
            className={`nav-item ${activePage === 'Idee' ? 'active' : ''}`}
            onClick={() => {
              showPage('Idee')
              setToast('Il tuo spazio idee: aggiungeremo questa funzione nel prossimo step.')
            }}
          >
            <Lightbulb size={16} />
            Idee
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="focus-card">
            <div className="eyebrow">Il tuo prossimo passo</div>
            <p>
              Non serve avere tutto sotto controllo. Basta sapere da dove
              cominciare.
            </p>
            <button
              className="focus-link"
              onClick={() => {
                showPage('Attività')
                setToast('Scegli una piccola attività e inizia da lì.')
              }}
            >
              Trova il focus <ArrowRight size={13} />
            </button>
          </div>

          <div className="profile">
            <div className="avatar">AM</div>
            <div>
              <div className="profile-name">Il mio spazio</div>
              <div className="profile-caption">Piano personale</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            {searchOpen ? (
              <div className="search-field">
                <Search size={15} />
                <input
                  autoFocus
                  aria-label="Cerca progetti e attività"
                  placeholder="Cerca..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button
                  className="search-close"
                  aria-label="Chiudi ricerca"
                  onClick={() => {
                    setSearchOpen(false)
                    setQuery('')
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                className="icon-button"
                aria-label="Apri ricerca"
                title="Cerca (Ctrl+K)"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={16} />
              </button>
            )}

            <button
              className="icon-button"
              aria-label="Notifiche"
              title="Notifiche"
              onClick={() => setToast('Non hai nuove notifiche.')}
            >
              <Bell size={16} />
            </button>

            <button
              className="primary-button"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={15} />
              <span>Nuovo progetto</span>
            </button>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                DOMENICA, 11 OTTOBRE
              </div>
              <h1 className="page-title">
                {activePage === 'Panoramica'
                  ? <>Bentornato<span style={{ color: '#a78bfa' }}>.</span></>
                  : activePage}
              </h1>
              <p className="page-description">
                {pageDescription[activePage]}
              </p>
            </div>

            <div className="date-pill">
              <Activity size={14} />
              <span>Il tuo spazio, il tuo ritmo</span>
            </div>
          </section>

          <section className="stats-grid" aria-label="Statistiche">
            <article className="stat-card">
              <div className="stat-top">
                Progetti attivi
                <div className="stat-icon">
                  <FolderKanban size={15} />
                </div>
              </div>
              <div className="stat-value">{activeProjects.length}</div>
              <div className="stat-foot">
                <span>In movimento</span> · un passo alla volta
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                Attività completate
                <div className="stat-icon">
                  <CheckCheck size={15} />
                </div>
              </div>
              <div className="stat-value">{completedTasks}</div>
              <div className="stat-foot">
                <span>{tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%</span>
                {' '}delle attività totali
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                Progressi medi
                <div className="stat-icon">
                  <TrendingUp size={15} />
                </div>
              </div>
              <div className="stat-value">
                {activeProjects.length
                  ? Math.round(
                      activeProjects.reduce((sum, project) => sum + project.progress, 0) /
                        activeProjects.length,
                    )
                  : 0}%
              </div>
              <div className="stat-foot">Sui progetti in corso</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                Da completare
                <div className="stat-icon">
                  <Target size={15} />
                </div>
              </div>
              <div className="stat-value">
                {tasks.filter((task) => !task.completed).length}
              </div>
              <div className="stat-foot">Il prossimo passo è il più importante</div>
            </article>
          </section>

          <section className="workspace-grid">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">
                    {activePage === 'Panoramica' ? 'I tuoi progetti' : 'Progetti'}
                  </h2>
                  <p className="panel-subtitle">
                    Idee che stanno diventando realtà
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => showPage('Progetti')}
                >
                  Vedi tutti <ArrowRight size={13} />
                </button>
              </div>

              <div className="project-list">
                {filteredProjects.length ? (
                  filteredProjects.map((project) => (
                    <div className="project-row" key={project.id}>
                      <div className="project-symbol">
                        {project.category === 'Apprendimento' ? (
                          <Lightbulb size={17} />
                        ) : project.category === 'Scripting' ? (
                          <Command size={17} />
                        ) : (
                          <FolderKanban size={17} />
                        )}
                      </div>
                      <div className="project-info">
                        <div className="project-name">{project.name}</div>
                        <div className="project-meta">
                          <span className={`status-dot ${project.status === 'Completato' ? 'green' : project.status === 'In pausa' ? 'orange' : ''}`} />
                          {project.category}
                        </div>
                      </div>
                      <div className="project-progress">
                        <div className="progress-label">
                          <span>Progressi</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label={`Progressi ${project.name}`}
                          aria-valuenow={project.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-fill"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    Nessun progetto trovato.
                    <br />
                    Prova un'altra ricerca o creane uno nuovo.
                  </div>
                )}
              </div>

              <div style={{ padding: '0 20px 18px' }}>
                <button
                  className="secondary-button"
                  style={{ width: '100%' }}
                  onClick={() => setModalOpen(true)}
                >
                  <Plus size={14} /> Crea un progetto
                </button>
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Prossime attività</h2>
                  <p className="panel-subtitle">
                    Le cose che meritano la tua attenzione
                  </p>
                </div>
                <button
                  className="text-button"
                  aria-label="Vedi tutte le attività"
                  onClick={() => showPage('Attività')}
                >
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="task-list">
                {visibleTasks.length ? (
                  visibleTasks.map((task) => {
                    const project = projects.find(
                      (item) => item.id === task.projectId,
                    )

                    return (
                      <div className="task-row" key={task.id}>
                        <button
                          className={`task-check ${task.completed ? 'checked' : ''}`}
                          aria-label={
                            task.completed
                              ? `Segna ${task.title} come da fare`
                              : `Completa ${task.title}`
                          }
                          aria-pressed={task.completed}
                          onClick={() => toggleTask(task.id)}
                        >
                          {task.completed && <Check size={12} />}
                        </button>
                        <div className="task-content">
                          <div
                            className={`task-name ${task.completed ? 'completed' : ''}`}
                          >
                            {task.title}
                          </div>
                          <div className="task-project">
                            {project?.name ?? 'Progetto eliminato'}
                          </div>
                        </div>
                        <div className="task-due">{task.due}</div>
                      </div>
                    )
                  })
                ) : (
                  <div className="empty-state">
                    Nessuna attività qui.
                    <br />
                    Per ora puoi concentrarti sul prossimo progetto.
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Il tuo ritmo</h2>
                  <p className="panel-subtitle">
                    Un promemoria: la costanza conta più della fretta.
                  </p>
                </div>
                <div className="stat-icon">
                  <Activity size={15} />
                </div>
              </div>
              <div className="activity-content">
                <div className="activity-chart" aria-label="Grafico dimostrativo dell'attività settimanale">
                  {[
                    { day: 'Lun', a: 35, b: 55 },
                    { day: 'Mar', a: 60, b: 42 },
                    { day: 'Mer', a: 42, b: 74 },
                    { day: 'Gio', a: 72, b: 52 },
                    { day: 'Ven', a: 48, b: 85 },
                    { day: 'Sab', a: 30, b: 45 },
                    { day: 'Dom', a: 58, b: 68 },
                  ].map((item) => (
                    <div className="chart-day" key={item.day}>
                      <div className="chart-bars">
                        <div className="chart-bar" style={{ height: `${item.a}%` }} />
                        <div className="chart-bar secondary" style={{ height: `${item.b}%` }} />
                      </div>
                      <span className="chart-day-label">{item.day}</span>
                    </div>
                  ))}
                </div>
                <p className="panel-subtitle" style={{ marginTop: 13 }}>
                  Anteprima visiva dimostrativa, non dati storici reali.
                </p>
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Una cosa alla volta</h2>
                  <p className="panel-subtitle">Un pensiero da tenere con te</p>
                </div>
                <div className="stat-icon">
                  <Sparkles size={15} />
                </div>
              </div>
              <div className="quote-content">
                <div className="quote-mark">“</div>
                <p className="quote-text">
                  Non devi vedere tutta la scala. Fai semplicemente il primo
                  passo.
                </p>
                <div className="quote-author">IL TUO PROMEMORIA DI OGGI</div>
              </div>
            </article>
          </section>

          <footer style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 25,
            color: '#686877',
            fontSize: 10,
          }}>
            <span>AFTERLIGHT © 2026</span>
            <span>Costruito un passo alla volta.</span>
          </footer>
        </div>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false)
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">NUOVO INIZIO</div>
                <h2 id="modal-title">Crea un progetto</h2>
                <p>Le idee prendono forma quando dai loro un nome.</p>
              </div>
              <button
                className="icon-button"
                aria-label="Chiudi"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={createProject}>
              <label className="form-label" htmlFor="project-name">
                Nome del progetto
              </label>
              <input
                id="project-name"
                className="form-input"
                autoFocus
                maxLength={70}
                placeholder="Es. Il mio prossimo progetto..."
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                required
              />

              <label className="form-label" htmlFor="project-category">
                Categoria
              </label>
              <select
                id="project-category"
                className="form-input"
                value={newProjectCategory}
                onChange={(event) => setNewProjectCategory(event.target.value)}
              >
                <option>Sviluppo web</option>
                <option>Apprendimento</option>
                <option>Scripting</option>
                <option>Personale</option>
                <option>Altro</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalOpen(false)}
                >
                  Annulla
                </button>
                <button type="submit" className="primary-button">
                  <Plus size={14} /> Crea progetto
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Sparkles size={15} color="#c4b5fd" />
          {toast}
          <button
            className="search-close"
            aria-label="Chiudi messaggio"
            onClick={() => setToast('')}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

export default App
