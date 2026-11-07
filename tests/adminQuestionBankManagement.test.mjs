import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

import { getPermissionsForRole } from '../src/features/auth/permissions.ts'
import { gradeAssessment } from '../src/features/assessments/lib/assessmentGrading.ts'
import { getAssessmentForExperiment } from '../src/features/assessments/lib/assessmentSelectors.ts'
import {
  addQuestionToAssessmentInBank,
  assertQuestionBankAdminAccess,
  createAssessmentInBank,
  createInitialAdminQuestionBankState,
  filterManagedAssessments,
  incrementSemanticMinorVersion,
  previewAssessmentQuiz,
  reorderQuestionInAssessmentInBank,
  resolveAssessmentDefinitionByVersion,
  setAssessmentPublicationStatusInBank,
  toStudentAssessmentCatalog,
  updateAssessmentMetadataInBank,
  updateQuestionInAssessmentInBank,
  validateAssessmentPublishReadiness,
  validateQuestionEditorInput,
} from '../src/features/assessments/lib/questionBankManagement.ts'
import {
  createQuestionBankRepository,
  getActiveStudentAssessmentCatalog,
  resetManagedQuestionBankStateForTests,
  setActiveManagedQuestionBankState,
} from '../src/features/assessments/lib/questionBankRepository.ts'
import {
  clearAllAssessmentResults,
  getLatestAssessmentResult,
} from '../src/features/assessments/state/assessmentResultsStore.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const verifiedAdminAuth = {
  status: 'authenticated',
  role: 'admin',
  roleStatus: 'verified',
  permissions: getPermissionsForRole('admin', 'verified'),
}

const studentAuth = {
  status: 'authenticated',
  role: 'student',
  roleStatus: 'verified',
  permissions: getPermissionsForRole('student', 'verified'),
}

const instructorAuth = {
  status: 'authenticated',
  role: 'instructor',
  roleStatus: 'verified',
  permissions: getPermissionsForRole('instructor', 'verified'),
}

const unverifiedAdminAuth = {
  status: 'authenticated',
  role: 'admin',
  roleStatus: 'unverified',
  permissions: getPermissionsForRole('admin', 'unverified'),
}

test('unauthorized users (student, instructor, unverified admin, anonymous) cannot mutate the question bank', () => {
  const initialState = createInitialAdminQuestionBankState()

  for (const unauthorizedActor of [
    null,
    undefined,
    studentAuth,
    instructorAuth,
    unverifiedAdminAuth,
  ]) {
    const access = assertQuestionBankAdminAccess(unauthorizedActor)
    assert.equal(access.ok, false)

    const createRes = createAssessmentInBank(
      initialState,
      {
        experimentId: 'exp-volume-002',
        title: 'Unauthorized Quiz',
        description: 'Should be rejected by authorization guard.',
      },
      unauthorizedActor,
    )
    assert.equal(createRes.ok, false)
    assert.equal(createRes.code, 'unauthorized')

    const addQRes = addQuestionToAssessmentInBank(
      initialState,
      'assessment-salt-water-001',
      {
        experimentId: 'exp-salt-water-001',
        prompt: 'Unauthorized question prompt?',
        options: [
          { id: 'opt-1', text: 'Option A', order: 1 },
          { id: 'opt-2', text: 'Option B', order: 2 },
        ],
        correctOptionId: 'opt-1',
        explanation: 'Unauthorized explanation.',
      },
      unauthorizedActor,
    )
    assert.equal(addQRes.ok, false)
    assert.equal(addQRes.code, 'unauthorized')

    const publishRes = setAssessmentPublicationStatusInBank(
      initialState,
      'assessment-volume-002',
      'published',
      unauthorizedActor,
    )
    assert.equal(publishRes.ok, false)
    assert.equal(publishRes.code, 'unauthorized')
  }
})

