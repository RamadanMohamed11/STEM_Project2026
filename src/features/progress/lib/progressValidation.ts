import { mockExperiments as catalogExperiments } from '../../experiments/data/mockExperiments.ts'
import { assessmentCatalog as experimentAssessments } from '../../assessments/data/assessmentCatalog.ts'
import { resolveSimulation } from '../../simulations/lib/simulationRegistry.ts'
import type {
  ExperimentId,
  ExperimentProgressRecord,
  ExperimentProgressStatus,
  ProgressActivityEntry,
  ProgressActivityType,
  ProgressValidationIssue,
  QuizProgressSummary,
  StudentProgressStoreEnvelope,
} from '../../../types/progress.ts'

export const PROGRESS_SCHEMA_VERSION = 1 as const
export const PROGRESS_STORAGE_SCOPE = 'local-device' as const
export const MAX_RECENT_ACTIVITIES = 15

const FORBIDDEN_KEYS = new Set([
  'password',
  'passwordHash',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  '$$typeof',
  'isObject3D',
  'isMesh',
  'isBufferGeometry',
  'isMaterial',
])

const VALID_EXPERIMENT_STATUSES: ReadonlySet<ExperimentProgressStatus> = new Set([
  'not-started',
  'in-progress',
  'completed',
])

const VALID_ACTIVITY_TYPES: ReadonlySet<ProgressActivityType> = new Set([
  'experiment-started',
  'step-completed',
  'experiment-completed',
  'experiment-restarted',
  'quiz-submitted',
])

export interface KnownExperimentVersionMap {
  readonly definitionVersions: Readonly<Record<string, string>>
  readonly stepCounts: Readonly<Record<string, number>>
  readonly assessmentVersions: Readonly<Record<string, string>>
  readonly knownExperimentIds: ReadonlySet<string>
}

export function getDefaultKnownExperimentVersions(): KnownExperimentVersionMap {
  const definitionVersions: Record<string, string> = {}
  const stepCounts: Record<string, number> = {}
  const assessmentVersions: Record<string, string> = {}
  const knownExperimentIds = new Set<string>()

  for (const experiment of catalogExperiments) {
    knownExperimentIds.add(experiment.id)
    const sim = resolveSimulation(experiment)
    if (sim) {
      definitionVersions[experiment.id] = sim.definition.version
      stepCounts[experiment.id] = sim.definition.steps.length
    } else {
      definitionVersions[experiment.id] = 'planned-0.0.0'
      stepCounts[experiment.id] = 0
    }
  }

  for (const assessment of experimentAssessments) {
    assessmentVersions[assessment.experimentId] = assessment.version
  }

  return {
    definitionVersions,
    stepCounts,
    assessmentVersions,
    knownExperimentIds,
  }
}

export function createEmptyExperimentProgressRecord(
  experimentId: ExperimentId,
  experimentDefinitionVersion: string,
  totalStepCount: number,
): ExperimentProgressRecord {
  return {
    experimentId,
    experimentDefinitionVersion,
    experimentStatus: 'not-started',
    lastActivityAt: null,
    currentValidatedStepId: null,
    currentValidatedStepIndex: 0,
    completedStepCount: 0,
    totalStepCount: Math.max(0, Math.trunc(totalStepCount)),
    experimentCompleted: false,
    experimentCompletedAt: null,
    latestQuizResult: null,
    quizAssessmentVersion: null,
  }
}

export function createEmptyProgressEnvelope(
  nowIso: string = new Date().toISOString(),
): StudentProgressStoreEnvelope {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    scope: PROGRESS_STORAGE_SCOPE,
    updatedAt: nowIso,
    experiments: {},
    recentActivities: [],
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Recursively checks that a value contains no functions, non-plain instances,
 * Three.js / React internals, or credential fields.
 */
export function containsForbiddenPayload(value: unknown, depth = 0): boolean {
  if (depth > 8) return true
  if (value === null || value === undefined) return false
  const valueType = typeof value
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') return true
  if (valueType !== 'object') return false

  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenPayload(item, depth + 1))
  }

  if (!isPlainRecord(value)) {
    return true
  }

  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) return true
    if (containsForbiddenPayload(nested, depth + 1)) return true
  }

  return false
}

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) return false
  const parsed = Date.parse(value)
  return Number.isFinite(parsed)
}

