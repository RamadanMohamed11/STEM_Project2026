import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { getActiveNavigationId, getPageContext } from '../src/app/navigation.ts'
import { routePaths } from '../src/app/paths.ts'
import { saltDissolutionAssessment } from '../src/features/assessments/data/saltDissolutionAssessment.ts'
import { gradeAssessment } from '../src/features/assessments/lib/assessmentGrading.ts'
import { setLatestAssessmentResult } from '../src/features/assessments/state/assessmentResultsStore.ts'
import {
  createLocalProgressRepository,
  STUDENT_PROGRESS_STORAGE_KEY,
} from '../src/features/progress/lib/progressRepository.ts'
import {
  createEmptyProgressEnvelope,
  validateStoredProgressEnvelope,
} from '../src/features/progress/lib/progressValidation.ts'
import {
  applyQuizResultToEnvelope,
  applySimulationMilestoneToEnvelope,
  buildStudentProgressOverview,
  clearStudentProgress,
  configureStudentProgressRepository,
  getStudentProgressEnvelope,
  getStudentProgressOverview,
  recordQuizResultProgress,
  recordSimulationMilestoneProgress,
  reloadStudentProgressFromRepository,
} from '../src/features/progress/state/studentProgressStore.ts'
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useSaltSimulationStore } from '../src/features/simulations/state/useSaltSimulationStore.ts'

function createMemoryStorageAdapter(initialValue = null) {
  const store = new Map()
  if (initialValue !== null) {
    store.set(STUDENT_PROGRESS_STORAGE_KEY, initialValue)
  }
  let getCount = 0
  let setCount = 0
  let removeCount = 0

  return {
    getItem(key) {
      getCount += 1
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      setCount += 1
      store.set(key, String(value))
    },
    removeItem(key) {
      removeCount += 1
      store.delete(key)
    },
    get rawValue() {
      return store.get(STUDENT_PROGRESS_STORAGE_KEY) ?? null
    },
    get stats() {
      return { getCount, setCount, removeCount }
    },
  }
}

test('progress creation, empty states, and planned experiment exclusion', () => {
  const storage = createMemoryStorageAdapter()
  const repo = createLocalProgressRepository({ storage })
  const overview = configureStudentProgressRepository(repo)

  assert.equal(overview.scope, 'local-device')
  assert.equal(overview.storageHealthy, true)
  assert.equal(overview.availableCount, 3)
  assert.equal(overview.executableCount, 1)
  assert.equal(overview.plannedCount, 2)
  assert.equal(overview.startedCount, 0)
  assert.equal(overview.completedCount, 0)
  assert.equal(overview.quizCompletedCount, 0)
  assert.equal(overview.continueLearningItems.length, 0)
  assert.equal(overview.completedExperimentItems.length, 0)
  assert.equal(overview.quizResultItems.length, 0)
  assert.equal(overview.recentActivities.length, 0)

  const saltItem = overview.items.find((item) => item.experiment.id === 'exp-salt-water-001')
  assert.ok(saltItem)
  assert.equal(saltItem.isExecutable, true)
  assert.equal(saltItem.progress.experimentStatus, 'not-started')
  assert.equal(saltItem.progress.completedStepCount, 0)
  assert.equal(saltItem.progress.totalStepCount, 9)
  assert.equal(saltItem.primaryActionLabel, 'Start Experiment')

  // Planned experiments must never be counted as completed even if injected into an envelope
  const forgedEnvelope = {
    ...createEmptyProgressEnvelope('2026-03-01T10:00:00.000Z'),
    experiments: {
      'exp-volume-002': {
        experimentId: 'exp-volume-002',
        experimentDefinitionVersion: 'planned-0.0.0',
        experimentStatus: 'completed',
        lastActivityAt: '2026-03-01T10:00:00.000Z',
        currentValidatedStepId: 'review',
        currentValidatedStepIndex: 5,
        completedStepCount: 5,
        totalStepCount: 5,
        experimentCompleted: true,
        experimentCompletedAt: '2026-03-01T10:00:00.000Z',
        latestQuizResult: null,
        quizAssessmentVersion: null,
      },
    },
  }
  const plannedCheckOverview = buildStudentProgressOverview(forgedEnvelope)
  assert.equal(plannedCheckOverview.completedCount, 0)
  assert.equal(plannedCheckOverview.startedCount, 0)
  const volumeItem = plannedCheckOverview.items.find(
    (item) => item.experiment.id === 'exp-volume-002',
  )
  assert.equal(volumeItem.isExecutable, false)
  assert.equal(volumeItem.progress.experimentStatus, 'not-started')
})