test('creating an assessment, adding questions, editing answer choices, selecting correct answers, and reordering', () => {
  let state = createInitialAdminQuestionBankState()

  // 1. Create a new draft assessment
  const created = createAssessmentInBank(
    state,
    {
      id: 'assessment-volume-practice-004',
      experimentId: 'exp-volume-002',
      title: 'Graduated Cylinder Meniscus Review',
      description: 'Practice questions for reading liquid volume accurately at eye level.',
      publicationStatus: 'draft',
    },
    verifiedAdminAuth,
  )
  assert.equal(created.ok, true)
  if (!created.ok) return
  state = created.state
  assert.equal(created.data.publicationStatus, 'draft')
  assert.equal(created.data.assessment.version, '1.0.0')
  assert.equal(created.data.assessment.questions.length, 0)

  // 2. Add Question 1
  const addedQ1 = addQuestionToAssessmentInBank(
    state,
    'assessment-volume-practice-004',
    {
      id: 'vol-q-01-eye-level',
      experimentId: 'exp-volume-002',
      prompt: 'Where should your eyes be positioned when reading a graduated cylinder?',
      options: [
        { id: 'vol-q-01-opt-above', text: 'Looking down from above the cylinder', order: 1 },
        { id: 'vol-q-01-opt-eye', text: 'Level with the bottom of the meniscus', order: 2 },
        { id: 'vol-q-01-opt-below', text: 'Looking up from below the table', order: 3 },
      ],
      correctOptionId: 'vol-q-01-opt-eye',
      explanation:
        'Reading the bottom of the curved liquid meniscus at eye level avoids parallax error.',
      difficulty: 'beginner',
      learningObjectiveId: 'volume-reading',
    },
    verifiedAdminAuth,
  )
  assert.equal(addedQ1.ok, true)
  if (!addedQ1.ok) return
  state = addedQ1.state
  assert.equal(addedQ1.data.record.assessment.questions.length, 1)

  // 3. Add Question 2
  const addedQ2 = addQuestionToAssessmentInBank(
    state,
    'assessment-volume-practice-004',
    {
      id: 'vol-q-02-meniscus-shape',
      experimentId: 'exp-volume-002',
      prompt: 'What is the curved upper surface of water in a graduated cylinder called?',
      options: [
        { id: 'vol-q-02-opt-meniscus', text: 'Meniscus', order: 1 },
        { id: 'vol-q-02-opt-precipitate', text: 'Precipitate', order: 2 },
      ],
      correctOptionId: 'vol-q-02-opt-meniscus',
      explanation: 'The curved surface of a liquid in a narrow tube is called the meniscus.',
      difficulty: 'beginner',
      learningObjectiveId: 'volume-meniscus',
    },
    verifiedAdminAuth,
  )
  assert.equal(addedQ2.ok, true)
  if (!addedQ2.ok) return
  state = addedQ2.state
  assert.equal(addedQ2.data.record.assessment.questions.length, 2)

  // 4. Edit Question 2 answer choices and change the selected Correct Answer
  const editedQ2 = updateQuestionInAssessmentInBank(
    state,
    'assessment-volume-practice-004',
    'vol-q-02-meniscus-shape',
    {
      experimentId: 'exp-volume-002',
      prompt: 'Which term describes the curved surface of water inside graduated glassware?',
      options: [
        { id: 'vol-q-02-opt-precipitate', text: 'Solid precipitate', order: 1 },
        { id: 'vol-q-02-opt-meniscus', text: 'The liquid meniscus', order: 2 },
        { id: 'vol-q-02-opt-filtrate', text: 'Aqueous filtrate', order: 3 },
      ],
      correctOptionId: 'vol-q-02-opt-meniscus',
      explanation:
        'Water forms a concave meniscus in glass cylinders due to adhesion to the glass walls.',
      difficulty: 'intermediate',
      learningObjectiveId: 'volume-meniscus',
    },
    verifiedAdminAuth,
  )
  assert.equal(editedQ2.ok, true)
  if (!editedQ2.ok) return
  state = editedQ2.state
  assert.equal(editedQ2.data.question.options.length, 3)
  assert.equal(editedQ2.data.question.correctOptionId, 'vol-q-02-opt-meniscus')
  assert.equal(editedQ2.data.question.difficulty, 'intermediate')

  // 5. Reorder Question 2 up to position 1
  const reordered = reorderQuestionInAssessmentInBank(
    state,
    'assessment-volume-practice-004',
    'vol-q-02-meniscus-shape',
    'up',
    verifiedAdminAuth,
  )
  assert.equal(reordered.ok, true)
  if (!reordered.ok) return
  state = reordered.state
  assert.equal(reordered.data.assessment.questions[0].id, 'vol-q-02-meniscus-shape')
  assert.equal(reordered.data.assessment.questions[0].order, 1)
  assert.equal(reordered.data.assessment.questions[1].id, 'vol-q-01-eye-level')
  assert.equal(reordered.data.assessment.questions[1].order, 2)
})

