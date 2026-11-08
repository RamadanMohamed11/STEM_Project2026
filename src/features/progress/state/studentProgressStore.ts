import { useSyncExternalStore } from 'react'
import { mockExperiments as defaultCatalogExperiments } from '../../experiments/data/mockExperiments.ts'
import type { AssessmentResultRecord } from '../../../types/assessment.ts'
import type { Experiment } from '../../../types/experiment.ts'
import type {
  ExperimentId,
  ExperimentProgressOverviewItem,
  ExperimentProgressRecord,
  ExperimentProgressStatus,
  ExperimentResumeMode,
  ProgressActivityEntry,
  ProgressSource,
  ProgressSyncStatus,
  ProgressValidationIssue,
  QuizProgressSummary,
  StudentProgressOverview,
  StudentProgressStoreEnvelope,
} from '../../../types/progress.ts'
import { resolveSimulation } from '../../simulations/lib/simulationRegistry.ts'
import { useSaltSimulationStore } from '../../simulations/state/useSaltSimulationStore.ts'
import {
  createLocalProgressRepository,
  type ProgressStorageAdapter,
  type StudentProgressRepository,
} from '../lib/progressRepository.ts'
import {
  changedProgressRows,
  envelopeFromAccountRows,
  planLocalProgressMigration,
  progressRowFromRecord,
  quizAttemptRowFromResult,
  type QuizAttemptRow,
} from '../lib/accountProgress.ts'
import type { AccountProgressApi } from '../lib/accountProgressApi.ts'
import {
  createEmptyExperimentProgressRecord,
  createEmptyProgressEnvelope,
  getDefaultKnownExperimentVersions,
  MAX_RECENT_ACTIVITIES,
  type KnownExperimentVersionMap,
} from '../lib/progressValidation.ts'

export interface ValidatedSimulationMilestoneInput {
  experimentId: ExperimentId
  experimentTitle?: string
  definitionVersion: string
  resetRevision: number
  safetyAcknowledged: boolean
  stepIndex: number
  currentStepId: string | null
  currentStepTitle?: string
  totalSteps: number
  completed: boolean
  occurredAt?: string
}

let activitySequence = 0
function nextActivityId(prefix: string, occurredAt: string): string {
  activitySequence += 1
  return `${prefix}-${Date.parse(occurredAt) || Date.now()}-${activitySequence}`
}

function resolveExperimentTitle(experimentId: string, fallbackTitle?: string): string {
  if (fallbackTitle && fallbackTitle.trim().length > 0) return fallbackTitle
  const found = defaultCatalogExperiments.find((item) => item.id === experimentId)
  return found?.title ?? experimentId
}

function prependActivity(
  existing: readonly ProgressActivityEntry[],
  entry: ProgressActivityEntry,
): readonly ProgressActivityEntry[] {
  return [entry, ...existing].slice(0, MAX_RECENT_ACTIVITIES)
}

/**
 * Pure transition that updates an envelope from a validated simulation milestone.
 * Ignores unstarted initial mounts and intermediate 3D animation frames where
 * validated workflow milestones have not changed.
 */