function validateQuizProgressSummary(
  raw: unknown,
  expectedAssessmentVersion?: string,
): QuizProgressSummary | null {
  if (!isPlainRecord(raw)) return null
  const {
    attemptId,
    assessmentId,
    assessmentVersion,
    score,
    maxScore,
    percentage,
    correctCount,
    totalQuestions,
    submittedAt,
  } = raw

  if (
    typeof attemptId !== 'string' ||
    attemptId.trim().length === 0 ||
    typeof assessmentId !== 'string' ||
    assessmentId.trim().length === 0 ||
    typeof assessmentVersion !== 'string' ||
    assessmentVersion.trim().length === 0 ||
    typeof score !== 'number' ||
    !Number.isFinite(score) ||
    score < 0 ||
    typeof maxScore !== 'number' ||
    !Number.isFinite(maxScore) ||
    maxScore <= 0 ||
    score > maxScore ||
    typeof percentage !== 'number' ||
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100 ||
    typeof correctCount !== 'number' ||
    !Number.isInteger(correctCount) ||
    correctCount < 0 ||
    typeof totalQuestions !== 'number' ||
    !Number.isInteger(totalQuestions) ||
    totalQuestions <= 0 ||
    correctCount > totalQuestions ||
    !isValidIsoTimestamp(submittedAt)
  ) {
    return null
  }

  if (expectedAssessmentVersion && assessmentVersion !== expectedAssessmentVersion) {
    return null
  }

  return {
    attemptId,
    assessmentId,
    assessmentVersion,
    score,
    maxScore,
    percentage,
    correctCount,
    totalQuestions,
    submittedAt,
  }
}

export interface ProgressValidationResult {
  envelope: StudentProgressStoreEnvelope
  issues: readonly ProgressValidationIssue[]
}

/**
 * Validates raw parsed JSON or unknown input into a clean StudentProgressStoreEnvelope.
 * Never throws; returns a safe envelope and any recorded validation issues.
 */
