import type {
  AssessmentAvailabilityStatus,
  AssessmentContentReviewStatus,
  AssessmentId,
  AssessmentOrderingMode,
  ExperimentAssessmentDefinition,
  MultipleChoiceQuestion,
  OptionId,
  PassingScoreConfiguration,
  QuestionId,
  QuestionOption,
} from '../../../types/assessment.ts'
import type { Experiment, ExperimentDifficulty } from '../../../types/experiment.ts'
import type { AuthSnapshot } from '../../auth/authService.ts'
import { hasPermission } from '../../auth/permissions.ts'
import { mockExperiments } from '../../experiments/data/mockExperiments.ts'
import { assessmentCatalog } from '../data/assessmentCatalog.ts'
import {
  gradeAssessment,
  type AssessmentGradingOutcome,
} from './assessmentGrading.ts'
import {
  getOrderedAssessmentQuestions,
  getOrderedQuestionOptions,
} from './assessmentSelectors.ts'
import {
  isValidSemanticVersion,
  validateAssessmentDefinition,
  validateMultipleChoiceQuestion,
  type AssessmentValidationIssue,
} from './assessmentValidation.ts'

/**
 * Security Note on Practice Assessments:
 * Assessments managed in this question bank are client-side post-experiment practice
 * quizzes (`isPracticeAssessment: true`). Published practice questions and explanations
 * are delivered to the browser so `gradeAssessment` can provide immediate educational
 * feedback after submission. This architecture is intended for formative learning review
 * and is not suitable for high-stakes official examinations.
 * Unpublished assessments (`draft`, `reviewed`, `archived`) are restricted to admins via RLS.
 */
export type AssessmentPublicationStatus =
  | 'draft'
  | 'reviewed'
  | 'published'
  | 'archived'

export type QuestionBankAuthCheck = Pick<
  AuthSnapshot,
  'status' | 'role' | 'roleStatus' | 'permissions'
>

export interface AssessmentVersionSnapshot {
  readonly version: string
  readonly savedAt: string
  readonly assessment: ExperimentAssessmentDefinition
}

export interface ManagedAssessmentRecord {
  readonly id: AssessmentId
  readonly experimentId: string
  readonly publicationStatus: AssessmentPublicationStatus
  readonly isPracticeAssessment: boolean
  readonly sortOrder: number
  readonly assessment: ExperimentAssessmentDefinition
  readonly versionHistory: readonly AssessmentVersionSnapshot[]
  readonly createdAt?: string
  readonly updatedAt?: string
}

export interface AdminQuestionBankState {
  readonly assessments: readonly ManagedAssessmentRecord[]
}

export interface QuestionOptionInput {
  id?: OptionId
  text: string
  order?: number
}

export interface QuestionEditorInput {
  id?: QuestionId
  experimentId: string
  version?: string
  prompt: string
  options: readonly QuestionOptionInput[]
  correctOptionId: OptionId
  explanation: string
  difficulty?: ExperimentDifficulty
  learningObjectiveId?: string
  reviewStatus?: AssessmentContentReviewStatus
  tags?: readonly string[]
  order?: number
}

export interface CreateAssessmentInput {
  id?: AssessmentId
  experimentId: string
  title: string
  description: string
  scopeDisclaimer?: string
  version?: string
  publicationStatus?: AssessmentPublicationStatus
  questionOrdering?: AssessmentOrderingMode
  passingScore?: PassingScoreConfiguration
  allowMultipleAttempts?: boolean
  questions?: readonly QuestionEditorInput[]
  sortOrder?: number
}

export interface UpdateAssessmentInput {
  assessmentId: AssessmentId
  experimentId?: string
  title?: string
  description?: string
  scopeDisclaimer?: string
  questionOrdering?: AssessmentOrderingMode
  passingScore?: PassingScoreConfiguration
}

export interface QuestionBankFilterCriteria {
  searchQuery?: string
  experimentId?: string | 'all'
  publicationStatus?: AssessmentPublicationStatus | 'all'
}

export interface QuizPreviewOutcome {
  readonly isPreview: true
  readonly persistedToStudentHistory: false
  readonly assessmentId: AssessmentId
  readonly assessmentVersion: string
  readonly gradingOutcome: AssessmentGradingOutcome
}

export type QuestionBankMutationResult<T> =
  | {
      ok: true
      data: T
      state: AdminQuestionBankState
      versionBumped?: boolean
      previousVersion?: string
    }
  | {
      ok: false
      code:
        | 'unauthorized'
        | 'validation_error'
        | 'not_found'
        | 'duplicate_id'
        | 'publish_blocked'
      message: string
      issues?: readonly AssessmentValidationIssue[]
    }

const DEFAULT_SCOPE_DISCLAIMER =
  'Formative post-experiment practice quiz for student concept review. Not an official high-stakes examination.'

const DEFAULT_PASSING_SCORE: PassingScoreConfiguration = {
  status: 'unconfigured-draft',
  note: 'Passing score thresholds are not enforced for practice review content.',
}

