import { sampleGrades } from '../data/sampleCurriculum.ts'
import type { Grade } from '@/types/curriculum'

export const GRADE_SESSION_KEY = 'stem_virtual_lab_selected_grade'

// In-memory fallback if sessionStorage is unavailable (SSR, private browsing, strict security)
let memoryGradeId: string | null = null

/**
 * Safely retrieve the stored grade ID from sessionStorage or in-memory fallback.
 * Validates that the returned ID matches an existing grade in sampleGrades.
 */
export function getStoredGradeId(): string | null {
  let id: string | null = null

  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      id = window.sessionStorage.getItem(GRADE_SESSION_KEY)
    } catch {
      // Storage access blocked or restricted; fall back to memory
      id = memoryGradeId
    }
  } else {
    id = memoryGradeId
  }

  if (id && sampleGrades.some((g) => g.id === id)) {
    return id
  }

  return null
}

/**
 * Store the selected grade ID in sessionStorage and in-memory fallback.
 */
export function setStoredGradeId(gradeId: string): void {
  memoryGradeId = gradeId

  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      window.sessionStorage.setItem(GRADE_SESSION_KEY, gradeId)
    } catch {
      // Non-fatal if storage write fails
    }
  }
}

/**
 * Clear the selected grade ID.
 */
export function clearStoredGradeId(): void {
  memoryGradeId = null

  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      window.sessionStorage.removeItem(GRADE_SESSION_KEY)
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Helper to resolve full Grade object from an ID.
 */
export function getGradeById(gradeId: string | null): Grade | null {
  if (!gradeId) return null
  return sampleGrades.find((g) => g.id === gradeId) ?? null
}
