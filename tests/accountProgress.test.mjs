import assert from 'node:assert/strict'
import test from 'node:test'
import { saltDissolutionAssessment } from '../src/features/assessments/data/saltDissolutionAssessment.ts'
import { gradeAssessment } from '../src/features/assessments/lib/assessmentGrading.ts'
import {
  changedProgressRows,
  envelopeFromAccountRows,
  planLocalProgressMigration,
  progressRowFromRecord,
  quizAttemptRowFromResult,
} from '../src/features/progress/lib/accountProgress.ts'
import {
  createLocalProgressRepository,
  STUDENT_PROGRESS_STORAGE_KEY,
} from '../src/features/progress/lib/progressRepository.ts'
import { createEmptyProgressEnvelope } from '../src/features/progress/lib/progressValidation.ts'
import {
  applyQuizResultToEnvelope,
  applySimulationMilestoneToEnvelope,
  clearStudentProgress,
  configureStudentProgressRepository,
  connectStudentProgressAccount,
  disconnectStudentProgressAccount,
  flushStudentProgressSync,
  getStudentProgressOverview,
  PROGRESS_MIGRATION_FLAG_PREFIX,
  progressSyncMessages,
  recordQuizResultProgress,
  recordSimulationMilestoneProgress,
  retryStudentProgressSync,
} from '../src/features/progress/state/studentProgressStore.ts'

const USER = '00000000-0000-4000-8000-000000000481'
const EXP = 'exp-salt-water-001'

function memoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    store,
  }
}

function fakeApi(initial = { progress: [], attempts: [] }) {
  const db = { progress: [...initial.progress], attempts: [...initial.attempts] }
  const calls = { upsert: [], insert: [], fetch: 0 }
  let failWrites = false
  let failFetch = false
  return {
    db,
    calls,
    setFailWrites: (value) => (failWrites = value),
    setFailFetch: (value) => (failFetch = value),
    async fetchAll(userId) {
      calls.fetch++
      if (failFetch) throw new Error('db down')
      return {
        progress: db.progress.filter((r) => r.user_id === userId).map((r) => ({ ...r })),
        attempts: db.attempts.filter((r) => r.user_id === userId).map((r) => ({ ...r })),
      }
    },
    async upsertProgress(rows) {
      if (rows.length === 0) return
      calls.upsert.push(rows)
      if (failWrites) throw new Error('write failed')
      for (const row of rows) {
        const i = db.progress.findIndex(
          (r) => r.user_id === row.user_id && r.experiment_id === row.experiment_id,
        )
        if (i >= 0) db.progress[i] = { ...row }
        else db.progress.push({ ...row })
      }
    },
    async insertAttempts(rows) {
      if (rows.length === 0) return
      calls.insert.push(rows)
      if (failWrites) throw new Error('write failed')
      for (const row of rows)
        if (!db.attempts.some((r) => r.user_id === row.user_id && r.attempt_id === row.attempt_id))
          db.attempts.push({ ...row })
    },
  }
}

const milestone = (overrides) => ({
  experimentId: EXP,
  definitionVersion: '1.0.0',
  resetRevision: 0,
  safetyAcknowledged: true,
  stepIndex: 0,
  currentStepId: 'prepare',
  totalSteps: 9,
  completed: false,
  occurredAt: '2026-03-01T10:00:00.000Z',
  ...overrides,
})

const perfectAnswers = {
  'q-salt-001-cylinder-purpose': 'opt-salt-001-measure-water',
  'q-salt-002-meniscus-reading': 'opt-salt-002-eye-level-meniscus',
  'q-salt-003-weighing-salt': 'opt-salt-003-spatula-and-boat',
  'q-salt-004-stirring-rod-function': 'opt-salt-004-circulate-and-dissolve',
  'q-salt-005-what-happens-when-dissolved': 'opt-salt-005-ions-disperse',
  'q-salt-006-physical-not-chemical': 'opt-salt-006-no-physical-process',
}

function quizResult(attemptId, submittedAt) {
  const outcome = gradeAssessment(saltDissolutionAssessment, perfectAnswers, {
    attemptId,
    submittedAt,
  })
  assert.equal(outcome.ok, true)
  return outcome.result
}

function localEnvelopeWithProgress() {
  let envelope = createEmptyProgressEnvelope()
  envelope = applySimulationMilestoneToEnvelope(envelope, milestone({})).envelope
  envelope = applySimulationMilestoneToEnvelope(
    envelope,
    milestone({
      stepIndex: 3,
      currentStepId: 'measure-water',
      occurredAt: '2026-03-01T10:05:00.000Z',
    }),
  ).envelope
  envelope = applyQuizResultToEnvelope(
    envelope,
    quizResult('attempt-local-1', '2026-03-01T10:10:00.000Z'),
  ).envelope
  return envelope
}

