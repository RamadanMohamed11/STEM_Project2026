import assert from 'node:assert/strict'
import test from 'node:test'
import {
  executeSaltCommand,
  initialSaltExperimentState,
  isDemonstrationComplete,
  maximumDissolvedSaltG,
  undissolvedSaltG,
} from '../src/features/simulations/engine/saltExperiment.ts'
import { applySimulationEvent } from '../src/features/simulations/engine/simulationEvents.ts'
import { initialWorkflowState } from '../src/features/simulations/engine/workflow.ts'
import { saltExperimentDefinition as definition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import {
  acknowledgeLabSafety,
  handlePhysicalInteraction,
  updatePhysicalPour,
} from '../src/features/simulations/state/directInteractions.ts'
import { restartExperimentSession } from '../src/features/simulations/state/sessionActions.ts'
import { useLabSceneStore as lab } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useSaltSimulationStore as simulation } from '../src/features/simulations/state/useSaltSimulationStore.ts'

const bench = definition.availableInventory
const pour = (source, target, amountMl) => ({ kind: 'pour', source, target, amountMl })
const scoop = { kind: 'scoop-salt', tool: 'spatula', source: 'sodium-chloride', massG: 5 }
const deposit = { kind: 'deposit-salt', tool: 'spatula', target: 'weighing-boat', massG: 5 }
const add = { kind: 'add-substance', source: 'weighing-boat', target: 'beaker', massG: 5 }
const stir = { kind: 'stir', tool: 'stirring-rod', target: 'beaker' }
const weigh = {
  type: 'MASS_MEASUREMENT_RECORDED',
  sourceId: 'weighing-boat',
  targetId: 'digital-balance',
  substance: 'NaCl',
  quantity: { value: 5, unit: 'g' },
}
const saltTotal = (s) => s.saltStockG + s.saltOnSpatulaG + s.saltOnBoatG + s.saltInBeakerG
const waterTotal = (s) => Object.values(s.waterMl).reduce((a, b) => a + b, 0)

function chemistryWithSalt(waterMl = 100, massG = 5) {
  let state = executeSaltCommand(
    initialSaltExperimentState(),
    pour('water', 'beaker', waterMl),
    bench,
  ).state
  state = executeSaltCommand(state, { ...add, source: 'sodium-chloride', massG }, bench).state
  return state
}

function finishEffect() {
  const effect = simulation.getState().effect
  if (effect) simulation.getState().stopEffect(effect.id)
}

function prepareWater() {
  restartExperimentSession()
  assert.equal(acknowledgeLabSafety(), true)
  for (const id of bench) {
    if (lab.getState().placedIds.includes(id)) continue
    lab.getState().beginPlacement(id)
    assert.equal(lab.getState().confirmPlacement(), true)
  }
}

function pourStage(source, target) {
  for (let i = 0; i < 40 && simulation.getState().experiment.waterMl[target] < 100; i++) {
    assert.equal(simulation.getState().streamTick(source, target, 0.75, 100), true)
  }
  simulation.getState().stopStream()
  assert.equal(simulation.getState().experiment.waterMl[target], 100)
}

function prepareBoat() {
  prepareWater()
  pourStage('water', 'graduated-cylinder')
  pourStage('graduated-cylinder', 'beaker')
  assert.equal(simulation.getState().execute(scoop), true)
  assert.equal(simulation.getState().execute(deposit), true)
}

function prepareStir() {
  prepareBoat()
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    true,
  )
  assert.equal(simulation.getState().execute(add), true)
  finishEffect()
  assert.equal(simulation.getState().workflow.stepIndex, 6)
}