export function applySimulationMilestoneToEnvelope(
  envelope: StudentProgressStoreEnvelope,
  input: ValidatedSimulationMilestoneInput,
  options: { isResetEvent?: boolean } = {},
): { envelope: StudentProgressStoreEnvelope; changed: boolean } {
  const occurredAt = input.occurredAt ?? new Date().toISOString()
  const totalStepCount = Math.max(0, Math.trunc(input.totalSteps))

  // Planned experiments with 0 executable steps cannot record simulation progress
  if (totalStepCount === 0) {
    return { envelope, changed: false }
  }

  const existing =
    envelope.experiments[input.experimentId] ??
    createEmptyExperimentProgressRecord(input.experimentId, input.definitionVersion, totalStepCount)

  const versionChanged = existing.experimentDefinitionVersion !== input.definitionVersion
  const baseRecord = versionChanged
    ? createEmptyExperimentProgressRecord(
        input.experimentId,
        input.definitionVersion,
        totalStepCount,
      )
    : existing

  const experimentTitle = resolveExperimentTitle(input.experimentId, input.experimentTitle)

  // Handle explicit reset when an experiment had previously started or completed
  const isUnstartedSimulation =
    !input.safetyAcknowledged && input.stepIndex === 0 && !input.completed

  if (options.isResetEvent && baseRecord.experimentStatus !== 'not-started') {
    const resetRecord: ExperimentProgressRecord = {
      ...createEmptyExperimentProgressRecord(
        input.experimentId,
        input.definitionVersion,
        totalStepCount,
      ),
      lastActivityAt: occurredAt,
      latestQuizResult: baseRecord.latestQuizResult,
      quizAssessmentVersion: baseRecord.quizAssessmentVersion,
    }

    const activity: ProgressActivityEntry = {
      id: nextActivityId('act-reset', occurredAt),
      experimentId: input.experimentId,
      experimentTitle,
      type: 'experiment-restarted',
      label: 'Experiment Restarted',
      detail: `Reset ${experimentTitle} to Step 1.`,
      occurredAt,
    }

    return {
      changed: true,
      envelope: {
        ...envelope,
        updatedAt: occurredAt,
        experiments: {
          ...envelope.experiments,
          [input.experimentId]: resetRecord,
        },
        recentActivities: prependActivity(envelope.recentActivities, activity),
      },
    }
  }

  // Opening /lab without acknowledging safety or completing any step must never mark started/completed
  if (isUnstartedSimulation) {
    return { envelope, changed: false }
  }

  const clampedStepIndex = Math.max(0, Math.min(Math.trunc(input.stepIndex), totalStepCount))
  const completedStepCount = input.completed ? totalStepCount : clampedStepIndex
  const nextStatus: ExperimentProgressStatus = input.completed ? 'completed' : 'in-progress'
  const nextStepId = input.completed
    ? (input.currentStepId ?? 'review')
    : (input.currentStepId ?? `step-${clampedStepIndex + 1}`)

  const noMilestoneChange =
    !versionChanged &&
    baseRecord.experimentStatus === nextStatus &&
    baseRecord.completedStepCount === completedStepCount &&
    baseRecord.currentValidatedStepIndex === clampedStepIndex &&
    baseRecord.currentValidatedStepId === nextStepId &&
    baseRecord.experimentCompleted === input.completed

  if (noMilestoneChange) {
    return { envelope, changed: false }
  }

  let activity: ProgressActivityEntry
  if (input.completed && !baseRecord.experimentCompleted) {
    activity = {
      id: nextActivityId('act-complete', occurredAt),
      experimentId: input.experimentId,
      experimentTitle,
      type: 'experiment-completed',
      label: 'Experiment Completed',
      detail: `Completed all ${totalStepCount} validated steps in ${experimentTitle}.`,
      occurredAt,
    }
  } else if (baseRecord.experimentStatus === 'not-started' && completedStepCount === 0) {
    activity = {
      id: nextActivityId('act-start', occurredAt),
      experimentId: input.experimentId,
      experimentTitle,
      type: 'experiment-started',
      label: 'Experiment Started',
      detail: `Acknowledged laboratory safety and started ${experimentTitle}.`,
      occurredAt,
    }
  } else {
    const stepDetail = input.currentStepTitle
      ? `Completed step ${completedStepCount} of ${totalStepCount} (${input.currentStepTitle}).`
      : `Completed ${completedStepCount} of ${totalStepCount} validated steps.`
    activity = {
      id: nextActivityId('act-step', occurredAt),
      experimentId: input.experimentId,
      experimentTitle,
      type: 'step-completed',
      label: 'Validated Step Completed',
      detail: stepDetail,
      occurredAt,
    }
  }

  const nextRecord: ExperimentProgressRecord = {
    experimentId: input.experimentId,
    experimentDefinitionVersion: input.definitionVersion,
    experimentStatus: nextStatus,
    lastActivityAt: occurredAt,
    currentValidatedStepId: nextStepId,
    currentValidatedStepIndex: clampedStepIndex,
    completedStepCount,
    totalStepCount,
    experimentCompleted: input.completed,
    experimentCompletedAt: input.completed
      ? (baseRecord.experimentCompletedAt ?? occurredAt)
      : null,
    latestQuizResult: baseRecord.latestQuizResult,
    quizAssessmentVersion: baseRecord.quizAssessmentVersion,
  }

  return {
    changed: true,
    envelope: {
      ...envelope,
      updatedAt: occurredAt,
      experiments: {
        ...envelope.experiments,
        [input.experimentId]: nextRecord,
      },
      recentActivities: prependActivity(envelope.recentActivities, activity),
    },
  }
}

