import assert from 'node:assert/strict'
import test from 'node:test'
import { saltExperimentDefinition as definition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import { useSaltSimulationStore as store } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import { useLabSceneStore as lab } from '../src/features/simulations/state/useLabSceneStore.ts'
import {
  acknowledgeLabSafety,
  handlePhysicalInteraction,
  inspectFinalSolution,
} from '../src/features/simulations/state/directInteractions.ts'
import {
  quantityUnits,
  resolvePairInteractions,
} from '../src/features/simulations/engine/materialTransfers.ts'

let requestSequence = 0
const bench = definition.availableInventory
const state = () => store.getState()
const request = (
  sourceId = 'water',
  targetId = 'graduated-cylinder',
  amount = 100,
  unit = 'mL',
  materialId = 'water',
) => ({
  requestId: `store-request-${++requestSequence}`,
  sourceId,
  targetId,
  materialId,
  amount,
  unit,
})
const scoop = (amount, unit = 'g') => request('sodium-chloride', 'spatula', amount, unit, 'NaCl')
const deposit = (amount, unit = 'g') => request('spatula', 'weighing-boat', amount, unit, 'NaCl')
const add = (amount, unit = 'g') => request('weighing-boat', 'beaker', amount, unit, 'NaCl')

function prepare() {
  lab.getState().resetEquipment()
  state().reset()
  lab.setState({ placedIds: [...bench] })
  assert.equal(acknowledgeLabSafety(), true)
  assert.equal(state().workflow.stepIndex, 2)
}
function start(payload) {
  const result = state().beginTransfer(payload)
  assert.equal(result.ok, true, result.message)
  assert.ok(state().transfer)
  return state().transfer
}
function complete(payload, tick = 100000) {
  const operation = start(payload)
  for (let i = 0; state().transfer && i < 10000; i++) {
    state().advanceTransfer(tick, operation.operationId)
    assertConserved()
  }
  assert.equal(state().transfer, null)
  assert.equal(state().feedback.ok, true, state().feedback.message)
  return operation
}
function prepareSalt() {
  prepare()
  complete(request())
  complete(request('graduated-cylinder', 'beaker'))
  assert.equal(state().workflow.stepIndex, 4)
}
function measuredBoat() {
  prepareSalt()
  complete(scoop(1.234))
  complete(deposit(0.234))
  complete(deposit(1))
  complete(scoop(3766, 'mg'))
  complete(deposit(3.766))
  assert.equal(state().experiment.saltOnBoatG, 5)
  assert.equal(state().workflow.stepIndex, 4)
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    true,
  )
  assert.equal(state().workflow.stepIndex, 5)
}
function assertConserved() {
  const s = state()
  assert.deepEqual(s.workflow.chemistryCheckpoint, s.experiment)
  assert.equal(
    Object.values(s.experiment.waterMl).reduce((sum, n) => sum + quantityUnits(n, 'water'), 0),
    4000,
  )
  assert.equal(
    [
      s.experiment.saltStockG,
      s.experiment.saltOnSpatulaG,
      s.experiment.saltOnBoatG,
      s.experiment.saltInBeakerG,
    ].reduce((sum, n) => sum + quantityUnits(n, 'NaCl'), 0),
    100000,
  )
  assert.ok(s.experiment.waterMl['graduated-cylinder'] <= 100)
}

