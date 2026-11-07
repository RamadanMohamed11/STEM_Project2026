import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import {
  saltDissolutionAssessment,
  saltDissolutionQuestions,
} from '../src/features/assessments/data/saltDissolutionAssessment.ts'
import {
  calculatePercentageScore,
  evaluatePassStatus,
  gradeAssessment,
  validateAttemptAnswers,
} from '../src/features/assessments/lib/assessmentGrading.ts'
import {
  cancelQuizSubmissionConfirmation,
  clearQuizOption,
  confirmQuizSubmission,
  createInitialQuizSessionState,
  requestQuizSubmission,
  retakeQuizSession,
  selectQuizOption,
} from '../src/features/assessments/state/useQuizState.ts'

let vite
let QuizFeedbackView
let QuizReviewScreen

test.before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ QuizFeedbackView } = await vite.ssrLoadModule(
    '/src/features/assessments/components/QuizFeedbackView.tsx',
  ))
  ;({ QuizReviewScreen } = await vite.ssrLoadModule(
    '/src/features/assessments/components/QuizReviewScreen.tsx',
  ))
})

test.after(async () => {
  await vite?.close()
})

function renderWithRouter(element) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, null, element))
}

test('all answers correct produces 100% score, 0 incorrect, 0 unanswered, and Correct Answer feedback', () => {
  const answers = {}
  for (const q of saltDissolutionQuestions) {
    answers[q.id] = q.correctOptionId
  }

  const outcome = gradeAssessment(saltDissolutionAssessment, answers, {
    attemptId: 'attempt-all-correct',
    submittedAt: '2026-11-07T10:00:00.000Z',
  })

  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  const { result } = outcome
  assert.equal(result.attemptId, 'attempt-all-correct')
  assert.equal(result.experimentId, 'exp-salt-water-001')
  assert.equal(result.assessmentId, saltDissolutionAssessment.id)
  assert.equal(result.assessmentVersion, saltDissolutionAssessment.version)
  assert.equal(result.totalQuestions, 6)
  assert.equal(result.correctCount, 6)
  assert.equal(result.incorrectCount, 0)
  assert.equal(result.unansweredCount, 0)
  assert.equal(result.score, 6)
  assert.equal(result.maxScore, 6)
  assert.equal(result.maximumScore, 6)
  assert.equal(result.percentage, 100)
  assert.equal(result.passStatus, 'unconfigured')
  assert.equal(result.isPracticeAssessment, true)
  assert.equal(result.submittedAt, '2026-11-07T10:00:00.000Z')
  assert.equal(result.validationWarnings.length, 0)

  assert.equal(result.questionFeedback.length, 6)
  for (const fb of result.questionFeedback) {
    assert.equal(fb.status, 'correct')
    assert.equal(fb.isCorrect, true)
    assert.equal(fb.feedbackHeading, 'Correct Answer')
    assert.equal(fb.selectedOptionId, fb.correctOptionId)
    assert.ok(fb.selectedOptionText && fb.selectedOptionText.length > 0)
    assert.ok(fb.explanation && fb.explanation.length > 10)
  }
})

test('all answers incorrect produces 0% score, 6 incorrect, 0 unanswered, and Not Quite Right feedback', () => {
  const answers = {}
  for (const q of saltDissolutionQuestions) {
    const wrongOption = q.options.find((opt) => opt.id !== q.correctOptionId)
    answers[q.id] = wrongOption.id
  }

  const outcome = gradeAssessment(saltDissolutionAssessment, answers)
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  const { result } = outcome
  assert.equal(result.totalQuestions, 6)
  assert.equal(result.correctCount, 0)
  assert.equal(result.incorrectCount, 6)
  assert.equal(result.unansweredCount, 0)
  assert.equal(result.score, 0)
  assert.equal(result.maxScore, 6)
  assert.equal(result.percentage, 0)

  for (const fb of result.questionFeedback) {
    assert.equal(fb.status, 'incorrect')
    assert.equal(fb.isCorrect, false)
    assert.equal(fb.feedbackHeading, 'Not Quite Right')
    assert.notEqual(fb.selectedOptionId, fb.correctOptionId)
    assert.ok(fb.selectedOptionText)
    assert.ok(fb.correctOptionText)
    assert.ok(fb.explanation)
  }
})