export function assertQuestionBankAdminAccess(
  authState?: QuestionBankAuthCheck | null,
): { ok: true } | { ok: false; code: 'unauthorized'; message: string } {
  if (
    !authState ||
    authState.status !== 'authenticated' ||
    authState.role !== 'admin' ||
    authState.roleStatus !== 'verified' ||
    !hasPermission(authState, 'admin:manage_content')
  ) {
    return {
      ok: false,
      code: 'unauthorized',
      message:
        'Access denied: Verified administrator role with admin:manage_content permission is required.',
    }
  }
  return { ok: true }
}

/**
 * Increments the minor segment of a semantic version string (`1.0.0` -> `1.1.0`)
 * when a published assessment's content is modified.
 */
export function incrementSemanticMinorVersion(version: string): string {
  const trimmed = version.trim()
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(trimmed)
  if (!match) {
    return '1.1.0'
  }
  const major = Number(match[1])
  const minor = Number(match[2]) + 1
  return `${major}.${minor}.0`
}

export function slugifyIdentifier(raw: string, prefix: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return normalized ? `${prefix}-${normalized}` : `${prefix}-item`
}

function mapPublicationToAvailabilityAndReview(
  publicationStatus: AssessmentPublicationStatus,
  questionCount: number,
  currentAvailability?: AssessmentAvailabilityStatus,
): {
  availabilityStatus: AssessmentAvailabilityStatus
  reviewStatus: AssessmentContentReviewStatus
} {
  if (publicationStatus === 'published') {
    return {
      availabilityStatus:
        currentAvailability === 'draft-demo' ? 'draft-demo' : 'available',
      reviewStatus: currentAvailability === 'draft-demo' ? 'draft' : 'approved',
    }
  }
  if (publicationStatus === 'reviewed') {
    return {
      availabilityStatus: questionCount > 0 ? 'draft-demo' : 'coming-soon',
      reviewStatus: 'reviewed',
    }
  }
  if (publicationStatus === 'archived') {
    return {
      availabilityStatus: 'archived',
      reviewStatus: 'reviewed',
    }
  }
  return {
    availabilityStatus: questionCount > 0 ? 'draft-demo' : 'coming-soon',
    reviewStatus: 'draft',
  }
}

function cloneOption(option: QuestionOption): QuestionOption {
  return {
    id: option.id,
    text: option.text,
    order: option.order,
  }
}

function cloneQuestion(question: MultipleChoiceQuestion): MultipleChoiceQuestion {
  return {
    id: question.id,
    experimentId: question.experimentId,
    version: question.version ?? '1.0.0',
    order: question.order,
    prompt: question.prompt,
    options: question.options.map(cloneOption),
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
    difficulty: question.difficulty ?? 'beginner',
    reviewStatus: question.reviewStatus ?? 'draft',
    ...(question.learningObjectiveId
      ? { learningObjectiveId: question.learningObjectiveId }
      : {}),
    ...(question.tags ? { tags: [...question.tags] } : {}),
  }
}

export function cloneAssessmentDefinition(
  assessment: ExperimentAssessmentDefinition,
): ExperimentAssessmentDefinition {
  return {
    id: assessment.id,
    experimentId: assessment.experimentId,
    title: assessment.title,
    description: assessment.description,
    scopeDisclaimer: assessment.scopeDisclaimer || DEFAULT_SCOPE_DISCLAIMER,
    version: assessment.version,
    availabilityStatus: assessment.availabilityStatus,
    reviewStatus: assessment.reviewStatus,
    questionOrdering: assessment.questionOrdering,
    passingScore: {
      ...assessment.passingScore,
      note: assessment.passingScore.note || DEFAULT_PASSING_SCORE.note,
    },
    allowMultipleAttempts: assessment.allowMultipleAttempts ?? true,
    questions: getOrderedAssessmentQuestions(assessment).map(cloneQuestion),
  }
}

export function createInitialAdminQuestionBankState(
  seedAssessments: readonly ExperimentAssessmentDefinition[] = assessmentCatalog,
): AdminQuestionBankState {
  const records: ManagedAssessmentRecord[] = seedAssessments.map((item, idx) => {
    const isPublished =
      item.id === 'assessment-salt-water-001' ||
      item.availabilityStatus === 'available' ||
      (item.availabilityStatus === 'draft-demo' && item.questions.length > 0)

    const publicationStatus: AssessmentPublicationStatus =
      item.availabilityStatus === 'archived'
        ? 'archived'
        : isPublished
          ? 'published'
          : item.reviewStatus === 'reviewed'
            ? 'reviewed'
            : 'draft'

    const cloned = cloneAssessmentDefinition(item)
    return {
      id: cloned.id,
      experimentId: cloned.experimentId,
      publicationStatus,
      isPracticeAssessment: true,
      sortOrder: idx + 1,
      assessment: cloned,
      versionHistory:
        publicationStatus === 'published'
          ? [
              {
                version: cloned.version,
                savedAt: '2026-11-07T00:00:00.000Z',
                assessment: cloneAssessmentDefinition(cloned),
              },
            ]
          : [],
    }
  })

  return {
    assessments: records,
  }
}