test('validated-step updates, experiment completion, reset, and no-write during 3D animations', () => {
  const storage = createMemoryStorageAdapter()
  const repo = createLocalProgressRepository({ storage })
  configureStudentProgressRepository(repo)

  // Opening the lab without acknowledging safety or completing steps must not write or start progress
  const unstartedChanged = recordSimulationMilestoneProgress({
    experimentId: 'exp-salt-water-001',
    definitionVersion: '1.0.0',
    resetRevision: 0,
    safetyAcknowledged: false,
    stepIndex: 0,
    currentStepId: 'prepare',
    totalSteps: 9,
    completed: false,
    occurredAt: '2026-03-01T10:00:00.000Z',
  })
  assert.equal(unstartedChanged, false)
  assert.equal(storage.stats.setCount, 0)
  assert.equal(getStudentProgressOverview().startedCount, 0)

  // 1. Experiment started (safety acknowledged)
  const startedChanged = recordSimulationMilestoneProgress({
    experimentId: 'exp-salt-water-001',
    definitionVersion: '1.0.0',
    resetRevision: 0,
    safetyAcknowledged: true,
    stepIndex: 0,
    currentStepId: 'prepare',
    totalSteps: 9,
    completed: false,
    occurredAt: '2026-03-01T10:01:00.000Z',
  })
  assert.equal(startedChanged, true)
  assert.equal(storage.stats.setCount, 1)

  let overview = getStudentProgressOverview()
  assert.equal(overview.startedCount, 1)
  assert.equal(overview.completedCount, 0)
  assert.equal(overview.recentActivities[0].type, 'experiment-started')

  // Repeated calls during 3D animations where milestone fields have not changed must NOT write to storage
  for (let frame = 0; frame < 30; frame += 1) {
    const frameChanged = recordSimulationMilestoneProgress({
      experimentId: 'exp-salt-water-001',
      definitionVersion: '1.0.0',
      resetRevision: 0,
      safetyAcknowledged: true,
      stepIndex: 0,
      currentStepId: 'prepare',
      totalSteps: 9,
      completed: false,
      occurredAt: `2026-03-01T10:01:${String(frame).padStart(2, '0')}.000Z`,
    })
    assert.equal(frameChanged, false)
  }
  assert.equal(storage.stats.setCount, 1, 'No storage writes should happen during animation frames')

  // 2. Validated step completed (stepIndex advances to 2)
  const stepChanged = recordSimulationMilestoneProgress({
    experimentId: 'exp-salt-water-001',
    definitionVersion: '1.0.0',
    resetRevision: 0,
    safetyAcknowledged: true,
    stepIndex: 2,
    currentStepId: 'salt',
    currentStepTitle: 'Measure 100 mL of water',
    totalSteps: 9,
    completed: false,
    occurredAt: '2026-03-01T10:03:00.000Z',
  })
  assert.equal(stepChanged, true)
  assert.equal(storage.stats.setCount, 2)

  overview = getStudentProgressOverview()
  const saltProgress = overview.items.find(
    (item) => item.experiment.id === 'exp-salt-water-001',
  ).progress
  assert.equal(saltProgress.experimentStatus, 'in-progress')
  assert.equal(saltProgress.completedStepCount, 2)
  assert.equal(saltProgress.currentValidatedStepIndex, 2)
  assert.equal(saltProgress.currentValidatedStepId, 'salt')
  assert.equal(overview.recentActivities[0].type, 'step-completed')

  // 3. Experiment completed (all 9 steps validated)
  const completedChanged = recordSimulationMilestoneProgress({
    experimentId: 'exp-salt-water-001',
    definitionVersion: '1.0.0',
    resetRevision: 0,
    safetyAcknowledged: true,
    stepIndex: 9,
    currentStepId: 'review',
    totalSteps: 9,
    completed: true,
    occurredAt: '2026-03-01T10:08:00.000Z',
  })
  assert.equal(completedChanged, true)
  assert.equal(storage.stats.setCount, 3)

  overview = getStudentProgressOverview()
  assert.equal(overview.startedCount, 0)
  assert.equal(overview.completedCount, 1)
  assert.equal(overview.completedExperimentItems.length, 1)
  assert.equal(overview.completedExperimentItems[0].progress.experimentCompleted, true)
  assert.equal(overview.completedExperimentItems[0].progress.completedStepCount, 9)
  assert.equal(
    overview.completedExperimentItems[0].progress.experimentCompletedAt,
    '2026-03-01T10:08:00.000Z',
  )
  assert.equal(overview.recentActivities[0].type, 'experiment-completed')

  // 4. Experiment reset
  const resetChanged = recordSimulationMilestoneProgress(
    {
      experimentId: 'exp-salt-water-001',
      definitionVersion: '1.0.0',
      resetRevision: 1,
      safetyAcknowledged: false,
      stepIndex: 0,
      currentStepId: 'prepare',
      totalSteps: 9,
      completed: false,
      occurredAt: '2026-03-01T10:10:00.000Z',
    },
    { isResetEvent: true },
  )
  assert.equal(resetChanged, true)
  assert.equal(storage.stats.setCount, 4)

  overview = getStudentProgressOverview()
  assert.equal(overview.startedCount, 0)
  assert.equal(overview.completedCount, 0)
  assert.equal(overview.recentActivities[0].type, 'experiment-restarted')
})

