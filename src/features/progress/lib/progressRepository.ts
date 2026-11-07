import type {
  ProgressValidationIssue,
  StudentProgressStoreEnvelope,
} from '../../../types/progress.ts'
import {
  containsForbiddenPayload,
  createEmptyProgressEnvelope,
  getDefaultKnownExperimentVersions,
  validateStoredProgressEnvelope,
  type KnownExperimentVersionMap,
} from './progressValidation.ts'

export const STUDENT_PROGRESS_STORAGE_KEY = 'stem_virtual_lab_student_progress_v1'

export interface ProgressStorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface ProgressRepositoryLoadResult {
  envelope: StudentProgressStoreEnvelope
  issues: readonly ProgressValidationIssue[]
  storageHealthy: boolean
  loadedFromStorage: boolean
}

export interface ProgressRepositorySaveResult {
  ok: boolean
  storageHealthy: boolean
  issues: readonly ProgressValidationIssue[]
}

/**
 * Small, testable repository interface for loading, saving, and clearing
 * student learning progress. Allows swapping local device storage for an
 * authenticated backend service in a future task without changing UI or simulation code.
 */
export interface StudentProgressRepository {
  load(): ProgressRepositoryLoadResult
  save(envelope: StudentProgressStoreEnvelope): ProgressRepositorySaveResult
  clear(): { ok: boolean; storageHealthy: boolean }
}

export interface CreateLocalProgressRepositoryOptions {
  storage?: ProgressStorageAdapter | null
  storageKey?: string
  knownVersions?: KnownExperimentVersionMap
}

function getBrowserLocalStorage(): ProgressStorageAdapter | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Creates a versioned local browser progress repository with automatic validation
 * and graceful fallback when browser storage is disabled, unavailable, or full.
 */
export function createLocalProgressRepository(
  options: CreateLocalProgressRepositoryOptions = {},
): StudentProgressRepository {
  const storageKey = options.storageKey ?? STUDENT_PROGRESS_STORAGE_KEY
  const knownVersions = options.knownVersions ?? getDefaultKnownExperimentVersions()
  let memoryFallbackEnvelope: StudentProgressStoreEnvelope = createEmptyProgressEnvelope()

  const resolveStorage = (): ProgressStorageAdapter | null => {
    if (options.storage !== undefined) {
      return options.storage
    }
    return getBrowserLocalStorage()
  }

  return {
    load(): ProgressRepositoryLoadResult {
      const storage = resolveStorage()
      if (!storage) {
        return {
          envelope: memoryFallbackEnvelope,
          issues: [
            {
              code: 'STORAGE_UNAVAILABLE',
              message:
                'Browser local storage is unavailable; keeping progress in temporary session memory only.',
            },
          ],
          storageHealthy: false,
          loadedFromStorage: false,
        }
      }

      let rawJson: string | null
      try {
        rawJson = storage.getItem(storageKey)
      } catch {
        return {
          envelope: memoryFallbackEnvelope,
          issues: [
            {
              code: 'STORAGE_UNAVAILABLE',
              message:
                'Reading from browser storage failed; using temporary session memory instead.',
            },
          ],
          storageHealthy: false,
          loadedFromStorage: false,
        }
      }

      if (rawJson === null || rawJson.trim().length === 0) {
        return {
          envelope: createEmptyProgressEnvelope(),
          issues: [],
          storageHealthy: true,
          loadedFromStorage: false,
        }
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(rawJson)
      } catch {
        const cleanEnvelope = createEmptyProgressEnvelope()
        memoryFallbackEnvelope = cleanEnvelope
        try {
          storage.removeItem(storageKey)
        } catch {
          // Ignore storage removal errors
        }
        return {
          envelope: cleanEnvelope,
          issues: [
            {
              code: 'INVALID_JSON',
              message: 'Stored progress data was not valid JSON and has been safely reset.',
            },
          ],
          storageHealthy: true,
          loadedFromStorage: false,
        }
      }

      const validated = validateStoredProgressEnvelope(parsed, knownVersions)
      memoryFallbackEnvelope = validated.envelope

      if (validated.issues.length > 0) {
        try {
          storage.setItem(storageKey, JSON.stringify(validated.envelope))
        } catch {
          // Ignore write healing errors on load
        }
      }

      return {
        envelope: validated.envelope,
        issues: validated.issues,
        storageHealthy: true,
        loadedFromStorage: true,
      }
    },

    save(envelope: StudentProgressStoreEnvelope): ProgressRepositorySaveResult {
      if (containsForbiddenPayload(envelope)) {
        return {
          ok: false,
          storageHealthy: true,
          issues: [
            {
              code: 'FORBIDDEN_PAYLOAD_OBJECT',
              message:
                'Refused to store non-serializable objects, 3D scene instances, or credential fields.',
            },
          ],
        }
      }

      const validated = validateStoredProgressEnvelope(envelope, knownVersions, envelope.updatedAt)
      memoryFallbackEnvelope = validated.envelope

      const storage = resolveStorage()
      if (!storage) {
        return {
          ok: false,
          storageHealthy: false,
          issues: [
            ...validated.issues,
            {
              code: 'STORAGE_UNAVAILABLE',
              message:
                'Browser local storage is unavailable; saved progress in temporary session memory only.',
            },
          ],
        }
      }

      try {
        storage.setItem(storageKey, JSON.stringify(validated.envelope))
        return {
          ok: true,
          storageHealthy: true,
          issues: validated.issues,
        }
      } catch {
        return {
          ok: false,
          storageHealthy: false,
          issues: [
            ...validated.issues,
            {
              code: 'STORAGE_UNAVAILABLE',
              message:
                'Writing to browser storage failed (quota exceeded or blocked); saved in temporary session memory.',
            },
          ],
        }
      }
    },

    clear(): { ok: boolean; storageHealthy: boolean } {
      memoryFallbackEnvelope = createEmptyProgressEnvelope()
      const storage = resolveStorage()
      if (!storage) {
        return { ok: false, storageHealthy: false }
      }
      try {
        storage.removeItem(storageKey)
        return { ok: true, storageHealthy: true }
      } catch {
        return { ok: false, storageHealthy: false }
      }
    },
  }
}
