import type {
  AssessmentAvailabilityStatus,
  AssessmentContentReviewStatus,
  AssessmentOrderingMode,
  ExperimentAssessmentDefinition,
  MultipleChoiceQuestion,
} from '../../../types/assessment.ts'
import type { EntityId, Experiment } from '../../../types/experiment.ts'

export type AssessmentValidationCode =
  | 'MALFORMED_ASSESSMENT'
  | 'MISSING_ASSESSMENT_ID'
  | 'DUPLICATE_ASSESSMENT_ID'
  | 'MISSING_ASSESSMENT_TITLE'
  | 'MISSING_ASSESSMENT_DESCRIPTION'
  | 'MISSING_SCOPE_DISCLAIMER'
  | 'INVALID_ASSESSMENT_VERSION'
  | 'INVALID_AVAILABILITY_STATUS'
  | 'INVALID_REVIEW_STATUS'
  | 'INVALID_ORDERING_MODE'
  | 'INVALID_PASSING_SCORE'
  | 'INVALID_EXPERIMENT_ASSOCIATION'
  | 'EMPTY_QUESTION_LIST'
  | 'MALFORMED_QUESTION'
  | 'MISSING_QUESTION_ID'
  | 'DUPLICATE_QUESTION_ID'
  | 'QUESTION_EXPERIMENT_MISMATCH'
  | 'INVALID_QUESTION_VERSION'
  | 'INVALID_QUESTION_ORDER'
  | 'MISSING_QUESTION_TEXT'
  | 'MISSING_EXPLANATION'
  | 'INVALID_DIFFICULTY'
  | 'INVALID_OBJECTIVE_REFERENCE'
  | 'INSUFFICIENT_OPTIONS'
  | 'MALFORMED_OPTION'
  | 'MISSING_OPTION_ID'
  | 'DUPLICATE_OPTION_ID'
  | 'MISSING_OPTION_TEXT'
  | 'DUPLICATE_OPTION_TEXT'
  | 'INVALID_OPTION_ORDER'
  | 'MISSING_CORRECT_ANSWER'
  | 'MULTIPLE_CORRECT_ANSWERS'
  | 'INVALID_CORRECT_ANSWER_REFERENCE'

export interface AssessmentValidationIssue {
  code: AssessmentValidationCode
  message: string
  assessmentId?: string
  questionId?: string
  optionId?: string
}

export interface AssessmentValidationResult {
  valid: boolean
  issues: readonly AssessmentValidationIssue[]
}

export interface QuestionValidationContext {
  expectedExperimentId?: EntityId
  knownExperimentIds?: ReadonlySet<EntityId> | readonly EntityId[]
  validLearningObjectiveIds?: ReadonlySet<EntityId> | readonly EntityId[]
  seenQuestionIds?: Set<string>
  seenGlobalOptionIds?: Set<string>
  assessmentId?: string
}

export interface AssessmentValidationContext {
  knownExperimentIds?: ReadonlySet<EntityId> | readonly EntityId[]
  experimentsById?: ReadonlyMap<EntityId, Experiment>
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const VALID_REVIEW_STATUSES: readonly AssessmentContentReviewStatus[] = [
  'draft',
  'reviewed',
  'approved',
]
const VALID_AVAILABILITY_STATUSES: readonly AssessmentAvailabilityStatus[] = [
  'draft-demo',
  'available',
  'coming-soon',
  'archived',
]
const VALID_ORDERING_MODES: readonly AssessmentOrderingMode[] = ['fixed', 'ordered-by-field']
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1
}

function toSet(
  collection: ReadonlySet<string> | readonly string[] | undefined,
): ReadonlySet<string> | null {
  if (!collection) return null
  return collection instanceof Set ? collection : new Set(collection)
}

export function isValidSemanticVersion(version: unknown): version is string {
  return isNonEmptyString(version) && SEMVER_PATTERN.test(version.trim())
}

/**
 * Pure validator for a single multiple-choice question.
 * Verifies question ID, experiment association, version, prompt text, explanation,
 * option count (>= 2), unique option IDs, and a single valid correct answer reference.
 */