test('live simulation store subscription records validated steps and ignores unstarted state', () => {
  const storage = createMemoryStorageAdapter()
  const repo = createLocalProgressRepository({ storage })

  useSaltSimulationStore.getState().reset()
  useLabSceneStore.getState().resetEquipment()
  configureStudentProgressRepository(repo)

  assert.equal(getStudentProgressOverview().startedCount, 0)

  // Acknowledge safety in the live 3D simulation store
  const ackOk = useSaltSimulationStore.getState().emit({
    type: 'SAFETY_ACKNOWLEDGED',
    ppeIds: ['safety-goggles', 'lab-coat', 'nitrile-gloves'],
  })
  assert.equal(ackOk, true)

  let overview = getStudentProgressOverview()
  assert.equal(overview.startedCount, 1)
  const activeSaltItem = overview.continueLearningItems[0]
  assert.ok(activeSaltItem)
  assert.equal(activeSaltItem.resumeMode, 'continue-live-session')
  assert.equal(activeSaltItem.primaryActionLabel, 'Continue')

  // Simulate a page refresh where localStorage has the in-progress record,
  // but the in-memory 3D simulation store is reset to initial state
  const savedJson = storage.rawValue
  assert.ok(savedJson)
  useSaltSimulationStore.getState().reset()

  const postRefreshStorage = createMemoryStorageAdapter(savedJson)
  const postRefreshRepo = createLocalProgressRepository({ storage: postRefreshStorage })
  overview = configureStudentProgressRepository(postRefreshRepo)

  assert.equal(overview.startedCount, 1)
  const postRefreshSaltItem = overview.continueLearningItems[0]
  assert.ok(postRefreshSaltItem)
  assert.equal(postRefreshSaltItem.resumeMode, 'restart-required')
  assert.equal(postRefreshSaltItem.primaryActionLabel, 'Restart Experiment')
})

test('quiz result tracking and persistence across reloads', () => {
  const storage = createMemoryStorageAdapter()
  const repo = createLocalProgressRepository({ storage })
  configureStudentProgressRepository(repo)

  const answers = {
    'q-salt-001-cylinder-purpose': 'opt-salt-001-measure-water',
    'q-salt-002-meniscus-reading': 'opt-salt-002-eye-level-meniscus',
    'q-salt-003-weighing-salt': 'opt-salt-003-spatula-and-boat',
    'q-salt-004-stirring-rod-function': 'opt-salt-004-circulate-and-dissolve',
    'q-salt-005-what-happens-when-dissolved': 'opt-salt-005-ions-disperse',
    'q-salt-006-physical-not-chemical': 'opt-salt-006-no-physical-process',
  }
  const outcome = gradeAssessment(saltDissolutionAssessment, answers, {
    attemptId: 'attempt-progress-001',
    submittedAt: '2026-03-01T12:00:00.000Z',
  })
  assert.equal(outcome.ok, true)
  const resultRecord = outcome.result

  // Calling setLatestAssessmentResult automatically updates studentProgressStore
  setLatestAssessmentResult('exp-salt-water-001', resultRecord)

  let overview = getStudentProgressOverview()
  assert.equal(overview.quizCompletedCount, 1)
  assert.equal(overview.quizResultItems.length, 1)
  const quizSummary = overview.quizResultItems[0].progress.latestQuizResult
  assert.ok(quizSummary)
  assert.equal(quizSummary.attemptId, 'attempt-progress-001')
  assert.equal(quizSummary.score, 6)
  assert.equal(quizSummary.maxScore, 6)
  assert.equal(quizSummary.percentage, 100)
  assert.equal(quizSummary.correctCount, 6)
  assert.equal(quizSummary.totalQuestions, 6)
  assert.equal(quizSummary.submittedAt, '2026-03-01T12:00:00.000Z')
  assert.equal(overview.recentActivities[0].type, 'quiz-submitted')

  // Duplicate submission with the same attemptId does not duplicate activity or rewrite storage
  const writesBeforeDuplicate = storage.stats.setCount
  const duplicateChanged = recordQuizResultProgress(resultRecord)
  assert.equal(duplicateChanged, false)
  assert.equal(storage.stats.setCount, writesBeforeDuplicate)

  // Reload from storage and verify persistence
  const reloadedOverview = reloadStudentProgressFromRepository()
  assert.equal(reloadedOverview.quizCompletedCount, 1)
  assert.equal(
    reloadedOverview.quizResultItems[0].progress.latestQuizResult.attemptId,
    'attempt-progress-001',
  )
})

