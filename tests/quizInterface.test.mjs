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

let vite
let AppRoutes
let QuizProgressBar
let QuizQuestionCard
let QuizReviewScreen
let QuizUnavailable

test.before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx'))
  ;({ QuizProgressBar } = await vite.ssrLoadModule(
    '/src/features/assessments/components/QuizProgressBar.tsx',
  ))
  ;({ QuizQuestionCard } = await vite.ssrLoadModule(
    '/src/features/assessments/components/QuizQuestionCard.tsx',
  ))
  ;({ QuizReviewScreen } = await vite.ssrLoadModule(
    '/src/features/assessments/components/QuizReviewScreen.tsx',
  ))
  ;({ QuizUnavailable } = await vite.ssrLoadModule(
    '/src/features/assessments/components/QuizUnavailable.tsx',
  ))
})

test.after(async () => {
  await vite?.close()
})

async function renderRoute(path) {
  return await renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(AppRoutes),
    ),
  )
}

async function renderWithRouter(element) {
  return await renderToStaticMarkup(
    React.createElement(MemoryRouter, null, element),
  )
}

test('ExperimentQuizPage renders the interactive quiz interface with question prompt, options, and progress', async () => {
  const html = await renderRoute('/experiments/exp-salt-water-001/quiz')

  // Header & Breadcrumbs
  assert.match(html, /Experiment Quiz/)
  assert.match(html, /Dissolving Salt in Water/)
  assert.match(html, /Learning Practice/)
  assert.match(html, /6 demonstration review questions/)

  // Question Prompt & Structure
  assert.match(html, /Question 1 of 6/)
  assert.match(html, /What is the main purpose of the graduated cylinder/)
  assert.match(html, /Choose one answer\./)
  assert.match(html, /<fieldset/)
  assert.match(html, /<legend/)

  // Options rendered as accessible radio buttons
  assert.match(html, /type="radio"/)
  assert.match(html, /name="quiz-question-q-salt-001-cylinder-purpose"/)
  assert.match(html, /100 mL/)
  assert.match(html, /To measure the mass/)

  // Navigation controls
  assert.match(html, />Previous</)
  assert.match(html, />Next</)
  assert.match(html, /Review Answers/)

  // Links
  assert.match(html, /href="\/experiments\/exp-salt-water-001"/)
  assert.match(html, /href="\/experiments\/exp-salt-water-001\/quiz\/results"/)

  // No form tag or fake scores
  assert.doesNotMatch(html, /<form/)
  assert.doesNotMatch(html, /Score:|Final Score|Grade:|You scored/i)
  assert.doesNotMatch(html, /[\u0600-\u06FF]/)
})

test('QuizQuestionCard renders accessible fieldset, radio inputs, selection states, and navigation', async () => {
  const q = saltDissolutionQuestions[0]

  // Unanswered state on first question
  const unansweredHtml = await renderWithRouter(
    React.createElement(QuizQuestionCard, {
      question: q,
      questionIndex: 0,
      totalQuestions: 6,
      selectedOptionId: undefined,
      onSelectOption: () => {},
      onClearOption: () => {},
      onPrevious: () => {},
      onNext: () => {},
      onOpenReview: () => {},
      isFirst: true,
      isLast: false,
    }),
  )

  assert.match(unansweredHtml, /Question 1 of 6/)
  assert.match(unansweredHtml, /Unanswered/)
  assert.match(unansweredHtml, /disabled=""/) // Previous button is disabled on first question
  assert.match(unansweredHtml, />Next</)

  // Answered state on last question
  const answeredHtml = await renderWithRouter(
    React.createElement(QuizQuestionCard, {
      question: q,
      questionIndex: 5,
      totalQuestions: 6,
      selectedOptionId: q.options[0].id,
      onSelectOption: () => {},
      onClearOption: () => {},
      onPrevious: () => {},
      onNext: () => {},
      onOpenReview: () => {},
      isFirst: false,
      isLast: true,
    }),
  )

  assert.match(answeredHtml, /Question 6 of 6/)
  assert.match(answeredHtml, /Answered/)
  assert.match(answeredHtml, /Clear/) // Clear button is visible when answered
  assert.match(answeredHtml, /checked=""/) // Selected radio is checked
  assert.match(answeredHtml, />Review Answers<\/span>/) // Next changes to Review Answers on last question
  assert.doesNotMatch(answeredHtml, /disabled=""/) // Previous button is not disabled
})