test('mixed answers (correct, incorrect, unanswered) calculate accurate counts and percentages', () => {
  const q = saltDissolutionQuestions
  const wrongQ3 = q[2].options.find((opt) => opt.id !== q[2].correctOptionId).id
  const wrongQ4 = q[3].options.find((opt) => opt.id !== q[3].correctOptionId).id

  const answers = {
    [q[0].id]: q[0].correctOptionId, // correct
    [q[1].id]: q[1].correctOptionId, // correct
    [q[2].id]: wrongQ3, // incorrect
    [q[3].id]: wrongQ4, // incorrect
    [q[4].id]: q[4].correctOptionId, // correct
    // q[5] left unanswered
  }

  const outcome = gradeAssessment(saltDissolutionAssessment, answers)
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  const { result } = outcome
  assert.equal(result.totalQuestions, 6)
  assert.equal(result.correctCount, 3)
  assert.equal(result.incorrectCount, 2)
  assert.equal(result.unansweredCount, 1)
  assert.equal(result.score, 3)
  assert.equal(result.maxScore, 6)
  assert.equal(result.percentage, 50)

  assert.equal(result.questionFeedback[0].status, 'correct')
  assert.equal(result.questionFeedback[1].status, 'correct')
  assert.equal(result.questionFeedback[2].status, 'incorrect')
  assert.equal(result.questionFeedback[3].status, 'incorrect')
  assert.equal(result.questionFeedback[4].status, 'correct')
  assert.equal(result.questionFeedback[5].status, 'unanswered')
  assert.equal(result.questionFeedback[5].selectedOptionId, null)
  assert.equal(result.questionFeedback[5].selectedOptionText, null)
})

test('unanswered questions are clearly flagged with null selection and 0 points', () => {
  const outcome = gradeAssessment(saltDissolutionAssessment, {})
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  const { result } = outcome
  assert.equal(result.totalQuestions, 6)
  assert.equal(result.correctCount, 0)
  assert.equal(result.incorrectCount, 0)
  assert.equal(result.unansweredCount, 6)
  assert.equal(result.score, 0)
  assert.equal(result.percentage, 0)

  for (const fb of result.questionFeedback) {
    assert.equal(fb.status, 'unanswered')
    assert.equal(fb.isCorrect, false)
    assert.equal(fb.selectedOptionId, null)
    assert.equal(fb.selectedOptionText, null)
    assert.equal(result.submittedAnswers[fb.questionId], null)
  }
})

test('duplicate submission is prevented in both pure grading engine and session state machine', () => {
  const firstOutcome = gradeAssessment(saltDissolutionAssessment, {
    [saltDissolutionQuestions[0].id]: saltDissolutionQuestions[0].correctOptionId,
  })
  assert.equal(firstOutcome.ok, true)
  if (!firstOutcome.ok) return

  // Pure engine rejects duplicate submission when existingSubmission is supplied
  const duplicateOutcome = gradeAssessment(
    saltDissolutionAssessment,
    {
      [saltDissolutionQuestions[0].id]: saltDissolutionQuestions[0].correctOptionId,
      [saltDissolutionQuestions[1].id]: saltDissolutionQuestions[1].correctOptionId,
    },
    { existingSubmission: firstOutcome.result },
  )
  assert.equal(duplicateOutcome.ok, false)
  if (!duplicateOutcome.ok) {
    assert.equal(duplicateOutcome.code, 'DUPLICATE_SUBMISSION')
    assert.equal(duplicateOutcome.existingResult, firstOutcome.result)
  }

  // Session state machine prevents duplicate submission and locks answers after submission
  let session = createInitialQuizSessionState(saltDissolutionAssessment)
  for (const q of saltDissolutionQuestions) {
    session = selectQuizOption(session, q.id, q.correctOptionId)
  }

  session = requestQuizSubmission(session, saltDissolutionAssessment, '2026-11-07T10:05:00.000Z')
  assert.equal(session.status, 'submitted')
  assert.ok(session.submittedResult)
  const firstSubmittedResult = session.submittedResult

  // Attempting to change or clear an answer after submission is ignored
  const wrongOpt = saltDissolutionQuestions[0].options.find(
    (o) => o.id !== saltDissolutionQuestions[0].correctOptionId,
  ).id
  const afterSelect = selectQuizOption(session, saltDissolutionQuestions[0].id, wrongOpt)
  assert.equal(afterSelect, session)
  const afterClear = clearQuizOption(session, saltDissolutionQuestions[0].id)
  assert.equal(afterClear, session)

  // Attempting to submit again is ignored and preserves the exact same result reference
  const afterSecondSubmit = confirmQuizSubmission(
    session,
    saltDissolutionAssessment,
    '2026-11-07T10:10:00.000Z',
  )
  assert.equal(afterSecondSubmit, session)
  assert.equal(afterSecondSubmit.submittedResult, firstSubmittedResult)
})