/**
 * Pure transition that records a submitted quiz result from T27/T28 into the progress envelope.
 * Uses the authoritative AssessmentResultRecord directly without recalculating scores.
 */
export function applyQuizResultToEnvelope(
  envelope: StudentProgressStoreEnvelope,
  result: AssessmentResultRecord,
  knownVersions: KnownExperimentVersionMap = getDefaultKnownExperimentVersions(),
): { envelope: StudentProgressStoreEnvelope; changed: boolean } {
  if (!result || typeof result.experimentId !== 'string') {
    return { envelope, changed: false }
  }

  const experimentId = result.experimentId
  if (!knownVersions.knownExperimentIds.has(experimentId)) {
    return { envelope, changed: false }
  }

  const totalSteps = knownVersions.stepCounts[experimentId] ?? 0
  if (totalSteps === 0) {
    return { envelope, changed: false }
  }

  const expectedDefVersion = knownVersions.definitionVersions[experimentId] ?? '1.0.0'
  const occurredAt = result.submittedAt || result.submissionTimestamp || new Date().toISOString()

  const existing =
    envelope.experiments[experimentId] ??
    createEmptyExperimentProgressRecord(experimentId, expectedDefVersion, totalSteps)

  if (existing.latestQuizResult?.attemptId === result.attemptId) {
    return { envelope, changed: false }
  }

  const quizSummary: QuizProgressSummary = {
    attemptId: result.attemptId,
    assessmentId: result.assessmentId,
    assessmentVersion: result.assessmentVersion,
    score: result.score,
    maxScore: result.maxScore,
    percentage: result.percentage,
    correctCount: result.correctCount,
    totalQuestions: result.totalQuestions,
    submittedAt: occurredAt,
  }

  const nextRecord: ExperimentProgressRecord = {
    ...existing,
    experimentDefinitionVersion: expectedDefVersion,
    totalStepCount: totalSteps,
    lastActivityAt: occurredAt,
    latestQuizResult: quizSummary,
    quizAssessmentVersion: result.assessmentVersion,
  }

  const experimentTitle = resolveExperimentTitle(experimentId)
  const activity: ProgressActivityEntry = {
    id: nextActivityId('act-quiz', occurredAt),
    experimentId,
    experimentTitle,
    type: 'quiz-submitted',
    label: 'Quiz Submitted',
    detail: `Scored ${result.correctCount} / ${result.totalQuestions} (${result.percentage}%) on ${experimentTitle} quiz.`,
    occurredAt,
  }

  return {
    changed: true,
    envelope: {
      ...envelope,
      updatedAt: occurredAt,
      experiments: {
        ...envelope.experiments,
        [experimentId]: nextRecord,
      },
      recentActivities: prependActivity(envelope.recentActivities, activity),
    },
  }
}

export interface BuildProgressOverviewOptions {
  catalog?: readonly Experiment[]
  liveInMemoryExperimentIds?: ReadonlySet<string>
  storageHealthy?: boolean
  validationIssues?: readonly ProgressValidationIssue[]
  source?: ProgressSource
  syncStatus?: ProgressSyncStatus
  syncMessage?: string | null
}

/**
 * Computes a complete, student-facing progress overview from a progress envelope
 * and the experiment catalog. Never counts planned experiments as completed activities.
 */
