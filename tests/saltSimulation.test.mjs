import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CAPACITIES_ML,
  DEMO_ACTION_RULES,
  executeSaltCommand,
  initialSaltExperimentState,
  isDemonstrationComplete,
  maximumDissolvedSaltG,
  undissolvedSaltG,
} from '../src/features/simulations/engine/saltExperiment.ts'
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useSaltSimulationStore } from '../src/features/simulations/state/useSaltSimulationStore.ts'

const all = [
  'water',
  'graduated-cylinder',
  'beaker',
  'sodium-chloride',
  'digital-balance',
  'stirring-rod',
]
const pour = (source, target, amountMl) => ({ kind: 'pour', source, target, amountMl })
const salt = (massG) => ({
  kind: 'add-substance',
  source: 'sodium-chloride',
  target: 'beaker',
  massG,
})
const stir = { kind: 'stir', tool: 'stirring-rod', target: 'beaker' }
const massTotal = (s) => s.saltStockG + s.saltInBeakerG
const volumeTotal = (s) => Object.values(s.waterMl).reduce((acc, amount) => acc + amount, 0)

test('typed action registry declares explicit actors, targets and prerequisites', () => {
  assert.deepEqual(
    Object.keys(DEMO_ACTION_RULES).sort(),
    [
      'select',
      'pick-up',
      'place',
      'rotate',
      'pour',
      'add-substance',
      'scoop-salt',
      'deposit-salt',
      'stir',
      'measure',
      'inspect',
    ].sort(),
  )
  for (const rule of Object.values(DEMO_ACTION_RULES)) {
    assert.ok(rule.actors.length > 0)
    assert.ok(rule.prerequisite.length > 10)
  }
})

test('pouring maintains exact volume conservation and respects 100mL/250mL capacities', () => {
  const initial = initialSaltExperimentState()
  assert.equal(volumeTotal(initial), 400)
  assert.equal(CAPACITIES_ML['graduated-cylinder'], 100)
  let result = executeSaltCommand(initial, pour('water', 'graduated-cylinder', 100), all)
  assert.equal(result.ok, true)
  assert.equal(result.effect.kind, 'liquid-transfer')
  assert.deepEqual(result.state.waterMl, { water: 300, 'graduated-cylinder': 100, beaker: 0 })
  result = executeSaltCommand(result.state, pour('graduated-cylinder', 'beaker', 50), all)
  assert.equal(result.ok, true)
  assert.deepEqual(result.state.waterMl, { water: 300, 'graduated-cylinder': 50, beaker: 50 })
  assert.equal(volumeTotal(result.state), volumeTotal(initial))
})

test('invalid pouring is atomic, rejects empty vessels, nonphysical values, missing equipment and overflow', () => {
  const initial = initialSaltExperimentState()
  for (const [command, placed] of [
    [pour('water', 'beaker', 25), ['water']],
    [pour('water', 'graduated-cylinder', 101), all],
    [pour('graduated-cylinder', 'beaker', 10), all],
    [pour('water', 'beaker', 1000), all],
    [pour('water', 'beaker', -1), all],
    [pour('water', 'beaker', Number.NaN), all],
    [pour('water', 'beaker', 0.5), all],
    [pour('graduated-cylinder', 'graduated-cylinder', 1), all],
  ]) {
    const result = executeSaltCommand(initial, command, placed)
    assert.equal(result.ok, false)
    assert.equal(result.state, initial)
  }
  let filled = executeSaltCommand(initial, pour('water', 'beaker', 100), all).state
  filled = executeSaltCommand(filled, pour('water', 'beaker', 100), all).state
  assert.equal(executeSaltCommand(filled, pour('water', 'beaker', 100), all).ok, false)
  assert.equal(volumeTotal(filled), 400)
})

test('adding measured salt conserves NaCl mass; no chemistry appears until stirring', () => {
  let state = executeSaltCommand(
    initialSaltExperimentState(),
    pour('water', 'beaker', 100),
    all,
  ).state
  const added = executeSaltCommand(state, salt(5), all)
  assert.equal(added.ok, true)
  state = added.state
  assert.equal(state.saltStockG, 95)
  assert.equal(state.saltInBeakerG, 5)
  assert.equal(state.dissolvedSaltG, 0)
  assert.equal(undissolvedSaltG(state), 5)
  assert.equal(massTotal(state), 100)
  for (const bad of [-10, 0, 0.2, 999, Infinity]) {
    const result = executeSaltCommand(state, salt(bad), all)
    assert.equal(result.ok, false)
    assert.equal(result.state, state)
  }
  assert.equal(executeSaltCommand(state, salt(5), ['beaker', 'sodium-chloride']).ok, false)
  assert.equal(executeSaltCommand(initialSaltExperimentState(), salt(5), all).ok, false)
})