test('invalid question rejection and publishing guard against empty or invalid assessments', () => {
  const state = createInitialAdminQuestionBankState()

  // 1. Missing prompt text
  const emptyPrompt = validateQuestionEditorInput(
    {
      experimentId: 'exp-salt-water-001',
      prompt: '   ',
      options: [
        { id: 'a', text: 'Option A', order: 1 },
        { id: 'b', text: 'Option B', order: 2 },
      ],
      correctOptionId: 'a',
      explanation: 'Valid explanation.',
    },
    { expectedExperimentId: 'exp-salt-water-001' },
  )
  assert.equal(emptyPrompt.valid, false)
  assert.ok(emptyPrompt.issues.some((i) => i.code === 'MISSING_QUESTION_TEXT'))

  // 2. Fewer than 2 answer options
  const singleOption = validateQuestionEditorInput(
    {
      experimentId: 'exp-salt-water-001',
      prompt: 'Valid question prompt?',
      options: [{ id: 'a', text: 'Only one option', order: 1 }],
      correctOptionId: 'a',
      explanation: 'Valid explanation.',
    },
    { expectedExperimentId: 'exp-salt-water-001' },
  )
  assert.equal(singleOption.valid, false)
  assert.ok(singleOption.issues.some((i) => i.code === 'INSUFFICIENT_OPTIONS'))

  // 3. Duplicate option texts
  const dupOptionText = validateQuestionEditorInput(
    {
      experimentId: 'exp-salt-water-001',
      prompt: 'Valid question prompt?',
      options: [
        { id: 'a', text: 'Same Option Text', order: 1 },
        { id: 'b', text: 'same option text', order: 2 },
      ],
      correctOptionId: 'a',
      explanation: 'Valid explanation.',
    },
    { expectedExperimentId: 'exp-salt-water-001' },
  )
  assert.equal(dupOptionText.valid, false)
  assert.ok(dupOptionText.issues.some((i) => i.code === 'DUPLICATE_OPTION_TEXT'))

  // 4. CorrectOptionId not matching any option
  const badCorrectId = validateQuestionEditorInput(
    {
      experimentId: 'exp-salt-water-001',
      prompt: 'Valid question prompt?',
      options: [
        { id: 'a', text: 'Option A', order: 1 },
        { id: 'b', text: 'Option B', order: 2 },
      ],
      correctOptionId: 'non-existent-option',
      explanation: 'Valid explanation.',
    },
    { expectedExperimentId: 'exp-salt-water-001' },
  )
  assert.equal(badCorrectId.valid, false)
  assert.ok(
    badCorrectId.issues.some((i) => i.code === 'INVALID_CORRECT_ANSWER_REFERENCE'),
  )

  // 5. Missing explanation
  const missingExplanation = validateQuestionEditorInput(
    {
      experimentId: 'exp-salt-water-001',
      prompt: 'Valid question prompt?',
      options: [
        { id: 'a', text: 'Option A', order: 1 },
        { id: 'b', text: 'Option B', order: 2 },
      ],
      correctOptionId: 'a',
      explanation: '',
    },
    { expectedExperimentId: 'exp-salt-water-001' },
  )
  assert.equal(missingExplanation.valid, false)
  assert.ok(missingExplanation.issues.some((i) => i.code === 'MISSING_EXPLANATION'))

  // 6. Cannot publish an empty assessment (e.g. assessment-volume-002 has 0 questions initially)
  const publishEmpty = setAssessmentPublicationStatusInBank(
    state,
    'assessment-volume-002',
    'published',
    verifiedAdminAuth,
  )
  assert.equal(publishEmpty.ok, false)
  assert.equal(publishEmpty.code, 'publish_blocked')
})

