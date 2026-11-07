import { useMemo, useState } from 'react'
import type {
  AssessmentResultRecord,
  ExperimentAssessmentDefinition,
  MultipleChoiceQuestion,
} from '../../../types/assessment.ts'
import { gradeAssessment } from '../lib/assessmentGrading.ts'
import { getOrderedAssessmentQuestions } from '../lib/assessmentSelectors.ts'
import {
  clearLatestAssessmentResult,
  setLatestAssessmentResult,
} from './assessmentResultsStore.ts'

export interface QuizSessionInternalState {
  attemptId: string
  attemptNumber: number
  assessmentId: string | null
  assessmentVersion: string | null
  currentQuestionIndex: number
  answers: Readonly<Record<string, string>>
  isReviewMode: boolean
  isConfirmingUnanswered: boolean
  status: 'in-progress' | 'submitted'
  submittedResult: AssessmentResultRecord | null
  submissionError: string | null
}

export function buildAttemptId(
  assessment: Pick<ExperimentAssessmentDefinition, 'id' | 'version'> | undefined,
  attemptNumber: number,
): string {
  if (!assessment) {
    return `attempt-unassigned-${attemptNumber}`
  }
  return `attempt-${assessment.id}-v${assessment.version}-${attemptNumber}`
}

export function createInitialQuizSessionState(
  assessment: ExperimentAssessmentDefinition | undefined,
  attemptNumber = 1,
): QuizSessionInternalState {
  return {
    attemptId: buildAttemptId(assessment, attemptNumber),
    attemptNumber,
    assessmentId: assessment?.id ?? null,
    assessmentVersion: assessment?.version ?? null,
    currentQuestionIndex: 0,
    answers: {},
    isReviewMode: false,
    isConfirmingUnanswered: false,
    status: 'in-progress',
    submittedResult: null,
    submissionError: null,
  }
}

/**
 * Pure state transition: selects or updates an option for a question.
 * Refuses changes once the attempt is marked `submitted`.
 */
export function selectQuizOption(
  state: QuizSessionInternalState,
  questionId: string,
  optionId: string,
): QuizSessionInternalState {
  if (state.status === 'submitted') {
    return state
  }
  return {
    ...state,
    answers: {
      ...state.answers,
      [questionId]: optionId,
    },
    isConfirmingUnanswered: false,
    submissionError: null,
  }
}

/**
 * Pure state transition: clears the selected option for a question.
 * Refuses changes once the attempt is marked `submitted`.
 */
export function clearQuizOption(
  state: QuizSessionInternalState,
  questionId: string,
): QuizSessionInternalState {
  if (state.status === 'submitted' || !state.answers[questionId]) {
    return state
  }
  const nextAnswers = { ...state.answers }
  delete nextAnswers[questionId]
  return {
    ...state,
    answers: nextAnswers,
    isConfirmingUnanswered: false,
    submissionError: null,
  }
}

/**
 * Pure state transition: confirms and executes final submission, calculating the score once.
 * Prevents duplicate submissions if already submitted.
 */
export function confirmQuizSubmission(
  state: QuizSessionInternalState,
  assessment: ExperimentAssessmentDefinition | undefined,
  submittedAt?: string,
): QuizSessionInternalState {
  if (state.status === 'submitted' || state.submittedResult !== null) {
    return state
  }

  const outcome = gradeAssessment(assessment, state.answers, {
    attemptId: state.attemptId,
    expectedAssessmentId: state.assessmentId ?? undefined,
    expectedAssessmentVersion: state.assessmentVersion ?? undefined,
    submittedAt,
    existingSubmission: state.submittedResult,
  })

  if (!outcome.ok) {
    return {
      ...state,
      isConfirmingUnanswered: false,
      submissionError: outcome.message,
    }
  }

  if (assessment?.experimentId) {
    setLatestAssessmentResult(assessment.experimentId, outcome.result)
  }

  return {
    ...state,
    status: 'submitted',
    isReviewMode: false,
    isConfirmingUnanswered: false,
    submittedResult: outcome.result,
    submissionError: null,
  }
}