test('unanswered confirmation prompt triggers before submission and Retake Quiz resets attempt', () => {
  let session = createInitialQuizSessionState(saltDissolutionAssessment)
  session = selectQuizOption(
    session,
    saltDissolutionQuestions[0].id,
    saltDissolutionQuestions[0].correctOptionId,
  )

  // Requesting submit with 5 unanswered questions triggers confirmation instead of grading
  session = requestQuizSubmission(session, saltDissolutionAssessment)
  assert.equal(session.status, 'in-progress')
  assert.equal(session.isConfirmingUnanswered, true)
  assert.equal(session.isReviewMode, true)
  assert.equal(session.submittedResult, null)

  // Cancelling confirmation returns to normal review state
  session = cancelQuizSubmissionConfirmation(session)
  assert.equal(session.isConfirmingUnanswered, false)
  assert.equal(session.status, 'in-progress')

  // Requesting again and confirming completes submission
  session = requestQuizSubmission(session, saltDissolutionAssessment)
  assert.equal(session.isConfirmingUnanswered, true)
  session = confirmQuizSubmission(session, saltDissolutionAssessment)
  assert.equal(session.status, 'submitted')
  assert.equal(session.isConfirmingUnanswered, false)
  assert.equal(session.submittedResult?.score, 1)
  assert.equal(session.submittedResult?.unansweredCount, 5)

  // Retaking quiz creates a fresh attempt with incremented attemptNumber and new attemptId
  const freshSession = retakeQuizSession(session, saltDissolutionAssessment)
  assert.equal(freshSession.status, 'in-progress')
  assert.equal(freshSession.attemptNumber, 2)
  assert.notEqual(freshSession.attemptId, session.attemptId)
  assert.deepEqual(freshSession.answers, {})
  assert.equal(freshSession.submittedResult, null)
})

