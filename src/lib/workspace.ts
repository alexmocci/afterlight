export type Project = {
  id: string
  name: string
  category: string
  progress: number
  color: string
  status: 'In corso' | 'In pausa' | 'Completato'
}

export type Task = {
  id: string
  title: string
  projectId: string
  due: string
  dueDate: string
  priority: TaskPriority
  completed: boolean
}

export type TaskPriority = 'Bassa' | 'Media' | 'Alta' | 'Urgente'

export type Idea = {
  id: string
  title: string
  description: string
  createdAt: string
}

export type WorkspaceData = {
  projects: Project[]
  tasks: Task[]
  ideas: Idea[]
}

export type WorkspaceLoadResult = {
  workspace: WorkspaceData
  warning: string | null
  recoveryData: string | null
}

export type WorkspaceSaveResult = {
  ok: boolean
  error: string | null
}

export type WorkspaceImportResult = {
  workspace: WorkspaceData | null
  error: string | null
}

export const storageKey = 'afterlight-workspace-v1'
export const workspaceSchemaVersion = 1
const recoveryKeyPrefix = `${storageKey}-recovery-`

export const initialProjects: Project[] = [
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

export function getLocalDate(offsetDays = 0, now = new Date()): string {
  const date = new Date(now)
  date.setDate(date.getDate() + offsetDays)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Completare la dashboard',
    projectId: 'p1',
    due: 'Oggi',
    dueDate: getLocalDate(),
    priority: 'Alta',
    completed: false,
  },
  {
    id: 't2',
    title: 'Ripassare gli hook di React',
    projectId: 'p2',
    due: 'Oggi',
    dueDate: getLocalDate(),
    priority: 'Media',
    completed: false,
  },
  {
    id: 't3',
    title: 'Sistemare la documentazione',
    projectId: 'p1',
    due: 'Domani',
    dueDate: getLocalDate(1),
    priority: 'Bassa',
    completed: true,
  },
  {
    id: 't4',
    title: 'Scrivere uno script di backup',
    projectId: 'p3',
    due: 'Domani',
    dueDate: getLocalDate(1),
    priority: 'Media',
    completed: false,
  },
]

const initialWorkspace: WorkspaceData = {
  projects: initialProjects,
  tasks: initialTasks,
  ideas: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isProjectStatus(value: unknown): value is Project['status'] {
  return value === 'In corso' || value === 'In pausa' || value === 'Completato'
}

function isLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function parseProject(value: unknown): Project | null {
  if (!isRecord(value) || !nonEmptyString(value.id) || !nonEmptyString(value.name)) {
    return null
  }

  return {
    id: value.id,
    name: value.name.trim(),
    category: nonEmptyString(value.category) ? value.category.trim() : 'Altro',
    progress:
      typeof value.progress === 'number' && Number.isFinite(value.progress)
        ? Math.min(100, Math.max(0, value.progress))
        : 0,
    color: nonEmptyString(value.color) ? value.color : 'purple',
    status: isProjectStatus(value.status) ? value.status : 'In corso',
  }
}

function parseTask(value: unknown): Task | null {
  if (!isRecord(value) || !nonEmptyString(value.id) || !nonEmptyString(value.title)) {
    return null
  }

  const legacyDue = typeof value.due === 'string' ? value.due : ''
  const persistedDueDate =
    typeof value.dueDate === 'string' && isLocalDate(value.dueDate)
      ? value.dueDate
      : ''
  const dueDate =
    persistedDueDate ||
    (legacyDue === 'Oggi'
      ? getLocalDate()
      : legacyDue === 'Domani'
        ? getLocalDate(1)
        : '')

  return {
    id: value.id,
    title: value.title.trim(),
    projectId: typeof value.projectId === 'string' ? value.projectId : '',
    due: legacyDue || 'Senza scadenza',
    dueDate,
    priority: isTaskPriority(value.priority) ? value.priority : 'Media',
    completed: typeof value.completed === 'boolean' ? value.completed : false,
  }
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    value === 'Bassa' ||
    value === 'Media' ||
    value === 'Alta' ||
    value === 'Urgente'
  )
}

export function formatTaskDueDate(dueDate: string, now = new Date()): string {
  if (!dueDate) return 'Senza scadenza'
  const today = getLocalDate(0, now)
  const tomorrow = getLocalDate(1, now)
  if (dueDate === today) return 'Oggi'
  if (dueDate === tomorrow) return 'Domani'

  const [year, month, day] = dueDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: year === now.getFullYear() ? undefined : 'numeric',
  })
}

export function isTaskOverdue(task: Task, now = new Date()): boolean {
  return !task.completed && Boolean(task.dueDate) && task.dueDate < getLocalDate(0, now)
}

function parseIdea(value: unknown): Idea | null {
  if (!isRecord(value) || !nonEmptyString(value.id) || !nonEmptyString(value.title)) {
    return null
  }

  const createdAt =
    typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt))
      ? value.createdAt
      : new Date(0).toISOString()

  return {
    id: value.id,
    title: value.title.trim(),
    description: typeof value.description === 'string' ? value.description : '',
    createdAt,
  }
}

function uniqueById<T extends { id: string }>(records: T[]): T[] {
  const ids = new Set<string>()
  return records.filter((record) => {
    if (ids.has(record.id)) return false
    ids.add(record.id)
    return true
  })
}