export function getKnownExperimentIds(
  experiments: readonly Pick<Experiment, 'id'>[] = mockExperiments,
): ReadonlySet<string> {
  return new Set(experiments.map((exp) => exp.id))
}

export function getKnownLearningObjectivesForExperiment(
  experimentId: string,
  experiments: readonly Experiment[] = mockExperiments,
): ReadonlySet<string> {
  const experiment = experiments.find((exp) => exp.id === experimentId)
  if (!experiment?.learning?.objectives) {
    return new Set()
  }
  return new Set(experiment.learning.objectives.map((obj) => obj.id))
}

export function buildQuestionFromInput(
  input: QuestionEditorInput,
  fallbackOrder: number,
): MultipleChoiceQuestion {
  const rawQuestionId =
    typeof input.id === 'string' && input.id.trim().length > 0
      ? input.id.trim()
      : slugifyIdentifier(
          input.prompt || 'question',
          `${input.experimentId}-q-${fallbackOrder}`,
        )

  const normalizedOptions: QuestionOption[] = (input.options ?? []).map((opt, idx) => {
    const order =
      typeof opt.order === 'number' && Number.isSafeInteger(opt.order) && opt.order >= 1
        ? opt.order
        : idx + 1
    const id =
      typeof opt.id === 'string' && opt.id.trim().length > 0
        ? opt.id.trim()
        : `${rawQuestionId}-opt-${order}`
    return {
      id,
      text: typeof opt.text === 'string' ? opt.text.trim() : '',
      order,
    }
  })

  const trimmedObjective =
    typeof input.learningObjectiveId === 'string' &&
    input.learningObjectiveId.trim().length > 0
      ? input.learningObjectiveId.trim()
      : undefined

  return {
    id: rawQuestionId,
    experimentId: typeof input.experimentId === 'string' ? input.experimentId.trim() : '',
    version:
      typeof input.version === 'string' && input.version.trim().length > 0
        ? input.version.trim()
        : '1.0.0',
    order:
      typeof input.order === 'number' &&
      Number.isSafeInteger(input.order) &&
      input.order >= 1
        ? input.order
        : fallbackOrder,
    prompt: typeof input.prompt === 'string' ? input.prompt.trim() : '',
    options: normalizedOptions,
    correctOptionId:
      typeof input.correctOptionId === 'string' ? input.correctOptionId.trim() : '',
    explanation: typeof input.explanation === 'string' ? input.explanation.trim() : '',
    difficulty: input.difficulty ?? 'beginner',
    reviewStatus: input.reviewStatus ?? 'draft',
    ...(trimmedObjective ? { learningObjectiveId: trimmedObjective } : {}),
    ...(input.tags ? { tags: [...input.tags] } : {}),
  }
}

export function validateQuestionEditorInput(
  input: QuestionEditorInput,
  options: {
    expectedExperimentId: string
    knownExperimentIds?: ReadonlySet<string>
    knownLearningObjectiveIds?: ReadonlySet<string>
    fallbackOrder?: number
  },
): {
  valid: boolean
  question: MultipleChoiceQuestion
  issues: readonly AssessmentValidationIssue[]
} {
  const question = buildQuestionFromInput(input, options.fallbackOrder ?? 1)
  const knownExperiments = options.knownExperimentIds ?? getKnownExperimentIds()
  const baseResult = validateMultipleChoiceQuestion(question, {
    expectedExperimentId: options.expectedExperimentId,
    knownExperimentIds: knownExperiments,
    validLearningObjectiveIds:
      options.knownLearningObjectiveIds && options.knownLearningObjectiveIds.size > 0
        ? options.knownLearningObjectiveIds
        : undefined,
  })

  return {
    valid: baseResult.issues.length === 0,
    question,
    issues: baseResult.issues,
  }
}

/**
 * Validates whether an assessment is structurally sound and ready to be published
 * to students (`publicationStatus = 'published'`).
 * Never allows publishing an empty assessment or an assessment with invalid questions.
 */
