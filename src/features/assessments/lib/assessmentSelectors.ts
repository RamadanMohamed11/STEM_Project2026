import type {
  ExperimentAssessmentDefinition,
  MultipleChoiceQuestion,
  QuestionOption,
} from '../../../types/assessment.ts'
import type { EntityId } from '../../../types/experiment.ts'
import { demoCatalog } from '../../experiments/data/mockExperiments.ts'
import { assessmentCatalog } from '../data/assessmentCatalog.ts'
import { validateAssessmentDefinition } from './assessmentValidation.ts'

/**
 * Returns a new array of options ordered deterministically by `order` then `id`.
 * Never mutates the input question or options array.
 */
export function getOrderedQuestionOptions(
  question: Pick<MultipleChoiceQuestion, 'options'>,
): readonly QuestionOption[] {
  return [...question.options].sort((a, b) =>
    a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id),
  )
}

/**
 * Returns a new array of questions ordered according to the assessment's `questionOrdering`
 * rule, with each question's options also deterministically ordered.
 * Never mutates the input assessment definition.
 */
export function getOrderedAssessmentQuestions(
  assessment: Pick<ExperimentAssessmentDefinition, 'questions' | 'questionOrdering'>,
): readonly MultipleChoiceQuestion[] {
  const cloned = assessment.questions.map((question) => ({
    ...question,
    options: getOrderedQuestionOptions(question),
  }))

  if (assessment.questionOrdering === 'fixed') {
    return cloned
  }

  return cloned.sort((a, b) =>
    a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id),
  )
}

/**
 * Looks up a validated assessment definition for the given `experimentId`.
 * Returns `undefined` if no assessment exists or if validation fails.
 */
export function getAssessmentForExperiment(
  experimentId: EntityId | undefined,
  catalog: readonly ExperimentAssessmentDefinition[] = assessmentCatalog,
  knownExperimentIds: readonly EntityId[] = demoCatalog.experiments.map((exp) => exp.id),
): ExperimentAssessmentDefinition | undefined {
  if (!experimentId || typeof experimentId !== 'string') return undefined
  const match = catalog.find((item) => item.experimentId === experimentId)
  if (!match) return undefined

  const validation = validateAssessmentDefinition(match, { knownExperimentIds })
  if (!validation.valid) return undefined

  return {
    ...match,
    questions: getOrderedAssessmentQuestions(match),
  }
}

export interface ExperimentAssessmentSummary {
  hasAssessment: boolean
  assessmentId: string | null
  version: string | null
  title: string | null
  questionCount: number
  availabilityStatus: ExperimentAssessmentDefinition['availabilityStatus'] | 'unavailable'
  reviewStatus: ExperimentAssessmentDefinition['reviewStatus'] | null
  scopeDisclaimer: string | null
  /** Interactive quiz UI belongs to T26; remains false in T25. */
  isInteractiveQuizEnabled: false
}

/**
 * Pure summary selector for route placeholders and metadata views.
 * Never fabricates scores or completed attempts.
 */
export function getExperimentAssessmentSummary(
  experimentId: EntityId | undefined,
  catalog: readonly ExperimentAssessmentDefinition[] = assessmentCatalog,
): ExperimentAssessmentSummary {
  const assessment = getAssessmentForExperiment(experimentId, catalog)
  if (!assessment) {
    return {
      hasAssessment: false,
      assessmentId: null,
      version: null,
      title: null,
      questionCount: 0,
      availabilityStatus: 'unavailable',
      reviewStatus: null,
      scopeDisclaimer: null,
      isInteractiveQuizEnabled: false,
    }
  }

  return {
    hasAssessment: assessment.questions.length > 0,
    assessmentId: assessment.id,
    version: assessment.version,
    title: assessment.title,
    questionCount: assessment.questions.length,
    availabilityStatus: assessment.availabilityStatus,
    reviewStatus: assessment.reviewStatus,
    scopeDisclaimer: assessment.scopeDisclaimer,
    isInteractiveQuizEnabled: false,
  }
}
