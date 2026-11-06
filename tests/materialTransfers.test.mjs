import assert from 'node:assert/strict'
import test from 'node:test'
import { saltExperimentDefinition as definition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import {
  initialSaltExperimentState,
  isValidSaltExperimentState,
  executeSaltCommand,
} from '../src/features/simulations/engine/saltExperiment.ts'
import { initialWorkflowState } from '../src/features/simulations/engine/workflow.ts'
import { applySimulationEvent } from '../src/features/simulations/engine/simulationEvents.ts'
import {
  resolvePairInteractions,
  validateTransferRequest,
  reduceMaterialTransfer,
  createTransferOperation,
  advanceTransferOperation,
  cancelTransferOperation,
  quantityUnits,
  describeQuantity,
  transferEquipment,
} from '../src/features/simulations/engine/materialTransfers.ts'
import {
  advanceMaterialTransferWorkflow,
  finishMaterialTransferWorkflow,
  verifyMaterialTransferReceipt,
} from '../src/features/simulations/engine/materialTransferWorkflow.ts'

const bench = definition.availableInventory
const water = (amount = 10, unit = 'mL') => ({
  requestId: 'domain-water',
  sourceId: 'water',
  targetId: 'graduated-cylinder',
  materialId: 'water',
  amount,
  unit,
})
const salt = (amount = 1, unit = 'g') => ({
  requestId: 'domain-salt',
  sourceId: 'sodium-chloride',
  targetId: 'spatula',
  materialId: 'NaCl',
  amount,
  unit,
})

function session() {
  let chemistry = initialSaltExperimentState()
  let workflow = initialWorkflowState(definition)
  for (const event of [
    { type: 'SAFETY_ACKNOWLEDGED' },
    { type: 'EQUIPMENT_PLACEMENT_VALIDATED', equipmentId: 'beaker' },
  ]) {
    const result = applySimulationEvent(definition, workflow, chemistry, bench, event)
    assert.equal(result.validation.valid, true)
    workflow = result.state
  }
  let sequence = 0
  return {
    get chemistry() {
      return chemistry
    },
    get workflow() {
      return workflow
    },
    transfer(request, partitions = [100000]) {
      const validation = validateTransferRequest(request, chemistry, workflow, bench)
      assert.equal(validation.ok, true, validation.message)
      let operation = createTransferOperation(
        request,
        validation,
        chemistry,
        workflow,
        `domain-operation-${++sequence}`,
        0,
      )
      for (const elapsed of partitions) {
        const next = advanceTransferOperation(operation, elapsed)
        const tick = advanceMaterialTransferWorkflow(workflow, chemistry, operation, next, bench)
        assert.ok(tick)
        chemistry = tick.chemistry
        workflow = tick.workflow
        operation = next
      }
      if (operation.elapsedMs === operation.durationMs) {
        const event = {
          type: 'MATERIAL_TRANSFER_COMPLETED',
          operationId: operation.operationId,
          requestId: operation.requestId,
          experimentId: definition.experimentId,
          sourceId: operation.sourceId,
          targetId: operation.targetId,
          materialId: operation.materialId,
          quantity: { value: operation.transferred, unit: operation.unit },
          sequence,
        }
        const result = finishMaterialTransferWorkflow(workflow, chemistry, operation, event, bench)
        assert.equal(result.validation.valid, true, result.validation.message)
        workflow = result.state
        return { operation, event }
      }
      return { operation }
    },
  }
}
function saltStage() {
  const s = session()
  s.transfer(water(100))
  s.transfer({ ...water(100), sourceId: 'graduated-cylinder', targetId: 'beaker' })
  assert.equal(s.workflow.stepIndex, 4)
  return s
}

function rejected(request, s = session(), ids = bench) {
  const before = structuredClone(s.chemistry)
  assert.equal(
    validateTransferRequest(request, s.chemistry, s.workflow, ids).ok,
    false,
    JSON.stringify(request),
  )
  assert.deepEqual(s.chemistry, before)
}

test('canonical decimal parsing accepts only exact liquid tenths and solid milligrams, including L conversion', () => {
  const s = session()
  for (const [amount, unit, expected] of [
    [0.1, 'mL', 0.1],
    [12.3, 'mL', 12.3],
    [0.0001, 'L', 0.1],
    [0.0123, 'L', 12.3],
    [0.1, 'L', 100],
    [1e-4, 'L', 0.1],
  ]) {
    const result = validateTransferRequest(water(amount, unit), s.chemistry, s.workflow, bench)
    assert.equal(result.ok, true, result.message)
    assert.equal(result.amount, expected)
  }
  const solids = saltStage()
  for (const [amount, unit, expected] of [
    [0.001, 'g', 0.001],
    [1.234, 'g', 1.234],
    [1, 'mg', 0.001],
    [1234, 'mg', 1.234],
    [5000, 'mg', 5],
  ]) {
    const result = validateTransferRequest(
      salt(amount, unit),
      solids.chemistry,
      solids.workflow,
      bench,
    )
    assert.equal(result.ok, true, result.message)
    assert.equal(result.amount, expected)
  }
  for (const request of [
    water(0.01),
    water(0.00001, 'L'),
    water(0.1 + 0.2),
    water(10.00000000001),
    water(1, 'g'),
    water(1, 'mg'),
    water(1, 'ml'),
    water('1'),
    water(NaN),
    water(Infinity),
    water(-1),
    water(0),
    water(1e100),
    { ...water(), requestId: '' },
    { ...water(), materialId: 'KCl' },
    null,
  ])
    rejected(request, s)
  for (const request of [
    salt(0.0001),
    salt(0.1, 'mg'),
    salt(1.2345),
    salt(1, 'mL'),
    salt(1, 'L'),
    salt(-1),
    salt(0),
    salt(Infinity),
  ])
    rejected(request, solids)
  assert.equal(describeQuantity(100, 'mL'), '100 mL')
  assert.equal(describeQuantity(1.234, 'g'), '1.234 g')
})

test('domain validation keeps cylinder capacity 100 and rejects overflow, empty source, stale state and missing equipment', () => {
  const s = session()
  assert.equal(transferEquipment['graduated-cylinder'].liquid.capacity, 100)
  rejected(water(100.1), s)
  rejected(
    water(1),
    s,
    bench.filter((id) => id !== 'graduated-cylinder'),
  )
  rejected({ ...water(), sourceId: 'beaker' }, s)
  rejected({ ...water(), targetId: 'water' }, s)
  rejected({ ...water(), sourceId: 'unknown' }, s)
  s.transfer(water(99.9))
  rejected(water(0.2), s)
  assert.equal(validateTransferRequest(water(0.1), s.chemistry, s.workflow, bench).ok, true)
  const stale = { ...s.workflow, chemistryCheckpoint: initialSaltExperimentState() }
  assert.equal(validateTransferRequest(water(0.1), s.chemistry, stale, bench).ok, false)
  const unsafe = { ...s.workflow, safetyAcknowledged: false }
  assert.equal(validateTransferRequest(water(0.1), s.chemistry, unsafe, bench).ok, false)
})

test('capabilities resolve unordered selections, meaningful disabled instructions, and no renderer mesh aliases', () => {
  const s = session()
  assert.equal(
    resolvePairInteractions(['graduated-cylinder', 'water'], s.chemistry, s.workflow, bench)[0]
      .sourceId,
    'water',
  )
  for (const ids of [
    [],
    ['water'],
    ['water', 'water'],
    ['water', 'beaker', 'spatula'],
    ['WaterMesh', 'beaker'],
    ['__proto__', 'beaker'],
  ])
    assert.deepEqual(resolvePairInteractions(ids, s.chemistry, s.workflow, bench), [])
  const solids = saltStage()
  const jarBoat = resolvePairInteractions(
    ['weighing-boat', 'sodium-chloride'],
    solids.chemistry,
    solids.workflow,
    bench,
  )[0]
  assert.equal(jarBoat.enabled, false)
  assert.match(jarBoat.reason, /spatula/i)
  rejected(
    salt(),
    solids,
    bench.filter((id) => id !== 'spatula'),
  )
  rejected(
    salt(),
    solids,
    bench.filter((id) => id !== 'digital-balance'),
  )
  rejected(
    salt(),
    solids,
    bench.filter((id) => id !== 'weighing-boat'),
  )
  rejected({ ...salt(), sourceId: 'weighing-boat', targetId: 'beaker' }, solids)
})

test('pure integer reducer preserves both inventories, capacities and caller state over decimal portions', () => {
  let chemistry = initialSaltExperimentState()
  const start = structuredClone(chemistry)
  const forward = { sourceId: 'water', targetId: 'graduated-cylinder', materialId: 'water' }
  for (let i = 0; i < 1000; i++) {
    chemistry = reduceMaterialTransfer(chemistry, forward, 1, true)
    assert.ok(chemistry)
    assert.equal(
      Object.values(chemistry.waterMl).reduce((sum, n) => sum + quantityUnits(n, 'water'), 0),
      4000,
    )
  }
  assert.equal(chemistry.waterMl['graduated-cylinder'], 100)
  assert.equal(reduceMaterialTransfer(chemistry, forward, 1, true), null)
  assert.deepEqual(start, initialSaltExperimentState())
  const route = { sourceId: 'sodium-chloride', targetId: 'spatula', materialId: 'NaCl' }
  chemistry = reduceMaterialTransfer(chemistry, route, 1234, true)
  assert.equal(chemistry.saltOnSpatulaG, 1.234)
  chemistry = reduceMaterialTransfer(
    chemistry,
    { ...route, sourceId: 'spatula', targetId: 'weighing-boat' },
    567,
    true,
  )
  assert.equal(chemistry.saltOnSpatulaG, 0.667)
  assert.equal(chemistry.saltOnBoatG, 0.567)
  assert.equal(
    [
      chemistry.saltStockG,
      chemistry.saltOnSpatulaG,
      chemistry.saltOnBoatG,
      chemistry.saltInBeakerG,
    ].reduce((sum, n) => sum + quantityUnits(n, 'NaCl'), 0),
    100000,
  )
  for (const units of [-1, 0.1, Infinity, NaN, 100001])
    assert.equal(reduceMaterialTransfer(chemistry, route, units, true), null)
})

test('liquid decimal states are valid without loosening legacy whole-number command validation', () => {
  const state = {
    ...initialSaltExperimentState(),
    waterMl: { water: 399.9, 'graduated-cylinder': 0.1, beaker: 0 },
  }
  assert.equal(isValidSaltExperimentState(state), true)
  assert.equal(
    isValidSaltExperimentState({ ...state, waterMl: { ...state.waterMl, beaker: 0.01 } }),
    false,
  )
  assert.equal(
    executeSaltCommand(
      state,
      { kind: 'pour', source: 'water', target: 'graduated-cylinder', amountMl: 0.1 },
      bench,
    ).ok,
    false,
  )
})

test('cylinder and beaker resolve both directions only for measured pure water, with cumulative completion', () => {
  const s = session()
  s.transfer(water(100))
  assert.equal(s.workflow.measurements.waterMl, 100)
  rejected({ ...water(0.1), sourceId: 'beaker', targetId: 'graduated-cylinder' }, s)
  s.transfer({ ...water(30.1), sourceId: 'graduated-cylinder', targetId: 'beaker' })
  rejected({ ...water(30.2), sourceId: 'beaker', targetId: 'graduated-cylinder' }, s)
  assert.equal(
    resolvePairInteractions(['beaker', 'graduated-cylinder'], s.chemistry, s.workflow, bench).find(
      (pair) => pair.sourceId === 'beaker',
    ).freeCapacity,
    30.1,
  )
  let pairs = resolvePairInteractions(
    ['beaker', 'graduated-cylinder'],
    s.chemistry,
    s.workflow,
    bench,
  )
  assert.equal(pairs.length, 2)
  assert.equal(
    pairs.every((pair) => pair.enabled),
    true,
  )
  s.transfer({ ...water(10.1), sourceId: 'beaker', targetId: 'graduated-cylinder' })
  assert.equal(s.chemistry.waterMl.beaker, 20)
  assert.equal(s.chemistry.waterMl['graduated-cylinder'], 80)
  assert.equal(s.workflow.stepIndex, 3)
  s.transfer({ ...water(79.9), sourceId: 'graduated-cylinder', targetId: 'beaker' })
  assert.equal(s.workflow.stepIndex, 3)
  s.transfer({ ...water(0.1), sourceId: 'graduated-cylinder', targetId: 'beaker' })
  assert.equal(s.workflow.stepIndex, 4)
  pairs = resolvePairInteractions(['beaker', 'graduated-cylinder'], s.chemistry, s.workflow, bench)
  assert.equal(
    pairs.every((pair) => !pair.enabled),
    true,
  )
  assert.match(pairs[0].reason, /solute partitioning/)
})

test('lifecycle keeps chemistry in flow only, bounds time, and is partition-independent', () => {
  const s = session()
  const request = water(12.3)
  const validation = validateTransferRequest(request, s.chemistry, s.workflow, bench)
  const op = createTransferOperation(request, validation, s.chemistry, s.workflow, 'life', 7)
  assert.equal(op.approachMs, 600)
  assert.equal(op.returnMs, 600)
  assert.ok(op.flowMs >= 1000 && op.flowMs <= 4500)
  const approached = advanceTransferOperation(op, 600)
  assert.equal(approached.transferred, 0)
  assert.equal(advanceTransferOperation(op, NaN), op)
  assert.equal(advanceTransferOperation(op, -1), op)
  const flowed = advanceTransferOperation(approached, op.flowMs)
  assert.equal(flowed.transferred, 12.3)
  assert.equal(advanceTransferOperation(flowed, 300).transferred, 12.3)
  const whole = advanceTransferOperation(op, 1e20)
  assert.equal(whole.elapsedMs, whole.durationMs)
  let sliced = op
  for (let i = 0; i < whole.durationMs; i++) sliced = advanceTransferOperation(sliced, 1)
  assert.deepEqual(sliced, whole)
  const cancelled = cancelTransferOperation(advanceTransferOperation(op, 1100))
  assert.equal(cancelled.durationMs - cancelled.elapsedMs, 600)
  assert.equal(advanceTransferOperation(cancelled, 10000).transferred, cancelled.transferred)
  const inReturn = advanceTransferOperation(op, op.approachMs + op.flowMs + 200)
  const cancelledReturn = cancelTransferOperation(inReturn)
  assert.equal(cancelledReturn.durationMs - cancelledReturn.elapsedMs, 400)
  assert.deepEqual(cancelTransferOperation(cancelledReturn), cancelledReturn)
})

test('receipts must match actual operation, lifecycle, before/after snapshots and cannot be public forged events', () => {
  const s = session()
  const { operation, event } = s.transfer(water(12.3))
  assert.equal(
    verifyMaterialTransferReceipt(event, operation, operation.beforeChemistry, s.chemistry),
    true,
  )
  for (const forged of [
    { ...event, operationId: 'other' },
    { ...event, requestId: 'other' },
    { ...event, experimentId: 'other' },
    { ...event, targetId: 'beaker' },
    { ...event, quantity: { value: 12, unit: 'mL' } },
    { ...event, quantity: { value: 12.3, unit: 'g' } },
    { ...event, sequence: 0 },
    { ...event, type: 'MATERIAL_TRANSFER_INTERRUPTED' },
  ])
    assert.equal(
      verifyMaterialTransferReceipt(forged, operation, operation.beforeChemistry, s.chemistry),
      false,
    )
  assert.equal(
    verifyMaterialTransferReceipt(
      event,
      { ...operation, elapsedMs: 1 },
      operation.beforeChemistry,
      s.chemistry,
    ),
    false,
  )
  assert.equal(verifyMaterialTransferReceipt(event, operation, s.chemistry, s.chemistry), false)
  assert.equal(
    verifyMaterialTransferReceipt(
      event,
      operation,
      operation.beforeChemistry,
      operation.beforeChemistry,
    ),
    false,
  )
  assert.equal(
    applySimulationEvent(definition, s.workflow, s.chemistry, bench, event).validation.valid,
    false,
  )
  assert.equal(
    finishMaterialTransferWorkflow(s.workflow, s.chemistry, operation, event, bench).validation
      .valid,
    false,
    'receipt replay',
  )
})