test('storage validation handles invalid JSON, corrupt records, outdated versions, missing experiments, and forbidden payloads', () => {
  // 1. Invalid JSON
  const invalidJsonStorage = createMemoryStorageAdapter('{not-valid-json')
  const invalidJsonRepo = createLocalProgressRepository({ storage: invalidJsonStorage })
  const invalidLoad = invalidJsonRepo.load()
  assert.equal(invalidLoad.storageHealthy, true)
  assert.equal(invalidLoad.issues[0]?.code, 'INVALID_JSON')
  assert.deepEqual(invalidLoad.envelope.experiments, {})

  // 2. Unsupported schemaVersion
  const wrongSchemaResult = validateStoredProgressEnvelope({
    schemaVersion: 99,
    scope: 'local-device',
    updatedAt: '2026-03-01T10:00:00.000Z',
    experiments: {},
    recentActivities: [],
  })
  assert.equal(wrongSchemaResult.issues[0]?.code, 'UNSUPPORTED_SCHEMA_VERSION')

  // 3. Forbidden payload (Three.js mesh / credential keys)
  const forbiddenResult = validateStoredProgressEnvelope({
    schemaVersion: 1,
    scope: 'local-device',
    updatedAt: '2026-03-01T10:00:00.000Z',
    experiments: {
      'exp-salt-water-001': {
        isObject3D: true,
        password: 'secret-value',
      },
    },
    recentActivities: [],
  })
  assert.equal(forbiddenResult.issues[0]?.code, 'FORBIDDEN_PAYLOAD_OBJECT')

  // 4. Missing/unknown experiment ID, outdated definition version, and corrupt experiment record
  const mixedResult = validateStoredProgressEnvelope({
    schemaVersion: 1,
    scope: 'local-device',
    updatedAt: '2026-03-01T10:00:00.000Z',
    experiments: {
      'exp-unknown-999': {
        experimentId: 'exp-unknown-999',
        experimentDefinitionVersion: '1.0.0',
        experimentStatus: 'completed',
        lastActivityAt: '2026-03-01T10:00:00.000Z',
        currentValidatedStepId: 'review',
        currentValidatedStepIndex: 5,
        completedStepCount: 5,
        totalStepCount: 5,
        experimentCompleted: true,
        experimentCompletedAt: '2026-03-01T10:00:00.000Z',
        latestQuizResult: null,
        quizAssessmentVersion: null,
      },
      'exp-salt-water-001': {
        experimentId: 'exp-salt-water-001',
        experimentDefinitionVersion: '0.1.0-outdated',
        experimentStatus: 'in-progress',
        lastActivityAt: '2026-03-01T10:00:00.000Z',
        currentValidatedStepId: 'water',
        currentValidatedStepIndex: 1,
        completedStepCount: 1,
        totalStepCount: 5,
        experimentCompleted: false,
        experimentCompletedAt: null,
        latestQuizResult: null,
        quizAssessmentVersion: null,
      },
    },
    recentActivities: [{ id: 'bad-activity' }],
  })

  const issueCodes = mixedResult.issues.map((issue) => issue.code)
  assert.ok(issueCodes.includes('UNKNOWN_EXPERIMENT_ID'))
  assert.ok(issueCodes.includes('OUTDATED_DEFINITION_VERSION'))
  assert.ok(issueCodes.includes('CORRUPT_ACTIVITY_RECORD'))
  assert.deepEqual(mixedResult.envelope.experiments, {})
  assert.deepEqual(mixedResult.envelope.recentActivities, [])

  // 5. Corrupt step numbers (e.g., completedStepCount > totalStepCount)
  const corruptRecordResult = validateStoredProgressEnvelope({
    schemaVersion: 1,
    scope: 'local-device',
    updatedAt: '2026-03-01T10:00:00.000Z',
    experiments: {
      'exp-salt-water-001': {
        experimentId: 'exp-salt-water-001',
        experimentDefinitionVersion: '1.0.0',
        experimentStatus: 'in-progress',
        lastActivityAt: '2026-03-01T10:00:00.000Z',
        currentValidatedStepId: 'water',
        currentValidatedStepIndex: 99,
        completedStepCount: 99,
        totalStepCount: 9,
        experimentCompleted: false,
        experimentCompletedAt: null,
        latestQuizResult: null,
        quizAssessmentVersion: null,
      },
    },
    recentActivities: [],
  })
  assert.equal(corruptRecordResult.issues[0]?.code, 'CORRUPT_EXPERIMENT_RECORD')
  assert.deepEqual(corruptRecordResult.envelope.experiments, {})
})