export function validateMultipleChoiceQuestion(
  questionInput: unknown,
  context: QuestionValidationContext = {},
): AssessmentValidationResult {
  const issues: AssessmentValidationIssue[] = []
  const assessmentId = context.assessmentId

  if (!questionInput || typeof questionInput !== 'object') {
    return {
      valid: false,
      issues: [
        {
          code: 'MALFORMED_QUESTION',
          message: 'Question definition must be a non-null object.',
          assessmentId,
        },
      ],
    }
  }

  const question = questionInput as Partial<MultipleChoiceQuestion> & {
    correctOptionIds?: unknown
  }
  const questionId = isNonEmptyString(question.id) ? question.id.trim() : undefined

  if (!questionId) {
    issues.push({
      code: 'MISSING_QUESTION_ID',
      message: 'Question must have a non-empty stable id.',
      assessmentId,
    })
  } else if (context.seenQuestionIds) {
    if (context.seenQuestionIds.has(questionId)) {
      issues.push({
        code: 'DUPLICATE_QUESTION_ID',
        message: `Duplicate question ID "${questionId}" detected.`,
        assessmentId,
        questionId,
      })
    } else {
      context.seenQuestionIds.add(questionId)
    }
  }

  const knownExpSet = toSet(context.knownExperimentIds)
  if (!isNonEmptyString(question.experimentId)) {
    issues.push({
      code: 'INVALID_EXPERIMENT_ASSOCIATION',
      message: `Question "${questionId ?? 'unknown'}" is missing an experimentId.`,
      assessmentId,
      questionId,
    })
  } else {
    const expId = question.experimentId.trim()
    if (context.expectedExperimentId && expId !== context.expectedExperimentId) {
      issues.push({
        code: 'QUESTION_EXPERIMENT_MISMATCH',
        message: `Question "${questionId ?? 'unknown'}" references experiment "${expId}" instead of "${context.expectedExperimentId}".`,
        assessmentId,
        questionId,
      })
    }
    if (knownExpSet && !knownExpSet.has(expId)) {
      issues.push({
        code: 'INVALID_EXPERIMENT_ASSOCIATION',
        message: `Question "${questionId ?? 'unknown'}" references unknown experiment "${expId}".`,
        assessmentId,
        questionId,
      })
    }
  }

  if (!isValidSemanticVersion(question.version)) {
    issues.push({
      code: 'INVALID_QUESTION_VERSION',
      message: `Question "${questionId ?? 'unknown'}" must declare a valid semantic version (e.g., "1.0.0").`,
      assessmentId,
      questionId,
    })
  }

  if (!isPositiveInteger(question.order)) {
    issues.push({
      code: 'INVALID_QUESTION_ORDER',
      message: `Question "${questionId ?? 'unknown'}" must have a positive integer order.`,
      assessmentId,
      questionId,
    })
  }

  if (!isNonEmptyString(question.prompt)) {
    issues.push({
      code: 'MISSING_QUESTION_TEXT',
      message: `Question "${questionId ?? 'unknown'}" must include non-empty question prompt text.`,
      assessmentId,
      questionId,
    })
  }

  if (!isNonEmptyString(question.explanation)) {
    issues.push({
      code: 'MISSING_EXPLANATION',
      message: `Question "${questionId ?? 'unknown'}" must include a non-empty scientific explanation.`,
      assessmentId,
      questionId,
    })
  }

  if (
    !isNonEmptyString(question.reviewStatus) ||
    !VALID_REVIEW_STATUSES.includes(question.reviewStatus as AssessmentContentReviewStatus)
  ) {
    issues.push({
      code: 'INVALID_REVIEW_STATUS',
      message: `Question "${questionId ?? 'unknown'}" has an invalid reviewStatus.`,
      assessmentId,
      questionId,
    })
  }

  if (
    question.difficulty !== undefined &&
    (!isNonEmptyString(question.difficulty) ||
      !VALID_DIFFICULTIES.includes(question.difficulty as (typeof VALID_DIFFICULTIES)[number]))
  ) {
    issues.push({
      code: 'INVALID_DIFFICULTY',
      message: `Question "${questionId ?? 'unknown'}" has an unsupported difficulty value.`,
      assessmentId,
      questionId,
    })
  }

  const validObjectives = toSet(context.validLearningObjectiveIds)
  if (question.learningObjectiveId !== undefined) {
    if (!isNonEmptyString(question.learningObjectiveId)) {
      issues.push({
        code: 'INVALID_OBJECTIVE_REFERENCE',
        message: `Question "${questionId ?? 'unknown'}" has an empty learningObjectiveId.`,
        assessmentId,
        questionId,
      })
    } else if (validObjectives && !validObjectives.has(question.learningObjectiveId.trim())) {
      issues.push({
        code: 'INVALID_OBJECTIVE_REFERENCE',
        message: `Question "${questionId ?? 'unknown'}" references unknown learning objective "${question.learningObjectiveId}".`,
        assessmentId,
        questionId,
      })
    }
  }

  const rawOptions = Array.isArray(question.options) ? question.options : []
  const localOptionIds = new Set<string>()
  const localOptionTexts = new Set<string>()
  let validOptionCount = 0
  let flaggedCorrectOptionsCount = 0

  for (const rawOption of rawOptions) {
    if (!rawOption || typeof rawOption !== 'object') {
      issues.push({
        code: 'MALFORMED_OPTION',
        message: `Question "${questionId ?? 'unknown'}" contains a non-object answer option.`,
        assessmentId,
        questionId,
      })
      continue
    }

    const option = rawOption as {
      id?: unknown
      text?: unknown
      order?: unknown
      isCorrect?: unknown
    }
    if (option.isCorrect === true) {
      flaggedCorrectOptionsCount += 1
    }

    const optionId = isNonEmptyString(option.id) ? option.id.trim() : undefined
    const optionText = isNonEmptyString(option.text) ? option.text.trim() : undefined
    const hasOrder = isPositiveInteger(option.order)

    if (!optionId) {
      issues.push({
        code: 'MISSING_OPTION_ID',
        message: `An option in question "${questionId ?? 'unknown'}" is missing a stable id.`,
        assessmentId,
        questionId,
      })
    } else {
      if (localOptionIds.has(optionId) || context.seenGlobalOptionIds?.has(optionId)) {
        issues.push({
          code: 'DUPLICATE_OPTION_ID',
          message: `Duplicate option ID "${optionId}" in question "${questionId ?? 'unknown'}".`,
          assessmentId,
          questionId,
          optionId,
        })
      }
      localOptionIds.add(optionId)
      context.seenGlobalOptionIds?.add(optionId)
    }

    if (!optionText) {
      issues.push({
        code: 'MISSING_OPTION_TEXT',
        message: `Option "${optionId ?? 'unknown'}" in question "${questionId ?? 'unknown'}" must have non-empty text.`,
        assessmentId,
        questionId,
        optionId,
      })
    } else {
      const normalizedText = optionText.toLowerCase()
      if (localOptionTexts.has(normalizedText)) {
        issues.push({
          code: 'DUPLICATE_OPTION_TEXT',
          message: `Duplicate option text in question "${questionId ?? 'unknown'}".`,
          assessmentId,
          questionId,
          optionId,
        })
      }
      localOptionTexts.add(normalizedText)
    }

    if (!hasOrder) {
      issues.push({
        code: 'INVALID_OPTION_ORDER',
        message: `Option "${optionId ?? 'unknown'}" in question "${questionId ?? 'unknown'}" must have a positive integer order.`,
        assessmentId,
        questionId,
        optionId,
      })
    }

    if (optionId && optionText && hasOrder) {
      validOptionCount += 1
    }
  }

  if (rawOptions.length < 2 || validOptionCount < 2) {
    issues.push({
      code: 'INSUFFICIENT_OPTIONS',
      message: `Question "${questionId ?? 'unknown'}" must provide at least two valid answer options.`,
      assessmentId,
      questionId,
    })
  }

  if (
    flaggedCorrectOptionsCount > 1 ||
    (Array.isArray(question.correctOptionIds) && question.correctOptionIds.length > 1)
  ) {
    issues.push({
      code: 'MULTIPLE_CORRECT_ANSWERS',
      message: `Question "${questionId ?? 'unknown'}" must have exactly one correct answer.`,
      assessmentId,
      questionId,
    })
  }

  if (!isNonEmptyString(question.correctOptionId)) {
    issues.push({
      code: 'MISSING_CORRECT_ANSWER',
      message: `Question "${questionId ?? 'unknown'}" is missing a correctOptionId.`,
      assessmentId,
      questionId,
    })
  } else {
    const correctId = question.correctOptionId.trim()
    const matchingOptions = rawOptions.filter(
      (opt) =>
        opt &&
        typeof opt === 'object' &&
        isNonEmptyString((opt as { id?: unknown }).id) &&
        ((opt as { id: string }).id.trim() === correctId),
    )
    if (matchingOptions.length === 0) {
      issues.push({
        code: 'INVALID_CORRECT_ANSWER_REFERENCE',
        message: `Question "${questionId ?? 'unknown'}" correctOptionId "${correctId}" does not match any option in the question.`,
        assessmentId,
        questionId,
        optionId: correctId,
      })
    } else if (matchingOptions.length > 1) {
      issues.push({
        code: 'MULTIPLE_CORRECT_ANSWERS',
        message: `Question "${questionId ?? 'unknown'}" correctOptionId "${correctId}" matches multiple options.`,
        assessmentId,
        questionId,
        optionId: correctId,
      })
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Pure validator for an ExperimentAssessmentDefinition.
 * Rejects malformed assessment definitions, invalid version strings, invalid experiment links,
 * duplicate question or option IDs, and malformed questions.
 */
export function validateAssessmentDefinition(
  assessmentInput: unknown,
  context: AssessmentValidationContext = {},
): AssessmentValidationResult {
  const issues: AssessmentValidationIssue[] = []

  if (!assessmentInput || typeof assessmentInput !== 'object') {
    return {
      valid: false,
      issues: [
        {
          code: 'MALFORMED_ASSESSMENT',
          message: 'Assessment definition must be a non-null object.',
        },
      ],
    }
  }

  const assessment = assessmentInput as Partial<ExperimentAssessmentDefinition>
  const assessmentId = isNonEmptyString(assessment.id) ? assessment.id.trim() : undefined

  if (!assessmentId) {
    issues.push({
      code: 'MISSING_ASSESSMENT_ID',
      message: 'Assessment definition must include a non-empty stable id.',
    })
  }

  const knownExpSet = toSet(context.knownExperimentIds)
  const experimentId = isNonEmptyString(assessment.experimentId)
    ? assessment.experimentId.trim()
    : undefined

  if (!experimentId) {
    issues.push({
      code: 'INVALID_EXPERIMENT_ASSOCIATION',
      message: `Assessment "${assessmentId ?? 'unknown'}" is missing an experimentId.`,
      assessmentId,
    })
  } else if (
    (knownExpSet && !knownExpSet.has(experimentId)) ||
    (context.experimentsById && !context.experimentsById.has(experimentId))
  ) {
    issues.push({
      code: 'INVALID_EXPERIMENT_ASSOCIATION',
      message: `Assessment "${assessmentId ?? 'unknown'}" references unknown experiment "${experimentId}".`,
      assessmentId,
    })
  }

  if (!isValidSemanticVersion(assessment.version)) {
    issues.push({
      code: 'INVALID_ASSESSMENT_VERSION',
      message: `Assessment "${assessmentId ?? 'unknown'}" must declare a valid semantic version (e.g., "1.0.0").`,
      assessmentId,
    })
  }

  if (!isNonEmptyString(assessment.title)) {
    issues.push({
      code: 'MISSING_ASSESSMENT_TITLE',
      message: `Assessment "${assessmentId ?? 'unknown'}" must include a non-empty title.`,
      assessmentId,
    })
  }

  if (!isNonEmptyString(assessment.description)) {
    issues.push({
      code: 'MISSING_ASSESSMENT_DESCRIPTION',
      message: `Assessment "${assessmentId ?? 'unknown'}" must include a non-empty description.`,
      assessmentId,
    })
  }

  if (!isNonEmptyString(assessment.scopeDisclaimer)) {
    issues.push({
      code: 'MISSING_SCOPE_DISCLAIMER',
      message: `Assessment "${assessmentId ?? 'unknown'}" must include a non-empty scopeDisclaimer.`,
      assessmentId,
    })
  }

  if (
    !isNonEmptyString(assessment.availabilityStatus) ||
    !VALID_AVAILABILITY_STATUSES.includes(
      assessment.availabilityStatus as AssessmentAvailabilityStatus,
    )
  ) {
    issues.push({
      code: 'INVALID_AVAILABILITY_STATUS',
      message: `Assessment "${assessmentId ?? 'unknown'}" has an invalid availabilityStatus.`,
      assessmentId,
    })
  }

  if (
    !isNonEmptyString(assessment.reviewStatus) ||
    !VALID_REVIEW_STATUSES.includes(assessment.reviewStatus as AssessmentContentReviewStatus)
  ) {
    issues.push({
      code: 'INVALID_REVIEW_STATUS',
      message: `Assessment "${assessmentId ?? 'unknown'}" has an invalid reviewStatus.`,
      assessmentId,
    })
  }

  if (
    !isNonEmptyString(assessment.questionOrdering) ||
    !VALID_ORDERING_MODES.includes(assessment.questionOrdering as AssessmentOrderingMode)
  ) {
    issues.push({
      code: 'INVALID_ORDERING_MODE',
      message: `Assessment "${assessmentId ?? 'unknown'}" has an invalid questionOrdering value.`,
      assessmentId,
    })
  }

  const passingScore = assessment.passingScore
  if (
    !passingScore ||
    typeof passingScore !== 'object' ||
    (passingScore.status !== 'unconfigured-draft' && passingScore.status !== 'approved') ||
    !isNonEmptyString(passingScore.note)
  ) {
    issues.push({
      code: 'INVALID_PASSING_SCORE',
      message: `Assessment "${assessmentId ?? 'unknown'}" must include a valid passingScore configuration.`,
      assessmentId,
    })
  } else if (passingScore.status === 'approved') {
    const pct = passingScore.minimumPercentage
    if (typeof pct !== 'number' || !Number.isFinite(pct) || pct <= 0 || pct > 100) {
      issues.push({
        code: 'INVALID_PASSING_SCORE',
        message: `Approved passingScore on assessment "${assessmentId ?? 'unknown'}" requires a minimumPercentage between 1 and 100.`,
        assessmentId,
      })
    }
  }

  if (!Array.isArray(assessment.questions)) {
    issues.push({
      code: 'MALFORMED_ASSESSMENT',
      message: `Assessment "${assessmentId ?? 'unknown'}" must provide a questions array.`,
      assessmentId,
    })
    return { valid: false, issues }
  }

  if (
    (assessment.availabilityStatus === 'draft-demo' ||
      assessment.availabilityStatus === 'available') &&
    assessment.questions.length === 0
  ) {
    issues.push({
      code: 'EMPTY_QUESTION_LIST',
      message: `Assessment "${assessmentId ?? 'unknown'}" with status "${assessment.availabilityStatus}" must contain at least one question.`,
      assessmentId,
    })
  }

  const associatedExperiment = experimentId
    ? context.experimentsById?.get(experimentId)
    : undefined
  const validLearningObjectiveIds = associatedExperiment?.learning?.objectives
    ? new Set(associatedExperiment.learning.objectives.map((obj) => obj.id))
    : undefined

  const seenQuestionIds = new Set<string>()
  const seenGlobalOptionIds = new Set<string>()

  for (const question of assessment.questions) {
    const qResult = validateMultipleChoiceQuestion(question, {
      expectedExperimentId: experimentId,
      knownExperimentIds: knownExpSet ?? undefined,
      validLearningObjectiveIds,
      seenQuestionIds,
      seenGlobalOptionIds,
      assessmentId,
    })
    issues.push(...qResult.issues)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Validates an entire catalog of assessments against the known experiment records.
 */
export function validateAssessmentCatalog(
  assessments: readonly unknown[],
  experiments: readonly Experiment[],
): AssessmentValidationResult {
  const issues: AssessmentValidationIssue[] = []
  const experimentsById = new Map(experiments.map((exp) => [exp.id, exp]))
  const knownExperimentIds = new Set(experiments.map((exp) => exp.id))
  const seenAssessmentIds = new Set<string>()

  for (const entry of assessments) {
    if (entry && typeof entry === 'object' && isNonEmptyString((entry as { id?: unknown }).id)) {
      const id = (entry as { id: string }).id.trim()
      if (seenAssessmentIds.has(id)) {
        issues.push({
          code: 'DUPLICATE_ASSESSMENT_ID',
          message: `Duplicate assessment ID "${id}" in assessment catalog.`,
          assessmentId: id,
        })
      }
      seenAssessmentIds.add(id)
    }

    const result = validateAssessmentDefinition(entry, {
      knownExperimentIds,
      experimentsById,
    })
    issues.push(...result.issues)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