function recordNeedsRecovery(
  raw: unknown,
  normalized: object | null,
  toleratedMissingKeys: string[] = [],
): boolean {
  if (!isRecord(raw) || normalized === null) return true
  const normalizedRecord = normalized as Record<string, unknown>
  return (
    Object.entries(normalizedRecord).some(
      ([key, value]) =>
        Object.hasOwn(raw, key) && raw[key] !== value ||
        !Object.hasOwn(raw, key) && !toleratedMissingKeys.includes(key),
    ) ||
    Object.keys(raw).some((key) => !Object.hasOwn(normalizedRecord, key))
  )
}

function getStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  if (storage) return storage
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadWorkspace(
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
): WorkspaceLoadResult {
  const targetStorage = getStorage(storage)
  if (!targetStorage) {
    return {
      workspace: initialWorkspace,
      warning: 'Memoria locale non disponibile: le modifiche non verranno salvate.',
      recoveryData: null,
    }
  }

  let saved: string | null
  try {
    saved = targetStorage.getItem(storageKey)
  } catch {
    return {
      workspace: initialWorkspace,
      warning: 'Impossibile leggere i dati salvati. Le modifiche non verranno salvate.',
      recoveryData: null,
    }
  }

  if (saved === null) {
    return { workspace: initialWorkspace, warning: null, recoveryData: null }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(saved)
  } catch {
    return {
      workspace: initialWorkspace,
      warning:
        'I dati salvati non sono leggibili. La copia originale verrà conservata prima del prossimo salvataggio.',
      recoveryData: saved,
    }
  }

  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.projects) &&
      !Array.isArray(parsed.tasks) &&
      !Array.isArray(parsed.ideas)
  ) {
    return {
      workspace: initialWorkspace,
      warning:
        'Il workspace salvato ha un formato non riconosciuto. La copia originale verrà conservata prima del prossimo salvataggio.',
      recoveryData: saved,
    }
  }

  const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : []
  const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : []
  const rawIdeas = parsed.ideas === undefined ? [] : parsed.ideas
  const safeIdeas = Array.isArray(rawIdeas) ? rawIdeas : []
  const parsedProjects = rawProjects.map(parseProject)
  const parsedTasks = rawTasks.map(parseTask)
  const parsedIdeas = safeIdeas.map(parseIdea)

  const projects = uniqueById(parsedProjects.filter((record): record is Project => record !== null))
  const tasks = uniqueById(parsedTasks.filter((record): record is Task => record !== null))
  const ideas = uniqueById(parsedIdeas.filter((record): record is Idea => record !== null))
  const invalidRecords =
    !Array.isArray(parsed.projects) ||
    !Array.isArray(parsed.tasks) ||
    !Array.isArray(rawIdeas) ||
    projects.length !== rawProjects.length ||
    tasks.length !== rawTasks.length ||
    ideas.length !== safeIdeas.length ||
    rawProjects.some((record, index) =>
      recordNeedsRecovery(record, parsedProjects[index]),
    ) ||
    rawTasks.some((record, index) =>
      recordNeedsRecovery(record, parsedTasks[index], ['dueDate', 'priority']),
    ) ||
    safeIdeas.some((record, index) =>
      recordNeedsRecovery(record, parsedIdeas[index], ['description']),
    )

  return {
    workspace: { projects, tasks, ideas },
    warning: invalidRecords
      ? 'Alcuni dati salvati non validi sono stati esclusi. La copia originale verrà conservata prima del prossimo salvataggio.'
      : null,
    recoveryData: invalidRecords ? saved : null,
  }
}

export function saveWorkspace(
  workspace: WorkspaceData,
  recoveryData: string | null = null,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
): WorkspaceSaveResult {
  const targetStorage = getStorage(storage)
  if (!targetStorage) {
    return {
      ok: false,
      error: 'Memoria locale non disponibile: il workspace non è stato salvato.',
    }
  }

  if (recoveryData !== null) {
    try {
      let recoveryKey = `${recoveryKeyPrefix}${Date.now()}`
      while (targetStorage.getItem(recoveryKey) !== null) {
        recoveryKey = `${recoveryKeyPrefix}${Date.now()}-${Math.random().toString(36).slice(2)}`
      }
      targetStorage.setItem(recoveryKey, recoveryData)
    } catch {
      return {
        ok: false,
        error:
          'Impossibile conservare la copia dei dati precedenti. Il workspace non è stato sovrascritto.',
      }
    }
  }

  try {
    targetStorage.setItem(storageKey, JSON.stringify(workspace))
    return { ok: true, error: null }
  } catch {
    return {
      ok: false,
      error: 'Impossibile salvare il workspace nella memoria locale del browser.',
    }
  }
}

export function serializeWorkspace(workspace: WorkspaceData): string {
  return JSON.stringify({
    schemaVersion: workspaceSchemaVersion,
    exportedAt: new Date().toISOString(),
    workspace,
  })
}

export function parseWorkspaceImport(rawData: string): WorkspaceImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawData)
  } catch {
    return { workspace: null, error: 'Il file non contiene un JSON valido.' }
  }

  if (
    !isRecord(parsed) ||
    parsed.schemaVersion !== workspaceSchemaVersion ||
    !isRecord(parsed.workspace)
  ) {
    return {
      workspace: null,
      error: `Formato di esportazione non supportato. È richiesta la versione ${workspaceSchemaVersion}.`,
    }
  }

  const serializedWorkspace = JSON.stringify(parsed.workspace)
  const result = loadWorkspace({
    getItem: () => serializedWorkspace,
    setItem: () => undefined,
  })
  if (result.warning || result.recoveryData !== null) {
    return {
      workspace: null,
      error: 'Il workspace nel file contiene dati non validi o incompleti.',
    }
  }

  return { workspace: result.workspace, error: null }
}
