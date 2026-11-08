/**
 * T48 pure mapping between the local progress envelope and the account tables
 * `public.student_experiment_progress` / `public.student_quiz_attempts`.
 * No network access here; see accountProgressApi.ts.
 */
import type { AssessmentResultRecord } from '../../../types/assessment.ts'
import type {
  ExperimentProgressRecord,
  ProgressActivityEntry,
  QuizProgressSummary,
  StudentProgressStoreEnvelope,
} from '../../../types/progress.ts'
import {
  createEmptyExperimentProgressRecord,
  createEmptyProgressEnvelope,
  getDefaultKnownExperimentVersions,
  MAX_RECENT_ACTIVITIES,
  validateStoredProgressEnvelope,
  type KnownExperimentVersionMap,
} from './progressValidation.ts'

export interface ProgressRow {
  user_id: string
  experiment_id: string
  definition_version: string
  status: ExperimentProgressRecord['experimentStatus']
  current_step_id: string | null
  current_step_index: number
  completed_step_count: number
  total_step_count: number
  lab_completed_at: string | null
  last_activity_at: string | null
}

export interface QuizAttemptRow {
  user_id: string
  attempt_id: string
  experiment_id: string
  assessment_id: string
  assessment_version: string
  score: number
  total: number
  percentage: number
  correct_count: number
  total_questions: number
  answers: Record<string, string | null>
  submitted_at: string
}

export function progressRowFromRecord(
  userId: string,
  record: ExperimentProgressRecord,
): ProgressRow {
  const total = Math.max(0, Math.trunc(record.totalStepCount))
  const completedSteps = Math.min(Math.max(0, Math.trunc(record.completedStepCount)), total)
  const completed = record.experimentStatus === 'completed'
  return {
    user_id: userId,
    experiment_id: record.experimentId,
    definition_version: record.experimentDefinitionVersion,
    status: record.experimentStatus,
    current_step_id: record.currentValidatedStepId,
    current_step_index: Math.max(0, Math.trunc(record.currentValidatedStepIndex)),
    completed_step_count: completedSteps,
    total_step_count: total,
    lab_completed_at: completed
      ? (record.experimentCompletedAt ?? record.lastActivityAt ?? new Date(0).toISOString())
      : record.experimentCompletedAt,
    last_activity_at: record.lastActivityAt,
  }
}

/** Only the student's chosen option ids are kept; feedback/answer keys are never sent. */
function sanitizeAnswers(answers: Readonly<Record<string, string | null>> | undefined) {
  const clean: Record<string, string | null> = {}
  for (const [questionId, optionId] of Object.entries(answers ?? {}).slice(0, 200)) {
    if (questionId.length > 120) continue
    clean[questionId] = typeof optionId === 'string' ? optionId.slice(0, 120) : null
  }
  return clean
}

export function quizAttemptRowFromResult(
  userId: string,
  result: AssessmentResultRecord,
): QuizAttemptRow {
  return {
    user_id: userId,
    attempt_id: result.attemptId,
    experiment_id: result.experimentId,
    assessment_id: result.assessmentId,
    assessment_version: result.assessmentVersion,
    score: result.score,
    total: result.maxScore,
    percentage: result.percentage,
    correct_count: result.correctCount,
    total_questions: result.totalQuestions,
    answers: sanitizeAnswers(result.submittedAnswers),
    submitted_at: result.submittedAt,
  }
}

/** Device-local history keeps only the latest summary, so migrated attempts have no answers. */
export function quizAttemptRowFromSummary(
  userId: string,
  experimentId: string,
  summary: QuizProgressSummary,
): QuizAttemptRow {
  return {
    user_id: userId,
    attempt_id: summary.attemptId,
    experiment_id: experimentId,
    assessment_id: summary.assessmentId,
    assessment_version: summary.assessmentVersion,
    score: summary.score,
    total: summary.maxScore,
    percentage: summary.percentage,
    correct_count: summary.correctCount,
    total_questions: summary.totalQuestions,
    answers: {},
    submitted_at: summary.submittedAt,
  }
}