test('runtime commands reject unknown kinds and forged apparatus without changing any mass', () => {
  const state = chemistryWithSalt()
  const invalid = [
    null,
    undefined,
    {},
    { kind: 'teleport' },
    { ...stir, tool: 'spatula' },
    { ...stir, target: 'water' },
    { ...scoop, tool: 'beaker' },
    { ...scoop, source: 'water' },
    { ...deposit, tool: 'water' },
    { ...deposit, target: 'beaker' },
    { ...add, source: 'unknown' },
    { ...add, target: 'water' },
    pour('unknown', 'beaker', 1),
    pour('water', 'unknown', 1),
    pour('water', '__proto__', 1),
  ]
  for (const command of invalid) {
    const result = executeSaltCommand(state, command, [...bench, 'unknown', '__proto__'])
    assert.equal(result.ok, false, JSON.stringify(command))
    assert.equal(result.state, state)
  }
})

test('corrupt nonfinite, negative, over-capacity and over-dissolved chemistry is rejected, not repaired', () => {
  const state = chemistryWithSalt()
  for (const invalid of [
    null,
    {},
    { ...state, waterMl: null },
    { ...state, saltStockG: NaN },
    { ...state, saltOnBoatG: -1 },
    { ...state, saltOnSpatulaG: 6 },
    { ...state, dissolvedSaltG: 6 },
    { ...state, dissolvedSaltG: Infinity },
    { ...state, operations: -1 },
    { ...state, waterMl: { ...state.waterMl, beaker: 251 } },
    { ...state, waterMl: { ...state.waterMl, water: NaN } },
  ]) {
    const result = executeSaltCommand(invalid, stir, bench)
    assert.equal(result.ok, false)
    assert.equal(result.state, invalid)
  }
})

test('completion cannot be inferred from a clamped zero residual in an over-dissolved state', () => {
  const state = executeSaltCommand(chemistryWithSalt(), stir, bench).state
  assert.equal(isDemonstrationComplete({ ...state, dissolvedSaltG: 6 }), false)
  assert.equal(isDemonstrationComplete({ ...state, dissolvedSaltG: Infinity }), false)
})

test('stirring never rounds dissolved mass above the available solid or solubility', () => {
  const state = { ...chemistryWithSalt(), saltInBeakerG: 4.00006, saltStockG: 95.99994 }
  const result = executeSaltCommand({ ...state, dissolvedSaltG: 4 }, stir, bench)
  assert.equal(result.ok, true)
  assert.ok(result.state.dissolvedSaltG <= state.saltInBeakerG)
  assert.equal(result.state.dissolvedSaltG, state.saltInBeakerG)
  assert.equal(saltTotal(result.state), saltTotal(state))
  assert.equal(undissolvedSaltG({ ...state, dissolvedSaltG: 4.00004 }) > 0, true)
})

test('all four solid reservoirs and three water vessels conserve quantities over transfers and saturation', () => {
  let state = initialSaltExperimentState()
  for (const command of [
    pour('water', 'graduated-cylinder', 25),
    pour('graduated-cylinder', 'beaker', 25),
    scoop,
    deposit,
    add,
  ]) {
    const result = executeSaltCommand(state, command, bench)
    assert.equal(result.ok, true)
    state = result.state
    assert.equal(saltTotal(state), 100)
    assert.equal(waterTotal(state), 400)
  }
  state = executeSaltCommand(state, { ...add, source: 'sodium-chloride', massG: 15 }, bench).state
  for (let i = 0; i < 10; i++) {
    const next = executeSaltCommand(state, stir, bench)
    if (!next.ok) break
    state = next.state
    assert.ok(state.dissolvedSaltG <= maximumDissolvedSaltG(state))
    assert.equal(saltTotal(state), 100)
    assert.equal(waterTotal(state), 400)
  }
  assert.equal(state.dissolvedSaltG, maximumDissolvedSaltG(state))
  assert.ok(undissolvedSaltG(state) > 0)
  assert.equal(executeSaltCommand(state, pour('beaker', 'graduated-cylinder', 1), bench).ok, false)
  state = executeSaltCommand(state, pour('water', 'beaker', 25), bench).state
  assert.equal(executeSaltCommand(state, stir, bench).ok, true)
})