export function validateAssessmentPublishReadiness(
  assessment: ExperimentAssessmentDefinition,
  knownExperimentIds: ReadonlySet<string> = getKnownExperimentIds(),
): {
  valid: boolean
  issues: readonly AssessmentValidationIssue[]
} {
  const candidateForPublish: ExperimentAssessmentDefinition = {
    ...assessment,
    scopeDisclaimer: assessment.scopeDisclaimer || DEFAULT_SCOPE_DISCLAIMER,
    availabilityStatus:
      assessment.availabilityStatus === 'draft-demo' ? 'draft-demo' : 'available',
    passingScore: {
      ...assessment.passingScore,
      note: assessment.passingScore.note || DEFAULT_PASSING_SCORE.note,
    },
  }

  const baseResult = validateAssessmentDefinition(candidateForPublish, {
    knownExperimentIds,
  })

  const issues: AssessmentValidationIssue[] = [...baseResult.issues]

  if (!Array.isArray(assessment.questions) || assessment.questions.length === 0) {
    if (!issues.some((i) => i.code === 'EMPTY_QUESTION_LIST')) {
      issues.push({
        code: 'EMPTY_QUESTION_LIST',
        assessmentId: assessment.id,
        message: `Assessment "${assessment.id}" cannot be published with zero questions.`,
      })
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Preserves the prior published snapshot in `versionHistory` and increments the
 * semantic version (`1.0.0 -> 1.1.0`) whenever a published assessment is modified.
 */
function applyVersionPreservationOnEdit(
  existingRecord: ManagedAssessmentRecord,
  updatedAssessment: ExperimentAssessmentDefinition,
  timestampIso: string,
): {
  nextVersion: string
  versionHistory: readonly AssessmentVersionSnapshot[]
  versionBumped: boolean
  previousVersion?: string
} {
  const wasPublished =
    existingRecord.publicationStatus === 'published' ||
    existingRecord.versionHistory.length > 0

  if (!wasPublished) {
    return {
      nextVersion: updatedAssessment.version,
      versionHistory: existingRecord.versionHistory,
      versionBumped: false,
    }
  }

  const previousVersion = existingRecord.assessment.version
  const hasSnapshotForPrevious = existingRecord.versionHistory.some(
    (snap) => snap.version === previousVersion,
  )

  const updatedHistory: AssessmentVersionSnapshot[] = hasSnapshotForPrevious
    ? [...existingRecord.versionHistory]
    : [
        ...existingRecord.versionHistory,
        {
          version: previousVersion,
          savedAt: timestampIso,
          assessment: cloneAssessmentDefinition(existingRecord.assessment),
        },
      ]

  const nextVersion = incrementSemanticMinorVersion(previousVersion)

  return {
    nextVersion,
    versionHistory: updatedHistory,
    versionBumped: true,
    previousVersion,
  }
}

/**
 * Resolves the exact assessment definition for a given `(assessmentId, version)` pair,
 * checking both the active version and preserved `versionHistory` snapshots so historical
 * student quiz attempts remain linked to the version used at submission time.
 */
export function resolveAssessmentDefinitionByVersion(
  state: AdminQuestionBankState,
  assessmentId: AssessmentId,
  version?: string,
): ExperimentAssessmentDefinition | undefined {
  const record = state.assessments.find((item) => item.id === assessmentId)
  if (!record) return undefined

  if (!version || record.assessment.version === version) {
    return record.assessment
  }

  const snapshot = record.versionHistory.find((entry) => entry.version === version)
  return snapshot?.assessment
}

export function createAssessmentInBank(
  state: AdminQuestionBankState,
  input: CreateAssessmentInput,
  authState?: QuestionBankAuthCheck | null,
  knownExperimentIds: ReadonlySet<string> = getKnownExperimentIds(),
): QuestionBankMutationResult<ManagedAssessmentRecord> {
  const access = assertQuestionBankAdminAccess(authState)
  if (!access.ok) return access

  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  const experimentId = typeof input.experimentId === 'string' ? input.experimentId.trim() : ''

  if (title.length < 3) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Assessment title must be at least 3 characters.',
    }
  }

  if (description.length < 5) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Assessment description must be at least 5 characters.',
    }
  }

  if (!knownExperimentIds.has(experimentId)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Experiment "${experimentId}" does not exist in the laboratory catalog.`,
    }
  }

  const assessmentId =
    typeof input.id === 'string' && input.id.trim().length > 0
      ? input.id.trim()
      : slugifyIdentifier(title, 'assessment')

  if (state.assessments.some((item) => item.id === assessmentId)) {
    return {
      ok: false,
      code: 'duplicate_id',
      message: `An assessment with ID "${assessmentId}" already exists.`,
    }
  }

  const version =
    typeof input.version === 'string' && input.version.trim().length > 0
      ? input.version.trim()
      : '1.0.0'

  if (!isValidSemanticVersion(version)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Version "${version}" is not a valid semantic version (expected e.g. 1.0.0).`,
    }
  }

  const builtQuestions: MultipleChoiceQuestion[] = []
  for (let i = 0; i < (input.questions ?? []).length; i += 1) {
    const qInput = input.questions![i]
    const validation = validateQuestionEditorInput(
      { ...qInput, experimentId },
      {
        expectedExperimentId: experimentId,
        knownExperimentIds,
        fallbackOrder: i + 1,
      },
    )
    if (!validation.valid) {
      return {
        ok: false,
        code: 'validation_error',
        message: validation.issues[0]?.message ?? 'Invalid question in assessment.',
        issues: validation.issues,
      }
    }
    builtQuestions.push(validation.question)
  }

  const desiredPublicationStatus: AssessmentPublicationStatus =
    input.publicationStatus ?? 'draft'
  const { availabilityStatus, reviewStatus } = mapPublicationToAvailabilityAndReview(
    desiredPublicationStatus,
    builtQuestions.length,
  )

  const definition: ExperimentAssessmentDefinition = {
    id: assessmentId,
    experimentId,
    title,
    description,
    scopeDisclaimer: input.scopeDisclaimer?.trim() || DEFAULT_SCOPE_DISCLAIMER,
    version,
    availabilityStatus,
    reviewStatus,
    questionOrdering: input.questionOrdering ?? 'ordered-by-field',
    passingScore: input.passingScore ?? { ...DEFAULT_PASSING_SCORE },
    allowMultipleAttempts: input.allowMultipleAttempts ?? true,
    questions: builtQuestions,
  }

  if (desiredPublicationStatus === 'published') {
    const readiness = validateAssessmentPublishReadiness(definition, knownExperimentIds)
    if (!readiness.valid) {
      return {
        ok: false,
        code: 'publish_blocked',
        message:
          readiness.issues[0]?.message ??
          'Assessment cannot be published until validation errors are resolved.',
        issues: readiness.issues,
      }
    }
  } else {
    const defCheck = validateAssessmentDefinition(definition, { knownExperimentIds })
    if (!defCheck.valid) {
      return {
        ok: false,
        code: 'validation_error',
        message: defCheck.issues[0]?.message ?? 'Invalid assessment definition.',
        issues: defCheck.issues,
      }
    }
  }

  const nowIso = new Date().toISOString()
  const newRecord: ManagedAssessmentRecord = {
    id: assessmentId,
    experimentId,
    publicationStatus: desiredPublicationStatus,
    isPracticeAssessment: true,
    sortOrder: input.sortOrder ?? state.assessments.length + 1,
    assessment: definition,
    versionHistory:
      desiredPublicationStatus === 'published'
        ? [
            {
              version: definition.version,
              savedAt: nowIso,
              assessment: cloneAssessmentDefinition(definition),
            },
          ]
        : [],
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const nextState: AdminQuestionBankState = {
    assessments: [...state.assessments, newRecord],
  }

  return {
    ok: true,
    data: newRecord,
    state: nextState,
  }
}