test('storage failure handling falls back gracefully to in-memory progress', () => {
  const throwingStorage = {
    getItem() {
      throw new Error('SecurityError: storage disabled')
    },
    setItem() {
      throw new Error('QuotaExceededError: storage full')
    },
    removeItem() {
      throw new Error('SecurityError: storage disabled')
    },
  }

  const repo = createLocalProgressRepository({ storage: throwingStorage })
  const overviewOnLoad = configureStudentProgressRepository(repo)
  assert.equal(overviewOnLoad.storageHealthy, false)

  // Recording milestones still works in session memory without throwing
  const milestoneOk = recordSimulationMilestoneProgress({
    experimentId: 'exp-salt-water-001',
    definitionVersion: '1.0.0',
    resetRevision: 0,
    safetyAcknowledged: true,
    stepIndex: 1,
    currentStepId: 'water',
    totalSteps: 9,
    completed: false,
    occurredAt: '2026-03-01T14:00:00.000Z',
  })
  assert.equal(milestoneOk, true)

  const overviewAfterUpdate = getStudentProgressOverview()
  assert.equal(overviewAfterUpdate.storageHealthy, false)
  assert.equal(overviewAfterUpdate.startedCount, 1)
  assert.equal(overviewAfterUpdate.continueLearningItems[0].progress.completedStepCount, 1)

  clearStudentProgress()
  assert.equal(getStudentProgressOverview().startedCount, 0)
  assert.equal(Object.keys(getStudentProgressEnvelope().experiments).length, 0)
})