test('draft visibility restrictions and publishing valid assessments to the student catalog', () => {
  let state = createInitialAdminQuestionBankState()

  // Initially only assessment-salt-water-001 is published; volume and pH are draft
  const initialStudentCatalog = toStudentAssessmentCatalog(state)
  assert.equal(initialStudentCatalog.length, 1)
  assert.equal(initialStudentCatalog[0].id, 'assessment-salt-water-001')
  assert.equal(
    getAssessmentForExperiment('exp-volume-002', initialStudentCatalog),
    undefined,
  )

  // Add a valid question to assessment-volume-002 while still in draft
  const withQuestion = addQuestionToAssessmentInBank(
    state,
    'assessment-volume-002',
    {
      id: 'vol-q-01',
      experimentId: 'exp-volume-002',
      prompt: 'Why should a graduated cylinder be placed on a flat surface before reading?',
      options: [
        { id: 'vol-q-01-flat', text: 'So the liquid meniscus is level and accurate', order: 1 },
        { id: 'vol-q-01-tilt', text: 'So water evaporates faster', order: 2 },
      ],
      correctOptionId: 'vol-q-01-flat',
      explanation: 'A flat, level surface ensures the liquid column is vertical.',
    },
    verifiedAdminAuth,
  )
  assert.equal(withQuestion.ok, true)
  if (!withQuestion.ok) return
  state = withQuestion.state

  // While in 'draft' or 'reviewed', assessment-volume-002 is still hidden from students
  const reviewedRes = setAssessmentPublicationStatusInBank(
    state,
    'assessment-volume-002',
    'reviewed',
    verifiedAdminAuth,
  )
  assert.equal(reviewedRes.ok, true)
  if (!reviewedRes.ok) return
  state = reviewedRes.state
  assert.equal(toStudentAssessmentCatalog(state).length, 1)

  // Once published, assessment-volume-002 becomes visible in the student catalog
  const publishedRes = setAssessmentPublicationStatusInBank(
    state,
    'assessment-volume-002',
    'published',
    verifiedAdminAuth,
  )
  assert.equal(publishedRes.ok, true)
  if (!publishedRes.ok) return
  state = publishedRes.state

  const publishedCatalog = toStudentAssessmentCatalog(state)
  assert.equal(publishedCatalog.length, 2)
  const volumeQuiz = getAssessmentForExperiment('exp-volume-002', publishedCatalog)
  assert.ok(volumeQuiz)
  assert.equal(volumeQuiz.questions.length, 1)

  // Archiving hides it from students again
  const archivedRes = setAssessmentPublicationStatusInBank(
    state,
    'assessment-volume-002',
    'archived',
    verifiedAdminAuth,
  )
  assert.equal(archivedRes.ok, true)
  if (!archivedRes.ok) return
  state = archivedRes.state
  assert.equal(toStudentAssessmentCatalog(state).length, 1)
})