export function updateAssessmentMetadataInBank(
  state: AdminQuestionBankState,
  input: UpdateAssessmentInput,
  authState?: QuestionBankAuthCheck | null,
  knownExperimentIds: ReadonlySet<string> = getKnownExperimentIds(),
): QuestionBankMutationResult<ManagedAssessmentRecord> {
  const access = assertQuestionBankAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.assessments.find((item) => item.id === input.assessmentId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Assessment "${input.assessmentId}" was not found.`,
    }
  }

  const nextTitle =
    typeof input.title === 'string' ? input.title.trim() : existing.assessment.title
  const nextDescription =
    typeof input.description === 'string'
      ? input.description.trim()
      : existing.assessment.description
  const nextExperimentId =
    typeof input.experimentId === 'string'
      ? input.experimentId.trim()
      : existing.experimentId

  if (nextTitle.length < 3) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Assessment title must be at least 3 characters.',
    }
  }

  if (nextDescription.length < 5) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Assessment description must be at least 5 characters.',
    }
  }

  if (!knownExperimentIds.has(nextExperimentId)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Experiment "${nextExperimentId}" does not exist in the laboratory catalog.`,
    }
  }

  const updatedQuestions = existing.assessment.questions.map((q) => ({
    ...cloneQuestion(q),
    experimentId: nextExperimentId,
  }))

  const nowIso = new Date().toISOString()
  const draftDefinition: ExperimentAssessmentDefinition = {
    ...existing.assessment,
    experimentId: nextExperimentId,
    title: nextTitle,
    description: nextDescription,
    scopeDisclaimer:
      input.scopeDisclaimer?.trim() ||
      existing.assessment.scopeDisclaimer ||
      DEFAULT_SCOPE_DISCLAIMER,
    questionOrdering: input.questionOrdering ?? existing.assessment.questionOrdering,
    passingScore: input.passingScore ?? existing.assessment.passingScore,
    questions: updatedQuestions,
  }

  const versionResult = applyVersionPreservationOnEdit(
    existing,
    draftDefinition,
    nowIso,
  )

  const finalDefinition: ExperimentAssessmentDefinition = {
    ...draftDefinition,
    version: versionResult.nextVersion,
  }

  const check = validateAssessmentDefinition(finalDefinition, { knownExperimentIds })
  if (!check.valid) {
    return {
      ok: false,
      code: 'validation_error',
      message: check.issues[0]?.message ?? 'Invalid assessment metadata update.',
      issues: check.issues,
    }
  }

  const updatedRecord: ManagedAssessmentRecord = {
    ...existing,
    experimentId: nextExperimentId,
    assessment: finalDefinition,
    versionHistory:
      existing.publicationStatus === 'published'
        ? [
            ...versionResult.versionHistory,
            {
              version: finalDefinition.version,
              savedAt: nowIso,
              assessment: cloneAssessmentDefinition(finalDefinition),
            },
          ]
        : versionResult.versionHistory,
    updatedAt: nowIso,
  }

  return {
    ok: true,
    data: updatedRecord,
    state: {
      assessments: state.assessments.map((item) =>
        item.id === updatedRecord.id ? updatedRecord : item,
      ),
    },
    versionBumped: versionResult.versionBumped,
    previousVersion: versionResult.previousVersion,
  }
}

