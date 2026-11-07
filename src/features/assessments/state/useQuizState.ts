import { useMemo, useState } from 'react'
import type {
  ExperimentAssessmentDefinition,
  MultipleChoiceQuestion,
} from '../../../types/assessment.ts'
import { getOrderedAssessmentQuestions } from '../lib/assessmentSelectors.ts'

export interface QuizState {
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
  selectOption: (questionId: string, optionId: string) => void
  clearOption: (questionId: string) => void
  nextQuestion: () => void
  previousQuestion: () => void
  goToQuestion: (index: number) => void
  goToQuestionById: (questionId: string) => void
  openReview: () => void
  exitReview: () => void
  resetAttempt: () => void
}

/**
 * Lightweight, pure React hook managing the student's in-progress quiz attempt.
 * Completely independent of 3D simulation stores and authentication services.
 * Tracks student answers by stable questionId -> optionId pairs.
 * Never calculates scores or reveals correct answers (reserved for T27).
 */
export function useQuizState(
  assessment: ExperimentAssessmentDefinition | undefined,
): QuizState {
  const questions = useMemo(
    () => (assessment ? getOrderedAssessmentQuestions(assessment) : []),
    [assessment],
  )

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isReviewMode, setIsReviewMode] = useState(false)

  const totalCount = questions.length
  const currentQuestion =
    currentQuestionIndex >= 0 && currentQuestionIndex < totalCount
      ? questions[currentQuestionIndex]
      : undefined

  const answeredCount = useMemo(() => {
    return questions.filter((q) => Boolean(answers[q.id])).length
  }, [questions, answers])

  const unansweredCount = Math.max(0, totalCount - answeredCount)
  const progressPercent =
    totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0

  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion =
    totalCount > 0 && currentQuestionIndex === totalCount - 1

  const selectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  const clearOption = (questionId: string) => {
    setAnswers((prev) => {
      if (!prev[questionId]) return prev
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }

  const nextQuestion = () => {
    if (isLastQuestion) {
      setIsReviewMode(true)
    } else {
      setCurrentQuestionIndex((prev) => Math.min(totalCount - 1, prev + 1))
    }
  }

  const previousQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalCount) {
      setCurrentQuestionIndex(index)
      setIsReviewMode(false)
    }
  }

  const goToQuestionById = (questionId: string) => {
    const targetIndex = questions.findIndex((q) => q.id === questionId)
    if (targetIndex >= 0) {
      setCurrentQuestionIndex(targetIndex)
      setIsReviewMode(false)
    }
  }

  const openReview = () => {
    setIsReviewMode(true)
  }

  const exitReview = () => {
    setIsReviewMode(false)
  }

  const resetAttempt = () => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setIsReviewMode(false)
  }

  return {
    assessment,
    questions,
    currentQuestionIndex,
    currentQuestion,
    answers,
    answeredCount,
    unansweredCount,
    totalCount,
    progressPercent,
    isFirstQuestion,
    isLastQuestion,
    isReviewMode,
    selectOption,
    clearOption,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    goToQuestionById,
    openReview,
    exitReview,
    resetAttempt,
  }
}