test('invalid answer IDs and invalid question IDs are flagged and sanitized safely', () => {
  const q0 = saltDissolutionQuestions[0]
  const q1 = saltDissolutionQuestions[1]

  const answers = {
    [q0.id]: q0.correctOptionId,
    [q1.id]: 'opt-nonexistent-id-999',
    'q-unknown-fake-id-888': 'some-option-id',
  }

  const validation = validateAttemptAnswers(saltDissolutionAssessment, answers)
  assert.equal(validation.valid, false)
  assert.deepEqual(validation.unknownQuestionIds, ['q-unknown-fake-id-888'])
  assert.equal(validation.invalidOptionSelections.length, 1)
  assert.equal(validation.invalidOptionSelections[0].questionId, q1.id)
  assert.equal(validation.answeredCount, 1)
  assert.equal(validation.unansweredCount, 5)

  const outcome = gradeAssessment(saltDissolutionAssessment, answers)
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  const { result } = outcome
  assert.equal(result.score, 1)
  assert.equal(result.correctCount, 1)
  assert.equal(result.incorrectCount, 0)
  assert.equal(result.unansweredCount, 5)

  // Unknown question ID is excluded from submittedAnswers
  assert.equal('q-unknown-fake-id-888' in result.submittedAnswers, false)
  // Invalid option ID is sanitized to null and marked hadInvalidSelection
  assert.equal(result.submittedAnswers[q1.id], null)
  const q1Feedback = result.questionFeedback.find((f) => f.questionId === q1.id)
  assert.equal(q1Feedback?.status, 'unanswered')
  assert.equal(q1Feedback?.hadInvalidSelection, true)

  // Warnings recorded for both unknown question ID and invalid option ID
  assert.equal(result.validationWarnings.length, 2)
  assert.ok(result.validationWarnings.some((w) => w.code === 'UNKNOWN_QUESTION_ID'))
  assert.ok(result.validationWarnings.some((w) => w.code === 'INVALID_OPTION_ID'))
})

test('different question ordering preserves exact score and orders feedback deterministically', () => {
  const reversedQuestions = [...saltDissolutionQuestions].reverse().map((q) => ({
    ...q,
    options: [...q.options].reverse(),
  }))

  const answers = {
    [saltDissolutionQuestions[0].id]: saltDissolutionQuestions[0].correctOptionId,
    [saltDissolutionQuestions[3].id]: saltDissolutionQuestions[3].correctOptionId,
    [saltDissolutionQuestions[5].id]: saltDissolutionQuestions[5].options.find(
      (o) => o.id !== saltDissolutionQuestions[5].correctOptionId,
    ).id,
  }

  const orderedByFieldAssessment = {
    ...saltDissolutionAssessment,
    questionOrdering: 'ordered-by-field',
    questions: reversedQuestions,
  }

  const fixedOrderAssessment = {
    ...saltDissolutionAssessment,
    questionOrdering: 'fixed',
    questions: reversedQuestions,
  }

  const outcomeOrdered = gradeAssessment(orderedByFieldAssessment, answers)
  const outcomeFixed = gradeAssessment(fixedOrderAssessment, answers)

  assert.equal(outcomeOrdered.ok, true)
  assert.equal(outcomeFixed.ok, true)
  if (!outcomeOrdered.ok || !outcomeFixed.ok) return

  assert.equal(outcomeOrdered.result.score, 2)
  assert.equal(outcomeFixed.result.score, 2)
  assert.equal(outcomeOrdered.result.percentage, 33)
  assert.equal(outcomeFixed.result.percentage, 33)

  // ordered-by-field restores canonical 1..6 question order
  assert.equal(outcomeOrdered.result.questionFeedback[0].questionId, saltDissolutionQuestions[0].id)
  // fixed keeps the supplied array order (6..1)
  assert.equal(outcomeFixed.result.questionFeedback[0].questionId, saltDissolutionQuestions[5].id)
})

test('zero-question assessments and assessment version/ID mismatches fail closed with clear codes', () => {
  const emptyAssessment = {
    ...saltDissolutionAssessment,
    questions: [],
  }

  const emptyOutcome = gradeAssessment(emptyAssessment, {})
  assert.equal(emptyOutcome.ok, false)
  if (!emptyOutcome.ok) {
    assert.equal(emptyOutcome.code, 'EMPTY_ASSESSMENT')
  }

  const versionMismatch = gradeAssessment(
    saltDissolutionAssessment,
    {},
    { expectedAssessmentVersion: '2.0.0' },
  )
  assert.equal(versionMismatch.ok, false)
  if (!versionMismatch.ok) {
    assert.equal(versionMismatch.code, 'ASSESSMENT_VERSION_MISMATCH')
  }

  const idMismatch = gradeAssessment(
    saltDissolutionAssessment,
    {},
    { expectedAssessmentId: 'assessment-other-999' },
  )
  assert.equal(idMismatch.ok, false)
  if (!idMismatch.ok) {
    assert.equal(idMismatch.code, 'ASSESSMENT_ID_MISMATCH')
  }

  const invalidSemver = gradeAssessment(
    { ...saltDissolutionAssessment, version: 'not-a-version' },
    {},
  )
  assert.equal(invalidSemver.ok, false)
  if (!invalidSemver.ok) {
    assert.equal(invalidSemver.code, 'INVALID_ASSESSMENT_VERSION')
  }
})