/**
 * Pure state transition: initiates submission.
 * If any questions are unanswered and confirmation has not yet been shown,
 * enters confirmation state without grading yet.
 */
export function requestQuizSubmission(
  state: QuizSessionInternalState,
  assessment: ExperimentAssessmentDefinition | undefined,
  submittedAt?: string,
): QuizSessionInternalState {
  if (state.status === 'submitted' || state.submittedResult !== null) {
    return state
  }

  if (!assessment || assessment.questions.length === 0) {
    return {
      ...state,
      submissionError: 'Cannot submit an assessment without questions.',
    }
  }

  const questions = getOrderedAssessmentQuestions(assessment)
  const answeredCount = questions.filter((q) => Boolean(state.answers[q.id])).length
  const unansweredCount = Math.max(0, questions.length - answeredCount)

  if (unansweredCount > 0 && !state.isConfirmingUnanswered) {
    return {
      ...state,
      isReviewMode: true,
      isConfirmingUnanswered: true,
      submissionError: null,
    }
  }

  return confirmQuizSubmission(state, assessment, submittedAt)
}

/**
 * Pure state transition: cancels the unanswered-questions confirmation prompt.
 */
export function cancelQuizSubmissionConfirmation(
  state: QuizSessionInternalState,
): QuizSessionInternalState {
  if (!state.isConfirmingUnanswered) {
    return state
  }
  return {
    ...state,
    isConfirmingUnanswered: false,
  }
}

/**
 * Pure state transition: starts a fresh attempt with a new attemptId and cleared state.
 */
export function retakeQuizSession(
  state: QuizSessionInternalState,
  assessment: ExperimentAssessmentDefinition | undefined,
): QuizSessionInternalState {
  if (assessment?.experimentId) {
    clearLatestAssessmentResult(assessment.experimentId)
  }
  return createInitialQuizSessionState(assessment, state.attemptNumber + 1)
}

export interface QuizState {
  attemptId: string
  attemptNumber: number
  assessment: ExperimentAssessmentDefinition | undefined
  questions: readonly MultipleChoiceQuestion[]
  currentQuestionIndex: number
  currentQuestion: MultipleChoiceQuestion | undefined
  answers: Readonly<Record<string, string>>
  answeredCount: number
  unansweredCount: number
  totalCount: number
  progressPercent: number
  isFirstQuestion: boolean
  isLastQuestion: boolean
  isReviewMode: boolean
  isConfirmingUnanswered: boolean
  status: 'in-progress' | 'submitted'
  isSubmitted: boolean
  submittedResult: AssessmentResultRecord | null
  submissionError: string | null
  selectOption: (questionId: string, optionId: string) => void
  clearOption: (questionId: string) => void
  nextQuestion: () => void
  previousQuestion: () => void
  goToQuestion: (index: number) => void
  goToQuestionById: (questionId: string) => void
  openReview: () => void
  exitReview: () => void
  requestSubmitQuiz: () => void
  confirmSubmitQuiz: () => void
  cancelSubmitConfirmation: () => void
  retakeQuiz: () => void
  resetAttempt: () => void
}

export interface UseQuizStateOptions {
  onSubmitted?: (result: AssessmentResultRecord) => void
}

/**
 * Lightweight, pure React hook managing the student's quiz attempt and grading lifecycle.
 * Completely independent of 3D simulation stores and authentication services.
 * Tracks student answers by stable questionId -> optionId pairs, enforces unanswered
 * confirmation and duplicate-submission protection, and locks answers once submitted.
 */