test('begin revalidates safety, workflow, units, precision, apparatus and current busy state without clamping', () => {
  prepare()
  for (const invalid of [
    request('water', 'graduated-cylinder', 100.1),
    request('water', 'graduated-cylinder', 0.01),
    request('water', 'graduated-cylinder', 1, 'mg'),
    request('water', 'beaker', 10),
    scoop(1),
    { ...request(), requestId: '' },
    null,
  ]) {
    const before = structuredClone(state().experiment)
    assert.equal(state().beginTransfer(invalid).ok, false)
    assert.equal(state().transfer, null)
    assert.deepEqual(state().experiment, before)
  }
  lab.setState({ placedIds: bench.filter((id) => id !== 'graduated-cylinder') })
  assert.equal(state().beginTransfer(request()).ok, false)
  lab.setState({ placedIds: [...bench], draggingId: 'water' })
  assert.equal(state().beginTransfer(request()).ok, false)
  lab.setState({
    draggingId: null,
    placement: { id: 'water', position: null, valid: false, message: '' },
  })
  assert.equal(state().beginTransfer(request()).ok, false)
  lab.setState({ placement: null })
  store.setState({
    effect: {
      id: 999,
      kind: 'stirring',
      sourceId: 'stirring-rod',
      targetId: 'beaker',
      startedAt: 0,
      durationMs: 100,
    },
  })
  assert.equal(state().beginTransfer(request()).ok, false)
  state().stopEffect(999)
  assert.equal(state().streamTick('water', 'graduated-cylinder', 0.75, 1), true)
  assert.equal(state().beginTransfer(request()).ok, false)
  state().stopStream()
  state().reset()
  assert.equal(state().beginTransfer(request()).ok, false, 'reset requires renewed safety evidence')
})

test('one authoritative lifecycle has no chemistry in approach/return and blocks all other scientific actions', () => {
  prepare()
  const before = structuredClone(state().experiment)
  const op = start(request('water', 'graduated-cylinder', 12.3))
  assert.equal(op.approachMs, 600)
  assert.equal(op.returnMs, 600)
  assert.equal(state().beginTransfer(request()).ok, false, 'double start')
  assert.equal(
    state().execute({ kind: 'pour', source: 'water', target: 'graduated-cylinder', amountMl: 1 }),
    false,
  )
  assert.equal(state().streamTick('water', 'graduated-cylinder', 0.75, 100), false)
  assert.equal(state().dispatch({ kind: 'validate-step' }), false)
  assert.equal(
    state().emit({
      type: 'LIQUID_TRANSFER_COMPLETED',
      sourceId: 'water',
      targetId: 'graduated-cylinder',
      quantity: { value: 100, unit: 'mL' },
    }),
    false,
  )
  state().advanceTransfer(599)
  assert.deepEqual(state().experiment, before)
  state().advanceTransfer(1)
  assert.deepEqual(state().experiment, before)
  state().advanceTransfer(op.flowMs / 2)
  assert.equal(state().transfer.transferred, 6.1)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 6.1)
  assert.equal(state().experiment.waterMl.water, 393.9)
  assert.equal(state().workflow.commandEvidence['measure-water'], 1)
  state().advanceTransfer(op.flowMs / 2)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 12.3)
  assert.equal(
    state().events.filter((event) => event.type === 'MATERIAL_TRANSFER_COMPLETED').length,
    0,
  )
  const flowingResult = structuredClone(state().experiment)
  state().advanceTransfer(599)
  assert.deepEqual(state().experiment, flowingResult)
  assert.ok(state().transfer)
  state().advanceTransfer(1)
  assert.equal(state().transfer, null)
  assert.deepEqual(state().experiment, flowingResult)
  const receipt = state().events.at(-1)
  assert.equal(receipt.type, 'MATERIAL_TRANSFER_COMPLETED')
  assert.equal(receipt.operationId, op.operationId)
  assert.equal(receipt.requestId, op.requestId)
  assert.equal(receipt.experimentId, definition.experimentId)
  assert.equal(receipt.materialId, 'water')
  assert.deepEqual(receipt.quantity, { value: 12.3, unit: 'mL' })
  assert.ok(receipt.sequence > 0)
  assert.equal(state().workflow.stepIndex, 2)
  assertConserved()
})

