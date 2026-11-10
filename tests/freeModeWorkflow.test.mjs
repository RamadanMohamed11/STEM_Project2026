import assert from 'node:assert/strict'
import test, { afterEach, beforeEach } from 'node:test'
import { saltExperimentDefinition as definition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import { useSaltSimulationStore as salt } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import { useLabSafetyStore as safety } from '../src/features/simulations/state/useLabSafetyStore.ts'
import { useLabSceneStore as scene } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useLabReadinessStore as readiness } from '../src/features/safety/state/useLabReadinessStore.ts'
import {
  useBenchLiquidsStore as bench,
  benchVolumeMl,
} from '../src/features/simulations/state/useBenchLiquidsStore.ts'
import { useMeasurementLogStore as log } from '../src/features/simulations/state/useMeasurementLogStore.ts'
import {
  acknowledgeLabSafety,
  handlePhysicalInteraction,
  inspectFinalSolution,
} from '../src/features/simulations/state/directInteractions.ts'
import {
  restartExperimentSession,
  suspendLaboratoryInteractions,
} from '../src/features/simulations/state/sessionActions.ts'
import {
  resolvePairInteractions,
  validateTransferRequest,
} from '../src/features/simulations/engine/materialTransfers.ts'

const state = salt.getState
let sequence = 0
const request = (
  sourceId = 'water',
  targetId = 'graduated-cylinder',
  amount = 100,
  materialId = 'water',
) => ({
  requestId: `free-mode-${++sequence}`,
  sourceId,
  targetId,
  amount,
  materialId,
  unit: materialId === 'water' ? 'mL' : 'g',
})
function drain() {
  for (let i = 0; state().transfer && i < 200; i++) state().advanceTransfer(250)
  assert.equal(state().transfer, null)
}
function transfer(payload = request()) {
  const result = state().beginTransfer(payload)
  assert.equal(result.ok, true, result.message)
  drain()
}
function prepare() {
  assert.equal(acknowledgeLabSafety(), true)
  assert.equal(state().workflow.stepIndex, 2)
}
function command(value) {
  assert.equal(state().execute(value), true, state().feedback?.message)
  if (state().effect) state().stopEffect(state().effect.id)
}
beforeEach(() => {
  safety.getState().setMode('guided')
  restartExperimentSession()
  bench.getState().reset()
  scene.setState({ placedIds: [...definition.availableInventory] })
})
afterEach(() => {
  safety.getState().setMode('guided')
  restartExperimentSession()
  bench.getState().reset()
})

test('Free mode rejects every workflow dispatch and semantic event without changing validation, evidence or measurements', () => {
  prepare()
  const saved = state().workflow,
    validation = state().validation,
    events = state().events
  safety.getState().setMode('free')
  for (const action of [
    { kind: 'acknowledge-safety' },
    { kind: 'validate-step' },
    { kind: 'record-water-measurement', valueMl: 100 },
    { kind: 'record-salt-measurement', selectedMassG: 5 },
    { kind: 'record-observation', observation: 'no-visible-solid' },
    { kind: 'finish-review' },
  ])
    assert.equal(state().dispatch(action), false)
  for (const event of [
    { type: 'SAFETY_ACKNOWLEDGED' },
    { type: 'EQUIPMENT_PLACEMENT_VALIDATED', equipmentId: 'beaker' },
    {
      type: 'LIQUID_TRANSFER_COMPLETED',
      sourceId: 'water',
      targetId: 'graduated-cylinder',
      quantity: { value: 100, unit: 'mL' },
      totalVolumeMl: 100,
    },
    {
      type: 'MASS_MEASUREMENT_RECORDED',
      sourceId: 'weighing-boat',
      targetId: 'digital-balance',
      substance: 'NaCl',
      quantity: { value: 5, unit: 'g' },
    },
    { type: 'OBSERVATION_RECORDED', observation: 'no-visible-solid' },
    { type: 'REVIEW_INSPECTED' },
  ])
    assert.equal(state().emit(event), false)
  assert.equal(acknowledgeLabSafety(), false)
  assert.strictEqual(state().workflow, saved)
  assert.strictEqual(state().validation, validation)
  assert.strictEqual(state().events, events)
})

