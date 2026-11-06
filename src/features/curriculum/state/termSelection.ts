import { sampleTerms } from '../data/sampleCurriculum.ts'
import type { Term } from '@/types/curriculum'

export const TERM_SESSION_KEY = 'stem_virtual_lab_selected_term'

let memoryTermId: string | null = null

/**
 * Safely retrieve the stored term ID from sessionStorage or in-memory fallback.
 * Validates that the returned ID matches an existing term in sampleTerms.
 */
export function getStoredTermId(): string | null {
  let id: string | null = null

  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      id = window.sessionStorage.getItem(TERM_SESSION_KEY)
    } catch {
      id = memoryTermId
    }
  } else {
    id = memoryTermId
  }

  if (id && sampleTerms.some((t) => t.id === id)) {
    return id
  }

  return null
}

/**
 * Store the selected term ID in sessionStorage and in-memory fallback.
 */
export function setStoredTermId(termId: string): void {
  memoryTermId = termId

  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      window.sessionStorage.setItem(TERM_SESSION_KEY, termId)
    } catch {
      // Non-fatal if storage write fails
    }
  }
}

/**
 * Clear the selected term ID.
 */
export function clearStoredTermId(): void {
  memoryTermId = null

  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      window.sessionStorage.removeItem(TERM_SESSION_KEY)
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Return all terms belonging to a specific grade.
 */
export function getTermsForGrade(gradeId: string | null): readonly Term[] {
  if (!gradeId) return []
  return sampleTerms.filter((term) => term.gradeId === gradeId)
}

/**
 * Helper to resolve a full Term object from an ID.
 */
export function getTermById(termId: string | null): Term | null {
  if (!termId) return null
  return sampleTerms.find((t) => t.id === termId) ?? null
}