test('score calculation, percentage rounding, and unconfigured vs approved passing thresholds', () => {
  assert.equal(calculatePercentageScore(0, 6), 0)
  assert.equal(calculatePercentageScore(1, 6), 17)
  assert.equal(calculatePercentageScore(2, 6), 33)
  assert.equal(calculatePercentageScore(3, 6), 50)
  assert.equal(calculatePercentageScore(4, 6), 67)
  assert.equal(calculatePercentageScore(5, 6), 83)
  assert.equal(calculatePercentageScore(6, 6), 100)
  assert.equal(calculatePercentageScore(0, 0), 0)
  assert.equal(calculatePercentageScore(NaN, 6), 0)

  // Unconfigured draft never invents pass/fail
  assert.equal(
    evaluatePassStatus(6, 100, { status: 'unconfigured-draft', note: 'Draft' }),
    'unconfigured',
  )

  // Approved threshold evaluates accurately
  assert.equal(
    evaluatePassStatus(4, 67, {
      status: 'approved',
      minimumPercentage: 70,
      note: '70% required',
    }),
    'failed',
  )
  assert.equal(
    evaluatePassStatus(5, 83, {
      status: 'approved',
      minimumPercentage: 70,
      note: '70% required',
    }),
    'passed',
  )
})

test('QuizFeedbackView and QuizReviewScreen render required English feedback labels without Pass/Fail inventions', () => {
  const q = saltDissolutionQuestions
  const wrongQ1 = q[1].options.find((opt) => opt.id !== q[1].correctOptionId).id

  const outcome = gradeAssessment(saltDissolutionAssessment, {
    [q[0].id]: q[0].correctOptionId,
    [q[1].id]: wrongQ1,
    // q[2..5] unanswered
  })
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  const feedbackHtml = renderWithRouter(
    React.createElement(QuizFeedbackView, {
      result: outcome.result,
      onRetakeQuiz: () => {},
      detailsPath: '/experiments/exp-salt-water-001',
      resultsPath: '/experiments/exp-salt-water-001/quiz/results',
    }),
  )

  assert.match(feedbackHtml, /Your Score/)
  assert.match(feedbackHtml, /1 \/ 6/)
  assert.match(feedbackHtml, /\(17%\)/)
  assert.match(feedbackHtml, /Review Your Answers/)
  assert.match(feedbackHtml, /Correct Answer/)
  assert.match(feedbackHtml, /Not Quite Right/)
  assert.match(feedbackHtml, /Here&#x27;s Why|Here's Why/)
  assert.match(feedbackHtml, /Try Again/)
  assert.match(feedbackHtml, /Not answered — You skipped this question/)
  assert.match(feedbackHtml, /Practice Assessment Notice/)
  // Must not display Pass/Fail threshold status when unconfigured
  assert.doesNotMatch(feedbackHtml, /Threshold Status:/)

  // Verify unanswered confirmation banner in QuizReviewScreen
  const confirmHtml = renderWithRouter(
    React.createElement(QuizReviewScreen, {
      questions: saltDissolutionQuestions,
      answers: { [q[0].id]: q[0].correctOptionId },
      onGoToQuestion: () => {},
      onBackToQuestions: () => {},
      isConfirmingUnanswered: true,
      detailsPath: '/experiments/exp-salt-water-001',
      resultsPath: '/experiments/exp-salt-water-001/quiz/results',
    }),
  )
  assert.match(confirmHtml, /You have 5 unanswered questions/)
  assert.match(confirmHtml, /Submit Anyway/)
})