test('malformed semantic event envelopes return diagnostics instead of throwing', () => {
  const state = initialSaltExperimentState()
  const workflow = initialWorkflowState(definition)
  for (const event of [
    null,
    undefined,
    {},
    { type: 'UNKNOWN' },
    { type: 'toString' },
    { type: '__proto__' },
    { type: 'LIQUID_TRANSFER_COMPLETED', quantity: null },
  ]) {
    const result = applySimulationEvent(definition, workflow, state, bench, event)
    assert.equal(result.validation.valid, false)
    assert.equal(result.state.stepIndex, 0)
    assert.equal(simulation.getState().emit(event), false)
  }
})

test('even matching checkpoints cannot authenticate unphysical or nonconserved event state', () => {
  for (const state of [
    { ...initialSaltExperimentState(), saltStockG: 101 },
    { ...initialSaltExperimentState(), dissolvedSaltG: 1 },
    {
      ...initialSaltExperimentState(),
      waterMl: { water: 400, 'graduated-cylinder': 101, beaker: 0 },
    },
  ]) {
    const workflow = {
      ...initialWorkflowState(definition),
      chemistryCheckpoint: structuredClone(state),
    }
    const result = applySimulationEvent(definition, workflow, state, bench, {
      type: 'SAFETY_ACKNOWLEDGED',
    })
    assert.equal(result.validation.valid, false)
    assert.equal(result.state.safetyAcknowledged, false)
  }
})

test('pour ticks reject zero time, impossible tilt, placement and unrelated drags atomically', () => {
  prepareWater()
  const initial = simulation.getState().experiment
  for (const [angle, deltaMs] of [
    [0.75, 0],
    [0.75, -1],
    [0.75, NaN],
    [Infinity, 100],
    [10, 100],
  ]) {
    assert.equal(
      updatePhysicalPour({ actorId: 'water', targetId: 'graduated-cylinder', angle, deltaMs }),
      false,
    )
    assert.equal(simulation.getState().experiment, initial)
    assert.equal(simulation.getState().livePour, null)
  }
  lab.getState().beginDrag('beaker')
  assert.equal(simulation.getState().streamTick('water', 'graduated-cylinder', 0.75, 100), false)
  lab.getState().finishDrag()
  lab.setState({ placement: { id: 'spatula', position: { x: 0, z: 0 }, valid: true, message: '' } })
  assert.equal(simulation.getState().streamTick('water', 'graduated-cylinder', 0.75, 100), false)
  assert.equal(simulation.getState().experiment, initial)
  lab.setState({ placement: null })
  // A real held source is allowed to be the active drag.
  lab.getState().beginDrag('water')
  assert.equal(simulation.getState().streamTick('water', 'graduated-cylinder', 0.75, 100), true)
  lab.getState().finishDrag()
  restartExperimentSession()
})

test('active fractional pour serializes legacy commands until explicitly stopped', () => {
  prepareWater()
  assert.equal(simulation.getState().streamTick('water', 'graduated-cylinder', 0.75, 10), true)
  const before = simulation.getState().experiment
  assert.ok(simulation.getState().streamRemainderMl > 0)
  assert.equal(simulation.getState().execute(pour('water', 'graduated-cylinder', 100)), false)
  assert.equal(simulation.getState().experiment, before)
  simulation.getState().stopStream()
  assert.equal(simulation.getState().streamRemainderMl, 0)
  assert.equal(simulation.getState().execute(pour('water', 'graduated-cylinder', 100)), true)
  restartExperimentSession()
})