export function addQuestionToAssessmentInBank(
  state: AdminQuestionBankState,
  assessmentId: AssessmentId,
  questionInput: QuestionEditorInput,
  authState?: QuestionBankAuthCheck | null,
  knownExperimentIds: ReadonlySet<string> = getKnownExperimentIds(),
  knownLearningObjectiveIds?: ReadonlySet<string>,
): QuestionBankMutationResult<{
  record: ManagedAssessmentRecord
  question: MultipleChoiceQuestion
}> {
  const access = assertQuestionBankAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.assessments.find((item) => item.id === assessmentId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Assessment "${assessmentId}" was not found.`,
    }
  }

  const nextOrder = existing.assessment.questions.length + 1
  const validation = validateQuestionEditorInput(
    {
      ...questionInput,
      experimentId: existing.experimentId,
      order: nextOrder,
    },
    {
      expectedExperimentId: existing.experimentId,
      knownExperimentIds,
      knownLearningObjectiveIds,
      fallbackOrder: nextOrder,
    },
  )

  if (!validation.valid) {
    return {
      ok: false,
      code: 'validation_error',
      message: validation.issues[0]?.message ?? 'Question validation failed.',
      issues: validation.issues,
    }
  }

  if (existing.assessment.questions.some((q) => q.id === validation.question.id)) {
    return {
      ok: false,
      code: 'duplicate_id',
      message: `A question with ID "${validation.question.id}" already exists in assessment "${assessmentId}".`,
    }
  }

  const nowIso = new Date().toISOString()
  const nextQuestions = [
    ...getOrderedAssessmentQuestions(existing.assessment).map(cloneQuestion),
    validation.question,
  ]

  const { availabilityStatus, reviewStatus } = mapPublicationToAvailabilityAndReview(
    existing.publicationStatus,
    nextQuestions.length,
    existing.assessment.availabilityStatus,
  )

  const draftDefinition: ExperimentAssessmentDefinition = {
    ...existing.assessment,
    availabilityStatus,
    reviewStatus,
    questions: nextQuestions,
  }

  const versionResult = applyVersionPreservationOnEdit(
    existing,
    draftDefinition,
    nowIso,
  )

  const finalDefinition: ExperimentAssessmentDefinition = {
    ...draftDefinition,
    version: versionResult.nextVersion,
  }

  const defCheck = validateAssessmentDefinition(finalDefinition, { knownExperimentIds })
  if (!defCheck.valid) {
    return {
      ok: false,
      code: 'validation_error',
      message: defCheck.issues[0]?.message ?? 'Assessment validation failed.',
      issues: defCheck.issues,
    }
  }

  const updatedRecord: ManagedAssessmentRecord = {
    ...existing,
    assessment: finalDefinition,
    versionHistory:
      existing.publicationStatus === 'published'
        ? [
            ...versionResult.versionHistory,
            {
              version: finalDefinition.version,
              savedAt: nowIso,
              assessment: cloneAssessmentDefinition(finalDefinition),
            },
          ]
        : versionResult.versionHistory,
    updatedAt: nowIso,
  }

  return {
    ok: true,
    data: {
      record: updatedRecord,
      question: validation.question,
    },
    state: {
      assessments: state.assessments.map((item) =>
        item.id === updatedRecord.id ? updatedRecord : item,
      ),
    },
    versionBumped: versionResult.versionBumped,
    previousVersion: versionResult.previousVersion,
  }
}

export function updateQuestionInAssessmentInBank(
  state: AdminQuestionBankState,
  assessmentId: AssessmentId,
  questionId: QuestionId,
  questionInput: QuestionEditorInput,
  authState?: QuestionBankAuthCheck | null,
  knownExperimentIds: ReadonlySet<string> = getKnownExperimentIds(),
  knownLearningObjectiveIds?: ReadonlySet<string>,
): QuestionBankMutationResult<{
  record: ManagedAssessmentRecord
  question: MultipleChoiceQuestion
}> {
  const access = assertQuestionBankAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.assessments.find((item) => item.id === assessmentId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Assessment "${assessmentId}" was not found.`,
    }
  }

  const currentQuestion = existing.assessment.questions.find((q) => q.id === questionId)
  if (!currentQuestion) {
    return {
      ok: false,
      code: 'not_found',
      message: `Question "${questionId}" was not found in assessment "${assessmentId}".`,
    }
  }

  const validation = validateQuestionEditorInput(
    {
      ...questionInput,
      id: questionId,
      experimentId: existing.experimentId,
      order: currentQuestion.order,
    },
    {
      expectedExperimentId: existing.experimentId,
      knownExperimentIds,
      knownLearningObjectiveIds,
      fallbackOrder: currentQuestion.order,
    },
  )

  if (!validation.valid) {
    return {
      ok: false,
      code: 'validation_error',
      message: validation.issues[0]?.message ?? 'Question validation failed.',
      issues: validation.issues,
    }
  }

  const nowIso = new Date().toISOString()
  const nextQuestions = getOrderedAssessmentQuestions(existing.assessment).map((q) =>
    q.id === questionId ? validation.question : cloneQuestion(q),
  )

  const draftDefinition: ExperimentAssessmentDefinition = {
    ...existing.assessment,
    questions: nextQuestions,
  }

  const versionResult = applyVersionPreservationOnEdit(
    existing,
    draftDefinition,
    nowIso,
  )

  const finalDefinition: ExperimentAssessmentDefinition = {
    ...draftDefinition,
    version: versionResult.nextVersion,
  }

  const defCheck = validateAssessmentDefinition(finalDefinition, { knownExperimentIds })
  if (!defCheck.valid) {
    return {
      ok: false,
      code: 'validation_error',
      message: defCheck.issues[0]?.message ?? 'Assessment validation failed.',
      issues: defCheck.issues,
    }
  }

  const updatedRecord: ManagedAssessmentRecord = {
    ...existing,
    assessment: finalDefinition,
    versionHistory:
      existing.publicationStatus === 'published'
        ? [
            ...versionResult.versionHistory,
            {
              version: finalDefinition.version,
              savedAt: nowIso,
              assessment: cloneAssessmentDefinition(finalDefinition),
            },
          ]
        : versionResult.versionHistory,
    updatedAt: nowIso,
  }

  return {
    ok: true,
    data: {
      record: updatedRecord,
      question: validation.question,
    },
    state: {
      assessments: state.assessments.map((item) =>
        item.id === updatedRecord.id ? updatedRecord : item,
      ),
    },
    versionBumped: versionResult.versionBumped,
    previousVersion: versionResult.previousVersion,
  }
}

