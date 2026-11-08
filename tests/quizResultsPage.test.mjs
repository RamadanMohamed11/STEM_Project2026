import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  saltDissolutionAssessment,
  saltDissolutionQuestions,
} from '../src/features/assessments/data/saltDissolutionAssessment.ts'
import { gradeAssessment } from '../src/features/assessments/lib/assessmentGrading.ts'
import { getPerformanceFeedback } from '../src/features/assessments/lib/performanceFeedback.ts'
import {
  clearAllAssessmentResults,
  clearLatestAssessmentResult,
  getLatestAssessmentResult,
  setLatestAssessmentResult,
} from '../src/features/assessments/state/assessmentResultsStore.ts'

let vite
let AppRoutes
let QuizResultsPage
let QuizResultsAnswerReview
let ScoreRingMeter
let AchievementIllustration
let CelebrationEffect
let storeSetLatest
let storeClearLatest
let storeGetLatest
let storeClearAll

test.before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx'))
  ;({ QuizResultsPage } = await vite.ssrLoadModule('/src/pages/QuizResultsPage.tsx'))
  ;({ QuizResultsAnswerReview } = await vite.ssrLoadModule(
    '/src/features/assessments/components/QuizResultsAnswerReview.tsx',
  ))
  ;({ ScoreRingMeter } = await vite.ssrLoadModule(
    '/src/features/assessments/components/ScoreRingMeter.tsx',
  ))
  ;({ AchievementIllustration } = await vite.ssrLoadModule(
    '/src/features/assessments/components/AchievementIllustration.tsx',
  ))
  ;({ CelebrationEffect } = await vite.ssrLoadModule(
    '/src/features/assessments/components/CelebrationEffect.tsx',
  ))
  const store = await vite.ssrLoadModule(
    '/src/features/assessments/state/assessmentResultsStore.ts',
  )
  storeSetLatest = store.setLatestAssessmentResult
  storeClearLatest = store.clearLatestAssessmentResult
  storeGetLatest = store.getLatestAssessmentResult
  storeClearAll = store.clearAllAssessmentResults
})

test.after(async () => {
  await vite?.close()
})

test.beforeEach(() => {
  storeClearAll?.()
  clearAllAssessmentResults()
})

async function renderRoute(path, state = null) {
  return await renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: path, state }] },
      React.createElement(AppRoutes),
    ),
  )
}

async function renderWithRouter(element) {
  return await renderToStaticMarkup(React.createElement(MemoryRouter, null, element))
}

test('QuizResultsPage renders honest empty state when visited without a submitted attempt', async () => {
  const html = await renderRoute('/experiments/exp-salt-water-001/quiz/results')

  assert.match(html, /Quiz Results/)
  assert.match(html, /No quiz results yet/)
  assert.match(html, /no score to show/)
  assert.match(html, /[Cc]oming soon/)
  assert.match(html, /href="\/experiments\/exp-salt-water-001\/quiz"/)
  assert.match(html, /href="\/experiments"/)
  assert.doesNotMatch(html, /<form|type="password"/)
  assert.doesNotMatch(html, /Excellent Work|Great Job|Final Score:\s*\d/i)
})

test('QuizResultsPage renders submitted assessment result with score, metrics, and navigation', async () => {
  const answers = {}
  for (const q of saltDissolutionQuestions) {
    answers[q.id] = q.correctOptionId
  }

  const outcome = gradeAssessment(saltDissolutionAssessment, answers, {
    attemptId: 'test-attempt-1',
  })
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  // Set in store and render route
  storeSetLatest('exp-salt-water-001', outcome.result)
  const html = await renderRoute('/experiments/exp-salt-water-001/quiz/results')

  // Score summary
  assert.match(html, /Quiz Results/)
  assert.match(html, /Dissolving Salt in Water/)
  assert.match(html, /6 \/ 6/)
  assert.match(html, /100%/)
  assert.match(html, /Total Questions[\s\S]*>6<\/p>/)
  assert.match(html, /Correct Answers[\s\S]*>6<\/p>/)
  assert.match(html, /Incorrect Answers[\s\S]*>0<\/p>/)
  assert.match(html, /Unanswered[\s\S]*>0<\/p>/)

  // Encouraging feedback
  assert.match(html, /Excellent Work!/)
  assert.match(html, /Perfect score on your practice quiz!/)

  // Navigation actions
  assert.match(html, />Review Answers<\/span>/)
  assert.match(html, />Try Again<\/span>/)
  assert.match(html, /href="\/experiments\/exp-salt-water-001"/)
  assert.match(html, /href="\/experiments"/)

  // Practice notice
  assert.match(html, /Practice Assessment Notice/)

  // Also verify passing result via React Router location state
  const htmlFromState = await renderRoute('/experiments/exp-salt-water-001/quiz/results', {
    result: outcome.result,
  })
  assert.match(htmlFromState, /Excellent Work!/)
  assert.match(htmlFromState, /100%/)
})