export function useQuizState(
  assessment: ExperimentAssessmentDefinition | undefined,
  options?: UseQuizStateOptions,
): QuizState {
  const questions = useMemo(
    () => (assessment ? getOrderedAssessmentQuestions(assessment) : []),
    [assessment],
  )

  const [session, setSession] = useState<QuizSessionInternalState>(() =>
    createInitialQuizSessionState(assessment, 1),
  )

  const totalCount = questions.length
  const currentQuestion =
    session.currentQuestionIndex >= 0 && session.currentQuestionIndex < totalCount
      ? questions[session.currentQuestionIndex]
      : undefined

  const answeredCount = useMemo(() => {
    return questions.filter((q) => Boolean(session.answers[q.id])).length
  }, [questions, session.answers])

  const unansweredCount = Math.max(0, totalCount - answeredCount)
  const progressPercent =
    totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0

  const isFirstQuestion = session.currentQuestionIndex === 0
  const isLastQuestion =
    totalCount > 0 && session.currentQuestionIndex === totalCount - 1

  const selectOption = (questionId: string, optionId: string) => {
    setSession((prev) => selectQuizOption(prev, questionId, optionId))
  }

  const clearOption = (questionId: string) => {
    setSession((prev) => clearQuizOption(prev, questionId))
  }

  const nextQuestion = () => {
    if (session.status === 'submitted') return
    if (isLastQuestion) {
      setSession((prev) => ({
        ...prev,
        isReviewMode: true,
        isConfirmingUnanswered: false,
      }))
    } else {
      setSession((prev) => ({
        ...prev,
        currentQuestionIndex: Math.min(totalCount - 1, prev.currentQuestionIndex + 1),
        isConfirmingUnanswered: false,
      }))
    }
  }

  const previousQuestion = () => {
    if (session.status === 'submitted') return
    setSession((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
      isConfirmingUnanswered: false,
    }))
  }

  const goToQuestion = (index: number) => {
    if (session.status === 'submitted') return
    if (index >= 0 && index < totalCount) {
      setSession((prev) => ({
        ...prev,
        currentQuestionIndex: index,
        isReviewMode: false,
        isConfirmingUnanswered: false,
      }))
    }
  }

  const goToQuestionById = (questionId: string) => {
    if (session.status === 'submitted') return
    const targetIndex = questions.findIndex((q) => q.id === questionId)
    if (targetIndex >= 0) {
      setSession((prev) => ({
        ...prev,
        currentQuestionIndex: targetIndex,
        isReviewMode: false,
        isConfirmingUnanswered: false,
      }))
    }
  }

  const openReview = () => {
    if (session.status === 'submitted') return
    setSession((prev) => ({
      ...prev,
      isReviewMode: true,
      isConfirmingUnanswered: false,
    }))
  }

  const exitReview = () => {
    if (session.status === 'submitted') return
    setSession((prev) => ({
      ...prev,
      isReviewMode: false,
      isConfirmingUnanswered: false,
    }))
  }

  const requestSubmitQuiz = () => {
    setSession((prev) => requestQuizSubmission(prev, assessment))
  }

  const confirmSubmitQuiz = () => {
    setSession((prev) => {
      const next = confirmQuizSubmission(prev, assessment)
      if (next.status === 'submitted' && next.submittedResult && next.submittedResult !== prev.submittedResult) {
        options?.onSubmitted?.(next.submittedResult)
      }
      return next
    })
  }

  const cancelSubmitConfirmation = () => {
    setSession((prev) => cancelQuizSubmissionConfirmation(prev))
  }

  const retakeQuiz = () => {
    setSession((prev) => retakeQuizSession(prev, assessment))
  }

  return {
    attemptId: session.attemptId,
    attemptNumber: session.attemptNumber,
    assessment,
    questions,
    currentQuestionIndex: session.currentQuestionIndex,
    currentQuestion,
    answers: session.answers,
    answeredCount,
    unansweredCount,
    totalCount,
    progressPercent,
    isFirstQuestion,
    isLastQuestion,
    isReviewMode: session.isReviewMode,
    isConfirmingUnanswered: session.isConfirmingUnanswered,
    status: session.status,
    isSubmitted: session.status === 'submitted',
    submittedResult: session.submittedResult,
    submissionError: session.submissionError,
    selectOption,
    clearOption,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    goToQuestionById,
    openReview,
    exitReview,
    requestSubmitQuiz,
    confirmSubmitQuiz,
    cancelSubmitConfirmation,
    retakeQuiz,
    resetAttempt: retakeQuiz,
  }
}