export function reorderQuestionInAssessmentInBank(
  state: AdminQuestionBankState,
  assessmentId: AssessmentId,
  questionId: QuestionId,
  direction: 'up' | 'down',
  authState?: QuestionBankAuthCheck | null,
): QuestionBankMutationResult<ManagedAssessmentRecord> {
  const access = assertQuestionBankAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.assessments.find((item) => item.id === assessmentId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Assessment "${assessmentId}" was not found.`,
    }
  }

  const ordered = getOrderedAssessmentQuestions(existing.assessment).map(cloneQuestion)
  const index = ordered.findIndex((q) => q.id === questionId)
  if (index === -1) {
    return {
      ok: false,
      code: 'not_found',
      message: `Question "${questionId}" was not found in assessment "${assessmentId}".`,
    }
  }

  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= ordered.length) {
    return {
      ok: true,
      data: existing,
      state,
    }
  }

  const temp = ordered[index]
  ordered[index] = ordered[swapIndex]
  ordered[swapIndex] = temp

  const reindexed = ordered.map((q, idx) => ({
    ...q,
    order: idx + 1,
  }))

  const nowIso = new Date().toISOString()
  const draftDefinition: ExperimentAssessmentDefinition = {
    ...existing.assessment,
    questions: reindexed,
  }

  const versionResult = applyVersionPreservationOnEdit(
    existing,
    draftDefinition,
    nowIso,
  )

  const finalDefinition: ExperimentAssessmentDefinition = {
    ...draftDefinition,
    version: versionResult.nextVersion,
  }

  const updatedRecord: ManagedAssessmentRecord = {
    ...existing,
    assessment: finalDefinition,
    versionHistory:
      existing.publicationStatus === 'published'
        ? [
            ...versionResult.versionHistory,
            {
              version: finalDefinition.version,
              savedAt: nowIso,
              assessment: cloneAssessmentDefinition(finalDefinition),
            },
          ]
        : versionResult.versionHistory,
    updatedAt: nowIso,
  }

  return {
    ok: true,
    data: updatedRecord,
    state: {
      assessments: state.assessments.map((item) =>
        item.id === updatedRecord.id ? updatedRecord : item,
      ),
    },
    versionBumped: versionResult.versionBumped,
    previousVersion: versionResult.previousVersion,
  }
}

export function setAssessmentPublicationStatusInBank(
  state: AdminQuestionBankState,
  assessmentId: AssessmentId,
  nextStatus: AssessmentPublicationStatus,
  authState?: QuestionBankAuthCheck | null,
  knownExperimentIds: ReadonlySet<string> = getKnownExperimentIds(),
): QuestionBankMutationResult<ManagedAssessmentRecord> {
  const access = assertQuestionBankAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.assessments.find((item) => item.id === assessmentId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Assessment "${assessmentId}" was not found.`,
    }
  }

  if (nextStatus === 'published') {
    const readiness = validateAssessmentPublishReadiness(
      existing.assessment,
      knownExperimentIds,
    )
    if (!readiness.valid) {
      return {
        ok: false,
        code: 'publish_blocked',
        message:
          readiness.issues[0]?.message ??
          'Assessment cannot be published until all validation errors are resolved.',
        issues: readiness.issues,
      }
    }
  }

  const { availabilityStatus, reviewStatus } = mapPublicationToAvailabilityAndReview(
    nextStatus,
    existing.assessment.questions.length,
    existing.assessment.availabilityStatus,
  )

  const nowIso = new Date().toISOString()
  const updatedDefinition: ExperimentAssessmentDefinition = {
    ...existing.assessment,
    availabilityStatus,
    reviewStatus,
  }

  const hasCurrentVersionSnapshot = existing.versionHistory.some(
    (snap) => snap.version === updatedDefinition.version,
  )

  const nextVersionHistory: readonly AssessmentVersionSnapshot[] =
    nextStatus === 'published' && !hasCurrentVersionSnapshot
      ? [
          ...existing.versionHistory,
          {
            version: updatedDefinition.version,
            savedAt: nowIso,
            assessment: cloneAssessmentDefinition(updatedDefinition),
          },
        ]
      : existing.versionHistory

  const updatedRecord: ManagedAssessmentRecord = {
    ...existing,
    publicationStatus: nextStatus,
    assessment: updatedDefinition,
    versionHistory: nextVersionHistory,
    updatedAt: nowIso,
  }

  return {
    ok: true,
    data: updatedRecord,
    state: {
      assessments: state.assessments.map((item) =>
        item.id === updatedRecord.id ? updatedRecord : item,
      ),
    },
  }
}