export function buildStudentProgressOverview(
  envelope: StudentProgressStoreEnvelope,
  options: BuildProgressOverviewOptions = {},
): StudentProgressOverview {
  const catalog = options.catalog ?? defaultCatalogExperiments
  const liveInMemoryIds = options.liveInMemoryExperimentIds ?? new Set<string>()
  const storageHealthy = options.storageHealthy ?? true
  const validationIssues = options.validationIssues ?? []

  const items: ExperimentProgressOverviewItem[] = []
  let executableCount = 0
  let plannedCount = 0
  let startedCount = 0
  let completedCount = 0
  let quizCompletedCount = 0

  for (const experiment of catalog) {
    const sim = resolveSimulation(experiment)
    const isExecutable = Boolean(sim) && experiment.status !== 'planned'

    if (isExecutable) {
      executableCount += 1
    } else {
      plannedCount += 1
    }

    const definitionVersion = sim ? sim.definition.version : null
    const totalStepCount = sim ? sim.definition.steps.length : 0

    // Planned experiments are always forced to clean 'not-started' state so they can never be counted as completed
    const storedRecord = isExecutable ? envelope.experiments[experiment.id] : undefined
    const progress: ExperimentProgressRecord =
      storedRecord ??
      createEmptyExperimentProgressRecord(
        experiment.id,
        definitionVersion ?? 'planned-0.0.0',
        totalStepCount,
      )

    if (isExecutable) {
      if (progress.experimentStatus === 'in-progress') {
        startedCount += 1
      } else if (progress.experimentStatus === 'completed') {
        completedCount += 1
      }
      if (progress.latestQuizResult !== null) {
        quizCompletedCount += 1
      }
    }

    let resumeMode: ExperimentResumeMode = 'start-new'
    let primaryActionLabel: ExperimentProgressOverviewItem['primaryActionLabel'] =
      'Start Experiment'

    if (progress.experimentStatus === 'in-progress') {
      if (liveInMemoryIds.has(experiment.id)) {
        resumeMode = 'continue-live-session'
        primaryActionLabel = 'Continue'
      } else {
        resumeMode = 'restart-required'
        primaryActionLabel = 'Restart Experiment'
      }
    } else if (progress.experimentStatus === 'completed') {
      resumeMode = 'start-new'
      primaryActionLabel = 'Try Again'
    }

    items.push({
      experiment,
      isExecutable,
      definitionVersion,
      progress,
      resumeMode,
      primaryActionLabel,
    })
  }

  return {
    scope: 'local-device',
    source: options.source ?? 'device',
    syncStatus: options.syncStatus ?? 'idle',
    syncMessage: options.syncMessage ?? null,
    storageHealthy,
    availableCount: catalog.length,
    executableCount,
    plannedCount,
    startedCount,
    completedCount,
    quizCompletedCount,
    items,
    continueLearningItems: items.filter(
      (item) => item.isExecutable && item.progress.experimentStatus === 'in-progress',
    ),
    completedExperimentItems: items.filter(
      (item) => item.isExecutable && item.progress.experimentStatus === 'completed',
    ),
    quizResultItems: items.filter(
      (item) => item.isExecutable && item.progress.latestQuizResult !== null,
    ),
    recentActivities: envelope.recentActivities,
    validationIssues,
  }
}

// ============================================================================
// Application Progress Store Singleton & Live Simulation Subscription
// ============================================================================

let activeRepository: StudentProgressRepository = createLocalProgressRepository()
let currentLoadState = activeRepository.load()
let currentEnvelope: StudentProgressStoreEnvelope = currentLoadState.envelope
let currentValidationIssues: readonly ProgressValidationIssue[] = currentLoadState.issues
let currentStorageHealthy: boolean = currentLoadState.storageHealthy

const listeners = new Set<() => void>()
let cachedOverviewSnapshot: StudentProgressOverview | null = null

function notifyListeners(): void {
  cachedOverviewSnapshot = null
  for (const listener of listeners) {
    listener()
  }
}

function getLiveInMemoryExperimentIds(): ReadonlySet<string> {
  const liveSet = new Set<string>()
  const simState = useSaltSimulationStore.getState()
  const hasStartedInMemory =
    simState.workflow.safetyAcknowledged ||
    simState.workflow.stepIndex > 0 ||
    simState.workflow.completed
  if (hasStartedInMemory && !simState.workflow.completed) {
    liveSet.add(simState.activeExperimentId)
  }
  return liveSet
}

/**
 * Configures or replaces the active progress repository (used by unit tests
 * or future backend synchronization adapters) and reloads state.
 */
export function configureStudentProgressRepository(
  repository?: StudentProgressRepository,
): StudentProgressOverview {
  connectGeneration += 1
  account = null
  syncStatus = 'idle'
  syncMessage = null
  activeRepository = repository ?? createLocalProgressRepository()
  currentLoadState = activeRepository.load()
  currentEnvelope = currentLoadState.envelope
  currentValidationIssues = currentLoadState.issues
  currentStorageHealthy = currentLoadState.storageHealthy
  lastObservedSimMilestone = captureCurrentSimulationMilestoneTuple()
  notifyListeners()
  return getStudentProgressOverview()
}