test('rows map to and from envelope records; answers carry choices only', () => {
  const envelope = localEnvelopeWithProgress()
  const record = envelope.experiments[EXP]
  const row = progressRowFromRecord(USER, record)
  assert.equal(row.status, 'in-progress')
  assert.equal(row.completed_step_count, 3)
  assert.equal(row.total_step_count, 9)
  assert.equal(row.lab_completed_at, null)

  const attempt = quizAttemptRowFromResult(USER, quizResult('a-1', '2026-03-02T09:00:00.000Z'))
  assert.deepEqual(attempt.answers, perfectAnswers)
  assert.equal(attempt.score, 6)
  assert.equal(attempt.total, 6)
  assert.doesNotMatch(JSON.stringify(attempt), /correctOptionId|isCorrect|feedback|explanation/i)

  const rebuilt = envelopeFromAccountRows([row], [attempt], { titleOf: () => 'Salt' })
  const back = rebuilt.experiments[EXP]
  assert.equal(back.completedStepCount, 3)
  assert.equal(back.experimentStatus, 'in-progress')
  assert.equal(back.latestQuizResult.attemptId, 'a-1')
  assert.deepEqual(
    progressRowFromRecord(USER, back),
    row,
    'round trip is stable (no spurious writes)',
  )
  assert.ok(rebuilt.recentActivities.some((a) => a.type === 'quiz-submitted'))
})

test('envelope from rows keeps the latest attempt and drops unknown experiments', () => {
  const older = quizAttemptRowFromResult(USER, quizResult('old', '2026-03-01T09:00:00.000Z'))
  const newer = {
    ...older,
    attempt_id: 'new',
    score: 3,
    percentage: 50,
    submitted_at: '2026-03-05T09:00:00.000Z',
  }
  const unknown = { ...older, attempt_id: 'x', experiment_id: 'exp-unknown-999' }
  const envelope = envelopeFromAccountRows([], [older, newer, unknown])
  assert.deepEqual(Object.keys(envelope.experiments), [EXP])
  assert.equal(envelope.experiments[EXP].latestQuizResult.attemptId, 'new')
  assert.equal(envelope.experiments[EXP].experimentStatus, 'not-started')
})

test('migration plan uploads only newer local records and missing attempts', () => {
  const local = localEnvelopeWithProgress()
  const fresh = planLocalProgressMigration(USER, local, [], [])
  assert.equal(fresh.progressRows.length, 1)
  assert.equal(fresh.quizRows.length, 1)
  assert.deepEqual(fresh.quizRows[0].answers, {})

  const remoteNewer = {
    ...fresh.progressRows[0],
    completed_step_count: 9,
    status: 'completed',
    lab_completed_at: '2026-04-01T00:00:00.000Z',
    last_activity_at: '2026-04-01T00:00:00.000Z',
  }
  const plan = planLocalProgressMigration(USER, local, [remoteNewer], fresh.quizRows)
  assert.equal(plan.progressRows.length, 0, 'remote newer wins')
  assert.equal(plan.quizRows.length, 0, 'attempt already in account')

  const synced = new Map([
    [EXP, JSON.stringify(progressRowFromRecord(USER, local.experiments[EXP]))],
  ])
  assert.equal(changedProgressRows(USER, local, synced).length, 0)
  assert.equal(changedProgressRows(USER, local, new Map()).length, 1)
})