/**
 * Evaluates a quiz preview in-memory using the existing pure `gradeAssessment` scoring
 * engine. Never persists fake scores or student assessment attempts.
 */
export function previewAssessmentQuiz(
  assessment: ExperimentAssessmentDefinition,
  answers: Readonly<Record<string, string | null | undefined>>,
  authState?: QuestionBankAuthCheck | null,
):
  | { ok: true; preview: QuizPreviewOutcome }
  | { ok: false; code: 'unauthorized'; message: string } {
  const access = assertQuestionBankAdminAccess(authState)
  if (!access.ok) return access

  const gradingOutcome = gradeAssessment(assessment, answers, {
    attemptId: `admin-preview-${assessment.id}-v${assessment.version}`,
    expectedAssessmentId: assessment.id,
    expectedAssessmentVersion: assessment.version,
  })

  return {
    ok: true,
    preview: {
      isPreview: true,
      persistedToStudentHistory: false,
      assessmentId: assessment.id,
      assessmentVersion: assessment.version,
      gradingOutcome,
    },
  }
}

/**
 * Projects the managed question bank into the student-visible assessment catalog.
 * Only assessments with `publicationStatus === 'published'` are exposed to students;
 * `draft`, `reviewed` (unpublished), and `archived` assessments are excluded.
 */
export function toStudentAssessmentCatalog(
  state: AdminQuestionBankState,
): readonly ExperimentAssessmentDefinition[] {
  return [...state.assessments]
    .filter((item) => item.publicationStatus === 'published')
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((item) => cloneAssessmentDefinition(item.assessment))
}

export function filterManagedAssessments(
  state: AdminQuestionBankState,
  criteria: QuestionBankFilterCriteria = {},
): readonly ManagedAssessmentRecord[] {
  const rawQuery =
    typeof criteria.searchQuery === 'string' ? criteria.searchQuery.trim().toLowerCase() : ''
  const expFilter =
    criteria.experimentId && criteria.experimentId !== 'all'
      ? criteria.experimentId
      : null
  const statusFilter =
    criteria.publicationStatus && criteria.publicationStatus !== 'all'
      ? criteria.publicationStatus
      : null

  return [...state.assessments]
    .filter((record) => {
      if (expFilter && record.experimentId !== expFilter) {
        return false
      }
      if (statusFilter && record.publicationStatus !== statusFilter) {
        return false
      }
      if (!rawQuery) {
        return true
      }

      const matchesHeader =
        record.id.toLowerCase().includes(rawQuery) ||
        record.experimentId.toLowerCase().includes(rawQuery) ||
        record.assessment.title.toLowerCase().includes(rawQuery) ||
        record.assessment.description.toLowerCase().includes(rawQuery)

      if (matchesHeader) return true

      return record.assessment.questions.some(
        (q) =>
          q.id.toLowerCase().includes(rawQuery) ||
          q.prompt.toLowerCase().includes(rawQuery) ||
          q.explanation.toLowerCase().includes(rawQuery) ||
          getOrderedQuestionOptions(q).some((opt) =>
            opt.text.toLowerCase().includes(rawQuery),
          ),
      )
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
}