/**
 * Reloads student progress from the active repository (e.g., simulating a page reload).
 */
export function reloadStudentProgressFromRepository(): StudentProgressOverview {
  currentLoadState = activeRepository.load()
  currentEnvelope = currentLoadState.envelope
  currentValidationIssues = currentLoadState.issues
  currentStorageHealthy = currentLoadState.storageHealthy
  lastObservedSimMilestone = captureCurrentSimulationMilestoneTuple()
  notifyListeners()
  return getStudentProgressOverview()
}

export function getStudentProgressEnvelope(): StudentProgressStoreEnvelope {
  return currentEnvelope
}

export function getStudentProgressOverview(): StudentProgressOverview {
  if (!cachedOverviewSnapshot) {
    cachedOverviewSnapshot = buildStudentProgressOverview(currentEnvelope, {
      liveInMemoryExperimentIds: getLiveInMemoryExperimentIds(),
      storageHealthy: currentStorageHealthy,
      validationIssues: currentValidationIssues,
      source: account ? 'account' : 'device',
      syncStatus,
      syncMessage,
    })
  }
  return cachedOverviewSnapshot
}

export function recordSimulationMilestoneProgress(
  input: ValidatedSimulationMilestoneInput,
  options: { isResetEvent?: boolean } = {},
): boolean {
  const result = applySimulationMilestoneToEnvelope(currentEnvelope, input, options)
  if (!result.changed) {
    return false
  }
  currentEnvelope = result.envelope
  const saveResult = activeRepository.save(currentEnvelope)
  currentStorageHealthy = saveResult.storageHealthy
  if (saveResult.issues.length > 0) {
    currentValidationIssues = saveResult.issues
  }
  notifyListeners()
  return true
}

export function recordQuizResultProgress(result: AssessmentResultRecord): boolean {
  const updated = applyQuizResultToEnvelope(currentEnvelope, result)
  if (!updated.changed) {
    return false
  }
  currentEnvelope = updated.envelope
  if (account) account.pendingAttempts.push(quizAttemptRowFromResult(account.userId, result))
  const saveResult = activeRepository.save(currentEnvelope)
  currentStorageHealthy = saveResult.storageHealthy
  if (saveResult.issues.length > 0) {
    currentValidationIssues = saveResult.issues
  }
  notifyListeners()
  return true
}

export function clearStudentProgress(): void {
  // Account records are never deleted from the browser.
  if (account) return
  const cleared = activeRepository.clear()
  currentEnvelope = createEmptyProgressEnvelope()
  currentValidationIssues = []
  currentStorageHealthy = cleared.storageHealthy
  notifyListeners()
}

export function subscribeStudentProgress(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useStudentProgressOverview(): StudentProgressOverview {
  return useSyncExternalStore(
    subscribeStudentProgress,
    getStudentProgressOverview,
    getStudentProgressOverview,
  )
}

// ============================================================================
// T48 Account Mode: Supabase-backed progress for signed-in students
// ============================================================================

export const PROGRESS_MIGRATION_FLAG_PREFIX = 'stem_virtual_lab_progress_migrated_v1:'

export const progressSyncMessages = {
  loadFailed:
    'Your account progress could not be loaded. Showing progress saved on this device instead.',
  saveFailed:
    'Some progress could not be saved to your account yet. It will be retried with your next step.',
  migrated: 'Progress saved on this device was added to your account.',
} as const

interface AccountSession {
  userId: string
  api: AccountProgressApi
  lastSynced: Map<string, string>
  pendingAttempts: QuizAttemptRow[]
  queue: Promise<void>
}

let account: AccountSession | null = null
let connectGeneration = 0
let syncStatus: ProgressSyncStatus = 'idle'
let syncMessage: string | null = null

/** In account mode the envelope lives in memory and is written through to Supabase. */
const accountRepository: StudentProgressRepository = {
  load: () => ({
    envelope: currentEnvelope,
    issues: [],
    storageHealthy: true,
    loadedFromStorage: true,
  }),
  save: () => {
    scheduleAccountSync()
    return { ok: true, storageHealthy: true, issues: [] }
  },
  clear: () => ({ ok: false, storageHealthy: true }),
}

function safeStorage(storage?: ProgressStorageAdapter | null): ProgressStorageAdapter | null {
  if (storage !== undefined) return storage
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
  } catch {
    return null
  }
}