export function quizSummaryFromAttemptRow(row: QuizAttemptRow): QuizProgressSummary {
  return {
    attemptId: row.attempt_id,
    assessmentId: row.assessment_id,
    assessmentVersion: row.assessment_version,
    score: Number(row.score),
    maxScore: Number(row.total),
    percentage: Number(row.percentage),
    correctCount: row.correct_count,
    totalQuestions: row.total_questions,
    submittedAt: new Date(row.submitted_at).toISOString(),
  }
}

function iso(value: string | null) {
  return value ? new Date(value).toISOString() : null
}

function time(value: string | null | undefined) {
  const parsed = value ? Date.parse(value) : NaN
  return Number.isNaN(parsed) ? -Infinity : parsed
}

function latestAttemptsByExperiment(attempts: readonly QuizAttemptRow[]) {
  const latest = new Map<string, QuizAttemptRow>()
  for (const attempt of attempts) {
    const current = latest.get(attempt.experiment_id)
    if (!current || time(attempt.submitted_at) > time(current.submitted_at))
      latest.set(attempt.experiment_id, attempt)
  }
  return latest
}

/** Activities are not stored server-side; a short history is derived from the rows. */
function deriveActivities(
  experiments: Readonly<Record<string, ExperimentProgressRecord>>,
  attempts: readonly QuizAttemptRow[],
  titleOf: (id: string) => string,
): ProgressActivityEntry[] {
  const entries: ProgressActivityEntry[] = []
  for (const record of Object.values(experiments)) {
    const title = titleOf(record.experimentId)
    if (record.experimentStatus === 'completed' && record.experimentCompletedAt)
      entries.push({
        id: `acct-completed-${record.experimentId}`,
        experimentId: record.experimentId,
        experimentTitle: title,
        type: 'experiment-completed',
        label: 'Experiment completed',
        detail: `Completed all ${record.totalStepCount} validated steps of ${title}.`,
        occurredAt: record.experimentCompletedAt,
      })
    else if (record.experimentStatus === 'in-progress' && record.lastActivityAt)
      entries.push({
        id: `acct-progress-${record.experimentId}`,
        experimentId: record.experimentId,
        experimentTitle: title,
        type: 'step-completed',
        label: 'Laboratory progress saved',
        detail: `${record.completedStepCount} of ${record.totalStepCount} steps validated in ${title}.`,
        occurredAt: record.lastActivityAt,
      })
  }
  for (const attempt of attempts) {
    const title = titleOf(attempt.experiment_id)
    entries.push({
      id: `acct-quiz-${attempt.attempt_id}`,
      experimentId: attempt.experiment_id,
      experimentTitle: title,
      type: 'quiz-submitted',
      label: 'Practice quiz submitted',
      detail: `Scored ${Number(attempt.score)} / ${Number(attempt.total)} (${Math.round(Number(attempt.percentage))}%) on ${title}.`,
      occurredAt: new Date(attempt.submitted_at).toISOString(),
    })
  }
  return entries
    .sort((a, b) => time(b.occurredAt) - time(a.occurredAt))
    .slice(0, MAX_RECENT_ACTIVITIES)
}

