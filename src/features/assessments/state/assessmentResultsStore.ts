import type { AssessmentResultRecord } from '../../../types/assessment.ts'
import { recordQuizResultProgress } from '../../progress/state/studentProgressStore.ts'

// In-memory session store mapping experimentId -> latest AssessmentResultRecord
const memoryResults = new Map<string, AssessmentResultRecord>()

/**
 * Stores the latest submitted assessment result for an experiment in memory
 * and records the quiz summary in the local student learning progress store.
 */
export function setLatestAssessmentResult(
  experimentId: string,
  result: AssessmentResultRecord,
): void {
  if (!experimentId || typeof experimentId !== 'string') return
  memoryResults.set(experimentId, result)
  recordQuizResultProgress(result)
}

/**
 * Retrieves the latest submitted assessment result for an experiment.
 * Returns null if no assessment has been submitted for this experiment in this session.
 */
export function getLatestAssessmentResult(
  experimentId: string | undefined,
): AssessmentResultRecord | null {
  if (!experimentId || typeof experimentId !== 'string') return null
  return memoryResults.get(experimentId) ?? null
}

/**
 * Clears the stored assessment result for an experiment (e.g. when retaking a quiz).
 */
export function clearLatestAssessmentResult(experimentId: string | undefined): void {
  if (!experimentId || typeof experimentId !== 'string') return
  memoryResults.delete(experimentId)
}

/**
 * Clears all stored assessment results across all experiments.
 */
export function clearAllAssessmentResults(): void {
  memoryResults.clear()
}