function scheduleAccountSync(): void {
  const session = account
  if (!session) return
  const rows = changedProgressRows(session.userId, currentEnvelope, session.lastSynced)
  const attempts = session.pendingAttempts.splice(0)
  if (rows.length === 0 && attempts.length === 0) return
  syncStatus = 'syncing'
  notifyListeners()
  session.queue = session.queue.then(async () => {
    try {
      await session.api.upsertProgress(rows)
      for (const row of rows) session.lastSynced.set(row.experiment_id, JSON.stringify(row))
      await session.api.insertAttempts(attempts)
      if (account !== session) return
      syncStatus = 'idle'
      if (syncMessage === progressSyncMessages.saveFailed) syncMessage = null
    } catch {
      // Unsaved rows stay "dirty" (lastSynced unchanged); attempts are re-queued.
      session.pendingAttempts.unshift(...attempts)
      if (account !== session) return
      syncStatus = 'error'
      syncMessage = progressSyncMessages.saveFailed
    }
    notifyListeners()
  })
}

/** Retries any unsaved account writes (e.g. from a "Try again" button). */
export function retryStudentProgressSync(): Promise<void> {
  scheduleAccountSync()
  return account?.queue ?? Promise.resolve()
}

/** Resolves when queued account writes have finished (tests and page unload helpers). */
export function flushStudentProgressSync(): Promise<void> {
  return account?.queue ?? Promise.resolve()
}

export interface ConnectAccountOptions {
  /** Device storage holding pre-login progress and the migration flag (tests inject this). */
  storage?: ProgressStorageAdapter | null
}

/**
 * Switches to account mode for a signed-in student. On the first sign-in for this user on this
 * device, progress saved on the device is uploaded once, then removed from the device so a later
 * account on a shared computer does not inherit it.
 */
export async function connectStudentProgressAccount(
  userId: string,
  api: AccountProgressApi,
  options: ConnectAccountOptions = {},
): Promise<void> {
  if (account?.userId === userId) return
  const generation = ++connectGeneration
  syncStatus = 'syncing'
  syncMessage = null
  notifyListeners()

  try {
    let remote = await api.fetchAll(userId)
    if (generation !== connectGeneration) return

    const storage = safeStorage(options.storage)
    const flagKey = PROGRESS_MIGRATION_FLAG_PREFIX + userId
    let migratedNow = false
    let alreadyMigrated = false
    try {
      alreadyMigrated = storage?.getItem(flagKey) === 'done'
    } catch {
      alreadyMigrated = false
    }
    if (!alreadyMigrated) {
      const deviceRepository = createLocalProgressRepository({ storage })
      const plan = planLocalProgressMigration(
        userId,
        deviceRepository.load().envelope,
        remote.progress,
        remote.attempts,
      )
      await api.upsertProgress(plan.progressRows)
      await api.insertAttempts(plan.quizRows)
      try {
        storage?.setItem(flagKey, 'done')
      } catch {
        // Re-running the migration is harmless: uploads are idempotent.
      }
      deviceRepository.clear()
      migratedNow = plan.progressRows.length + plan.quizRows.length > 0
      if (migratedNow) remote = await api.fetchAll(userId)
      if (generation !== connectGeneration) return
    }

    const envelope = envelopeFromAccountRows(remote.progress, remote.attempts, {
      titleOf: (id) => resolveExperimentTitle(id),
    })
    account = {
      userId,
      api,
      lastSynced: new Map(
        Object.values(envelope.experiments).map((record) => [
          record.experimentId,
          JSON.stringify(progressRowFromRecord(userId, record)),
        ]),
      ),
      pendingAttempts: [],
      queue: Promise.resolve(),
    }
    activeRepository = accountRepository
    currentEnvelope = envelope
    currentValidationIssues = []
    currentStorageHealthy = true
    syncStatus = 'idle'
    syncMessage = migratedNow ? progressSyncMessages.migrated : null
    lastObservedSimMilestone = captureCurrentSimulationMilestoneTuple()
    notifyListeners()
  } catch {
    if (generation !== connectGeneration) return
    syncStatus = 'error'
    syncMessage = progressSyncMessages.loadFailed
    notifyListeners()
  }
}