test('balance measurement requires the complete contact tuple, not merely a target ID', () => {
  prepareBoat()
  for (const relationship of [
    { actorId: 'weighing-boat', targetId: 'digital-balance', kind: 'insertion' },
    { actorId: 'spatula', targetId: 'digital-balance', kind: 'balance-contact' },
  ]) {
    lab.setState({ relationships: { 'weighing-boat': relationship } })
    const before = simulation.getState().workflow
    assert.equal(simulation.getState().emit(weigh), false)
    assert.equal(
      simulation.getState().dispatch({ kind: 'record-salt-measurement', selectedMassG: 5 }),
      false,
    )
    assert.equal(simulation.getState().workflow, before)
  }
  lab.getState().setRelationship({
    actorId: 'weighing-boat',
    targetId: 'digital-balance',
    kind: 'balance-contact',
  })
  assert.equal(simulation.getState().emit(weigh), true)
  assert.equal(simulation.getState().workflow.measurements.saltG, 5)
  // The predefined tared boat reports NaCl only, not stock or an invented gross load.
  assert.equal(simulation.getState().experiment.saltOnBoatG, 5)
  restartExperimentSession()
})

test('a rejected weighing gesture cannot leave a fabricated contact behind', () => {
  prepareBoat()
  // The chemistry is real, but its workflow evidence is deliberately stale.
  simulation.setState({
    workflow: {
      ...simulation.getState().workflow,
      chemistryCheckpoint: initialSaltExperimentState(),
    },
  })
  const before = lab.getState().relationships
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    false,
  )
  assert.deepEqual(lab.getState().relationships, before)
  restartExperimentSession()
})

test('measurement events cannot bypass active equipment movement', () => {
  prepareBoat()
  lab.getState().setRelationship({
    actorId: 'weighing-boat',
    targetId: 'digital-balance',
    kind: 'balance-contact',
  })
  lab.getState().beginDrag('water')
  assert.equal(simulation.getState().emit(weigh), false)
  assert.equal(simulation.getState().workflow.measurements.saltG, null)
  lab.getState().finishDrag()
  restartExperimentSession()
})

test('final review requires an idle scene and a placed solution beaker', () => {
  prepareStir()
  assert.equal(simulation.getState().execute(stir), true)
  finishEffect()
  assert.equal(simulation.getState().execute(stir), true)
  assert.equal(simulation.getState().workflow.stepIndex, 8)
  assert.equal(simulation.getState().emit({ type: 'REVIEW_INSPECTED' }), false)
  finishEffect()
  lab.getState().beginDrag('water')
  assert.equal(simulation.getState().emit({ type: 'REVIEW_INSPECTED' }), false)
  lab.getState().finishDrag()
  lab.setState({ placement: { id: 'spatula', position: { x: 0, z: 0 }, valid: true, message: '' } })
  assert.equal(simulation.getState().emit({ type: 'REVIEW_INSPECTED' }), false)
  lab.setState({ placement: null })
  lab.getState().removeFromBench('beaker')
  assert.equal(simulation.getState().emit({ type: 'REVIEW_INSPECTED' }), false)
  assert.equal(simulation.getState().workflow.completed, false)
  restartExperimentSession()
})

test('accepted event history owns a copy of caller-supplied quantities', () => {
  prepareBoat()
  lab.getState().setRelationship({
    actorId: 'weighing-boat',
    targetId: 'digital-balance',
    kind: 'balance-contact',
  })
  const payload = structuredClone(weigh)
  assert.equal(simulation.getState().emit(payload), true)
  payload.quantity.value = 500
  payload.sourceId = 'water'
  assert.equal(simulation.getState().events.at(-1).quantity.value, 5)
  assert.equal(simulation.getState().events.at(-1).sourceId, 'weighing-boat')
  restartExperimentSession()
})

