import type { AssessmentId } from './assessment.ts'
import type { EntityId, Experiment } from './experiment.ts'

export type ExperimentId = EntityId

export type ExperimentProgressStatus = 'not-started' | 'in-progress' | 'completed'

/**
 * Serializable summary of a student's latest submitted practice quiz attempt.
 * Derived directly from AssessmentResultRecord (T27/T28) without recalculating scores.
 */
export interface QuizProgressSummary {
  attemptId: string
  assessmentId: AssessmentId
  assessmentVersion: string
  score: number
  maxScore: number
  percentage: number
  correctCount: number
  totalQuestions: number
  submittedAt: string
}

/**
 * Per-experiment learning progress record stored in the local device envelope.
 * Never stores React components, Three.js objects, physics instances, or credentials.
 */
export interface ExperimentProgressRecord {
  experimentId: ExperimentId
  experimentDefinitionVersion: string
  experimentStatus: ExperimentProgressStatus
  lastActivityAt: string | null
  currentValidatedStepId: string | null
  currentValidatedStepIndex: number
  completedStepCount: number
  totalStepCount: number
  experimentCompleted: boolean
  experimentCompletedAt: string | null
  latestQuizResult: QuizProgressSummary | null
  quizAssessmentVersion: string | null
}

export type ProgressActivityType =
  | 'experiment-started'
  | 'step-completed'
  | 'experiment-completed'
  | 'experiment-restarted'
  | 'quiz-submitted'

export interface ProgressActivityEntry {
  id: string
  experimentId: ExperimentId
  experimentTitle: string
  type: ProgressActivityType
  label: string
  detail: string
  occurredAt: string
}

/**
 * Versioned local browser storage envelope for student learning progress.
 * Explicitly scoped to the local browser/device (`local-device`) until a future
 * authenticated backend synchronization service is connected.
 */
export interface StudentProgressStoreEnvelope {
  schemaVersion: 1
  scope: 'local-device'
  updatedAt: string
  experiments: Readonly<Record<ExperimentId, ExperimentProgressRecord>>
  recentActivities: readonly ProgressActivityEntry[]
}

export type ProgressValidationIssueCode =
  | 'INVALID_JSON'
  | 'INVALID_ENVELOPE'
  | 'UNSUPPORTED_SCHEMA_VERSION'
  | 'FORBIDDEN_PAYLOAD_OBJECT'
  | 'UNKNOWN_EXPERIMENT_ID'
  | 'OUTDATED_DEFINITION_VERSION'
  | 'CORRUPT_EXPERIMENT_RECORD'
  | 'CORRUPT_ACTIVITY_RECORD'
  | 'STORAGE_UNAVAILABLE'

export interface ProgressValidationIssue {
  code: ProgressValidationIssueCode
  message: string
  experimentId?: string
}

/**
 * Indicates how an in-progress experiment can be resumed honestly:
 * - `continue-live-session`: An active in-memory 3D session exists in the current browser tab.
 * - `restart-required`: Progress was loaded from local storage after a page refresh (or live 3D state was reset),
 *   so the 3D laboratory must start fresh rather than pretending to restore mid-step physical coordinates.
 * - `start-new`: The experiment has not been started yet, or was already completed.
 */
export type ExperimentResumeMode = 'continue-live-session' | 'restart-required' | 'start-new'

export interface ExperimentProgressOverviewItem {
  experiment: Experiment
  isExecutable: boolean
  definitionVersion: string | null
  progress: ExperimentProgressRecord
  resumeMode: ExperimentResumeMode
  primaryActionLabel: 'Continue' | 'Restart Experiment' | 'Start Experiment' | 'Try Again'
}

/** Where the overview's data comes from (T48). */
export type ProgressSource = 'device' | 'account'
export type ProgressSyncStatus = 'idle' | 'syncing' | 'error'

export interface StudentProgressOverview {
  scope: 'local-device'
  /** `account`: loaded from and saved to the signed-in student's Supabase records. */
  source: ProgressSource
  syncStatus: ProgressSyncStatus
  syncMessage: string | null
  storageHealthy: boolean
  availableCount: number
  executableCount: number
  plannedCount: number
  startedCount: number
  completedCount: number
  quizCompletedCount: number
  items: readonly ExperimentProgressOverviewItem[]
  continueLearningItems: readonly ExperimentProgressOverviewItem[]
  completedExperimentItems: readonly ExperimentProgressOverviewItem[]
  quizResultItems: readonly ExperimentProgressOverviewItem[]
  recentActivities: readonly ProgressActivityEntry[]
  validationIssues: readonly ProgressValidationIssue[]
}