/** Returns to device-local progress (signed out). Account data is not copied to the device. */
export function disconnectStudentProgressAccount(options: ConnectAccountOptions = {}): void {
  connectGeneration += 1
  const wasAccount = account !== null
  account = null
  if (!wasAccount && syncStatus === 'idle') return
  syncStatus = 'idle'
  syncMessage = null
  if (wasAccount) {
    activeRepository = createLocalProgressRepository({ storage: safeStorage(options.storage) })
    currentLoadState = activeRepository.load()
    currentEnvelope = currentLoadState.envelope
    currentValidationIssues = currentLoadState.issues
    currentStorageHealthy = currentLoadState.storageHealthy
    lastObservedSimMilestone = captureCurrentSimulationMilestoneTuple()
  }
  notifyListeners()
}

// ============================================================================
// Milestone-Gated Subscription to useSaltSimulationStore
// ============================================================================

interface SimulationMilestoneTuple {
  experimentId: string
  definitionVersion: string
  resetRevision: number
  safetyAcknowledged: boolean
  stepIndex: number
  completed: boolean
}

function captureCurrentSimulationMilestoneTuple(): SimulationMilestoneTuple {
  const s = useSaltSimulationStore.getState()
  return {
    experimentId: s.activeExperimentId,
    definitionVersion: s.definitionVersion,
    resetRevision: s.resetRevision,
    safetyAcknowledged: s.workflow.safetyAcknowledged,
    stepIndex: s.workflow.stepIndex,
    completed: s.workflow.completed,
  }
}

let lastObservedSimMilestone: SimulationMilestoneTuple = captureCurrentSimulationMilestoneTuple()

useSaltSimulationStore.subscribe((state) => {
  const prev = lastObservedSimMilestone
  const next: SimulationMilestoneTuple = {
    experimentId: state.activeExperimentId,
    definitionVersion: state.definitionVersion,
    resetRevision: state.resetRevision,
    safetyAcknowledged: state.workflow.safetyAcknowledged,
    stepIndex: state.workflow.stepIndex,
    completed: state.workflow.completed,
  }

  // Fast exit during 3D animations (transfer ticks, stream ticks, effects) when no milestone changed
  if (
    prev.experimentId === next.experimentId &&
    prev.definitionVersion === next.definitionVersion &&
    prev.resetRevision === next.resetRevision &&
    prev.safetyAcknowledged === next.safetyAcknowledged &&
    prev.stepIndex === next.stepIndex &&
    prev.completed === next.completed
  ) {
    return
  }

  lastObservedSimMilestone = next

  const experimentObj = defaultCatalogExperiments.find(
    (item) => item.id === state.activeExperimentId,
  )
  const sim = resolveSimulation(experimentObj)
  const totalSteps = sim ? sim.definition.steps.length : 0
  const currentStep = sim ? sim.definition.steps[state.workflow.stepIndex] : undefined
  const previousCompletedStep =
    sim && state.workflow.stepIndex > 0
      ? sim.definition.steps[state.workflow.stepIndex - 1]
      : undefined

  const isResetEvent =
    next.resetRevision > prev.resetRevision &&
    !next.safetyAcknowledged &&
    next.stepIndex === 0 &&
    !next.completed

  recordSimulationMilestoneProgress(
    {
      experimentId: state.activeExperimentId,
      definitionVersion: state.definitionVersion,
      resetRevision: state.resetRevision,
      safetyAcknowledged: state.workflow.safetyAcknowledged,
      stepIndex: state.workflow.stepIndex,
      currentStepId: currentStep?.id ?? null,
      currentStepTitle: previousCompletedStep?.title,
      totalSteps,
      completed: state.workflow.completed,
    },
    { isResetEvent },
  )

  // Always invalidate cached overview when in-memory simulation milestone changes
  // so live resumeMode ('continue-live-session' vs 'restart-required') stays accurate
  notifyListeners()
})
