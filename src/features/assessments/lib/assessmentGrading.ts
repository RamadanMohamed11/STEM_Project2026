import type {
  AssessmentGradingWarning,
  AssessmentPassStatus,
  AssessmentResultRecord,
  ExperimentAssessmentDefinition,
  MultipleChoiceQuestion,
  OptionId,
  PassingScoreConfiguration,
  QuestionFeedbackItem,
  QuestionId,
  QuestionOption,
} from '../../../types/assessment.ts'
import {
  getOrderedAssessmentQuestions,
  getOrderedQuestionOptions,
} from './assessmentSelectors.ts'
import { isValidSemanticVersion } from './assessmentValidation.ts'

export type AssessmentGradingErrorCode =
  | 'DUPLICATE_SUBMISSION'
  | 'INVALID_ASSESSMENT'
  | 'EMPTY_ASSESSMENT'
  | 'INVALID_ASSESSMENT_VERSION'
  | 'ASSESSMENT_ID_MISMATCH'
  | 'ASSESSMENT_VERSION_MISMATCH'

export interface GradeAssessmentOptions {
  /** Stable identifier for this attempt. Generated deterministically if omitted. */
  attemptId?: string
  /** Optional expected assessment ID to verify the attempt matches the definition. */
  expectedAssessmentId?: string
  /** Optional expected semantic version to detect version drift between attempt start and submit. */
  expectedAssessmentVersion?: string
  /** ISO-8601 timestamp string. Defaults to current time if omitted. */
  submittedAt?: string
  /** Existing submitted result for this attempt; if present, prevents duplicate grading. */
  existingSubmission?: AssessmentResultRecord | null
}

export type AssessmentGradingOutcome =
  | {
      ok: true
      result: AssessmentResultRecord
    }
  | {
      ok: false
      code: AssessmentGradingErrorCode
      message: string
      existingResult?: AssessmentResultRecord
    }