test('Free-mode chemistry can perform the whole salt activity without completing or measuring any guided step', () => {
  prepare()
  const saved = state().workflow,
    validation = state().validation,
    events = state().events
  safety.getState().setMode('free')
  command({ kind: 'pour', source: 'water', target: 'graduated-cylinder', amountMl: 100 })
  command({ kind: 'pour', source: 'graduated-cylinder', target: 'beaker', amountMl: 100 })
  command({ kind: 'scoop-salt', source: 'sodium-chloride', tool: 'spatula', massG: 5 })
  command({ kind: 'deposit-salt', tool: 'spatula', target: 'weighing-boat', massG: 5 })
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    true,
  )
  assert.equal(scene.getState().relationships['weighing-boat'].targetId, 'digital-balance')
  assert.equal(
    handlePhysicalInteraction({ actorId: 'weighing-boat', targetId: 'beaker', gesture: 'tilt' }),
    true,
  )
  if (state().effect) state().stopEffect(state().effect.id)
  command({ kind: 'stir', tool: 'stirring-rod', target: 'beaker', elapsedMs: 1500 })
  command({ kind: 'stir', tool: 'stirring-rod', target: 'beaker', elapsedMs: 1500 })
  assert.equal(state().experiment.dissolvedSaltG, 5)
  assert.equal(inspectFinalSolution('beaker'), false)
  assert.strictEqual(state().workflow, saved)
  assert.strictEqual(state().validation, validation)
  assert.strictEqual(state().events, events)
  assert.equal(state().workflow.completed, false)
  assert.deepEqual(state().workflow.measurements, { waterMl: null, saltG: null })
})

test('Free mode removes guided prerequisites from physical transfer previews and authority, preserving quantities and capacity checks', () => {
  safety.getState().setMode('free')
  const saved = state().workflow,
    validation = state().validation
  const payload = request()
  assert.equal(
    validateTransferRequest(payload, state().experiment, saved, scene.getState().placedIds).ok,
    false,
  )
  assert.equal(
    validateTransferRequest(payload, state().experiment, saved, scene.getState().placedIds, false)
      .ok,
    true,
  )
  assert.ok(
    resolvePairInteractions(
      ['water', 'graduated-cylinder'],
      state().experiment,
      saved,
      scene.getState().placedIds,
      false,
    ).some((entry) => entry.enabled),
  )
  assert.equal(state().beginTransfer({ ...payload, amount: 101 }).ok, false, 'no overflow/clamping')
  transfer(payload)
  transfer(request('graduated-cylinder', 'beaker'))
  transfer(request('sodium-chloride', 'spatula', 5, 'NaCl'))
  transfer(request('spatula', 'weighing-boat', 5, 'NaCl'))
  transfer(request('weighing-boat', 'beaker', 5, 'NaCl'))
  assert.equal(state().experiment.waterMl.beaker, 100)
  assert.equal(state().experiment.saltInBeakerG, 5)
  assert.equal(
    Object.values(state().experiment.waterMl).reduce((a, b) => a + b, 0),
    400,
  )
  assert.strictEqual(state().workflow, saved)
  assert.strictEqual(state().validation, validation)
  assert.deepEqual(state().events, [])
})

test('real held stream ticks move water in Free mode without validating or recording the guided measurement', () => {
  const saved = state().workflow,
    validation = state().validation
  safety.getState().setMode('free')
  for (let i = 0; i < 40; i++) state().streamTick('water', 'graduated-cylinder', 0.9, 100)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 100)
  state().stopStream()
  assert.strictEqual(state().workflow, saved)
  assert.strictEqual(state().validation, validation)
  assert.equal(saved.stepIndex, 0)
  assert.equal(state().events.length, 0)
})