test('multiple decimal liquid portions complete only cumulative 100 mL and allow reverse transfers in stage 3', () => {
  prepare()
  complete(request('water', 'graduated-cylinder', 0.0123, 'L'), 17)
  assert.equal(state().workflow.measurements.waterMl, null)
  complete(request('water', 'graduated-cylinder', 87.6))
  assert.equal(state().workflow.stepIndex, 2)
  complete(request('water', 'graduated-cylinder', 0.1))
  assert.equal(state().workflow.stepIndex, 3)
  assert.equal(state().workflow.measurements.waterMl, 100)
  complete(request('graduated-cylinder', 'beaker', 40.1), 31)
  complete(request('beaker', 'graduated-cylinder', 20.1), 19)
  assert.equal(state().experiment.waterMl.beaker, 20)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 80)
  assert.equal(state().workflow.stepIndex, 3)
  complete(request('graduated-cylinder', 'beaker', 79.9))
  assert.equal(state().workflow.stepIndex, 3)
  complete(request('graduated-cylinder', 'beaker', 0.1))
  assert.equal(state().workflow.stepIndex, 4)
  const blocked = state().beginTransfer(request('beaker', 'graduated-cylinder', 1))
  assert.equal(blocked.ok, false)
  assert.match(blocked.message, /solute partitioning/)
  assertConserved()
})

test('request IDs cannot be reused after completion, cancellation or reset; stale ticks cannot affect new operations', () => {
  prepare()
  const payload = request('water', 'graduated-cylinder', 10)
  const first = start(payload)
  const capturedFirstTick = state().advanceTransfer
  const capturedFirstCancel = state().cancelTransfer
  capturedFirstTick(first.durationMs)
  assert.equal(state().beginTransfer(payload).ok, false)
  const second = start(request('water', 'graduated-cylinder', 10))
  const before = structuredClone(state().experiment)
  capturedFirstTick(100000)
  state().advanceTransfer(100000, first.operationId)
  capturedFirstCancel()
  state().cancelTransfer(first.operationId)
  assert.equal(state().transfer.cancelled, false)
  assert.deepEqual(state().experiment, before)
  assert.equal(state().transfer.operationId, second.operationId)
  const capturedSecondTick = state().advanceTransfer
  const capturedSecondCancel = state().cancelTransfer
  const revision = state().resetRevision
  state().reset()
  assert.equal(state().transfer, null)
  assert.equal(state().resetRevision, revision + 1)
  capturedSecondTick(100000)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 0)
  assert.equal(acknowledgeLabSafety(), true)
  assert.equal(state().beginTransfer(payload).ok, false)
  const third = start(request('water', 'graduated-cylinder', 10))
  assert.notEqual(third.operationId, first.operationId)
  assert.notEqual(third.operationId, second.operationId)
  capturedSecondTick(100000)
  capturedSecondCancel()
  assert.equal(state().transfer.cancelled, false)
  assert.equal(state().transfer.elapsedMs, 0)
  state().cancelTransfer()
  state().advanceTransfer(100000)
  const cancelledPayload = request('water', 'graduated-cylinder', 1)
  start(cancelledPayload)
  state().cancelTransfer()
  state().advanceTransfer(100000)
  assert.equal(state().beginTransfer(cancelledPayload).ok, false)
})

test('cancellation during approach records interruption without chemistry and keeps the safe-return lock', () => {
  prepare()
  const before = structuredClone(state().experiment)
  start(request())
  state().advanceTransfer(300)
  state().cancelTransfer()
  assert.equal(state().transfer.cancelled, true)
  assert.equal(state().transfer.durationMs - state().transfer.elapsedMs, 600)
  assert.equal(state().beginTransfer(request()).ok, false)
  state().advanceTransfer(599)
  assert.deepEqual(state().experiment, before)
  assert.ok(state().transfer)
  state().advanceTransfer(1)
  assert.equal(state().transfer, null)
  assert.deepEqual(state().experiment, before)
  assert.equal(state().events.at(-1).type, 'MATERIAL_TRANSFER_INTERRUPTED')
  assert.deepEqual(state().events.at(-1).quantity, { value: 0, unit: 'mL' })
  assert.equal(state().workflow.stepIndex, 2)
})

