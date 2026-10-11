import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Activity,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  Database,
  Download,
  FileUp,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import './index.css'
import {
  formatTaskDueDate,
  getLocalDate,
  isProjectStatus,
  isTaskOverdue,
  isTaskPriority,
  loadWorkspace,
  parseWorkspaceImport,
  saveWorkspace,
  serializeWorkspace,
  type Idea,
  type Project,
  type Task,
  type TaskPriority,
  type WorkspaceData,
} from './lib/workspace'

const todayLabel = new Date()
  .toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  .toLocaleUpperCase('it-IT')

function App() {
  const [loadResult] = useState(loadWorkspace)
  const [workspace, setWorkspace] = useState<WorkspaceData>(loadResult.workspace)
  const [storageMessage, setStorageMessage] = useState(loadResult.warning)
  const recoveryData = useRef(loadResult.recoveryData)
  const initialWorkspace = useRef(loadResult.workspace)
  const [activePage, setActivePage] = useState('Panoramica')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectCategory, setNewProjectCategory] = useState('Sviluppo web')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [projectStatus, setProjectStatus] = useState<Project['status']>('In corso')
  const [projectProgress, setProjectProgress] = useState(0)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [projectStatusFilter, setProjectStatusFilter] = useState('Tutti')
  const [projectSort, setProjectSort] = useState('Nome')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskProjectId, setNewTaskProjectId] = useState(
    () => loadResult.workspace.projects[0]?.id ?? '',
  )
  const [newTaskDueDate, setNewTaskDueDate] = useState(getLocalDate)
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Media')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskProjectId, setEditTaskProjectId] = useState('')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>('Media')
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [taskStatusFilter, setTaskStatusFilter] = useState('Tutte')
  const [taskProjectFilter, setTaskProjectFilter] = useState('Tutti')
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('Tutte')
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaDescription, setIdeaDescription] = useState('')
  const [ideaSearch, setIdeaSearch] = useState('')
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null)
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null)
  const dialogReturnFocus = useRef<HTMLElement | null>(null)
  const importFileInput = useRef<HTMLInputElement>(null)
  const [importCandidate, setImportCandidate] = useState<WorkspaceData | null>(null)
  const [importError, setImportError] = useState('')

  const { projects, tasks, ideas } = workspace
  useEffect(() => {
    if (workspace === initialWorkspace.current) return
    const result = saveWorkspace(workspace, recoveryData.current)
    if (result.ok) {
      recoveryData.current = null
      setStorageMessage(null)
    } else {
      setStorageMessage(result.error)
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
        setDeletingProjectId(null)
        setDeletingTaskId(null)
        setDeletingIdeaId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  useEffect(() => {
    if (!modalOpen && !deletingProjectId && !deletingTaskId && !deletingIdeaId) {
      return
    }

    const dialog = document.querySelector<HTMLElement>(
      '[role="dialog"], [role="alertdialog"]',
    )
    if (!dialog) return

    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(focusableSelector),
    )
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const initialFocus =
      dialog.querySelector<HTMLElement>('[autofocus]') ??
      dialog.querySelector<HTMLElement>('.modal-actions .secondary-button') ??
      focusable[0]
    initialFocus?.focus()

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', trapFocus)
    return () => {
      document.removeEventListener('keydown', trapFocus)
      const returnTarget = dialogReturnFocus.current ?? previousFocus
      dialogReturnFocus.current = null
      if (returnTarget?.isConnected) returnTarget.focus()
    }
  }, [modalOpen, deletingProjectId, deletingTaskId, deletingIdeaId])
  function rememberDialogTrigger(event: MouseEvent<HTMLButtonElement>) {
    dialogReturnFocus.current = event.currentTarget
  }
  const activeProjects = projects.filter(
    (project) => project.status === 'In corso',
  )
  const completedTasks = tasks.filter((task) => task.completed).length
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task)).length
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
  const displayedProjects = useMemo(() => {
    if (activePage !== 'Progetti') return filteredProjects
    const matchingProjects = filteredProjects.filter(
      (project) =>
        projectStatusFilter === 'Tutti' || project.status === projectStatusFilter,
    )
    return matchingProjects.sort((first, second) =>
      projectSort === 'Progressi'
        ? second.progress - first.progress
        : first.name.localeCompare(second.name, 'it'),
    )
  }, [filteredProjects, activePage, projectStatusFilter, projectSort])
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

  const filteredIdeas = useMemo(() => {
    const searchTerms = [ideaSearch, query]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
    if (searchTerms.length === 0) return ideas

    return ideas.filter(
      (idea) => {
        const searchableText = `${idea.title} ${idea.description}`.toLowerCase()
        return searchTerms.every((term) => searchableText.includes(term))
      },
    )
  }, [ideas, ideaSearch, query])

  function showPage(page: string) {
    setActivePage(page)
    setQuery('')
    setSearchOpen(false)
  }
  function toggleTask(taskId: string) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    }))
  }
  function startEditingTask(task: Task) {
    setEditingTaskId(task.id)
    setEditTaskTitle(task.title)
    setEditTaskProjectId(
      projects.some((project) => project.id === task.projectId)
        ? task.projectId
        : '',
    )
    setEditTaskDueDate(task.dueDate)
    setEditTaskPriority(task.priority)
    setDeletingTaskId(null)
  }
  function cancelEditingTask() {
    setEditingTaskId(null)
    setEditTaskTitle('')
    setEditTaskProjectId('')
    setEditTaskDueDate('')
    setEditTaskPriority('Media')
  }
  function saveEditedTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = editTaskTitle.trim()
    if (!title) {
      setToast('Inserisci un titolo per l’attività.')
      return
    }
    if (!editingTaskId) return
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title,
              projectId: editTaskProjectId,
              due: editTaskDueDate || 'Senza scadenza',
              dueDate: editTaskDueDate,
              priority: editTaskPriority,
            }
          : task,
      ),
    }))
    cancelEditingTask()
    setToast('Attività aggiornata.')
  }
  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) {
      setToast('Inserisci un titolo per l’attività.')
      return
    }
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      projectId: newTaskProjectId,
      due: newTaskDueDate || 'Senza scadenza',
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      completed: false,
    }
    setWorkspace((current) => ({
      ...current,
      tasks: [task, ...current.tasks],
    }))
    setNewTaskTitle('')
    setNewTaskDueDate(getLocalDate())
    setNewTaskPriority('Media')
    setToast('Attività creata.')
  }
  function deleteTask(taskId: string) {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }))
    if (editingTaskId === taskId) {
      cancelEditingTask()
    }
    setDeletingTaskId(null)
    setToast('Attività eliminata.')
  }
  function startCreatingProject() {
    setEditingProjectId(null)
    setNewProjectName('')
    setNewProjectCategory('Sviluppo web')
    setProjectStatus('In corso')
    setProjectProgress(0)
    setModalOpen(true)
  }
  function startEditingProject(project: Project) {
    setEditingProjectId(project.id)
    setNewProjectName(project.name)
    setNewProjectCategory(project.category)
    setProjectStatus(project.status)
    setProjectProgress(project.progress)
    setModalOpen(true)
  }
  function closeProjectModal() {
    setModalOpen(false)
    setEditingProjectId(null)
  }
  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newProjectName.trim()
    if (!name) {
      setToast('Inserisci un nome per il progetto.')
      return
    }
    if (editingProjectId) {
      setWorkspace((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === editingProjectId
            ? {
                ...project,
                name,
                category: newProjectCategory.trim() || 'Altro',
                status: projectStatus,
                progress: projectStatus === 'Completato' ? 100 : projectProgress,
              }
            : project,
        ),
      }))
      closeProjectModal()
      setToast(`Progetto "${name}" aggiornato.`)
      return
    }
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      category: newProjectCategory,
      progress: projectStatus === 'Completato' ? 100 : projectProgress,
      color: 'purple',
      status: projectStatus,
    }
    setWorkspace((current) => ({
      ...current,
      projects: [project, ...current.projects],
    }))
    setNewProjectName('')
    setNewProjectCategory('Sviluppo web')
    closeProjectModal()
    setActivePage('Progetti')
    setQuery('')
    setToast(`Progetto "${name}" creato.`)
  }
  function deleteProject(projectId: string) {
    const remainingProjects = projects.filter((project) => project.id !== projectId)
    setWorkspace((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.id !== projectId),
      tasks: current.tasks.map((task) =>
        task.projectId === projectId ? { ...task, projectId: '' } : task,
      ),
    }))
    if (newTaskProjectId === projectId) {
      setNewTaskProjectId(remainingProjects[0]?.id ?? '')
    }
    if (editTaskProjectId === projectId) setEditTaskProjectId('')
    setDeletingProjectId(null)
    setToast('Progetto eliminato. Le attività collegate sono state conservate senza progetto.')
  }
  function resetIdeaForm() {
    setIdeaTitle('')
    setIdeaDescription('')
    setEditingIdeaId(null)
  }

  function saveIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = ideaTitle.trim()
    const description = ideaDescription.trim()

    if (!title) {
      setToast('Inserisci un titolo per l’idea.')
      return
    }

    if (editingIdeaId) {
      setWorkspace((current) => ({
        ...current,
        ideas: current.ideas.map((idea) =>
          idea.id === editingIdeaId ? { ...idea, title, description } : idea,
        ),
      }))
      setToast('Idea aggiornata.')
    } else {
      const newIdea: Idea = {
        id: crypto.randomUUID(),
        title,
        description,
        createdAt: new Date().toISOString(),
      }
      setWorkspace((current) => ({
        ...current,
        ideas: [newIdea, ...current.ideas],
      }))
      setToast('Idea salvata.')
    }

    resetIdeaForm()
  }

  function startEditingIdea(idea: Idea) {
    setEditingIdeaId(idea.id)
    setIdeaTitle(idea.title)
    setIdeaDescription(idea.description)
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function deleteIdea(ideaId: string) {
    setWorkspace((current) => ({
      ...current,
      ideas: current.ideas.filter((idea) => idea.id !== ideaId),
    }))
    if (editingIdeaId === ideaId) resetIdeaForm()
    setDeletingIdeaId(null)
    setToast('Idea eliminata.')
  }
  function exportWorkspace() {
    let downloadUrl: string | null = null
    try {
      const file = new Blob([serializeWorkspace(workspace)], {
        type: 'application/json',
      })
      const objectUrl = URL.createObjectURL(file)
      downloadUrl = objectUrl
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `afterlight-workspace-${getLocalDate()}.json`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
      setToast('Workspace esportato.')
    } catch {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
      setImportError('Impossibile creare il file di esportazione.')
    }
  }
  function readImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setImportError('')
    setImportCandidate(null)
    if (file.size > 10 * 1024 * 1024) {
      setImportError('Il file supera il limite massimo di 10 MB.')
      return
    }
    const reader = new FileReader()
    reader.onerror = () => {
      setImportError('Impossibile leggere il file selezionato.')
    }
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setImportError('Il file selezionato non contiene testo leggibile.')
        return
      }
      const result = parseWorkspaceImport(reader.result)
      if (result.error || !result.workspace) {
        setImportError(result.error ?? 'Il workspace nel file non è valido.')
        return
      }
      setImportCandidate(result.workspace)
    }
    try {
      reader.readAsText(file)
    } catch {
      setImportError('Impossibile leggere il file selezionato.')
    }
  }
  function confirmImport() {
    if (!importCandidate) return
    const result = saveWorkspace(importCandidate, recoveryData.current)
    if (!result.ok) {
      setStorageMessage(result.error)
      setImportError(result.error ?? 'Impossibile salvare il workspace importato.')
      return
    }
    recoveryData.current = null
    initialWorkspace.current = importCandidate
    setWorkspace(importCandidate)
    setNewTaskProjectId(importCandidate.projects[0]?.id ?? '')
    cancelEditingTask()
    resetIdeaForm()
    setStorageMessage(null)
    setImportCandidate(null)
    setImportError('')
    setToast('Workspace importato.')
  }

  const pageDescription: Record<string, string> = {
    Panoramica: 'Uno spazio tutto tuo, per dare forma alle idee.',
    Progetti: 'Tutto quello su cui stai costruendo qualcosa.',
    Attività: 'Piccoli passi, progressi concreti.',
    Completati: 'Guarda quanta strada hai già fatto.',
    Idee: 'Ogni grande progetto comincia da un pensiero.',
    Dati: 'Esporta o ripristina una copia del tuo workspace.',
  }
  const visibleTasks =
    activePage === 'Attività' || activePage === 'Completati'
      ? filteredTasks
      : filteredTasks.filter((task) => !task.completed)
  const displayedTasks = visibleTasks.filter((task) => {
    if (activePage !== 'Attività') return true
    const statusMatches =
      taskStatusFilter === 'Tutte' ||
      (taskStatusFilter === 'Da fare' && !task.completed) ||
      (taskStatusFilter === 'Completate' && task.completed) ||
      (taskStatusFilter === 'Scadute' && isTaskOverdue(task))
    const projectMatches =
      taskProjectFilter === 'Tutti' || task.projectId === taskProjectFilter
    const priorityMatches =
      taskPriorityFilter === 'Tutte' || task.priority === taskPriorityFilter
    return statusMatches && projectMatches && priorityMatches
  })
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
            onClick={() => showPage('Idee')}
          >
            <Lightbulb size={16} />
            Idee
            <span className="nav-count">{ideas.length}</span>
          </button>
          <button
            className={`nav-item ${activePage === 'Dati' ? 'active' : ''}`}
            onClick={() => showPage('Dati')}
          >
            <Database size={16} />
            Dati
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
                  aria-label="Cerca progetti, attività e idee"
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
              className="primary-button"
              aria-label="Nuovo progetto"
              onClick={(event) => {
                rememberDialogTrigger(event)
                startCreatingProject()
              }}
            >
              <Plus size={15} />
              <span>Nuovo progetto</span>
            </button>
          </div>
        </header>
        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">{todayLabel}</div>
              <h1 className="page-title">
                {activePage === 'Panoramica' ? (
                  <>
                    Bentornato
                    <span style={{ color: '#a78bfa' }}>.</span>
                  </>
                ) : (
                  activePage
                )}
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
          {storageMessage && (
            <div className="storage-warning" role="alert">
              {storageMessage}
            </div>
          )}
          {activePage === 'Idee' ? (
            <section className="ideas-page" aria-label="Archivio idee">
              {projects.length > 0 && (
                <article className="panel project-preview-panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Progetti in corso</h2>
                      <p className="panel-subtitle">Continua da dove eri rimasto.</p>
                    </div>
                    <div className="stat-icon">
                      <FolderKanban size={16} />
                    </div>
                  </div>
                  <div className="project-list">
                    {projects.map((project) => (
                      <div className="project-row" key={project.id}>
                        <div className="project-symbol">
                          <FolderKanban size={17} />
                        </div>
                        <div className="project-info">
                          <div className="project-name">{project.name}</div>
                          <div className="project-meta">
                            <span>{project.category}</span>
                            <span className={`status-dot ${project.status === 'Completato' ? 'green' : project.status === 'In pausa' ? 'orange' : ''}`} />
                            <span>{project.status}</span>
                          </div>
                        </div>
                        <div className="project-progress">
                          <div className="progress-label">
                            <span>Progresso</span>
                            <strong>{project.progress}%</strong>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="project-actions">
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={`Modifica progetto ${project.name}`}
                            title="Modifica progetto"
                            onClick={(event) => {
                              rememberDialogTrigger(event)
                              startEditingProject(project)
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={`Elimina progetto ${project.name}`}
                            title="Elimina progetto"
                            onClick={(event) => {
                              rememberDialogTrigger(event)
                              setDeletingProjectId(project.id)
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              <article className="panel" style={{ marginBottom: 22 }}>
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">
                      {editingIdeaId ? 'Modifica idea' : 'Cattura un’idea'}
                    </h2>
                    <p className="panel-subtitle">
                      Annota uno spunto e ritrovalo quando vuoi.
                    </p>
                  </div>
                  <div className="stat-icon">
                    <Lightbulb size={16} />
                  </div>
                </div>

                <form className="idea-form" onSubmit={saveIdea}>
                  <label className="form-label" htmlFor="idea-title">
                    Titolo
                  </label>
                  <input
                    id="idea-title"
                    className="form-input"
                    value={ideaTitle}
                    onChange={(event) => setIdeaTitle(event.target.value)}
                    placeholder="Es. Una nuova funzionalità per Afterlight"
                    maxLength={120}
                    required
                  />

                  <label className="form-label" htmlFor="idea-description">
                    Descrizione{' '}
                    <span style={{ color: '#858599', fontSize: 10, marginLeft: 6 }}>
                      OPZIONALE
                    </span>
                  </label>
                  <textarea
                    id="idea-description"
                    className="form-input"
                    value={ideaDescription}
                    onChange={(event) => setIdeaDescription(event.target.value)}
                    placeholder="Aggiungi dettagli, possibili utilizzi o prossimi passi..."
                    rows={4}
                    maxLength={2000}
                    style={{ resize: 'vertical', minHeight: 100 }}
                  />

                  <div className="idea-form-footer">
                    <span className="panel-subtitle">{ideaDescription.length}/2000 caratteri</span>
                    <div className="idea-form-actions">
                      {editingIdeaId && (
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={resetIdeaForm}
                        >
                          Annulla
                        </button>
                      )}
                      <button className="primary-button" type="submit">
                        {editingIdeaId ? <Check size={14} /> : <Plus size={14} />}
                        {editingIdeaId ? 'Salva modifiche' : 'Salva idea'}
                      </button>
                    </div>
                  </div>
                </form>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title" style={{ marginBottom: 4 }}>
                      Il tuo archivio
                    </h2>
                    <p className="panel-subtitle">
                      {ideas.length === 0
                        ? 'Le idee che salvi appariranno qui.'
                        : `${ideas.length} ${ideas.length === 1 ? 'idea salvata' : 'idee salvate'}`}
                    </p>
                  </div>
                  <div className="search-field idea-search-field">
                    <Search size={15} />
                    <input
                      aria-label="Cerca idee"
                      placeholder="Cerca idee..."
                      value={ideaSearch}
                      onChange={(event) => setIdeaSearch(event.target.value)}
                    />
                    {ideaSearch && (
                      <button
                        className="search-close"
                        type="button"
                        aria-label="Cancella ricerca"
                        onClick={() => setIdeaSearch('')}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="idea-list">
                  {filteredIdeas.length > 0 ? (
                    filteredIdeas.map((idea) => (
                      <div className="idea-row" key={idea.id}>
                        <div className="project-symbol idea-symbol">
                          <Lightbulb size={16} />
                        </div>
                        <div className="idea-info">
                          <h3 className="project-name">{idea.title}</h3>
                          <div className="idea-description">
                            {idea.description || 'Nessuna descrizione aggiunta.'}
                          </div>
                          <div className="project-meta">
                            <span>
                              {new Date(idea.createdAt).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="task-actions">
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={`Modifica ${idea.title}`}
                            title="Modifica idea"
                            onClick={() => startEditingIdea(idea)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={`Elimina ${idea.title}`}
                            title="Elimina idea"
                            onClick={(event) => {
                              rememberDialogTrigger(event)
                              setDeletingIdeaId(idea.id)
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state idea-empty-state">
                      <div className="idea-empty-icon">
                        <Lightbulb size={26} />
                      </div>
                      <h3>
                        {ideaSearch ? 'Nessuna idea trovata' : 'La tua prossima idea parte da qui'}
                      </h3>
                      <p>
                        {ideaSearch
                          ? 'Prova con un termine diverso oppure cancella la ricerca.'
                          : 'Scrivi la prima idea nel modulo qui sopra. Potrai modificarla o eliminarla in qualsiasi momento.'}
                      </p>
                      {ideaSearch && (
                        <button
                          className="secondary-button"
                          style={{ marginTop: 14 }}
                          onClick={() => setIdeaSearch('')}
                        >
                          Cancella ricerca
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            </section>
          ) : activePage === 'Dati' ? (
            <section className="data-page" aria-label="Gestione dati workspace">
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Esporta workspace</h2>
                    <p className="panel-subtitle">
                      Scarica una copia locale di progetti, attività e idee.
                    </p>
                  </div>
                  <div className="stat-icon">
                    <Download size={16} />
                  </div>
                </div>
                <div className="data-panel-content">
                  <p>
                    Il file JSON include {projects.length} progetti, {tasks.length}{' '}
                    attività e {ideas.length} idee, insieme alla versione del formato.
                    I dati non vengono inviati a un server.
                  </p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={exportWorkspace}
                  >
                    <Download size={14} /> Esporta JSON
                  </button>
                </div>
              </article>

              <article className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Importa workspace</h2>
                    <p className="panel-subtitle">
                      Controlla una copia JSON prima di sostituire i dati attuali.
                    </p>
                  </div>
                  <div className="stat-icon">
                    <FileUp size={16} />
                  </div>
                </div>
                <div className="data-panel-content">
                  <input
                    ref={importFileInput}
                    className="visually-hidden"
                    type="file"
                    accept="application/json,.json"
                    aria-label="Seleziona file workspace JSON"
                    onChange={readImportFile}
                  />
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => importFileInput.current?.click()}
                  >
                    <FileUp size={14} /> Seleziona file JSON
                  </button>
                  {importError && (
                    <p className="data-error" role="alert">
                      {importError}
                    </p>
                  )}
                  {importCandidate && (
                    <div
                      className="import-preview"
                      role="region"
                      aria-label="Anteprima workspace da importare"
                    >
                      <h3>Anteprima della copia</h3>
                      <p>
                        {importCandidate.projects.length}{' '}
                        {importCandidate.projects.length === 1 ? 'progetto' : 'progetti'},{' '}
                        {importCandidate.tasks.length} attività e{' '}
                        {importCandidate.ideas.length}{' '}
                        {importCandidate.ideas.length === 1 ? 'idea' : 'idee'}.
                      </p>
                      <p className="data-warning">
                        La conferma sostituirà il workspace attuale. L’azione non può
                        essere annullata.
                      </p>
                      <div className="idea-form-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => setImportCandidate(null)}
                        >
                          Annulla
                        </button>
                        <button
                          className="primary-button"
                          type="button"
                          onClick={confirmImport}
                        >
                          Importa e sostituisci
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </section>
          ) : (
            <>
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
                <span>
                  {tasks.length
                    ? Math.round((completedTasks / tasks.length) * 100)
                    : 0}
                  %
                </span>{' '}
                delle attività totali
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
                      activeProjects.reduce(
                        (sum, project) => sum + project.progress,
                        0,
                      ) / activeProjects.length,
                    )
                  : 0}
                %
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
              <div className="stat-foot">
                {overdueTasks === 0
                  ? 'Nessuna attività scaduta'
                  : `${overdueTasks} ${overdueTasks === 1 ? 'attività scaduta' : 'attività scadute'}`}
              </div>
            </article>
          </section>
          <section className="workspace-grid">
            <article className="panel project-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Progetti</h2>
                  <p className="panel-subtitle">
                    Il tuo focus in un solo sguardo.
                  </p>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => showPage('Progetti')}
                >
                  Vedi tutti <ArrowRight size={12} />
                </button>
              </div>
              {activePage === 'Progetti' && (
                <div className="project-filters" aria-label="Filtri progetti">
                  <label>
                    <span>Stato</span>
                    <select
                      className="form-input"
                      aria-label="Filtra progetti per stato"
                      value={projectStatusFilter}
                      onChange={(event) => setProjectStatusFilter(event.target.value)}
                    >
                      <option value="Tutti">Tutti gli stati</option>
                      <option>In corso</option>
                      <option>In pausa</option>
                      <option>Completato</option>
                    </select>
                  </label>
                  <label>
                    <span>Ordina per</span>
                    <select
                      className="form-input"
                      aria-label="Ordina progetti"
                      value={projectSort}
                      onChange={(event) => setProjectSort(event.target.value)}
                    >
                      <option>Nome</option>
                      <option>Progressi</option>
                    </select>
                  </label>
                </div>
              )}
              <div className="project-list">
                {displayedProjects.length > 0 ? displayedProjects.map((project) => {
                  return (
                    <div className="project-row" key={project.id}>
                      <div className="project-symbol">
                        <FolderKanban size={17} />
                      </div>
                      <div className="project-info">
                        <div className="project-name">{project.name}</div>
                        <div className="project-meta">
                          <span>{project.category}</span>
                          <span className={`status-dot ${project.status === 'Completato' ? 'green' : project.status === 'In pausa' ? 'orange' : ''}`} />
                          <span>{project.status}</span>
                        </div>
                      </div>
                      <div className="project-progress">
                        <div className="progress-label">
                          <span>Progresso</span>
                          <strong>{project.progress}%</strong>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="project-actions">
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Modifica progetto ${project.name}`}
                          title="Modifica progetto"
                          onClick={(event) => {
                            rememberDialogTrigger(event)
                            startEditingProject(project)
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Elimina progetto ${project.name}`}
                          title="Elimina progetto"
                          onClick={(event) => {
                            rememberDialogTrigger(event)
                            setDeletingProjectId(project.id)
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="empty-state">
                    Nessun progetto corrisponde ai filtri selezionati.
                  </div>
                )}
              </div>
            </article>
            <article className="panel task-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Attività</h2>
                  <p className="panel-subtitle">
                    Piccoli passi, progressi concreti.
                  </p>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => showPage('Attività')}
                >
                  Vedi tutte le attività <ArrowRight size={12} />
                </button>
              </div>
              {activePage === 'Attività' && (
                <details className="task-create-disclosure">
                  <summary>Aggiungi attività</summary>
                  <form className="task-create-form" onSubmit={createTask}>
                    <label className="form-label" htmlFor="new-task-title">
                      Titolo attività
                    </label>
                    <input
                      id="new-task-title"
                      className="form-input"
                      value={newTaskTitle}
                      onChange={(event) => setNewTaskTitle(event.target.value)}
                      maxLength={120}
                      placeholder="Es. Preparare la prossima versione"
                      required
                    />
                    <div className="task-create-fields">
                      <label>
                        <span className="form-label">Progetto</span>
                        <select
                          className="form-input"
                          aria-label="Progetto nuova attività"
                          value={newTaskProjectId}
                          onChange={(event) => setNewTaskProjectId(event.target.value)}
                        >
                          <option value="">Senza progetto</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="form-label">Scadenza</span>
                        <input
                          className="form-input"
                          aria-label="Scadenza nuova attività"
                          type="date"
                          value={newTaskDueDate}
                          onChange={(event) => setNewTaskDueDate(event.target.value)}
                        />
                      </label>
                      <label>
                        <span className="form-label">Priorità</span>
                        <select
                          className="form-input"
                          aria-label="Priorità nuova attività"
                          value={newTaskPriority}
                          onChange={(event) =>
                            setNewTaskPriority(
                              isTaskPriority(event.target.value)
                                ? event.target.value
                                : 'Media',
                            )
                          }
                        >
                          <option>Bassa</option>
                          <option>Media</option>
                          <option>Alta</option>
                          <option>Urgente</option>
                        </select>
                      </label>
                    </div>
                    <div className="task-edit-actions">
                      <button className="primary-button" type="submit">
                        <Plus size={14} /> Crea attività
                      </button>
                    </div>
                  </form>
                </details>
              )}
              {activePage === 'Attività' && (
                <div className="task-filters" aria-label="Filtri attività">
                  <label>
                    <span>Stato</span>
                    <select
                      className="form-input"
                      aria-label="Filtra attività per stato"
                      value={taskStatusFilter}
                      onChange={(event) => setTaskStatusFilter(event.target.value)}
                    >
                      <option>Tutte</option>
                      <option>Da fare</option>
                      <option>Completate</option>
                      <option>Scadute</option>
                    </select>
                  </label>
                  <label>
                    <span>Progetto</span>
                    <select
                      className="form-input"
                      aria-label="Filtra attività per progetto"
                      value={taskProjectFilter}
                      onChange={(event) => setTaskProjectFilter(event.target.value)}
                    >
                      <option value="Tutti">Tutti i progetti</option>
                      <option value="">Senza progetto</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Priorità</span>
                    <select
                      className="form-input"
                      aria-label="Filtra attività per priorità"
                      value={taskPriorityFilter}
                      onChange={(event) => setTaskPriorityFilter(event.target.value)}
                    >
                      <option>Tutte</option>
                      <option>Bassa</option>
                      <option>Media</option>
                      <option>Alta</option>
                      <option>Urgente</option>
                    </select>
                  </label>
                </div>
              )}
              <div className="task-list">
                {displayedTasks.length > 0 ? (
                  displayedTasks.map((task) => (
                    <div className="task-row" key={task.id}>
                      {editingTaskId === task.id ? (
                        <form
                          className="task-edit-form"
                          onSubmit={saveEditedTask}
                        >
                          <input
                            className="form-input"
                            aria-label="Titolo attività"
                            placeholder="Titolo attività"
                            value={editTaskTitle}
                            onChange={(event) => setEditTaskTitle(event.target.value)}
                            autoFocus
                            required
                          />
                          <select
                            className="form-input"
                            aria-label="Progetto attività"
                            value={editTaskProjectId}
                            onChange={(event) => setEditTaskProjectId(event.target.value)}
                          >
                            <option value="">Senza progetto</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="form-input"
                            aria-label="Scadenza attività"
                            type="date"
                            value={editTaskDueDate}
                            onChange={(event) => setEditTaskDueDate(event.target.value)}
                          />
                          <select
                            className="form-input"
                            aria-label="Priorità attività"
                            value={editTaskPriority}
                            onChange={(event) =>
                              setEditTaskPriority(
                                isTaskPriority(event.target.value)
                                  ? event.target.value
                                  : 'Media',
                              )
                            }
                          >
                            <option>Bassa</option>
                            <option>Media</option>
                            <option>Alta</option>
                            <option>Urgente</option>
                          </select>
                          <div className="task-edit-actions">
                            <button className="primary-button" type="submit">
                              <Check size={14} /> Salva
                            </button>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={cancelEditingTask}
                            >
                              Annulla
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
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
                              {projects.find((item) => item.id === task.projectId)?.name ??
                                (task.projectId ? 'Progetto eliminato' : 'Senza progetto')}
                            </div>
                            <span className={`task-priority priority-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                          </div>
                          <div
                            className={`task-due ${isTaskOverdue(task) ? 'overdue' : ''}`}
                            title={task.dueDate || undefined}
                          >
                            {formatTaskDueDate(task.dueDate)}
                          </div>
                          <div className="task-actions">
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Modifica ${task.title}`}
                              title="Modifica attività"
                              onClick={() => startEditingTask(task)}
                            >
                              <span aria-hidden="true">✎</span>
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Elimina ${task.title}`}
                              title="Elimina attività"
                              onClick={(event) => {
                                rememberDialogTrigger(event)
                                setDeletingTaskId(task.id)
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
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
          {query.trim() && activePage !== 'Idee' && activePage !== 'Dati' && (
            <section className="panel global-idea-results" aria-label="Risultati idee">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Idee corrispondenti</h2>
                  <p className="panel-subtitle">
                    {filteredIdeas.length === 0
                      ? 'Nessuna idea corrisponde alla ricerca.'
                      : `${filteredIdeas.length} ${filteredIdeas.length === 1 ? 'idea trovata' : 'idee trovate'}`}
                  </p>
                </div>
                <div className="stat-icon">
                  <Lightbulb size={16} />
                </div>
              </div>
              {filteredIdeas.length > 0 && (
                <div className="idea-list">
                  {filteredIdeas.map((idea) => (
                    <div className="idea-row" key={idea.id}>
                      <div className="project-symbol idea-symbol">
                        <Lightbulb size={16} />
                      </div>
                      <div className="idea-info">
                        <h3 className="project-name">{idea.title}</h3>
                        <div className="idea-description">
                          {idea.description || 'Nessuna descrizione aggiunta.'}
                        </div>
                      </div>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => {
                          setIdeaSearch(query.trim())
                          setActivePage('Idee')
                          setQuery('')
                          setSearchOpen(false)
                        }}
                      >
                        Apri idee <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
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
                <div
                  className="activity-chart"
                  aria-label="Grafico dimostrativo dell'attività settimanale"
                >
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
                        <div
                          className="chart-bar"
                          style={{ height: `${item.a}%` }}
                        />
                        <div
                          className="chart-bar secondary"
                          style={{ height: `${item.b}%` }}
                        />
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
                  <p className="panel-subtitle">
                    Un pensiero da tenere con te
                  </p>
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
            </>
          )}

          <footer
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 25,
              color: '#686877',
              fontSize: 10,
            }}
          >
            <span>AFTERLIGHT © 2026</span>
            <span>Costruito un passo alla volta.</span>
          </footer>
        </div>
      </main>
      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProjectModal()
            }
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
                <div className="eyebrow">
                  {editingProjectId ? 'AGGIORNA IL TUO SPAZIO' : 'NUOVO INIZIO'}
                </div>
                <h2 id="modal-title">
                  {editingProjectId ? 'Modifica progetto' : 'Crea un progetto'}
                </h2>
                <p>
                  {editingProjectId
                    ? 'Aggiorna i dettagli e i progressi del progetto.'
                    : 'Le idee prendono forma quando dai loro un nome.'}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Chiudi"
                onClick={closeProjectModal}
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
                {editingProjectId &&
                  ![
                    'Sviluppo web',
                    'Apprendimento',
                    'Scripting',
                    'Personale',
                    'Altro',
                  ].includes(newProjectCategory) && (
                    <option value={newProjectCategory}>{newProjectCategory}</option>
                  )}
                <option>Sviluppo web</option>
                <option>Apprendimento</option>
                <option>Scripting</option>
                <option>Personale</option>
                <option>Altro</option>
              </select>
              {editingProjectId && (
                <>
                  <label className="form-label" htmlFor="project-status">
                    Stato
                  </label>
                  <select
                    id="project-status"
                    className="form-input"
                    value={projectStatus}
                    onChange={(event) => {
                      if (!isProjectStatus(event.target.value)) return
                      setProjectStatus(event.target.value)
                      if (event.target.value === 'Completato') {
                        setProjectProgress(100)
                      }
                    }}
                  >
                    <option>In corso</option>
                    <option>In pausa</option>
                    <option>Completato</option>
                  </select>
                  <label className="form-label" htmlFor="project-progress">
                    Progresso: {projectProgress}%
                  </label>
                  <input
                    id="project-progress"
                    className="progress-input"
                    type="range"
                    min="0"
                    max="100"
                    value={projectProgress}
                    onChange={(event) => setProjectProgress(Number(event.target.value))}
                    disabled={projectStatus === 'Completato'}
                  />
                </>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeProjectModal}
                >
                  Annulla
                </button>
                <button type="submit" className="primary-button">
                  {editingProjectId ? <Check size={14} /> : <Plus size={14} />}
                  {editingProjectId ? 'Salva modifiche' : 'Crea progetto'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {deletingProjectId && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeletingProjectId(null)
          }}
        >
          <section
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            aria-describedby="delete-project-description"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">CONFERMA</div>
                <h2 id="delete-project-title">Eliminare il progetto?</h2>
                <p id="delete-project-description">
                  Le attività collegate verranno conservate senza un progetto associato.
                  Questa operazione non può essere annullata.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Chiudi dialog"
                onClick={() => setDeletingProjectId(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeletingProjectId(null)}
              >
                Annulla
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => deleteProject(deletingProjectId)}
              >
                Elimina progetto
              </button>
            </div>
          </section>
        </div>
      )}
      {deletingTaskId && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeletingTaskId(null)
            }
          }}
        >
          <section
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            aria-describedby="delete-task-description"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">CONFERMA</div>
                <h2 id="delete-task-title">Eliminare l'attività?</h2>
                <p id="delete-task-description">
                  Questa attività verrà rimossa dal tuo piano.
                </p>
                <p>Questa operazione non può essere annullata.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Chiudi dialog"
                onClick={() => setDeletingTaskId(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeletingTaskId(null)}
              >
                Annulla
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => deleteTask(deletingTaskId)}
              >
                Elimina
              </button>
            </div>
          </section>
        </div>
      )}
      {deletingIdeaId && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeletingIdeaId(null)
          }}
        >
          <section className="modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-idea-title">
            <div className="modal-header">
              <div>
                <div className="eyebrow">CONFERMA</div>
                <h2 id="delete-idea-title">Eliminare questa idea?</h2>
                <p>L’idea verrà rimossa dal tuo archivio. Questa operazione non può essere annullata.</p>
              </div>
              <button type="button" className="icon-button" aria-label="Chiudi dialog" onClick={() => setDeletingIdeaId(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setDeletingIdeaId(null)}>Annulla</button>
              <button type="button" className="primary-button" onClick={() => deleteIdea(deletingIdeaId)}>Elimina idea</button>
            </div>
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