test('StudentProgressPage renders required labels, honest resume actions, and navigation context', async () => {
  assert.equal(getActiveNavigationId(routePaths.progress), 'progress')
  assert.equal(getPageContext(routePaths.progress), 'My Progress')

  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const [{ AppRoutes }, progressStoreModule, simStoreModule] = await Promise.all([
      vite.ssrLoadModule('/src/app/routes.tsx'),
      vite.ssrLoadModule('/src/features/progress/state/studentProgressStore.ts'),
      vite.ssrLoadModule('/src/features/simulations/state/useSaltSimulationStore.ts'),
    ])

    const renderProgress = async () =>
      await renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/progress'] },
          React.createElement(AppRoutes),
        ),
      )

    const memoryStorage = createMemoryStorageAdapter()
    const repo = createLocalProgressRepository({ storage: memoryStorage })
    simStoreModule.useSaltSimulationStore.getState().reset()
    progressStoreModule.configureStudentProgressRepository(repo)

    // 1. Empty progress state
    const emptyMarkup = await renderProgress()
    assert.match(emptyMarkup, /My Progress/)
    assert.match(emptyMarkup, /Continue Learning/)
    assert.match(emptyMarkup, /Completed Experiments/)
    assert.match(emptyMarkup, /Quiz Results/)
    assert.match(emptyMarkup, /Not Started/)
    assert.match(emptyMarkup, /Planned \(Not Counted\)/)
    assert.doesNotMatch(emptyMarkup, /<form|type="password"/)

    // 2. Stored in-progress state without live 3D session -> shows "Restart Experiment" honestly
    progressStoreModule.recordSimulationMilestoneProgress({
      experimentId: 'exp-salt-water-001',
      definitionVersion: '1.0.0',
      resetRevision: 0,
      safetyAcknowledged: true,
      stepIndex: 2,
      currentStepId: 'salt',
      totalSteps: 9,
      completed: false,
      occurredAt: '2026-03-01T15:00:00.000Z',
    })
    const savedProgressMarkup = await renderProgress()
    assert.match(savedProgressMarkup, /Validated steps: 2 \/ 9/)
    assert.match(savedProgressMarkup, /Restart Experiment/)

    // 3. Live 3D session active in memory -> shows "Continue"
    simStoreModule.useSaltSimulationStore.getState().emit({
      type: 'SAFETY_ACKNOWLEDGED',
      ppeIds: ['safety-goggles', 'lab-coat', 'nitrile-gloves'],
    })
    const liveSessionMarkup = await renderProgress()
    assert.match(liveSessionMarkup, />Continue</)

    // 4. Completed experiment + quiz result -> shows "Try Again" and quiz score
    const uiOutcome = gradeAssessment(
      saltDissolutionAssessment,
      {
        'q-salt-001-cylinder-purpose': 'opt-salt-001-measure-water',
        'q-salt-002-meniscus-reading': 'opt-salt-002-eye-level-meniscus',
        'q-salt-003-weighing-salt': 'opt-salt-003-spatula-and-boat',
        'q-salt-004-stirring-rod-function': 'opt-salt-004-circulate-and-dissolve',
        'q-salt-005-what-happens-when-dissolved': 'opt-salt-005-ions-disperse',
        'q-salt-006-physical-not-chemical': 'opt-salt-006-no-physical-process',
      },
      {
        attemptId: 'attempt-ui-001',
        submittedAt: '2026-03-01T15:10:00.000Z',
      },
    )
    assert.equal(uiOutcome.ok, true)
    const quizResult = uiOutcome.result
    progressStoreModule.recordSimulationMilestoneProgress({
      experimentId: 'exp-salt-water-001',
      definitionVersion: '1.0.0',
      resetRevision: 0,
      safetyAcknowledged: true,
      stepIndex: 9,
      currentStepId: 'review',
      totalSteps: 9,
      completed: true,
      occurredAt: '2026-03-01T15:05:00.000Z',
    })
    progressStoreModule.recordQuizResultProgress(quizResult)

    const completedMarkup = await renderProgress()
    assert.match(completedMarkup, />Try Again</)
    assert.match(completedMarkup, /100% \(6 \/ 6 Correct\)/)
    assert.match(completedMarkup, /Clear Local Progress/)
  } finally {
    await vite.close()
  }
})

test('pure envelope transition helpers remain deterministic and isolated', () => {
  let envelope = createEmptyProgressEnvelope('2026-03-01T09:00:00.000Z')
  const stepResult = applySimulationMilestoneToEnvelope(envelope, {
    experimentId: 'exp-salt-water-001',
    definitionVersion: '1.0.0',
    resetRevision: 0,
    safetyAcknowledged: true,
    stepIndex: 3,
    currentStepId: 'dissolve',
    totalSteps: 9,
    completed: false,
    occurredAt: '2026-03-01T09:05:00.000Z',
  })
  assert.equal(stepResult.changed, true)
  envelope = stepResult.envelope
  assert.equal(envelope.experiments['exp-salt-water-001'].completedStepCount, 3)

  const pureOutcome = gradeAssessment(
    saltDissolutionAssessment,
    {
      'q-salt-001-cylinder-purpose': 'opt-salt-001-measure-water',
      'q-salt-002-meniscus-reading': 'opt-salt-002-eye-level-meniscus',
      'q-salt-003-weighing-salt': 'opt-salt-003-spatula-and-boat',
    },
    {
      attemptId: 'attempt-pure-001',
      submittedAt: '2026-03-01T09:10:00.000Z',
    },
  )
  assert.equal(pureOutcome.ok, true)
  const quizStep = applyQuizResultToEnvelope(envelope, pureOutcome.result)
  assert.equal(quizStep.changed, true)
  assert.equal(quizStep.envelope.experiments['exp-salt-water-001'].latestQuizResult?.score, 3)
  assert.equal(quizStep.envelope.experiments['exp-salt-water-001'].latestQuizResult?.percentage, 50)
})
