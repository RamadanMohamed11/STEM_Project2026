import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'
import {
  SALT_DISSOLUTION_ASSESSMENT_ID,
  SALT_DISSOLUTION_EXPERIMENT_ID,
  saltDissolutionAssessment,
  saltDissolutionQuestions,
} from '../src/features/assessments/data/saltDissolutionAssessment.ts'
import { assessmentCatalog } from '../src/features/assessments/data/assessmentCatalog.ts'
import {
  isValidSemanticVersion,
  validateAssessmentCatalog,
  validateAssessmentDefinition,
  validateMultipleChoiceQuestion,
} from '../src/features/assessments/lib/assessmentValidation.ts'
import {
  getAssessmentForExperiment,
  getExperimentAssessmentSummary,
  getOrderedAssessmentQuestions,
  getOrderedQuestionOptions,
} from '../src/features/assessments/lib/assessmentSelectors.ts'

test('valid assessment data and demonstration catalog pass all validation checks', () => {
  const catalogValidation = validateAssessmentCatalog(
    assessmentCatalog,
    demoCatalog.experiments,
  )
  assert.equal(catalogValidation.valid, true, JSON.stringify(catalogValidation.issues))
  assert.deepEqual(catalogValidation.issues, [])

  const saltExperiment = demoCatalog.experiments.find(
    (exp) => exp.id === SALT_DISSOLUTION_EXPERIMENT_ID,
  )
  assert.ok(saltExperiment)

  const singleValidation = validateAssessmentDefinition(saltDissolutionAssessment, {
    knownExperimentIds: demoCatalog.experiments.map((exp) => exp.id),
    experimentsById: new Map(demoCatalog.experiments.map((exp) => [exp.id, exp])),
  })
  assert.equal(singleValidation.valid, true)
  assert.equal(saltDissolutionAssessment.id, SALT_DISSOLUTION_ASSESSMENT_ID)
  assert.equal(saltDissolutionAssessment.experimentId, SALT_DISSOLUTION_EXPERIMENT_ID)
  assert.equal(saltDissolutionAssessment.reviewStatus, 'draft')
  assert.equal(saltDissolutionAssessment.availabilityStatus, 'draft-demo')
  assert.equal(saltDissolutionAssessment.passingScore.status, 'unconfigured-draft')
  assert.ok(saltDissolutionQuestions.length >= 5)

  // Every question must be draft demonstration content with English-only text and valid learning objective link
  const validObjectiveIds = new Set(saltExperiment.learning.objectives.map((obj) => obj.id))
  for (const question of saltDissolutionQuestions) {
    assert.equal(question.experimentId, SALT_DISSOLUTION_EXPERIMENT_ID)
    assert.equal(question.reviewStatus, 'draft')
    assert.ok(validObjectiveIds.has(question.learningObjectiveId))
    assert.doesNotMatch(question.prompt, /[\u0600-\u06FF]/)
    assert.doesNotMatch(question.explanation, /[\u0600-\u06FF]/)
    for (const option of question.options) {
      assert.doesNotMatch(option.text, /[\u0600-\u06FF]/)
    }
  }
})

test('validator rejects duplicate question IDs within an assessment', () => {
  const duplicateQuestions = [
    saltDissolutionQuestions[0],
    {
      ...saltDissolutionQuestions[1],
      id: saltDissolutionQuestions[0].id,
    },
  ]
  const invalidAssessment = {
    ...saltDissolutionAssessment,
    questions: duplicateQuestions,
  }

  const result = validateAssessmentDefinition(invalidAssessment)
  assert.equal(result.valid, false)
  assert.ok(result.issues.some((issue) => issue.code === 'DUPLICATE_QUESTION_ID'))
})

test('validator rejects duplicate option IDs within a question and across questions', () => {
  const baseQuestion = saltDissolutionQuestions[0]
  const duplicateWithinQuestion = {
    ...baseQuestion,
    options: [
      baseQuestion.options[0],
      {
        ...baseQuestion.options[1],
        id: baseQuestion.options[0].id,
      },
    ],
  }
  const singleResult = validateMultipleChoiceQuestion(duplicateWithinQuestion)
  assert.equal(singleResult.valid, false)
  assert.ok(singleResult.issues.some((issue) => issue.code === 'DUPLICATE_OPTION_ID'))

  // Duplicate option ID reused in a second question of the same assessment
  const crossQuestionDuplicate = {
    ...saltDissolutionAssessment,
    questions: [
      saltDissolutionQuestions[0],
      {
        ...saltDissolutionQuestions[1],
        options: [
          {
            ...saltDissolutionQuestions[1].options[0],
            id: saltDissolutionQuestions[0].options[0].id,
          },
          ...saltDissolutionQuestions[1].options.slice(1),
        ],
      },
    ],
  }
  const assessmentResult = validateAssessmentDefinition(crossQuestionDuplicate)
  assert.equal(assessmentResult.valid, false)
  assert.ok(assessmentResult.issues.some((issue) => issue.code === 'DUPLICATE_OPTION_ID'))
})