test('cancellation during flow conserves actual partial material, never completes the requested amount, and can resume cumulatively', () => {
  prepare()
  const op = start(request())
  state().advanceTransfer(op.approachMs + op.flowMs / 2)
  assert.equal(state().transfer.transferred, 50)
  state().cancelTransfer()
  state().cancelTransfer()
  state().advanceTransfer(600)
  assert.equal(state().transfer, null)
  assert.equal(state().experiment.waterMl.water, 350)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 50)
  assert.equal(state().workflow.stepIndex, 2)
  assert.equal(state().workflow.measurements.waterMl, null)
  assert.equal(state().events.at(-1).type, 'MATERIAL_TRANSFER_INTERRUPTED')
  assert.deepEqual(state().events.at(-1).quantity, { value: 50, unit: 'mL' })
  assert.equal(
    state().events.some((event) => event.type === 'MATERIAL_TRANSFER_COMPLETED'),
    false,
  )
  complete(request('water', 'graduated-cylinder', 50))
  assert.equal(state().workflow.stepIndex, 3)
  assertConserved()
})

test('cancel during return uses only remaining return time and never changes already delivered quantities', () => {
  prepare()
  const op = start(request('water', 'graduated-cylinder', 10))
  state().advanceTransfer(op.approachMs + op.flowMs + 250)
  const before = structuredClone(state().experiment)
  state().cancelTransfer()
  assert.equal(state().transfer.durationMs - state().transfer.elapsedMs, 350)
  state().advanceTransfer(349)
  assert.ok(state().transfer)
  assert.deepEqual(state().experiment, before)
  state().advanceTransfer(1)
  assert.equal(state().transfer, null)
  assert.equal(state().events.at(-1).type, 'MATERIAL_TRANSFER_INTERRUPTED')
  assert.deepEqual(state().experiment, before)
})

test('zero, negative, nonfinite and stale-identity ticks never advance time or chemistry; oversize elapsed is bounded', () => {
  prepare()
  const op = start(request('water', 'graduated-cylinder', 10))
  const before = structuredClone(state().experiment)
  for (const delta of [0, -1, NaN, Infinity, -Infinity]) state().advanceTransfer(delta)
  state().advanceTransfer(10000, 'stale-operation')
  assert.equal(state().transfer.elapsedMs, 0)
  assert.deepEqual(state().experiment, before)
  state().advanceTransfer(Number.MAX_VALUE, op.operationId)
  assert.equal(state().transfer, null)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 10)
  const history = structuredClone(state().events)
  state().advanceTransfer(10000)
  assert.deepEqual(state().events, history)
})

test('capability and safety are revalidated at flow, interrupting changed apparatus without inventing material', () => {
  prepare()
  start(request('water', 'graduated-cylinder', 10))
  state().advanceTransfer(600)
  lab.setState({ placedIds: bench.filter((id) => id !== 'graduated-cylinder') })
  state().advanceTransfer(500)
  assert.equal(state().transfer.cancelled, true)
  assert.equal(state().experiment.waterMl['graduated-cylinder'], 0)
  state().advanceTransfer(600)
  assert.equal(state().transfer, null)
  assert.equal(state().events.at(-1).type, 'MATERIAL_TRANSFER_INTERRUPTED')
  assertConserved()
})

test('new public material receipts cannot be forged or replayed even when they match actual chemistry', () => {
  prepare()
  const op = complete(request('water', 'graduated-cylinder', 10))
  const real = state().events.at(-1)
  const before = structuredClone(state().workflow)
  const history = structuredClone(state().events)
  for (const payload of [
    real,
    { ...real, operationId: 'fake-operation', requestId: 'fake-request' },
    { ...real, type: 'MATERIAL_TRANSFER_INTERRUPTED' },
    { ...real, quantity: { value: 100, unit: 'mL' } },
  ]) {
    assert.equal(state().emit(payload), false)
    assert.deepEqual({ ...state().workflow, validation: before.validation }, before)
    assert.deepEqual(state().events, history)
  }
  assert.equal(real.operationId, op.operationId)
})