test('unchanged Free → Guided resumes exactly where Guided stopped and still needs real new evidence', () => {
  prepare()
  const saved = state().workflow
  safety.getState().setMode('free')
  suspendLaboratoryInteractions()
  safety.getState().setMode('guided')
  assert.strictEqual(state().workflow, saved)
  assert.equal(state().guidedResumeIssue, null)
  transfer()
  assert.equal(state().workflow.stepIndex, 3)
  assert.equal(state().workflow.measurements.waterMl, 100)
})

test('changed Free-mode quantities block Guided catch-up, preserve saved progress and recover only with an explicit reset', () => {
  prepare()
  const saved = state().workflow
  safety.getState().setMode('free')
  transfer()
  safety.getState().setMode('guided')
  assert.match(state().guidedResumeIssue, /bench changed in Free mode/i)
  assert.strictEqual(state().workflow, saved)
  assert.equal(state().dispatch({ kind: 'record-water-measurement', valueMl: 100 }), false)
  assert.equal(state().emit({ type: 'REVIEW_INSPECTED' }), false)
  assert.equal(
    state().execute({ kind: 'scoop-salt', source: 'sodium-chloride', tool: 'spatula', massG: 5 }),
    false,
  )
  assert.equal(state().beginTransfer(request('graduated-cylinder', 'beaker')).ok, false)
  suspendLaboratoryInteractions()
  safety.getState().setMode('free')
  safety.getState().setMode('guided')
  assert.ok(state().guidedResumeIssue, 'mode toggles/navigation cannot clear the conflict')
  assert.strictEqual(state().workflow, saved)
  const revision = state().resetRevision
  restartExperimentSession()
  assert.equal(state().guidedResumeIssue, null)
  assert.equal(state().workflow.stepIndex, 0)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 0)
  assert.equal(state().resetRevision, revision + 1)
})

test('only removing equipment needed by the saved step requires a Guided reset; unrelated layout changes resume normally', () => {
  prepare()
  const saved = state().workflow
  safety.getState().setMode('free')
  scene.setState({ placedIds: [...scene.getState().placedIds, 'beaker-100'] })
  safety.getState().setMode('guided')
  assert.equal(state().guidedResumeIssue, null)
  safety.getState().setMode('free')
  scene.setState({ placedIds: scene.getState().placedIds.filter((id) => id !== 'stirring-rod') })
  safety.getState().setMode('guided')
  assert.equal(state().guidedResumeIssue, null, 'the rod is not needed for water measurement')
  safety.getState().setMode('free')
  scene.setState({
    placedIds: scene.getState().placedIds.filter((id) => id !== 'graduated-cylinder'),
  })
  safety.getState().setMode('guided')
  assert.ok(state().guidedResumeIssue)
  assert.strictEqual(state().workflow, saved)
})

test('mode switches cancel in-flight transfers into safe return with no deferred guided receipt or auto-completion', () => {
  prepare()
  assert.equal(state().beginTransfer(request()).ok, true)
  for (let i = 0; i < 5; i++) state().advanceTransfer(250)
  const saved = state().workflow,
    delivered = state().experiment.waterMl['graduated-cylinder']
  assert.ok(delivered > 0 && delivered < 100)
  safety.getState().setMode('free')
  assert.equal(state().transfer.cancelled, true)
  safety.getState().setMode('guided')
  assert.equal(state().guidedResumeIssue, null, 'only safe return happened across the boundary')
  drain()
  assert.equal(state().experiment.waterMl['graduated-cylinder'], delivered)
  assert.strictEqual(state().workflow, saved)
  assert.equal(state().workflow.measurements.waterMl, null)
  transfer(request('water', 'graduated-cylinder', 100 - delivered))
  assert.equal(state().workflow.stepIndex, 3)
})

