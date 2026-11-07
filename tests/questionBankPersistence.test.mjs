import assert from 'node:assert/strict'
import test from 'node:test'
import { getPermissionsForRole } from '../src/features/auth/permissions.ts'
import { createInitialAdminQuestionBankState } from '../src/features/assessments/lib/questionBankManagement.ts'
import {
  createQuestionBankRepository,
  getActiveManagedQuestionBankState,
  setActiveManagedQuestionBankState,
} from '../src/features/assessments/lib/questionBankRepository.ts'

const admin = {
  status: 'authenticated',
  role: 'admin',
  roleStatus: 'verified',
  permissions: getPermissionsForRole('admin', 'verified'),
}
const success = { data: { id: 'confirmed' }, error: null }
const denied = { data: null, error: { code: '42501', message: 'private database detail' } }

function clientWith(resolve) {
  return {
    from(table) {
      function query(operation) {
        const run = () => Promise.resolve().then(() => resolve(table, operation))
        return {
          then: (yes, no) => run().then(yes, no),
          eq: () => query(operation),
          select: () => ({ single: run }),
          order: run,
        }
      }
      return {
        select: () => query('read'),
        insert: () => query('insert'),
        update: () => query('update'),
      }
    },
  }
}

test('database load failures are errors; an empty database remains empty', async () => {
  const previous = createInitialAdminQuestionBankState()
  setActiveManagedQuestionBankState(previous)
  for (const fail of [
    () => denied,
    () => {
      throw new Error('network')
    },
  ]) {
    const result = await createQuestionBankRepository(clientWith(fail)).loadAdminState(admin)
    assert.equal(result.ok, false)
    assert.equal(getActiveManagedQuestionBankState(), previous)
  }
  const empty = await createQuestionBankRepository(
    clientWith(() => ({ data: [], error: null })),
  ).loadAdminState(admin)
  assert.equal(empty.ok, true)
  assert.deepEqual(empty.data.assessments, [])
})

test('all admin question-bank mutations reject denied, missing-row, and network writes', async () => {
  const state = createInitialAdminQuestionBankState()
  const record = state.assessments.find((item) => item.assessment.questions.length > 1)
  assert.ok(record)
  const question = record.assessment.questions[0]
  const input = { ...question, prompt: `${question.prompt} Updated` }
  const operations = [
    (repo) =>
      repo.createAssessment(
        state,
        {
          id: 'qa-new-assessment',
          experimentId: 'exp-volume-002',
          title: 'QA draft',
          description: 'Persistence check.',
        },
        admin,
      ),
    (repo) =>
      repo.updateAssessmentMetadata(
        state,
        { assessmentId: record.id, title: 'Updated title' },
        admin,
      ),
    (repo) =>
      repo.addQuestion(
        state,
        record.id,
        {
          ...input,
          id: 'qa-new-question',
          options: input.options.map((option, i) => ({ ...option, id: `qa-option-${i}` })),
          correctOptionId: 'qa-option-0',
        },
        admin,
      ),
    (repo) => repo.updateQuestion(state, record.id, question.id, input, admin),
    (repo) => repo.reorderQuestion(state, record.id, question.id, 'down', admin),
    (repo) => repo.setPublicationStatus(state, record.id, 'archived', admin),
  ]
  for (const failure of [
    () => denied,
    () => ({ data: null, error: null }),
    () => {
      throw new Error('network')
    },
  ]) {
    for (const mutate of operations) {
      setActiveManagedQuestionBankState(state)
      const result = await mutate(createQuestionBankRepository(clientWith(failure)))
      assert.equal(result.ok, false)
      assert.match(result.message, /Reload/)
      assert.doesNotMatch(result.message, /private database detail/)
      assert.equal(getActiveManagedQuestionBankState(), state)
    }
  }
})

test('confirmed writes update local data; failed version snapshots cannot claim success', async () => {
  const state = createInitialAdminQuestionBankState()
  const record = state.assessments.find((item) => item.publicationStatus === 'published')
  assert.ok(record)
  for (const snapshotError of [null, { code: '23505' }, { code: '42501' }]) {
    setActiveManagedQuestionBankState(state)
    const repo = createQuestionBankRepository(
      clientWith((table) =>
        table === 'assessment_version_snapshots' ? { data: null, error: snapshotError } : success,
      ),
    )
    const result = await repo.updateAssessmentMetadata(
      state,
      { assessmentId: record.id, title: 'New title' },
      admin,
    )
    assert.equal(result.ok, snapshotError?.code !== '42501')
    assert.equal(getActiveManagedQuestionBankState() === state, snapshotError?.code === '42501')
  }
})

test('a later write failure does not publish a partly saved assessment locally', async () => {
  const state = createInitialAdminQuestionBankState()
  const record = state.assessments.find((item) => item.assessment.questions.length)
  setActiveManagedQuestionBankState(state)
  const repo = createQuestionBankRepository(
    clientWith((table) => (table === 'assessment_questions' ? success : denied)),
  )
  const result = await repo.addQuestion(
    state,
    record.id,
    {
      ...record.assessment.questions[0],
      id: 'qa-partial-question',
      options: [
        { id: 'qa-p-a', text: 'First', order: 1 },
        { id: 'qa-p-b', text: 'Second', order: 2 },
      ],
      correctOptionId: 'qa-p-a',
    },
    admin,
  )
  assert.equal(result.ok, false)
  assert.equal(getActiveManagedQuestionBankState(), state)
})