test('first sign-in migrates device progress once, clears it from the device, then writes through', async () => {
  const deviceStorage = memoryStorage({
    [STUDENT_PROGRESS_STORAGE_KEY]: JSON.stringify(localEnvelopeWithProgress()),
  })
  configureStudentProgressRepository(createLocalProgressRepository({ storage: deviceStorage }))
  assert.equal(getStudentProgressOverview().source, 'device')
  assert.equal(getStudentProgressOverview().startedCount, 1)

  const api = fakeApi()
  await connectStudentProgressAccount(USER, api, { storage: deviceStorage })
  let overview = getStudentProgressOverview()
  assert.equal(overview.source, 'account')
  assert.equal(overview.syncStatus, 'idle')
  assert.equal(overview.syncMessage, progressSyncMessages.migrated)
  assert.equal(overview.startedCount, 1)
  assert.equal(overview.quizCompletedCount, 1)
  assert.equal(api.db.progress.length, 1)
  assert.equal(api.db.attempts.length, 1)
  assert.equal(deviceStorage.store.get(PROGRESS_MIGRATION_FLAG_PREFIX + USER), 'done')
  assert.equal(deviceStorage.store.has(STUDENT_PROGRESS_STORAGE_KEY), false, 'device copy removed')

  // Lab step in account mode → upsert only that experiment; device storage untouched.
  recordSimulationMilestoneProgress(
    milestone({ stepIndex: 5, currentStepId: 'add-salt', occurredAt: '2026-03-01T10:20:00.000Z' }),
  )
  await flushStudentProgressSync()
  assert.equal(api.db.progress[0].completed_step_count, 5)
  assert.equal(deviceStorage.store.has(STUDENT_PROGRESS_STORAGE_KEY), false)

  // Quiz in account mode → full attempt with answers.
  recordQuizResultProgress(quizResult('attempt-acct-2', '2026-03-01T11:00:00.000Z'))
  await flushStudentProgressSync()
  const stored = api.db.attempts.find((a) => a.attempt_id === 'attempt-acct-2')
  assert.deepEqual(stored.answers, perfectAnswers)

  // Clearing is disabled for account data.
  clearStudentProgress()
  assert.equal(getStudentProgressOverview().startedCount, 1)

  // Sign out → device mode, empty device; sign back in → no second migration, data from account.
  disconnectStudentProgressAccount({ storage: deviceStorage })
  overview = getStudentProgressOverview()
  assert.equal(overview.source, 'device')
  assert.equal(overview.startedCount, 0)
  const fetchesBefore = api.calls.fetch
  const upsertsBefore = api.calls.upsert.length
  await connectStudentProgressAccount(USER, api, { storage: deviceStorage })
  overview = getStudentProgressOverview()
  assert.equal(overview.source, 'account')
  assert.equal(overview.syncMessage, null)
  assert.equal(overview.items.find((i) => i.experiment.id === EXP).progress.completedStepCount, 5)
  assert.equal(overview.quizResultItems[0].progress.latestQuizResult.attemptId, 'attempt-acct-2')
  assert.equal(api.calls.fetch, fetchesBefore + 1)
  assert.equal(api.calls.upsert.length, upsertsBefore, 'no re-migration')
  disconnectStudentProgressAccount({ storage: deviceStorage })
})

test('another account on the same device never inherits migrated progress', async () => {
  const deviceStorage = memoryStorage({
    [STUDENT_PROGRESS_STORAGE_KEY]: JSON.stringify(localEnvelopeWithProgress()),
  })
  configureStudentProgressRepository(createLocalProgressRepository({ storage: deviceStorage }))
  const api = fakeApi()
  await connectStudentProgressAccount(USER, api, { storage: deviceStorage })
  disconnectStudentProgressAccount({ storage: deviceStorage })
  const other = '00000000-0000-4000-8000-000000000482'
  await connectStudentProgressAccount(other, api, { storage: deviceStorage })
  assert.equal(getStudentProgressOverview().startedCount, 0)
  assert.equal(api.db.progress.filter((r) => r.user_id === other).length, 0)
  disconnectStudentProgressAccount({ storage: deviceStorage })
})

test('write failures show an error, keep data dirty and succeed on retry', async () => {
  configureStudentProgressRepository(createLocalProgressRepository({ storage: memoryStorage() }))
  const api = fakeApi()
  await connectStudentProgressAccount(USER, api, { storage: memoryStorage() })
  api.setFailWrites(true)
  recordSimulationMilestoneProgress(milestone({ occurredAt: '2026-03-02T10:00:00.000Z' }))
  recordQuizResultProgress(quizResult('attempt-retry', '2026-03-02T10:30:00.000Z'))
  await flushStudentProgressSync()
  let overview = getStudentProgressOverview()
  assert.equal(overview.syncStatus, 'error')
  assert.equal(overview.syncMessage, progressSyncMessages.saveFailed)
  assert.equal(api.db.progress.length, 0)

  api.setFailWrites(false)
  await retryStudentProgressSync()
  overview = getStudentProgressOverview()
  assert.equal(overview.syncStatus, 'idle')
  assert.equal(overview.syncMessage, null)
  assert.equal(api.db.progress.length, 1)
  assert.equal(api.db.attempts.length, 1)
  disconnectStudentProgressAccount({ storage: memoryStorage() })
})

test('load failure falls back to device progress with a message', async () => {
  const deviceStorage = memoryStorage({
    [STUDENT_PROGRESS_STORAGE_KEY]: JSON.stringify(localEnvelopeWithProgress()),
  })
  configureStudentProgressRepository(createLocalProgressRepository({ storage: deviceStorage }))
  const api = fakeApi()
  api.setFailFetch(true)
  await connectStudentProgressAccount(USER, api, { storage: deviceStorage })
  const overview = getStudentProgressOverview()
  assert.equal(overview.source, 'device')
  assert.equal(overview.syncStatus, 'error')
  assert.equal(overview.syncMessage, progressSyncMessages.loadFailed)
  assert.equal(overview.startedCount, 1, 'device progress still visible')
  assert.equal(deviceStorage.store.has(STUDENT_PROGRESS_STORAGE_KEY), true, 'nothing removed')
  disconnectStudentProgressAccount({ storage: deviceStorage })
  assert.equal(getStudentProgressOverview().syncStatus, 'idle')
})