export interface AttemptAnswerValidationResult {
  valid: boolean
  isComplete: boolean
  totalQuestions: number
  answeredCount: number
  unansweredCount: number
  answeredQuestionIds: readonly QuestionId[]
  unansweredQuestionIds: readonly QuestionId[]
  unknownQuestionIds: readonly string[]
  invalidOptionSelections: ReadonlyArray<{ questionId: QuestionId; optionId: string }>
  warnings: readonly AssessmentGradingWarning[]
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getOptionLetter(index: number): string {
  return OPTION_LETTERS[index] ?? String(index + 1)
}

/**
 * Pure percentage calculator with deterministic rounding to the nearest integer (0–100).
 * Returns 0 when maximumScore <= 0 or inputs are non-finite.
 */
export function calculatePercentageScore(score: number, maximumScore: number): number {
  if (
    typeof score !== 'number' ||
    typeof maximumScore !== 'number' ||
    !Number.isFinite(score) ||
    !Number.isFinite(maximumScore) ||
    maximumScore <= 0
  ) {
    return 0
  }

  const clampedScore = Math.max(0, Math.min(maximumScore, score))
  return Math.round((clampedScore / maximumScore) * 100)
}

/**
 * Evaluates passing status strictly from the assessment's `passingScore` configuration.
 * Never invents a passing threshold when `status === 'unconfigured-draft'`.
 */
export function evaluatePassStatus(
  score: number,
  percentage: number,
  passingScore: PassingScoreConfiguration | undefined,
): AssessmentPassStatus {
  if (!passingScore || passingScore.status !== 'approved') {
    return 'unconfigured'
  }

  const hasMinPercent =
    typeof passingScore.minimumPercentage === 'number' &&
    Number.isFinite(passingScore.minimumPercentage) &&
    passingScore.minimumPercentage > 0 &&
    passingScore.minimumPercentage <= 100

  const hasMinCount =
    typeof passingScore.minimumCorrectCount === 'number' &&
    Number.isSafeInteger(passingScore.minimumCorrectCount) &&
    passingScore.minimumCorrectCount >= 1

  if (!hasMinPercent && !hasMinCount) {
    return 'unconfigured'
  }

  const meetsPercent = hasMinPercent ? percentage >= passingScore.minimumPercentage! : true
  const meetsCount = hasMinCount ? score >= passingScore.minimumCorrectCount! : true

  return meetsPercent && meetsCount ? 'passed' : 'failed'
}

/**
 * Validates a student's answer map against an assessment definition without grading.
 * Reports unanswered questions, unknown question IDs, and invalid option IDs.
 */
export function validateAttemptAnswers(
  assessment: Pick<ExperimentAssessmentDefinition, 'questions' | 'questionOrdering'>,
  answers: Readonly<Record<string, string | null | undefined>> | null | undefined,
): AttemptAnswerValidationResult {
  const orderedQuestions =
    assessment && Array.isArray(assessment.questions)
      ? getOrderedAssessmentQuestions(assessment)
      : []

  const safeAnswers = answers && typeof answers === 'object' ? answers : {}
  const questionMap = new Map<string, MultipleChoiceQuestion>()
  for (const question of orderedQuestions) {
    if (question && isNonEmptyString(question.id)) {
      questionMap.set(question.id, question)
    }
  }

  const warnings: AssessmentGradingWarning[] = []
  const unknownQuestionIds: string[] = []
  const invalidOptionSelections: Array<{ questionId: QuestionId; optionId: string }> = []
  const answeredQuestionIds: QuestionId[] = []
  const unansweredQuestionIds: QuestionId[] = []

  for (const rawKey of Object.keys(safeAnswers)) {
    if (!questionMap.has(rawKey)) {
      unknownQuestionIds.push(rawKey)
      warnings.push({
        code: 'UNKNOWN_QUESTION_ID',
        questionId: rawKey,
        message: `Submitted answer references unknown question ID "${rawKey}".`,
      })
    }
  }

  for (const question of orderedQuestions) {
    const rawSelection = safeAnswers[question.id]
    if (!isNonEmptyString(rawSelection)) {
      unansweredQuestionIds.push(question.id)
      continue
    }

    const trimmedSelection = rawSelection.trim()
    const orderedOptions = getOrderedQuestionOptions(question)
    const matchedOption = orderedOptions.find((opt) => opt.id === trimmedSelection)

    if (!matchedOption) {
      invalidOptionSelections.push({
        questionId: question.id,
        optionId: trimmedSelection,
      })
      unansweredQuestionIds.push(question.id)
      warnings.push({
        code: 'INVALID_OPTION_ID',
        questionId: question.id,
        optionId: trimmedSelection,
        message: `Question "${question.id}" received an invalid option ID "${trimmedSelection}".`,
      })
    } else {
      answeredQuestionIds.push(question.id)
    }
  }

  const totalQuestions = orderedQuestions.length
  const answeredCount = answeredQuestionIds.length
  const unansweredCount = unansweredQuestionIds.length

  return {
    valid: unknownQuestionIds.length === 0 && invalidOptionSelections.length === 0,
    isComplete: totalQuestions > 0 && unansweredCount === 0,
    totalQuestions,
    answeredCount,
    unansweredCount,
    answeredQuestionIds,
    unansweredQuestionIds,
    unknownQuestionIds,
    invalidOptionSelections,
    warnings,
  }
}

/**
 * Builds structured educational feedback for a single question.
 */
export function buildQuestionFeedback(
  question: MultipleChoiceQuestion,
  rawSelectedOptionId: string | null | undefined,
  displayOrderIndex?: number,
): {
  feedback: QuestionFeedbackItem
  sanitizedOptionId: OptionId | null
  warning?: AssessmentGradingWarning
} {
  const orderedOptions = getOrderedQuestionOptions(question)
  const correctIndex = orderedOptions.findIndex((opt) => opt.id === question.correctOptionId)
  const correctOption = correctIndex >= 0 ? orderedOptions[correctIndex] : undefined
  const correctOptionLabel = correctIndex >= 0 ? getOptionLetter(correctIndex) : '?'
  const correctOptionText = correctOption ? correctOption.text : ''

  const effectiveOrder =
    typeof displayOrderIndex === 'number' ? displayOrderIndex + 1 : question.order

  if (!isNonEmptyString(rawSelectedOptionId)) {
    return {
      sanitizedOptionId: null,
      feedback: {
        questionId: question.id,
        order: effectiveOrder,
        prompt: question.prompt,
        status: 'unanswered',
        isCorrect: false,
        feedbackHeading: 'Not Quite Right',
        selectedOptionId: null,
        selectedOptionLabel: null,
        selectedOptionText: null,
        correctOptionId: question.correctOptionId,
        correctOptionLabel,
        correctOptionText,
        explanation: question.explanation,
        hadInvalidSelection: false,
        learningObjectiveId: question.learningObjectiveId,
        difficulty: question.difficulty,
      },
    }
  }

  const trimmedOptionId = rawSelectedOptionId.trim()
  const selectedIndex = orderedOptions.findIndex((opt) => opt.id === trimmedOptionId)
  const selectedOption = selectedIndex >= 0 ? orderedOptions[selectedIndex] : undefined

  if (!selectedOption) {
    return {
      sanitizedOptionId: null,
      warning: {
        code: 'INVALID_OPTION_ID',
        questionId: question.id,
        optionId: trimmedOptionId,
        message: `Question "${question.id}" received an invalid option ID "${trimmedOptionId}".`,
      },
      feedback: {
        questionId: question.id,
        order: effectiveOrder,
        prompt: question.prompt,
        status: 'unanswered',
        isCorrect: false,
        feedbackHeading: 'Not Quite Right',
        selectedOptionId: null,
        selectedOptionLabel: null,
        selectedOptionText: null,
        correctOptionId: question.correctOptionId,
        correctOptionLabel,
        correctOptionText,
        explanation: question.explanation,
        hadInvalidSelection: true,
        learningObjectiveId: question.learningObjectiveId,
        difficulty: question.difficulty,
      },
    }
  }

  const isCorrect = selectedOption.id === question.correctOptionId
  const selectedOptionLabel = getOptionLetter(selectedIndex)

  return {
    sanitizedOptionId: selectedOption.id,
    feedback: {
      questionId: question.id,
      order: effectiveOrder,
      prompt: question.prompt,
      status: isCorrect ? 'correct' : 'incorrect',
      isCorrect,
      feedbackHeading: isCorrect ? 'Correct Answer' : 'Not Quite Right',
      selectedOptionId: selectedOption.id,
      selectedOptionLabel,
      selectedOptionText: selectedOption.text,
      correctOptionId: question.correctOptionId,
      correctOptionLabel,
      correctOptionText,
      explanation: question.explanation,
      hadInvalidSelection: false,
      learningObjectiveId: question.learningObjectiveId,
      difficulty: question.difficulty,
    },
  }
}

/**
 * Pure automatic grading engine for multiple-choice assessments (T27).
 *
 * - Validates assessment integrity, version compatibility, and duplicate submission guards.
 * - Matches student responses by stable `questionId` and `optionId` (never by array index).
 * - Calculates total, correct, incorrect, and unanswered counts and percentage score.
 * - Produces structured question-level feedback with scientific explanations.
 */
export function gradeAssessment(
  assessment: ExperimentAssessmentDefinition | null | undefined,
  answers: Readonly<Record<string, string | null | undefined>> | null | undefined,
  options: GradeAssessmentOptions = {},
): AssessmentGradingOutcome {
  if (options.existingSubmission) {
    return {
      ok: false,
      code: 'DUPLICATE_SUBMISSION',
      message: 'This quiz attempt has already been submitted and graded.',
      existingResult: options.existingSubmission,
    }
  }

  if (
    !assessment ||
    typeof assessment !== 'object' ||
    !isNonEmptyString(assessment.id) ||
    !isNonEmptyString(assessment.experimentId)
  ) {
    return {
      ok: false,
      code: 'INVALID_ASSESSMENT',
      message: 'Assessment definition is missing required identifiers.',
    }
  }

  if (!isValidSemanticVersion(assessment.version)) {
    return {
      ok: false,
      code: 'INVALID_ASSESSMENT_VERSION',
      message: `Assessment "${assessment.id}" has an invalid semantic version "${String(assessment.version)}".`,
    }
  }

  if (
    isNonEmptyString(options.expectedAssessmentId) &&
    options.expectedAssessmentId.trim() !== assessment.id.trim()
  ) {
    return {
      ok: false,
      code: 'ASSESSMENT_ID_MISMATCH',
      message: `Attempt assessment ID "${options.expectedAssessmentId}" does not match assessment "${assessment.id}".`,
    }
  }

  if (
    isNonEmptyString(options.expectedAssessmentVersion) &&
    options.expectedAssessmentVersion.trim() !== assessment.version.trim()
  ) {
    return {
      ok: false,
      code: 'ASSESSMENT_VERSION_MISMATCH',
      message: `Attempt was started on assessment version "${options.expectedAssessmentVersion}", which does not match current version "${assessment.version}".`,
    }
  }

  if (!Array.isArray(assessment.questions) || assessment.questions.length === 0) {
    return {
      ok: false,
      code: 'EMPTY_ASSESSMENT',
      message: `Assessment "${assessment.id}" has zero questions and cannot be graded.`,
    }
  }

  // Verify structural soundness of questions and correct answer references
  const seenQuestionIds = new Set<string>()
  for (const q of assessment.questions) {
    if (!q || typeof q !== 'object' || !isNonEmptyString(q.id)) {
      return {
        ok: false,
        code: 'INVALID_ASSESSMENT',
        message: 'Assessment contains a question without a valid ID.',
      }
    }
    if (seenQuestionIds.has(q.id)) {
      return {
        ok: false,
        code: 'INVALID_ASSESSMENT',
        message: `Assessment contains duplicate question ID "${q.id}".`,
      }
    }
    seenQuestionIds.add(q.id)

    if (!Array.isArray(q.options) || q.options.length < 2) {
      return {
        ok: false,
        code: 'INVALID_ASSESSMENT',
        message: `Question "${q.id}" must have at least two options.`,
      }
    }

    const hasValidCorrectOption = q.options.some(
      (opt: QuestionOption) => opt && isNonEmptyString(opt.id) && opt.id === q.correctOptionId,
    )
    if (!hasValidCorrectOption) {
      return {
        ok: false,
        code: 'INVALID_ASSESSMENT',
        message: `Question "${q.id}" references a correctOptionId "${String(q.correctOptionId)}" that does not exist in its options.`,
      }
    }
  }

  const orderedQuestions = getOrderedAssessmentQuestions(assessment)
  const safeAnswers = answers && typeof answers === 'object' ? answers : {}
  const validationWarnings: AssessmentGradingWarning[] = []

  // Record warnings for any unknown question keys in the input map
  for (const rawQuestionKey of Object.keys(safeAnswers)) {
    if (!seenQuestionIds.has(rawQuestionKey)) {
      validationWarnings.push({
        code: 'UNKNOWN_QUESTION_ID',
        questionId: rawQuestionKey,
        message: `Submitted answer references unknown question ID "${rawQuestionKey}".`,
      })
    }
  }

  const submittedAnswers: Record<QuestionId, OptionId | null> = {}
  const questionFeedback: QuestionFeedbackItem[] = []
  let correctCount = 0
  let incorrectCount = 0
  let unansweredCount = 0

  orderedQuestions.forEach((question, index) => {
    const rawSelection = safeAnswers[question.id]
    const { feedback, sanitizedOptionId, warning } = buildQuestionFeedback(
      question,
      rawSelection,
      index,
    )

    if (warning) {
      validationWarnings.push(warning)
    }

    submittedAnswers[question.id] = sanitizedOptionId
    questionFeedback.push(feedback)

    if (feedback.status === 'correct') {
      correctCount += 1
    } else if (feedback.status === 'incorrect') {
      incorrectCount += 1
    } else {
      unansweredCount += 1
    }
  })

  const totalQuestions = orderedQuestions.length
  const score = correctCount
  const maxScore = totalQuestions
  const percentage = calculatePercentageScore(score, maxScore)
  const passStatus = evaluatePassStatus(score, percentage, assessment.passingScore)

  const submittedAt = isNonEmptyString(options.submittedAt)
    ? options.submittedAt.trim()
    : new Date().toISOString()

  const attemptId = isNonEmptyString(options.attemptId)
    ? options.attemptId.trim()
    : `attempt-${assessment.id}-v${assessment.version}-1`

  const result: AssessmentResultRecord = {
    attemptId,
    experimentId: assessment.experimentId,
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    submittedAnswers,
    score,
    maxScore,
    maximumScore: maxScore,
    percentage,
    totalQuestions,
    correctCount,
    incorrectCount,
    unansweredCount,
    passStatus,
    questionFeedback,
    submittedAt,
    submissionTimestamp: submittedAt,
    isPracticeAssessment: true,
    validationWarnings,
  }

  return {
    ok: true,
    result,
  }
}