test('decimal scoops/deposits accumulate to five grams but cannot bypass the physical balance release', () => {
  prepareSalt()
  const denied = state().beginTransfer(request('sodium-chloride', 'weighing-boat', 1, 'g', 'NaCl'))
  assert.equal(denied.ok, false)
  assert.match(denied.message, /spatula/)
  complete(scoop(0.001), 7)
  complete(deposit(1, 'mg'))
  assert.equal(state().experiment.saltOnBoatG, 0.001)
  assert.equal(state().workflow.stepIndex, 4)
  assert.equal(state().beginTransfer(add(0.001)).ok, false)
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    false,
  )
  complete(scoop(4.999))
  complete(deposit(4.999))
  assert.equal(state().experiment.saltOnBoatG, 5)
  assert.equal(state().experiment.saltStockG, 95)
  assert.equal(state().workflow.measurements.saltG, null)
  assert.equal(state().workflow.stepIndex, 4)
  assert.equal(state().beginTransfer(add(1)).ok, false)
  assert.equal(
    state().emit({
      type: 'MASS_MEASUREMENT_RECORDED',
      sourceId: 'weighing-boat',
      targetId: 'digital-balance',
      substance: 'NaCl',
      quantity: { value: 5, unit: 'g' },
    }),
    false,
    'no contact',
  )
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    true,
  )
  assert.equal(state().workflow.stepIndex, 5)
  assert.equal(state().workflow.measurements.saltG, 5)
  assert.equal(state().events.at(-1).type, 'MASS_MEASUREMENT_RECORDED')
  assertConserved()
})

test('full guided decimal sequence retains physical timed stirring, observation and final review', () => {
  measuredBoat()
  const op = start(add(1.234))
  const before = structuredClone(state().experiment)
  state().advanceTransfer(600)
  assert.deepEqual(state().experiment, before)
  state().advanceTransfer(op.flowMs / 2)
  assert.equal(state().experiment.saltInBeakerG, 0.617)
  state().cancelTransfer()
  state().advanceTransfer(600)
  assert.equal(state().workflow.stepIndex, 5)
  assert.equal(state().experiment.saltInBeakerG, 0.617)
  complete(add(1.383))
  assert.equal(state().experiment.saltInBeakerG, 2)
  assert.equal(state().workflow.stepIndex, 5)
  assert.equal(
    state().execute({ kind: 'stir', tool: 'stirring-rod', target: 'beaker', elapsedMs: 50 }),
    false,
  )
  complete(add(2999, 'mg'))
  assert.equal(state().workflow.stepIndex, 5)
  assert.equal(state().experiment.saltInBeakerG, 4.999)
  complete(add(0.001))
  assert.equal(state().workflow.stepIndex, 6)
  assert.equal(state().experiment.saltOnBoatG, 0)
  assert.equal(state().experiment.dissolvedSaltG, 0)
  assert.equal(inspectFinalSolution('beaker'), false)
  assert.equal(
    resolvePairInteractions(
      ['beaker', 'graduated-cylinder'],
      state().experiment,
      state().workflow,
      bench,
    ).every((item) => !item.enabled),
    true,
  )
  lab.getState().beginDrag('stirring-rod')
  for (let i = 0; i < 60 && state().workflow.stepIndex === 6; i++) {
    assert.equal(
      handlePhysicalInteraction({
        actorId: 'stirring-rod',
        targetId: 'beaker',
        gesture: 'stir',
        elapsedMs: 50,
      }),
      true,
    )
    assertConserved()
  }
  lab.getState().finishDrag()
  assert.equal(state().workflow.stepIndex, 8)
  assert.equal(state().experiment.dissolvedSaltG, 5)
  assert.equal(state().workflow.observationRecorded, true)
  assert.equal(inspectFinalSolution('beaker'), true)
  assert.equal(state().workflow.completed, true)
  assert.deepEqual(state().workflow.measurements, { waterMl: 100, saltG: 5 })
  const receipts = state().events.filter((event) => event.type.startsWith('MATERIAL_TRANSFER_'))
  assert.ok(receipts.length >= 10)
  for (let i = 1; i < receipts.length; i++)
    assert.ok(receipts[i].sequence > receipts[i - 1].sequence)
  assert.equal(new Set(receipts.map((event) => event.operationId)).size, receipts.length)
  assert.equal(state().beginTransfer(request('beaker', 'graduated-cylinder', 1)).ok, false)
  assertConserved()
})