test('validator rejects missing correct answers and multiple correct answers', () => {
  const missingCorrect = {
    ...saltDissolutionQuestions[0],
    correctOptionId: '   ',
  }
  const missingResult = validateMultipleChoiceQuestion(missingCorrect)
  assert.equal(missingResult.valid, false)
  assert.ok(missingResult.issues.some((issue) => issue.code === 'MISSING_CORRECT_ANSWER'))

  const multipleCorrectFlags = {
    ...saltDissolutionQuestions[0],
    correctOptionIds: [
      saltDissolutionQuestions[0].options[0].id,
      saltDissolutionQuestions[0].options[1].id,
    ],
  }
  const multiResult = validateMultipleChoiceQuestion(multipleCorrectFlags)
  assert.equal(multiResult.valid, false)
  assert.ok(multiResult.issues.some((issue) => issue.code === 'MULTIPLE_CORRECT_ANSWERS'))
})

test('validator rejects invalid correct-answer references', () => {
  const wrongReference = {
    ...saltDissolutionQuestions[0],
    correctOptionId: 'opt-non-existent-id',
  }
  const result = validateMultipleChoiceQuestion(wrongReference)
  assert.equal(result.valid, false)
  assert.ok(
    result.issues.some((issue) => issue.code === 'INVALID_CORRECT_ANSWER_REFERENCE'),
  )
})

test('validator rejects insufficient options, empty option text, and duplicate option text', () => {
  const onlyOneOption = {
    ...saltDissolutionQuestions[0],
    options: [saltDissolutionQuestions[0].options[0]],
  }
  const oneOptResult = validateMultipleChoiceQuestion(onlyOneOption)
  assert.equal(oneOptResult.valid, false)
  assert.ok(oneOptResult.issues.some((issue) => issue.code === 'INSUFFICIENT_OPTIONS'))

  const emptyOptionText = {
    ...saltDissolutionQuestions[0],
    options: [
      saltDissolutionQuestions[0].options[0],
      { ...saltDissolutionQuestions[0].options[1], text: '   ' },
    ],
  }
  const emptyTextResult = validateMultipleChoiceQuestion(emptyOptionText)
  assert.equal(emptyTextResult.valid, false)
  assert.ok(emptyTextResult.issues.some((issue) => issue.code === 'MISSING_OPTION_TEXT'))
  assert.ok(emptyTextResult.issues.some((issue) => issue.code === 'INSUFFICIENT_OPTIONS'))

  const duplicateOptionText = {
    ...saltDissolutionQuestions[0],
    options: [
      saltDissolutionQuestions[0].options[0],
      {
        ...saltDissolutionQuestions[0].options[1],
        text: saltDissolutionQuestions[0].options[0].text.toUpperCase(),
      },
    ],
  }
  const dupTextResult = validateMultipleChoiceQuestion(duplicateOptionText)
  assert.equal(dupTextResult.valid, false)
  assert.ok(dupTextResult.issues.some((issue) => issue.code === 'DUPLICATE_OPTION_TEXT'))
})

test('validator rejects missing question prompt text and missing explanations', () => {
  const missingPrompt = {
    ...saltDissolutionQuestions[0],
    prompt: '',
  }
  const promptResult = validateMultipleChoiceQuestion(missingPrompt)
  assert.equal(promptResult.valid, false)
  assert.ok(promptResult.issues.some((issue) => issue.code === 'MISSING_QUESTION_TEXT'))

  const missingExplanation = {
    ...saltDissolutionQuestions[0],
    explanation: '   ',
  }
  const explanationResult = validateMultipleChoiceQuestion(missingExplanation)
  assert.equal(explanationResult.valid, false)
  assert.ok(explanationResult.issues.some((issue) => issue.code === 'MISSING_EXPLANATION'))
})