test('QuizProgressBar displays accurate progress, question count, and interactive step jump buttons', async () => {
  const questions = saltDissolutionQuestions
  const answers = {
    [questions[0].id]: questions[0].options[0].id,
    [questions[1].id]: questions[1].options[1].id,
  }

  const html = await renderWithRouter(
    React.createElement(QuizProgressBar, {
      questions,
      currentIndex: 1,
      answers,
      onSelectIndex: () => {},
    }),
  )

  assert.match(html, /Question <span[^>]*>2<\/span> of <span[^>]*>6<\/span>/)
  assert.match(html, /2<\/span> of <span[^>]*>6<\/span> answered \(33%\)/)
  assert.match(html, /role="progressbar"/)
  assert.match(html, /aria-valuenow="33"/)
  assert.match(html, /style="width:33%"/)

  // Buttons 1-6
  assert.match(html, /aria-label="Question 1: Answered"/)
  assert.match(html, /aria-label="Question 2: Answered \(Current\)"/)
  assert.match(html, /aria-label="Question 3: Unanswered"/)
})

test('QuizReviewScreen renders complete summary, answered vs unanswered items, and future submission notice without fake scores', async () => {
  const questions = saltDissolutionQuestions
  const answers = {
    [questions[0].id]: questions[0].options[0].id,
    [questions[1].id]: questions[1].options[1].id,
    [questions[2].id]: questions[2].options[2].id,
  }

  const html = await renderWithRouter(
    React.createElement(QuizReviewScreen, {
      questions,
      answers,
      onGoToQuestion: () => {},
      onBackToQuestions: () => {},
      detailsPath: '/experiments/exp-salt-water-001',
      resultsPath: '/experiments/exp-salt-water-001/quiz/results',
    }),
  )

  assert.match(html, /Review Answers/)
  assert.match(html, /Total Questions/)
  assert.match(html, />6<\/p>/) // 6 total
  assert.match(html, />3<\/p>/) // 3 answered & 3 unanswered
  assert.match(html, /Answered Questions/)
  assert.match(html, /Unanswered Questions/)

  // Question checklist items
  assert.match(html, /Selected:[\s\S]*100 mL/i)
  assert.match(html, /No answer selected yet/)
  assert.match(html, /Change Answer/)
  assert.match(html, /Answer Question/)

  // Submission preparation notice (no fake score before submission!)
  assert.match(html, /Assessment Submission Notice/)
  assert.match(html, />Submit Quiz<\/span>/)
  assert.match(html, /Continue Answering/)
  assert.match(html, /Back to Experiment/)
  assert.match(html, /View Quiz Results/)

  // Strict check: zero score calculations or correct answer disclosures
  assert.doesNotMatch(html, /Score:|Final Score|Grade:|You scored|\d+% correct/i)
})

test('QuizUnavailable renders honest unavailable state when experiment has no assessment', async () => {
  const html = await renderWithRouter(
    React.createElement(QuizUnavailable, {
      experimentTitle: 'Measuring Liquid Volume',
      detailsPath: '/experiments/exp-volume-002',
      resultsPath: '/experiments/exp-volume-002/quiz/results',
    }),
  )

  assert.match(html, /Quiz questions are coming soon/)
  assert.match(html, /Measuring Liquid Volume/)
  assert.match(html, /Back to Experiment/)
  assert.match(html, /View Quiz Results/)
  assert.doesNotMatch(html, /type="radio"/)
})

test('planned experiments render QuizUnavailable through route without generating fake questions', async () => {
  const volumeHtml = await renderRoute('/experiments/exp-volume-002/quiz')
  assert.match(volumeHtml, /Quiz questions are coming soon/)
  assert.match(volumeHtml, /Measuring Liquid Volume/)
  assert.doesNotMatch(volumeHtml, /type="radio"/)

  const phHtml = await renderRoute('/experiments/exp-ph-003/quiz')
  assert.match(phHtml, /Quiz questions are coming soon/)
  assert.match(phHtml, /Exploring pH Indicators/)
  assert.doesNotMatch(phHtml, /type="radio"/)
})

test('invalid experiment ID returns clean 404 Experiment Not Found on quiz route', async () => {
  const html = await renderRoute('/experiments/invalid-unknown-id/quiz')
  assert.match(html, /Experiment Not Found/)
  assert.doesNotMatch(html, /Choose one answer/)
})
