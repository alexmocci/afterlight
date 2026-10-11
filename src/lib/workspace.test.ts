import { describe, expect, it } from 'vitest'
import {
  initialProjects,
  formatTaskDueDate,
  getLocalDate,
  isTaskOverdue,
  loadWorkspace,
  saveWorkspace,
  storageKey,
  type WorkspaceData,
} from './workspace'

function createMemoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  const storage = {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
  return { storage, values }
}

describe('workspace persistence', () => {
  it('loads existing workspaces without an ideas field', () => {
    const { storage } = createMemoryStorage({
      [storageKey]: JSON.stringify({
        projects: [
          {
            id: 'legacy-project',
            name: 'Progetto legacy',
            category: 'Scripting',
            progress: 10,
            color: 'purple',
            status: 'In corso',
          },
        ],
        tasks: [
          {
            id: 'legacy-task',
            title: 'Attività legacy',
            projectId: 'legacy-project',
            due: 'Domani',
            completed: false,
          },
        ],
      }),
    })

    const result = loadWorkspace(storage)

    expect(result.warning).toBeNull()
    expect(result.recoveryData).toBeNull()
    expect(result.workspace).toMatchObject({
      projects: [{ id: 'legacy-project', name: 'Progetto legacy' }],
      tasks: [{ id: 'legacy-task', due: 'Domani', priority: 'Media' }],
      ideas: [],
    })
    expect(result.workspace.tasks[0].dueDate).toBe(getLocalDate(1))
  })

  it('keeps valid records and normalizes bad fields and entries', () => {
    const { storage } = createMemoryStorage({
      [storageKey]: JSON.stringify({
        projects: [
          {
            id: 'p1',
            name: ' Progetto valido ',
            progress: 150,
            status: 'sconosciuto',
          },
          { id: 'invalid-project' },
          { id: 'p1', name: 'Duplicato' },
        ],
        tasks: [
          { id: 't1', title: ' Task valida ', projectId: 'removed-project' },
          { id: 'invalid-task', title: '   ' },
        ],
        ideas: [
          { id: 'i1', title: 'Idea valida', createdAt: 'data non valida' },
          { id: 'invalid-idea', title: 'Idea senza data', description: 123 },
        ],
      }),
    })

    const result = loadWorkspace(storage)

    expect(result.warning).toContain('Alcuni dati salvati non validi')
    expect(result.recoveryData).not.toBeNull()
    expect(result.workspace.projects).toEqual([
      {
        id: 'p1',
        name: 'Progetto valido',
        category: 'Altro',
        progress: 100,
        color: 'purple',
        status: 'In corso',
      },
    ])
    expect(result.workspace.tasks).toEqual([
      {
        id: 't1',
        title: 'Task valida',
        projectId: 'removed-project',
        due: 'Senza scadenza',
        dueDate: '',
        priority: 'Media',
        completed: false,
      },
    ])
    expect(result.workspace.ideas[0]).toMatchObject({
      id: 'i1',
      title: 'Idea valida',
      description: '',
    })
    expect(Date.parse(result.workspace.ideas[0].createdAt)).not.toBeNaN()
  })

  it('preserves valid sections when another section has the wrong shape', () => {
    const { storage } = createMemoryStorage({
      [storageKey]: JSON.stringify({
        projects: [
          {
            id: 'p1',
            name: 'Progetto conservato',
            category: 'Personale',
            progress: 10,
            color: 'purple',
            status: 'In corso',
          },
        ],
        tasks: [],
        ideas: { malformed: true },
      }),
    })

    const result = loadWorkspace(storage)

    expect(result.workspace.projects).toHaveLength(1)
    expect(result.workspace.projects[0].name).toBe('Progetto conservato')
    expect(result.workspace.ideas).toEqual([])
    expect(result.recoveryData).not.toBeNull()
  })

  it('does not replace corrupted saved data during load', () => {
    const corrupted = '{not valid json'
    const { storage, values } = createMemoryStorage({ [storageKey]: corrupted })

    const result = loadWorkspace(storage)

    expect(result.workspace.projects).toEqual(initialProjects)
    expect(result.recoveryData).toBe(corrupted)
    expect(values.get(storageKey)).toBe(corrupted)
  })

  it('backs up malformed data before writing normalized workspace data', () => {
    const corrupted = '{not valid json'
    const { storage, values } = createMemoryStorage({ [storageKey]: corrupted })
    const loaded = loadWorkspace(storage)

    const result = saveWorkspace(loaded.workspace, loaded.recoveryData, storage)

    expect(result).toEqual({ ok: true, error: null })
    expect([...values.entries()].some(([key, value]) =>
      key.startsWith(`${storageKey}-recovery-`) && value === corrupted,
    )).toBe(true)
    expect(JSON.parse(values.get(storageKey)!)).toEqual(loaded.workspace)
  })

  it('does not write over original data when its recovery copy cannot be stored', () => {
    const corrupted = '{not valid json'
    const storage = {
      getItem: (key: string) => (key === storageKey ? corrupted : null),
      setItem: () => {
        throw new Error('Storage quota exceeded')
      },
    }
    const loaded = loadWorkspace(storage)

    const result = saveWorkspace(loaded.workspace, loaded.recoveryData, storage)

    expect(result.ok).toBe(false)
    expect(result.error).toContain('non è stato sovrascritto')
  })

  it('reports storage write errors instead of silently claiming success', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Storage quota exceeded')
      },
    }
    const workspace: WorkspaceData = {
      projects: [],
      tasks: [],
      ideas: [],
    }

    const result = saveWorkspace(workspace, null, storage)

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Impossibile salvare')
  })

  it('formats local due dates and identifies only pending overdue tasks', () => {
    const now = new Date(2026, 9, 11, 12)
    const today = getLocalDate(0, now)
    const yesterday = getLocalDate(-1, now)
    const task = {
      id: 't1',
      title: 'Task',
      projectId: '',
      due: yesterday,
      dueDate: yesterday,
      priority: 'Media' as const,
      completed: false,
    }

    expect(formatTaskDueDate(today, now)).toBe('Oggi')
    expect(formatTaskDueDate(getLocalDate(1, now), now)).toBe('Domani')
    expect(formatTaskDueDate('', now)).toBe('Senza scadenza')
    expect(isTaskOverdue(task, now)).toBe(true)
    expect(isTaskOverdue({ ...task, completed: true }, now)).toBe(false)
    expect(
      isTaskOverdue({ ...task, dueDate: getLocalDate(1, now) }, now),
    ).toBe(false)
  })
})