test('validator rejects invalid experiment associations, mismatched question experimentId, and invalid version info', () => {
  const knownExperimentIds = demoCatalog.experiments.map((exp) => exp.id)

  const unknownExpAssessment = {
    ...saltDissolutionAssessment,
    experimentId: 'exp-does-not-exist-999',
  }
  const unknownExpResult = validateAssessmentDefinition(unknownExpAssessment, {
    knownExperimentIds,
  })
  assert.equal(unknownExpResult.valid, false)
  assert.ok(
    unknownExpResult.issues.some((issue) => issue.code === 'INVALID_EXPERIMENT_ASSOCIATION'),
  )

  const mismatchedQuestionExp = {
    ...saltDissolutionAssessment,
    questions: [
      {
        ...saltDissolutionQuestions[0],
        experimentId: 'exp-volume-002',
      },
    ],
  }
  const mismatchResult = validateAssessmentDefinition(mismatchedQuestionExp, {
    knownExperimentIds,
  })
  assert.equal(mismatchResult.valid, false)
  assert.ok(
    mismatchResult.issues.some((issue) => issue.code === 'QUESTION_EXPERIMENT_MISMATCH'),
  )

  assert.equal(isValidSemanticVersion('1.0.0'), true)
  assert.equal(isValidSemanticVersion('0.2.1-draft.1'), true)
  assert.equal(isValidSemanticVersion('v1'), false)
  assert.equal(isValidSemanticVersion(''), false)

  const badVersionAssessment = {
    ...saltDissolutionAssessment,
    version: 'not-a-semver',
  }
  const versionResult = validateAssessmentDefinition(badVersionAssessment)
  assert.equal(versionResult.valid, false)
  assert.ok(
    versionResult.issues.some((issue) => issue.code === 'INVALID_ASSESSMENT_VERSION'),
  )

  const badPassingScore = {
    ...saltDissolutionAssessment,
    passingScore: {
      status: 'approved',
      minimumPercentage: 150,
      note: 'Invalid percentage over 100.',
    },
  }
  const passingResult = validateAssessmentDefinition(badPassingScore)
  assert.equal(passingResult.valid, false)
  assert.ok(passingResult.issues.some((issue) => issue.code === 'INVALID_PASSING_SCORE'))
})

test('pure selectors order questions and options deterministically without mutating source data', () => {
  const reversedQuestion = {
    ...saltDissolutionQuestions[0],
    options: [...saltDissolutionQuestions[0].options].reverse(),
  }
  const snapshot = structuredClone(reversedQuestion)
  const orderedOptions = getOrderedQuestionOptions(reversedQuestion)
  assert.deepEqual(
    orderedOptions.map((opt) => opt.order),
    [1, 2, 3, 4],
  )
  assert.deepEqual(reversedQuestion, snapshot, 'source question must not be mutated')

  const shuffledAssessment = {
    ...saltDissolutionAssessment,
    questions: [...saltDissolutionQuestions].reverse(),
  }
  const assessmentSnapshot = structuredClone(shuffledAssessment)
  const orderedQuestions = getOrderedAssessmentQuestions(shuffledAssessment)
  assert.deepEqual(
    orderedQuestions.map((q) => q.order),
    [1, 2, 3, 4, 5, 6],
  )
  assert.deepEqual(shuffledAssessment, assessmentSnapshot, 'source assessment must not be mutated')

  const resolved = getAssessmentForExperiment(SALT_DISSOLUTION_EXPERIMENT_ID)
  assert.ok(resolved)
  assert.equal(resolved.id, SALT_DISSOLUTION_ASSESSMENT_ID)
  assert.equal(getAssessmentForExperiment('unknown-experiment'), undefined)

  const summary = getExperimentAssessmentSummary(SALT_DISSOLUTION_EXPERIMENT_ID)
  assert.equal(summary.hasAssessment, true)
  assert.equal(summary.questionCount, 6)
  assert.equal(summary.availabilityStatus, 'draft-demo')
  assert.equal(summary.reviewStatus, 'draft')
  assert.equal(summary.isInteractiveQuizEnabled, false)
})

test('existing quiz and quiz results routes remain operational with honest placeholder states and no fake scores', async () => {
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const render = (path) =>
      renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(AppRoutes),
        ),
      )

    const quizHtml = render('/experiments/exp-salt-water-001/quiz')
    assert.match(quizHtml, /Experiment Quiz/)
    assert.match(quizHtml, /Quiz questions are coming soon/)
    assert.match(quizHtml, /6 demonstration review questions/)
    assert.doesNotMatch(quizHtml, /<form|type="radio"|Score:/i)

    const quizResultsHtml = render('/experiments/exp-salt-water-001/quiz/results')
    assert.match(quizResultsHtml, /Quiz Results/)
    assert.match(quizResultsHtml, /No quiz results yet/)
    assert.match(quizResultsHtml, /no score to show/)
  } finally {
    await vite.close()
  }
})