test('assessment versioning preserves historical snapshots and student attempts when published quizzes are edited', () => {
  assert.equal(incrementSemanticMinorVersion('1.0.0'), '1.1.0')
  assert.equal(incrementSemanticMinorVersion('1.1.0'), '1.2.0')

  let state = createInitialAdminQuestionBankState()
  const originalSaltQuiz = resolveAssessmentDefinitionByVersion(
    state,
    'assessment-salt-water-001',
    '1.0.0',
  )
  assert.ok(originalSaltQuiz)
  assert.equal(originalSaltQuiz.version, '1.0.0')
  assert.equal(originalSaltQuiz.questions.length, 6)

  // Simulate a student submitting an attempt on v1.0.0 BEFORE admin edits the quiz
  const v1Answers = Object.fromEntries(
    originalSaltQuiz.questions.map((q) => [q.id, q.correctOptionId]),
  )
  const studentSubmissionV1 = gradeAssessment(
    originalSaltQuiz,
    v1Answers,
    {
      attemptId: 'student-attempt-v1',
      expectedAssessmentId: 'assessment-salt-water-001',
      expectedAssessmentVersion: '1.0.0',
    },
  )
  assert.equal(studentSubmissionV1.ok, true)
  if (!studentSubmissionV1.ok) return
  assert.equal(studentSubmissionV1.result.assessmentVersion, '1.0.0')
  assert.equal(studentSubmissionV1.result.score, 6)
  assert.equal(studentSubmissionV1.result.totalQuestions, 6)

  // Now admin adds a 7th question to the published salt assessment
  const editedSalt = addQuestionToAssessmentInBank(
    state,
    'assessment-salt-water-001',
    {
      id: 'salt-q-07-solution-definition',
      experimentId: 'exp-salt-water-001',
      prompt: 'In an aqueous sodium chloride solution, what role does water play?',
      options: [
        { id: 'salt-q-07-opt-solvent', text: 'Water is the solvent', order: 1 },
        { id: 'salt-q-07-opt-solute', text: 'Water is the solid solute', order: 2 },
      ],
      correctOptionId: 'salt-q-07-opt-solvent',
      explanation: 'Water dissolves the sodium chloride and therefore acts as the solvent.',
    },
    verifiedAdminAuth,
  )
  assert.equal(editedSalt.ok, true)
  if (!editedSalt.ok) return
  assert.equal(editedSalt.versionBumped, true)
  assert.equal(editedSalt.previousVersion, '1.0.0')
  assert.equal(editedSalt.data.record.assessment.version, '1.1.0')
  assert.equal(editedSalt.data.record.assessment.questions.length, 7)

  state = editedSalt.state

  // Verify v1.0.0 snapshot is preserved intact in versionHistory while v1.1.0 is active
  const preservedV1 = resolveAssessmentDefinitionByVersion(
    state,
    'assessment-salt-water-001',
    '1.0.0',
  )
  const activeV1_1 = resolveAssessmentDefinitionByVersion(
    state,
    'assessment-salt-water-001',
    '1.1.0',
  )
  assert.ok(preservedV1)
  assert.ok(activeV1_1)
  assert.equal(preservedV1.questions.length, 6)
  assert.equal(activeV1_1.questions.length, 7)

  // Student's historical v1.0.0 submission remains 6/6 on v1.0.0 and is never overwritten
  assert.equal(studentSubmissionV1.result.assessmentVersion, '1.0.0')
  assert.equal(studentSubmissionV1.result.maxScore, 6)
})

test('quiz preview mode evaluates answers with gradeAssessment without saving student attempts or fake scores', () => {
  clearAllAssessmentResults()
  const state = createInitialAdminQuestionBankState()
  const saltRecord = state.assessments.find((a) => a.id === 'assessment-salt-water-001')
  assert.ok(saltRecord)

  const firstTwoQuestions = saltRecord.assessment.questions.slice(0, 2)
  const previewAnswers = Object.fromEntries(
    firstTwoQuestions.map((q) => [q.id, q.correctOptionId]),
  )

  const previewRes = previewAssessmentQuiz(
    saltRecord.assessment,
    previewAnswers,
    verifiedAdminAuth,
  )
  assert.equal(previewRes.ok, true)
  if (!previewRes.ok) return

  assert.equal(previewRes.preview.isPreview, true)
  assert.equal(previewRes.preview.persistedToStudentHistory, false)
  assert.equal(previewRes.preview.gradingOutcome.ok, true)
  if (previewRes.preview.gradingOutcome.ok) {
    assert.equal(previewRes.preview.gradingOutcome.result.score, 2)
    assert.equal(previewRes.preview.gradingOutcome.result.totalQuestions, 6)
  }

  // Verify student assessment results store was NOT mutated by admin preview
  assert.equal(getLatestAssessmentResult('exp-salt-water-001'), null)
})

test('filtering and searching managed assessments by keyword, experiment, and status', () => {
  const state = createInitialAdminQuestionBankState()

  const byExperiment = filterManagedAssessments(state, {
    experimentId: 'exp-salt-water-001',
  })
  assert.equal(byExperiment.length, 1)
  assert.equal(byExperiment[0].id, 'assessment-salt-water-001')

  const byPublished = filterManagedAssessments(state, {
    publicationStatus: 'published',
  })
  assert.equal(byPublished.length, 1)

  const byDraft = filterManagedAssessments(state, {
    publicationStatus: 'draft',
  })
  assert.equal(byDraft.length, 2)

  const byQuestionKeyword = filterManagedAssessments(state, {
    searchQuery: 'weighing boat',
  })
  assert.equal(byQuestionKeyword.length, 1)
  assert.equal(byQuestionKeyword[0].id, 'assessment-salt-water-001')
})