test('reset invalidates stale effect callbacks and balance contacts across sessions', () => {
  prepareWater()
  assert.equal(simulation.getState().execute(pour('water', 'graduated-cylinder', 100)), true)
  const oldEffect = simulation.getState().effect
  prepareWater()
  assert.equal(simulation.getState().execute(pour('water', 'graduated-cylinder', 100)), true)
  const newEffect = simulation.getState().effect
  assert.notEqual(newEffect.id, oldEffect.id)
  simulation.getState().stopEffect(oldEffect.id)
  assert.equal(simulation.getState().effect, newEffect)
  finishEffect()
  lab.getState().setRelationship({
    actorId: 'weighing-boat',
    targetId: 'digital-balance',
    kind: 'balance-contact',
  })
  assert.equal(Object.keys(lab.getState().relationships).length, 1)
  const revision = simulation.getState().resetRevision
  simulation.getState().reset()
  assert.deepEqual(lab.getState().relationships, {})
  assert.equal(simulation.getState().resetRevision, revision + 1)
  assert.deepEqual(simulation.getState().experiment, initialSaltExperimentState())
  assert.equal(simulation.getState().effect, null)
  assert.equal(simulation.getState().livePour, null)
  assert.deepEqual(simulation.getState().events, [])
  restartExperimentSession()
})

test('explicit stirring elapsed time gives smooth partition-independent dissolution; legacy actions stay at 4 g', () => {
  const initial = chemistryWithSalt(100, 20)
  const legacy = executeSaltCommand(initial, stir, bench)
  assert.equal(legacy.state.dissolvedSaltG, 4)
  const whole = executeSaltCommand(initial, { ...stir, elapsedMs: 1500 }, bench)
  let partitioned = initial
  for (let i = 0; i < 15; i++) {
    const result = executeSaltCommand(partitioned, { ...stir, elapsedMs: 100 }, bench)
    assert.equal(result.ok, true)
    assert.ok(result.state.dissolvedSaltG > partitioned.dissolvedSaltG)
    assert.ok(result.state.dissolvedSaltG - partitioned.dissolvedSaltG < 0.27)
    partitioned = result.state
  }
  assert.ok(Math.abs(partitioned.dissolvedSaltG - whole.state.dissolvedSaltG) < 1e-10)
  assert.equal(saltTotal(partitioned), 100)
  for (const elapsedMs of [0, -1, NaN, Infinity, 1501, null, '100']) {
    const result = executeSaltCommand(initial, { ...stir, elapsedMs }, bench)
    assert.equal(result.ok, false, String(elapsedMs))
    assert.equal(result.state, initial)
  }
})

test('time-sliced stirring uses actual chemistry checkpoints and cannot complete the workflow early', () => {
  prepareStir()
  lab.getState().beginDrag('water')
  assert.equal(simulation.getState().execute({ ...stir, elapsedMs: 100 }), false)
  lab.getState().finishDrag()
  lab.getState().beginDrag('stirring-rod')
  assert.equal(
    handlePhysicalInteraction({ actorId: 'stirring-rod', targetId: 'beaker', gesture: 'stir' }),
    false,
  )
  for (let i = 0; i < 19; i++) {
    assert.equal(
      handlePhysicalInteraction({
        actorId: 'stirring-rod',
        targetId: 'beaker',
        gesture: 'stir',
        elapsedMs: 100,
      }),
      true,
    )
    const current = simulation.getState()
    assert.equal(
      current.effect,
      null,
      'time-sliced stirring must not lock the next frame behind an animation',
    )
    assert.equal(
      current.experiment.dissolvedSaltG,
      current.workflow.chemistryCheckpoint.dissolvedSaltG,
    )
    assert.equal(saltTotal(current.experiment), 100)
    if (i < 18) assert.equal(current.workflow.stepIndex, 6)
  }
  lab.getState().finishDrag()
  assert.equal(simulation.getState().experiment.dissolvedSaltG, 5)
  assert.equal(simulation.getState().workflow.stepIndex, 8)
  assert.equal(simulation.getState().workflow.completed, false)
  assert.equal(
    simulation.getState().events.filter((event) => event.type === 'STIRRING_REQUIREMENT_COMPLETED')
      .length,
    1,
  )
  restartExperimentSession()
})