test('a Free-started transfer cannot finish the current Guided step after switching modes', () => {
  prepare()
  const saved = state().workflow
  safety.getState().setMode('free')
  assert.equal(state().beginTransfer(request()).ok, true)
  for (let i = 0; i < 5; i++) state().advanceTransfer(250)
  const delivered = state().experiment.waterMl['graduated-cylinder']
  safety.getState().setMode('guided')
  assert.ok(state().guidedResumeIssue)
  drain()
  assert.strictEqual(state().workflow, saved)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], delivered)
  assert.equal(state().workflow.measurements.waterMl, null)
})

test('switching modes after flow reaches its goal but before the receipt offers reset instead of silently completing or trapping the saved step', () => {
  prepare()
  assert.equal(state().beginTransfer(request()).ok, true)
  while (state().transfer.transferred < 100) state().advanceTransfer(250)
  assert.ok(state().transfer, 'the source is still returning safely')
  const saved = state().workflow
  safety.getState().setMode('free')
  drain()
  safety.getState().setMode('guided')
  assert.match(state().guidedResumeIssue, /transfer stopped before its guided result was recorded/i)
  assert.strictEqual(state().workflow, saved)
  assert.equal(state().workflow.measurements.waterMl, null)
  assert.equal(state().workflow.stepIndex, 2)
  restartExperimentSession()
  assert.equal(state().guidedResumeIssue, null)
})

test('practice pouring, heating, safety alerts and measurements remain independent of the paused workflow', () => {
  prepare()
  safety.getState().setMode('free')
  const saved = state().workflow
  readiness.getState().setGoggles(false)
  log.getState().begin(definition.experimentId, 0)
  const rig = {
    'bunsen-burner': { kind: 'snapped', actorId: 'bunsen-burner', targetId: 'tripod' },
    'beaker-100': { kind: 'snapped', actorId: 'beaker-100', targetId: 'tripod' },
  }
  bench
    .getState()
    .sync([
      'wash-bottle',
      'hydrochloric-acid',
      'test-tube',
      'beaker-100',
      'tripod',
      'bunsen-burner',
    ])
  assert.equal(bench.getState().pourAmount('hydrochloric-acid', 'test-tube', 1), true)
  for (let i = 0; bench.getState().pour && i < 500; i++) bench.getState().tick(33)
  assert.ok(benchVolumeMl(bench.getState(), 'test-tube') > 0)
  assert.ok(safety.getState().mistakes.some((entry) => entry.kind === 'safety'))
  assert.equal(bench.getState().setLit('bunsen-burner', true, rig), true)
  bench.getState().react(250, rig)
  assert.ok(bench.getState().lab.containers['beaker-100'].temperatureC > 20)
  const temperature = bench.getState().lab.containers['beaker-100'].temperatureC
  const row = log.getState().record(
    {
      instrument: 'thermometer',
      quantity: 'temperature',
      targetId: 'beaker-100',
      targetLabel: 'Beaker',
      value: temperature,
    },
    1000,
  )
  assert.equal(row.timeS, 1)
  assert.equal(log.getState().rows.length, 1)
  assert.strictEqual(state().workflow, saved)
  assert.equal(log.getState().experimentId, definition.experimentId)
  safety.getState().setMode('guided')
  assert.equal(state().guidedResumeIssue, null)
  assert.strictEqual(state().workflow, saved)
})

test('invalid and busy Free-mode scientific actions never replace guided validation or record step mistakes', () => {
  prepare()
  const saved = state().workflow,
    validation = state().validation
  safety.getState().setMode('free')
  assert.equal(
    state().execute({ kind: 'pour', source: 'water', target: 'graduated-cylinder', amountMl: 500 }),
    false,
  )
  assert.equal(state().beginTransfer(request()).ok, true)
  assert.equal(
    state().execute({ kind: 'scoop-salt', source: 'sodium-chloride', tool: 'spatula', massG: 5 }),
    false,
  )
  assert.strictEqual(state().workflow, saved)
  assert.strictEqual(state().validation, validation)
  assert.ok(!safety.getState().mistakes.some((entry) => entry.kind === 'step'))
  drain()
  assert.strictEqual(state().workflow, saved)
})