/** Builds a validated envelope from account rows (unknown/outdated experiments are dropped). */
export function envelopeFromAccountRows(
  progressRows: readonly ProgressRow[],
  attemptRows: readonly QuizAttemptRow[],
  options: {
    knownVersions?: KnownExperimentVersionMap
    titleOf?: (experimentId: string) => string
    nowIso?: string
  } = {},
): StudentProgressStoreEnvelope {
  const known = options.knownVersions ?? getDefaultKnownExperimentVersions()
  const titleOf = options.titleOf ?? ((id: string) => id)
  const latest = latestAttemptsByExperiment(attemptRows)
  const experiments: Record<string, ExperimentProgressRecord> = {}

  for (const row of progressRows) {
    const quiz = latest.get(row.experiment_id)
    experiments[row.experiment_id] = {
      experimentId: row.experiment_id,
      experimentDefinitionVersion: row.definition_version,
      experimentStatus: row.status,
      lastActivityAt: iso(row.last_activity_at),
      currentValidatedStepId: row.current_step_id,
      currentValidatedStepIndex: row.current_step_index,
      completedStepCount: row.completed_step_count,
      totalStepCount: row.total_step_count,
      experimentCompleted: row.status === 'completed',
      experimentCompletedAt: iso(row.lab_completed_at),
      latestQuizResult: quiz ? quizSummaryFromAttemptRow(quiz) : null,
      quizAssessmentVersion: quiz ? quiz.assessment_version : null,
    }
  }
  for (const [experimentId, quiz] of latest) {
    if (experiments[experimentId]) continue
    const version = known.definitionVersions[experimentId]
    if (!version) continue
    experiments[experimentId] = {
      ...createEmptyExperimentProgressRecord(
        experimentId,
        version,
        known.stepCounts[experimentId] ?? 0,
      ),
      lastActivityAt: new Date(quiz.submitted_at).toISOString(),
      latestQuizResult: quizSummaryFromAttemptRow(quiz),
      quizAssessmentVersion: quiz.assessment_version,
    }
  }

  const nowIso = options.nowIso ?? new Date().toISOString()
  const raw: StudentProgressStoreEnvelope = {
    ...createEmptyProgressEnvelope(),
    updatedAt: nowIso,
    experiments,
    recentActivities: deriveActivities(experiments, attemptRows, titleOf),
  }
  return validateStoredProgressEnvelope(raw, known, nowIso).envelope
}

/**
 * One-time device → account migration plan: upload a local record only when the account has
 * none for that experiment or the local one is more recent; upload every local quiz summary the
 * account does not already have (attempt ids are unique, so re-running is harmless).
 */
export function planLocalProgressMigration(
  userId: string,
  local: StudentProgressStoreEnvelope,
  remoteProgress: readonly ProgressRow[],
  remoteAttempts: readonly QuizAttemptRow[],
): { progressRows: ProgressRow[]; quizRows: QuizAttemptRow[] } {
  const remoteByExperiment = new Map(remoteProgress.map((row) => [row.experiment_id, row]))
  const remoteAttemptIds = new Set(remoteAttempts.map((row) => row.attempt_id))
  const progressRows: ProgressRow[] = []
  const quizRows: QuizAttemptRow[] = []

  for (const record of Object.values(local.experiments)) {
    const hasLocalProgress = record.experimentStatus !== 'not-started'
    const remote = remoteByExperiment.get(record.experimentId)
    if (
      hasLocalProgress &&
      record.totalStepCount > 0 &&
      (!remote || time(record.lastActivityAt) > time(remote.last_activity_at))
    )
      progressRows.push(progressRowFromRecord(userId, record))
    const quiz = record.latestQuizResult
    if (quiz && !remoteAttemptIds.has(quiz.attemptId))
      quizRows.push(quizAttemptRowFromSummary(userId, record.experimentId, quiz))
  }
  return { progressRows, quizRows }
}

/** Experiments whose account row must be (re)written after a local change. */
export function changedProgressRows(
  userId: string,
  envelope: StudentProgressStoreEnvelope,
  lastSynced: ReadonlyMap<string, string>,
): ProgressRow[] {
  const rows: ProgressRow[] = []
  for (const record of Object.values(envelope.experiments)) {
    if (record.totalStepCount === 0) continue
    const row = progressRowFromRecord(userId, record)
    if (lastSynced.get(record.experimentId) !== JSON.stringify(row)) rows.push(row)
  }
  return rows
}
