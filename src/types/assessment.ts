import type { EntityId, ExperimentDifficulty } from './experiment.ts'

/** Stable identifiers for assessment entities, independent of display order or UI labels. */
export type AssessmentId = EntityId
export type QuestionId = EntityId
export type OptionId = EntityId

/**
 * Editorial lifecycle for educational assessment content.
 * `draft` marks demonstration content that has not undergone formal curriculum approval.
 */
export type AssessmentContentReviewStatus = 'draft' | 'reviewed' | 'approved'

/**
 * Operational availability of an assessment definition.
 * - `draft-demo`: Validated demonstration question set exists; interactive quiz UI is pending T26.
 * - `available`: Approved and ready for student attempts once T26 is active.
 * - `coming-soon`: Planned assessment without a finalized question set yet.
 * - `archived`: Retained for historical attempt version lookups only.
 */
export type AssessmentAvailabilityStatus =
  | 'draft-demo'
  | 'available'
  | 'coming-soon'
  | 'archived'

export type AssessmentOrderingMode = 'fixed' | 'ordered-by-field'

export interface QuestionOption {
  /** Stable option identifier; never rely on array index as the answer key. */
  id: OptionId
  /** Student-facing answer choice text in clear, simple English. */
  text: string
  /** Explicit 1-based display order index. */
  order: number
}

export interface MultipleChoiceQuestion {
  /** Stable question identifier across assessment versions. */
  id: QuestionId
  /** Stable experiment ID this question assesses (e.g., `exp-salt-water-001`). */
  experimentId: EntityId
  /** Semantic version of the question content (e.g., `1.0.0`). */
  version: string
  /** Explicit 1-based display position within the assessment. */
  order: number
  /** Clear, concise question prompt in English. */
  prompt: string
  /** At least two valid answer options with stable option IDs. */
  options: readonly QuestionOption[]
  /** Stable ID referencing the single correct option in `options`. */
  correctOptionId: OptionId
  /** Scientifically accurate explanation shown during post-quiz review (T27). */
  explanation: string
  /** Optional difficulty classification matching the experiment model. */
  difficulty?: ExperimentDifficulty
  /** Optional link to an `ExperimentLearningContent` objective ID. */
  learningObjectiveId?: EntityId
  /** Distinguishes draft demonstration content from reviewed/approved material. */
  reviewStatus: AssessmentContentReviewStatus
  /** Optional topic tags for future filtering and teacher question banks. */
  tags?: readonly string[]
}

export interface PassingScoreConfiguration {
  /** `unconfigured-draft` avoids inventing official grading thresholds for demo content. */
  status: 'unconfigured-draft' | 'approved'
  /** Required when `status === 'approved'` (1–100). */
  minimumPercentage?: number
  /** Optional minimum number of correct responses when `status === 'approved'`. */
  minimumCorrectCount?: number
  /** Transparent note explaining the passing policy. */
  note: string
}

export interface ExperimentAssessmentDefinition {
  /** Stable assessment identifier (e.g., `assessment-salt-water-001`). */
  id: AssessmentId
  /** Associated experiment ID (e.g., `exp-salt-water-001`). */
  experimentId: EntityId
  /** Semantic version of the assessment definition (e.g., `1.0.0`). */
  version: string
  /** Student-facing assessment title. */
  title: string
  /** Brief overview of what the assessment covers. */
  description: string
  /** Explicit notice clarifying draft demonstration status vs. official exams. */
  scopeDisclaimer: string
  /** Operational availability state. */
  availabilityStatus: AssessmentAvailabilityStatus
  /** Editorial review status of the assessment package. */
  reviewStatus: AssessmentContentReviewStatus
  /** Strategy used by pure selectors to order questions. */
  questionOrdering: AssessmentOrderingMode
  /** Passing threshold configuration. */
  passingScore: PassingScoreConfiguration
  /** Whether students will be allowed to retry the assessment in future tasks. */
  allowMultipleAttempts: boolean
  /** Questions belonging to this assessment. */
  questions: readonly MultipleChoiceQuestion[]
}

/**
 * Separated contract for future student answer state (T26).
 * T25 defines only the data contract; interactive state and scoring belong to T26/T27.
 */
export interface StudentQuestionResponse {
  questionId: QuestionId
  selectedOptionId: OptionId | null
}

/**
 * Separated contract for a future assessment attempt session (T26/T27).
 * No fake attempts or scores are generated in T25.
 */
export interface AssessmentAttemptRecord {
  attemptId: string
  assessmentId: AssessmentId
  assessmentVersion: string
  experimentId: EntityId
  status: 'not-started' | 'in-progress' | 'submitted'
  responses: Readonly<Record<QuestionId, OptionId | null>>
}

/**
 * Outcome status for an individual question after grading (T27).
 */
export type QuestionFeedbackStatus = 'correct' | 'incorrect' | 'unanswered'

/**
 * Student-facing heading label for question feedback (T27).
 */
export type QuestionFeedbackHeading = 'Correct Answer' | 'Not Quite Right'

/**
 * Structured question-level educational feedback produced by the pure grading engine (T27).
 */
export interface QuestionFeedbackItem {
  questionId: QuestionId
  order: number
  prompt: string
  status: QuestionFeedbackStatus
  isCorrect: boolean
  feedbackHeading: QuestionFeedbackHeading
  selectedOptionId: OptionId | null
  selectedOptionLabel: string | null
  selectedOptionText: string | null
  correctOptionId: OptionId
  correctOptionLabel: string
  correctOptionText: string
  explanation: string
  /** True if the submitted answer contained an invalid/unknown option ID that was rejected. */
  hadInvalidSelection: boolean
  learningObjectiveId?: EntityId
  difficulty?: ExperimentDifficulty
}

/**
 * Non-fatal validation warnings recorded when sanitizing student answer maps (T27).
 */
export type AssessmentGradingWarningCode = 'UNKNOWN_QUESTION_ID' | 'INVALID_OPTION_ID'

export interface AssessmentGradingWarning {
  code: AssessmentGradingWarningCode
  message: string
  questionId: string
  optionId?: string
}

/**
 * Passing evaluation status. Remains `unconfigured` when `passingScore.status === 'unconfigured-draft'`
 * so the UI never invents arbitrary Pass/Fail labels.
 */
export type AssessmentPassStatus = 'unconfigured' | 'passed' | 'failed'

/**
 * Structured, immutable result record generated once upon quiz submission (T27).
 * Client-side practice result only; never treated as an official examination grade.
 */
export interface AssessmentResultRecord {
  attemptId: string
  experimentId: EntityId
  assessmentId: AssessmentId
  assessmentVersion: string
  submittedAnswers: Readonly<Record<QuestionId, OptionId | null>>
  score: number
  maxScore: number
  maximumScore: number
  percentage: number
  totalQuestions: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  passStatus: AssessmentPassStatus
  questionFeedback: readonly QuestionFeedbackItem[]
  submittedAt: string
  submissionTimestamp: string
  /** Explicit integrity marker: client-calculated scores are for student practice only. */
  isPracticeAssessment: true
  validationWarnings: readonly AssessmentGradingWarning[]
}