test('Performance feedback helper maps score ranges to appropriate encouraging messages', () => {
  const perfect = getPerformanceFeedback(100)
  assert.equal(perfect.tier, 'perfect')
  assert.equal(perfect.title, 'Excellent Work!')
  assert.match(perfect.message, /every question correctly/i)

  const great = getPerformanceFeedback(83)
  assert.equal(great.tier, 'excellent')
  assert.equal(great.title, 'Great Job!')
  assert.match(great.message, /clear grasp of the laboratory techniques/i)

  const good = getPerformanceFeedback(67)
  assert.equal(good.tier, 'good')
  assert.equal(good.title, 'Good Effort!')
  assert.match(good.headline, /making steady progress/i)

  const practice = getPerformanceFeedback(33)
  assert.equal(practice.tier, 'practice')
  assert.equal(practice.title, 'Keep Practicing!')
  assert.match(practice.message, /opportunity to learn/i)

  // Boundary checks
  assert.equal(getPerformanceFeedback(0).tier, 'practice')
  assert.equal(getPerformanceFeedback(50).tier, 'good')
  assert.equal(getPerformanceFeedback(80).tier, 'excellent')
})

test('ScoreRingMeter renders accessible progressbar with clamped percentage and numerals', async () => {
  const html = await renderWithRouter(
    React.createElement(ScoreRingMeter, {
      score: 5,
      maxScore: 6,
      percentage: 83,
    }),
  )

  assert.match(html, /role="progressbar"/)
  assert.match(html, /aria-valuenow="83"/)
  assert.match(html, /aria-valuemin="0"/)
  assert.match(html, /aria-valuemax="100"/)
  assert.match(html, /83%/)
  assert.match(html, /5 \/ 6/)
})

test('AchievementIllustration and CelebrationEffect render cleanly without audio or large assets', async () => {
  const perfectHtml = await renderWithRouter(
    React.createElement(AchievementIllustration, { tier: 'perfect' }),
  )
  assert.match(perfectHtml, /<svg/)
  assert.match(perfectHtml, /aria-hidden="true"/)

  const goodHtml = await renderWithRouter(
    React.createElement(AchievementIllustration, { tier: 'good' }),
  )
  assert.match(goodHtml, /<svg/)

  const celebrationInactive = await renderWithRouter(
    React.createElement(CelebrationEffect, { active: false }),
  )
  assert.equal(celebrationInactive, '')
})

test('QuizResultsAnswerReview renders each question, student choice, correct answer, and filter tabs', async () => {
  const q = saltDissolutionQuestions
  const wrongQ1 = q[1].options.find((o) => o.id !== q[1].correctOptionId).id

  const outcome = gradeAssessment(saltDissolutionAssessment, {
    [q[0].id]: q[0].correctOptionId,
    [q[1].id]: wrongQ1,
    // q[2..5] left unanswered
  })
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  const html = await renderWithRouter(
    React.createElement(QuizResultsAnswerReview, {
      feedbackItems: outcome.result.questionFeedback,
    }),
  )

  // Section title & filter buttons
  assert.match(html, /Review Answers/)
  assert.match(html, />All \(6\)<\/span>/)
  assert.match(html, />Needs Review \(5\)<\/span>/)
  assert.match(html, />Correct \(1\)<\/span>/)

  // Question 1 (Correct)
  assert.match(html, /Question 1/)
  assert.match(html, />Correct Answer<\/span>/)
  assert.match(html, /Here&#x27;s Why|Here's Why/)

  // Question 2 (Incorrect)
  assert.match(html, /Question 2/)
  assert.match(html, />Not Quite Right<\/span>/)

  // Question 3 (Unanswered)
  assert.match(html, /Question 3/)
  assert.match(html, /Not answered — You skipped this question/)
})

test('assessmentResultsStore manages session results cleanly across experiments', () => {
  const outcome = gradeAssessment(saltDissolutionAssessment, {})
  assert.equal(outcome.ok, true)
  if (!outcome.ok) return

  assert.equal(getLatestAssessmentResult('exp-salt-water-001'), null)
  setLatestAssessmentResult('exp-salt-water-001', outcome.result)
  assert.equal(getLatestAssessmentResult('exp-salt-water-001')?.attemptId, outcome.result.attemptId)

  clearLatestAssessmentResult('exp-salt-water-001')
  assert.equal(getLatestAssessmentResult('exp-salt-water-001'), null)
})

test('invalid experiment ID returns 404 Experiment Not Found on results route', async () => {
  const html = await renderRoute('/experiments/unknown-fake-id/quiz/results')
  assert.match(html, /Experiment Not Found/)
  assert.match(html, /Not found/)
})