test('deterministic stirring reaches complete solution without inventing a new compound', () => {
  let state = executeSaltCommand(
    initialSaltExperimentState(),
    pour('water', 'beaker', 100),
    all,
  ).state
  state = executeSaltCommand(state, salt(5), all).state
  const first = executeSaltCommand(state, stir, all)
  assert.equal(first.ok, true)
  assert.equal(first.state.dissolvedSaltG, 4)
  assert.equal(undissolvedSaltG(first.state), 1)
  const second = executeSaltCommand(first.state, stir, all)
  assert.equal(second.ok, true)
  assert.equal(second.state.dissolvedSaltG, 5)
  assert.equal(undissolvedSaltG(second.state), 0)
  assert.equal(isDemonstrationComplete(second.state), true)
  assert.equal(executeSaltCommand(second.state, stir, all).ok, false)
  assert.equal(massTotal(second.state), 100)
})

test('stirring is capped by water-dependent NaCl solubility', () => {
  let state = executeSaltCommand(
    initialSaltExperimentState(),
    pour('water', 'beaker', 25),
    all,
  ).state
  state = executeSaltCommand(state, salt(20), all).state
  for (let i = 0; i < 10; i++) {
    const result = executeSaltCommand(state, stir, all)
    if (!result.ok) break
    state = result.state
  }
  assert.ok(Math.abs(state.dissolvedSaltG - maximumDissolvedSaltG(state)) < 0.00001)
  assert.ok(undissolvedSaltG(state) > 0)
  assert.equal(executeSaltCommand(state, stir, all).ok, false)
  state = executeSaltCommand(state, pour('water', 'beaker', 25), all).state
  assert.equal(executeSaltCommand(state, stir, all).ok, true)
})

test('Zustand integration rejects operations until equipment is placed and preserves state on error', () => {
  useLabSceneStore.getState().resetEquipment()
  useSaltSimulationStore.getState().reset()
  const initial = useSaltSimulationStore.getState().experiment
  assert.equal(useSaltSimulationStore.getState().execute(pour('water', 'beaker', 50)), false)
  assert.equal(useSaltSimulationStore.getState().experiment, initial)
  assert.equal(useSaltSimulationStore.getState().feedback.ok, false)
  useSaltSimulationStore.getState().reset()
})

test('successful store operation changes quantities, publishes an effect, and prevents overlapping commands', () => {
  useLabSceneStore.getState().resetEquipment()
  useSaltSimulationStore.getState().reset()
  useLabSceneStore.getState().beginPlacement('water')
  assert.equal(useLabSceneStore.getState().confirmPlacement(), true)
  useLabSceneStore.getState().beginPlacement('graduated-cylinder')
  assert.equal(useLabSceneStore.getState().confirmPlacement(), true)
  const simulation = useSaltSimulationStore
  assert.equal(simulation.getState().dispatch({ kind: 'acknowledge-safety' }), true)
  assert.equal(simulation.getState().dispatch({ kind: 'validate-step' }), true)
  assert.equal(simulation.getState().dispatch({ kind: 'validate-step' }), true)
  assert.equal(simulation.getState().execute(pour('water', 'graduated-cylinder', 100)), true)
  assert.equal(simulation.getState().experiment.waterMl.water, 300)
  assert.equal(simulation.getState().experiment.waterMl['graduated-cylinder'], 100)
  const effect = simulation.getState().effect
  assert.equal(effect.kind, 'liquid-transfer')
  assert.equal(effect.sourceId, 'water')
  assert.equal(effect.targetId, 'graduated-cylinder')
  const current = simulation.getState().experiment
  assert.equal(simulation.getState().execute(pour('water', 'beaker', 25)), false)
  assert.equal(simulation.getState().experiment, current)
  simulation.getState().stopEffect(effect.id + 1)
  assert.equal(simulation.getState().effect.id, effect.id)
  simulation.getState().stopEffect(effect.id)
  assert.equal(simulation.getState().effect, null)
  simulation.getState().reset()
  useLabSceneStore.getState().resetEquipment()
})