export function validateStoredProgressEnvelope(
  raw: unknown,
  knownVersions: KnownExperimentVersionMap = getDefaultKnownExperimentVersions(),
  nowIso: string = new Date().toISOString(),
): ProgressValidationResult {
  const issues: ProgressValidationIssue[] = []

  if (!isPlainRecord(raw)) {
    issues.push({
      code: 'INVALID_ENVELOPE',
      message: 'Stored progress data is not a plain object.',
    })
    return { envelope: createEmptyProgressEnvelope(nowIso), issues }
  }

  if (containsForbiddenPayload(raw)) {
    issues.push({
      code: 'FORBIDDEN_PAYLOAD_OBJECT',
      message:
        'Stored progress contained non-serializable objects, rendering instances, or forbidden fields and was reset.',
    })
    return { envelope: createEmptyProgressEnvelope(nowIso), issues }
  }

  if (raw.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
    issues.push({
      code: 'UNSUPPORTED_SCHEMA_VERSION',
      message: `Unsupported progress schema version "${String(raw.schemaVersion)}". Expected version ${PROGRESS_SCHEMA_VERSION}.`,
    })
    return { envelope: createEmptyProgressEnvelope(nowIso), issues }
  }

  if (raw.scope !== PROGRESS_STORAGE_SCOPE) {
    issues.push({
      code: 'INVALID_ENVELOPE',
      message: `Invalid progress scope "${String(raw.scope)}". Expected "${PROGRESS_STORAGE_SCOPE}".`,
    })
    return { envelope: createEmptyProgressEnvelope(nowIso), issues }
  }

  const rawExperiments = raw.experiments
  if (!isPlainRecord(rawExperiments)) {
    issues.push({
      code: 'INVALID_ENVELOPE',
      message: 'Stored progress is missing a valid experiments map.',
    })
    return { envelope: createEmptyProgressEnvelope(nowIso), issues }
  }

  const cleanExperiments: Record<ExperimentId, ExperimentProgressRecord> = {}

  for (const [experimentId, recordValue] of Object.entries(rawExperiments)) {
    if (!knownVersions.knownExperimentIds.has(experimentId)) {
      issues.push({
        code: 'UNKNOWN_EXPERIMENT_ID',
        experimentId,
        message: `Ignored progress record for unknown experiment "${experimentId}".`,
      })
      continue
    }

    if (!isPlainRecord(recordValue) || recordValue.experimentId !== experimentId) {
      issues.push({
        code: 'CORRUPT_EXPERIMENT_RECORD',
        experimentId,
        message: `Dropped corrupt progress record for "${experimentId}".`,
      })
      continue
    }

    const expectedDefVersion = knownVersions.definitionVersions[experimentId]
    const expectedStepCount = knownVersions.stepCounts[experimentId] ?? 0
    const expectedAssessmentVersion = knownVersions.assessmentVersions[experimentId]

    // Planned experiments have 0 executable steps and cannot be marked in-progress or completed
    if (expectedStepCount === 0) {
      issues.push({
        code: 'CORRUPT_EXPERIMENT_RECORD',
        experimentId,
        message: `Ignored executable progress record for planned experiment "${experimentId}".`,
      })
      continue
    }

    const storedDefVersion = recordValue.experimentDefinitionVersion
    if (typeof storedDefVersion !== 'string' || storedDefVersion !== expectedDefVersion) {
      issues.push({
        code: 'OUTDATED_DEFINITION_VERSION',
        experimentId,
        message: `Experiment "${experimentId}" definition version "${String(storedDefVersion)}" does not match current version "${expectedDefVersion}". Step progress was reset.`,
      })
      continue
    }

    const status = recordValue.experimentStatus as ExperimentProgressStatus
    const currentValidatedStepIndex = recordValue.currentValidatedStepIndex
    const completedStepCount = recordValue.completedStepCount
    const totalStepCount = recordValue.totalStepCount
    const experimentCompleted = recordValue.experimentCompleted
    const lastActivityAt = recordValue.lastActivityAt
    const experimentCompletedAt = recordValue.experimentCompletedAt
    const currentValidatedStepId = recordValue.currentValidatedStepId

    const validNumbers =
      typeof currentValidatedStepIndex === 'number' &&
      Number.isInteger(currentValidatedStepIndex) &&
      currentValidatedStepIndex >= 0 &&
      currentValidatedStepIndex <= expectedStepCount &&
      typeof completedStepCount === 'number' &&
      Number.isInteger(completedStepCount) &&
      completedStepCount >= 0 &&
      completedStepCount <= expectedStepCount &&
      typeof totalStepCount === 'number' &&
      Number.isInteger(totalStepCount) &&
      totalStepCount === expectedStepCount &&
      typeof experimentCompleted === 'boolean'

    const validStatusConsistency =
      VALID_EXPERIMENT_STATUSES.has(status) &&
      (status !== 'completed' || (experimentCompleted === true && completedStepCount === expectedStepCount)) &&
      (status !== 'not-started' || (experimentCompleted === false && completedStepCount === 0)) &&
      (!experimentCompleted || status === 'completed')

    const validTimestamps =
      (lastActivityAt === null || isValidIsoTimestamp(lastActivityAt)) &&
      (experimentCompletedAt === null || isValidIsoTimestamp(experimentCompletedAt)) &&
      (currentValidatedStepId === null || typeof currentValidatedStepId === 'string')

    if (!validNumbers || !validStatusConsistency || !validTimestamps) {
      issues.push({
        code: 'CORRUPT_EXPERIMENT_RECORD',
        experimentId,
        message: `Dropped inconsistent or corrupt progress fields for "${experimentId}".`,
      })
      continue
    }

    let validQuizResult: QuizProgressSummary | null = null
    let validQuizVersion: string | null = null

    if (recordValue.latestQuizResult !== null && recordValue.latestQuizResult !== undefined) {
      const checkedQuiz = validateQuizProgressSummary(
        recordValue.latestQuizResult,
        expectedAssessmentVersion,
      )
      if (!checkedQuiz) {
        issues.push({
          code: 'CORRUPT_EXPERIMENT_RECORD',
          experimentId,
          message: `Dropped invalid or outdated quiz result for "${experimentId}".`,
        })
      } else {
        validQuizResult = checkedQuiz
        validQuizVersion = checkedQuiz.assessmentVersion
      }
    }

    cleanExperiments[experimentId] = {
      experimentId,
      experimentDefinitionVersion: expectedDefVersion,
      experimentStatus: status,
      lastActivityAt: lastActivityAt as string | null,
      currentValidatedStepId: currentValidatedStepId as string | null,
      currentValidatedStepIndex: currentValidatedStepIndex as number,
      completedStepCount: completedStepCount as number,
      totalStepCount: expectedStepCount,
      experimentCompleted: experimentCompleted as boolean,
      experimentCompletedAt: experimentCompletedAt as string | null,
      latestQuizResult: validQuizResult,
      quizAssessmentVersion: validQuizVersion,
    }
  }

  const cleanActivities: ProgressActivityEntry[] = []
  if (Array.isArray(raw.recentActivities)) {
    for (const item of raw.recentActivities) {
      if (!isPlainRecord(item)) {
        issues.push({
          code: 'CORRUPT_ACTIVITY_RECORD',
          message: 'Ignored non-object recent activity entry.',
        })
        continue
      }
      const { id, experimentId, experimentTitle, type, label, detail, occurredAt } = item
      if (
        typeof id !== 'string' ||
        id.trim().length === 0 ||
        typeof experimentId !== 'string' ||
        !knownVersions.knownExperimentIds.has(experimentId) ||
        typeof experimentTitle !== 'string' ||
        experimentTitle.trim().length === 0 ||
        typeof type !== 'string' ||
        !VALID_ACTIVITY_TYPES.has(type as ProgressActivityType) ||
        typeof label !== 'string' ||
        label.trim().length === 0 ||
        typeof detail !== 'string' ||
        !isValidIsoTimestamp(occurredAt)
      ) {
        issues.push({
          code: 'CORRUPT_ACTIVITY_RECORD',
          experimentId: typeof experimentId === 'string' ? experimentId : undefined,
          message: 'Ignored corrupt recent activity entry.',
        })
        continue
      }
      cleanActivities.push({
        id,
        experimentId,
        experimentTitle,
        type: type as ProgressActivityType,
        label,
        detail,
        occurredAt,
      })
      if (cleanActivities.length >= MAX_RECENT_ACTIVITIES) break
    }
  }

  const updatedAt = isValidIsoTimestamp(raw.updatedAt) ? raw.updatedAt : nowIso

  return {
    envelope: {
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      scope: PROGRESS_STORAGE_SCOPE,
      updatedAt,
      experiments: cleanExperiments,
      recentActivities: cleanActivities,
    },
    issues,
  }
}
