import assert from 'node:assert/strict'
import test from 'node:test'
import { saltExperimentDefinition as definition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import {
  executeSaltCommand,
  initialSaltExperimentState,
} from '../src/features/simulations/engine/saltExperiment.ts'
import {
  initialWorkflowState,
  transitionWorkflow,
} from '../src/features/simulations/engine/workflow.ts'
import { applySimulationEvent } from '../src/features/simulations/engine/simulationEvents.ts'

const fullBench = Object.freeze([
  'beaker',
  'digital-balance',
  'graduated-cylinder',
  'water',
  'sodium-chloride',
  'spatula',
  'weighing-boat',
  'stirring-rod',
])

const commands = Object.freeze({
  measureWater: { kind: 'pour', source: 'water', target: 'graduated-cylinder', amountMl: 100 },
  pourIntoBeaker: { kind: 'pour', source: 'graduated-cylinder', target: 'beaker', amountMl: 100 },
  scoop: { kind: 'scoop-salt', tool: 'spatula', source: 'sodium-chloride', massG: 5 },
  deposit: { kind: 'deposit-salt', tool: 'spatula', target: 'weighing-boat', massG: 5 },
  addSalt: { kind: 'add-substance', source: 'weighing-boat', target: 'beaker', massG: 5 },
  stir: { kind: 'stir', tool: 'stirring-rod', target: 'beaker' },
})

const events = Object.freeze({
  safety: { type: 'SAFETY_ACKNOWLEDGED' },
  placeBeaker: { type: 'EQUIPMENT_PLACEMENT_VALIDATED', equipmentId: 'beaker' },
  measureWater: {
    type: 'LIQUID_TRANSFER_COMPLETED',
    sourceId: 'water',
    targetId: 'graduated-cylinder',
    quantity: { value: 100, unit: 'mL' },
    totalVolumeMl: 100,
  },
  pourIntoBeaker: {
    type: 'LIQUID_TRANSFER_COMPLETED',
    sourceId: 'graduated-cylinder',
    targetId: 'beaker',
    quantity: { value: 100, unit: 'mL' },
    totalVolumeMl: 100,
  },
  scoop: {
    type: 'SOLID_TRANSFER_COMPLETED',
    sourceId: 'sodium-chloride',
    targetId: 'spatula',
    substance: 'NaCl',
    quantity: { value: 5, unit: 'g' },
  },
  deposit: {
    type: 'SOLID_TRANSFER_COMPLETED',
    sourceId: 'spatula',
    targetId: 'weighing-boat',
    substance: 'NaCl',
    quantity: { value: 5, unit: 'g' },
  },
  weigh: {
    type: 'MASS_MEASUREMENT_RECORDED',
    sourceId: 'weighing-boat',
    targetId: 'digital-balance',
    substance: 'NaCl',
    quantity: { value: 5, unit: 'g' },
  },
  addSalt: {
    type: 'SOLID_TRANSFER_COMPLETED',
    sourceId: 'weighing-boat',
    targetId: 'beaker',
    substance: 'NaCl',
    quantity: { value: 5, unit: 'g' },
  },
  stir: {
    type: 'STIRRING_REQUIREMENT_COMPLETED',
    toolId: 'stirring-rod',
    targetId: 'beaker',
    quantity: { value: 5, unit: 'g' },
    cycles: 2,
  },
  observe: { type: 'OBSERVATION_RECORDED', observation: 'no-visible-solid' },
  review: { type: 'REVIEW_INSPECTED' },
})

/** A pure, isolated domain fixture: commands update actual chemistry first. */
function makeSession() {
  let chemistry = initialSaltExperimentState()
  let workflow = initialWorkflowState(definition)

  const event = (payload, placedIds = fullBench) => {
    const result = applySimulationEvent(definition, workflow, chemistry, placedIds, payload)
    if (result.validation.valid) workflow = result.state
    return result
  }

  const command = (payload, placedIds = fullBench) => {
    const scientific = executeSaltCommand(chemistry, payload, placedIds)
    assert.equal(scientific.ok, true, 'Fixture requires a real, accepted chemistry operation')
    const accepted = transitionWorkflow(definition, workflow, scientific.state, placedIds, {
      kind: 'command',
      command: payload,
      beforeChemistry: chemistry,
    })
    assert.equal(
      accepted.validation.valid,
      true,
      'Fixture requires workflow-validated command evidence',
    )
    chemistry = scientific.state
    workflow = accepted.state
    return accepted
  }

  return {
    event,
    command,
    get workflow() {
      return workflow
    },
    get chemistry() {
      return chemistry
    },
  }
}

/** Rejection may update diagnostic validation, but must never commit experiment progress. */
function expectRejected(session, payload, placedIds = fullBench) {
  const beforeWorkflow = structuredClone(session.workflow)
  const beforeChemistry = structuredClone(session.chemistry)
  const result = session.event(payload, placedIds)
  assert.equal(result.validation.valid, false, `Expected ${payload.type} to be rejected`)
  // The returned transition is inspected too: rejected events must not smuggle
  // state changes into a caller that always stores result.state.
  assert.deepEqual(
    { ...result.state, validation: beforeWorkflow.validation },
    beforeWorkflow,
    'Rejected event changed workflow state beyond diagnostic validation',
  )
  assert.deepEqual(session.workflow, beforeWorkflow, 'Event reducer mutated its input workflow')
  assert.deepEqual(session.chemistry, beforeChemistry)
  return result
}

function expectAccepted(session, payload, expectedIndex) {
  const result = session.event(payload)
  assert.equal(result.validation.valid, true, `${payload.type}: ${result.validation.message}`)
  assert.equal(session.workflow.stepIndex, expectedIndex)
  return result
}

function advanceToWater(session) {
  expectAccepted(session, events.safety, 1)
  expectAccepted(session, events.placeBeaker, 2)
}

function advanceToSalt(session) {
  advanceToWater(session)
  session.command(commands.measureWater)
  expectAccepted(session, events.measureWater, 3)
  assert.equal(session.chemistry.waterMl['graduated-cylinder'], 100)
  assert.equal(session.workflow.measurements.waterMl, 100)
  session.command(commands.pourIntoBeaker)
  expectAccepted(session, events.pourIntoBeaker, 4)
  assert.equal(session.chemistry.waterMl.beaker, 100)
}

function advanceToStir(session) {
  advanceToSalt(session)
  session.command(commands.scoop)
  expectAccepted(session, events.scoop, 4)
  session.command(commands.deposit)
  expectAccepted(session, events.deposit, 4)
  expectAccepted(session, events.weigh, 5)
  assert.equal(session.chemistry.saltOnBoatG, 5)
  assert.equal(session.workflow.measurements.saltG, 5)
  session.command(commands.addSalt)
  expectAccepted(session, events.addSalt, 6)
}

test('fabricated water or salt events cannot change workflow without chemistry evidence', () => {
  const session = makeSession()
  expectRejected(session, events.measureWater)
  expectRejected(session, events.weigh)
  expectRejected(session, events.stir)
  advanceToWater(session)
  expectRejected(session, events.measureWater)
  assert.equal(session.chemistry.waterMl['graduated-cylinder'], 0)
  assert.equal(session.workflow.measurements.waterMl, null)
})

test('invalid units, quantities, actors and destination cannot confirm a real water transfer', () => {
  const session = makeSession()
  advanceToWater(session)
  session.command(commands.measureWater)
  const badEvents = [
    { ...events.measureWater, quantity: { value: 100, unit: 'g' } },
    { ...events.measureWater, quantity: { value: 101, unit: 'mL' } },
    { ...events.measureWater, quantity: { value: -100, unit: 'mL' } },
    { ...events.measureWater, quantity: { value: Number.NaN, unit: 'mL' } },
    { ...events.measureWater, sourceId: 'beaker' },
    { ...events.measureWater, targetId: 'beaker' },
    { ...events.measureWater, totalVolumeMl: 50 },
  ]
  for (const invalid of badEvents) expectRejected(session, invalid)
  expectAccepted(session, events.measureWater, 3)
})

test('missing apparatus and out-of-sequence or duplicate events never advance steps', () => {
  const session = makeSession()
  expectRejected(session, events.placeBeaker, ['digital-balance'])
  expectRejected(session, events.addSalt)
  expectRejected(session, events.observe)
  expectAccepted(session, events.safety, 1)
  expectRejected(session, events.placeBeaker, ['water', 'digital-balance'])
  expectAccepted(session, events.placeBeaker, 2)
  session.command(commands.measureWater)
  expectRejected(
    session,
    events.measureWater,
    fullBench.filter((id) => id !== 'graduated-cylinder'),
  )
  expectAccepted(session, events.measureWater, 3)
  expectRejected(session, events.measureWater)
  expectRejected(session, events.stir)
})

test('stale and forged chemistry snapshots cannot authenticate completed transfers', () => {
  const session = makeSession()
  advanceToWater(session)
  const beforeTransfer = structuredClone(session.chemistry)
  session.command(commands.measureWater)
  const beforeWorkflow = structuredClone(session.workflow)

  const stale = applySimulationEvent(
    definition,
    session.workflow,
    beforeTransfer,
    fullBench,
    events.measureWater,
  )
  assert.equal(stale.validation.valid, false)
  assert.equal(stale.validation.code, 'STALE_CHEMISTRY')
  assert.deepEqual(
    { ...stale.state, validation: beforeWorkflow.validation },
    beforeWorkflow,
    'A stale event must not rewrite validated operation evidence or step progress',
  )
  assert.deepEqual(session.workflow, beforeWorkflow)

  const forged = {
    ...session.chemistry,
    waterMl: {
      ...session.chemistry.waterMl,
      water: session.chemistry.waterMl.water + 10,
    },
  }
  assert.equal(
    applySimulationEvent(definition, session.workflow, forged, fullBench, events.measureWater)
      .validation.valid,
    false,
  )
  expectAccepted(session, events.measureWater, 3)
})

test('salt amount, source, substance and unit must match real spatula/boat mass', () => {
  const session = makeSession()
  advanceToSalt(session)
  expectRejected(session, events.weigh)
  expectRejected(session, events.addSalt)
  session.command(commands.scoop)
  for (const payload of [
    { ...events.scoop, quantity: { value: 5, unit: 'mL' } },
    { ...events.scoop, quantity: { value: 10, unit: 'g' } },
    { ...events.scoop, sourceId: 'weighing-boat' },
    { ...events.scoop, targetId: 'beaker' },
    { ...events.scoop, substance: 'KCl' },
  ])
    expectRejected(session, payload)
  expectAccepted(session, events.scoop, 4)
  expectRejected(session, events.scoop)
  expectRejected(session, events.weigh)
  session.command(commands.deposit)
  expectAccepted(session, events.deposit, 4)
  expectRejected(session, events.deposit)
  expectRejected(session, { ...events.weigh, quantity: { value: 4, unit: 'g' } })
  expectRejected(session, { ...events.weigh, targetId: 'beaker' })
  expectRejected(session, { ...events.weigh, quantity: { value: 5, unit: 'mL' } })
  expectAccepted(session, events.weigh, 5)
})

test('stirring cannot be faked before sufficient real dissolution evidence', () => {
  const session = makeSession()
  advanceToStir(session)
  assert.equal(session.chemistry.dissolvedSaltG, 0)
  expectRejected(session, events.stir)
  session.command(commands.stir)
  assert.equal(session.chemistry.dissolvedSaltG, 4)
  expectRejected(session, events.stir)
  session.command(commands.stir)
  assert.equal(session.chemistry.dissolvedSaltG, 5)
  expectRejected(session, { ...events.stir, toolId: 'spatula' })
  expectRejected(session, { ...events.stir, targetId: 'weighing-boat' })
  expectRejected(session, { ...events.stir, quantity: { value: 100, unit: 'mL' } })
  expectRejected(session, { ...events.stir, cycles: 0 })
  expectAccepted(session, events.stir, 7)
})

test('all nine ordered steps complete from real quantities, and fresh restart resets evidence', () => {
  const session = makeSession()
  advanceToStir(session)
  session.command(commands.stir)
  session.command(commands.stir)
  expectAccepted(session, events.stir, 7)
  expectRejected(session, { ...events.observe, observation: 'visible-solid' })
  expectAccepted(session, events.observe, 8)
  const result = expectAccepted(session, events.review, 8)
  assert.equal(result.state.completed, true)
  assert.equal(session.workflow.completed, true)
  assert.deepEqual(session.workflow.measurements, { waterMl: 100, saltG: 5 })
  assert.deepEqual(session.chemistry.waterMl, {
    water: 300,
    'graduated-cylinder': 0,
    beaker: 100,
  })
  assert.deepEqual(
    {
      stockG: session.chemistry.saltStockG,
      spatulaG: session.chemistry.saltOnSpatulaG,
      boatG: session.chemistry.saltOnBoatG,
      beakerG: session.chemistry.saltInBeakerG,
      dissolvedG: session.chemistry.dissolvedSaltG,
    },
    { stockG: 95, spatulaG: 0, boatG: 0, beakerG: 5, dissolvedG: 5 },
  )
  assert.equal(session.chemistry.stirCount, 2)
  expectRejected(session, events.review)
  expectRejected(session, events.measureWater)

  const restarted = makeSession()
  assert.equal(restarted.workflow.stepIndex, 0)
  assert.equal(restarted.workflow.completed, false)
  assert.equal(restarted.workflow.safetyAcknowledged, false)
  assert.deepEqual(restarted.workflow.measurements, { waterMl: null, saltG: null })
  assert.deepEqual(restarted.workflow.commandEvidence, {})
  assert.deepEqual(restarted.chemistry, initialSaltExperimentState())
  expectRejected(restarted, events.measureWater)
})