test('SSR rendering of /admin/questions and student ExperimentQuizPage compatibility', async () => {
  resetManagedQuestionBankStateForTests()

  const vite = await createServer({
    root: repoRoot,
    server: { middlewareMode: true },
    appType: 'custom',
  })

  try {
    const [
      { AppRoutes },
      { AuthContext },
      { createAuthService, unavailableAuth },
      { getPermissionsForRole: ssrPermissions },
    ] = await Promise.all([
      vite.ssrLoadModule('/src/app/routes.tsx'),
      vite.ssrLoadModule('/src/features/auth/authContext.ts'),
      vite.ssrLoadModule('/src/features/auth/authService.ts'),
      vite.ssrLoadModule('/src/features/auth/permissions.ts'),
    ])

    const auth = createAuthService(null, '')
    const renderRoute = (urlPath, state) =>
      renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: { auth, state } },
          React.createElement(
            MemoryRouter,
            { initialEntries: [urlPath] },
            React.createElement(AppRoutes),
          ),
        ),
      )

    const adminState = {
      ...unavailableAuth,
      status: 'authenticated',
      user: { id: 'admin-001', email: 'admin@school.example' },
      role: 'admin',
      roleStatus: 'verified',
      permissions: ssrPermissions('admin'),
    }

    const studentState = {
      ...unavailableAuth,
      status: 'authenticated',
      user: { id: 'student-001', email: 'student@school.example' },
      role: 'student',
      roleStatus: 'verified',
      permissions: ssrPermissions('student'),
    }

    // 1. Authorized admin renders /admin/questions with all required English labels
    const adminQuestionsHtml = renderRoute('/admin/questions', adminState)
    for (const requiredLabel of [
      'Question Bank',
      'Add Question',
      'Edit Question',
      'Correct Answer',
      'Answer Options',
      'Explanation',
      'Preview Quiz',
      'Save Draft',
      'Publish Quiz',
    ]) {
      assert.ok(
        adminQuestionsHtml.includes(requiredLabel),
        `Expected /admin/questions markup to include "${requiredLabel}"`,
      )
    }

    // 2. Student cannot access /admin/questions
    const deniedHtml = renderRoute('/admin/questions', studentState)
    assert.match(deniedHtml, /Access Denied/)
    assert.doesNotMatch(deniedHtml, /Questions in Assessment/)

    // 3. Student quiz page renders published assessment questions
    const studentSaltQuizHtml = renderRoute(
      '/experiments/exp-salt-water-001/quiz',
      studentState,
    )
    assert.match(studentSaltQuizHtml, /Experiment Quiz/)
    assert.match(
      studentSaltQuizHtml,
      /What is the main purpose of the graduated cylinder in the salt dissolution experiment\?/,
    )

    // 4. Draft assessment (exp-volume-002) shows QuizUnavailable on student route
    const studentVolumeQuizHtml = renderRoute(
      '/experiments/exp-volume-002/quiz',
      studentState,
    )
    assert.match(studentVolumeQuizHtml, /Quiz questions are coming soon/i)
  } finally {
    resetManagedQuestionBankStateForTests()
    await vite.close()
  }
})

test('question bank repository and Supabase migration enforce RLS and constraints', async () => {
  resetManagedQuestionBankStateForTests()
  const repo = createQuestionBankRepository(null)

  const loaded = await repo.loadAdminState(verifiedAdminAuth)
  assert.equal(loaded.ok, true)
  assert.equal(getActiveStudentAssessmentCatalog().length, 1)

  const migrationSql = readFileSync(
    path.join(
      repoRoot,
      'supabase',
      'migrations',
      '202611070005_question_bank_management.sql',
    ),
    'utf8',
  )
  assert.match(migrationSql, /create table if not exists public\.experiment_assessments/)
  assert.match(migrationSql, /create table if not exists public\.assessment_questions/)
  assert.match(
    migrationSql,
    /create table if not exists public\.assessment_version_snapshots/,
  )
  assert.match(migrationSql, /enable row level security/)
  assert.match(migrationSql, /force row level security/)
  assert.match(migrationSql, /publication_status = 'published'/)
  assert.match(migrationSql, /public\.has_permission\('admin:manage_content'\)/)
  resetManagedQuestionBankStateForTests()
})
