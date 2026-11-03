import assert from 'node:assert/strict'
import test from 'node:test'
import {
  acknowledgeLabSafety,
  handlePhysicalInteraction,
  stopPhysicalPour,
  updatePhysicalPour,
} from '../src/features/simulations/state/directInteractions.ts'
import { restartExperimentSession } from '../src/features/simulations/state/sessionActions.ts'
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useSaltSimulationStore } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import {
  initialCircularGesture,
  isCircularStir,
  traceCircularGesture,
} from '../src/features/simulations/three/gestureMath.ts'

function place(id) {
  const scene = useLabSceneStore.getState()
  scene.beginPlacement(id)
  assert.equal(useLabSceneStore.getState().confirmPlacement(), true, 'place ' + id)
}
function pourUntil(source, target, condition) {
  for (let i = 0; i < 80 && !condition(); i++)
    assert.equal(
      updatePhysicalPour({ actorId: source, targetId: target, angle: 0.75, deltaMs: 100 }),
      true,
    )
  stopPhysicalPour()
  assert.equal(condition(), true)
}

test('holding a tilted source creates partial transfer; moving away/straightening stops; reset clears', () => {
  restartExperimentSession()
  assert.equal(acknowledgeLabSafety(), true)
  place('water')
  place('graduated-cylinder')
  const initial = useSaltSimulationStore.getState().experiment
  assert.equal(
    updatePhysicalPour({
      actorId: 'water',
      targetId: 'graduated-cylinder',
      angle: 0.75,
      deltaMs: 100,
    }),
    true,
  )
  const partiallyFilled = useSaltSimulationStore.getState().experiment
  assert.ok(partiallyFilled.waterMl['graduated-cylinder'] > 0)
  assert.ok(partiallyFilled.waterMl['graduated-cylinder'] < 100)
  assert.equal(
    Object.values(partiallyFilled.waterMl).reduce((a, b) => a + b, 0),
    400,
  )
  assert.equal(
    updatePhysicalPour({ actorId: 'water', targetId: null, angle: 0.75, deltaMs: 100 }),
    false,
  )
  assert.equal(useSaltSimulationStore.getState().livePour, null)
  assert.equal(
    updatePhysicalPour({
      actorId: 'water',
      targetId: 'graduated-cylinder',
      angle: 0.1,
      deltaMs: 100,
    }),
    false,
  )
  assert.deepEqual(useSaltSimulationStore.getState().experiment.waterMl, partiallyFilled.waterMl)
  assert.equal(
    updatePhysicalPour({
      actorId: 'water',
      targetId: 'graduated-cylinder',
      angle: 0.75,
      deltaMs: 100,
    }),
    true,
  )
  assert.ok(useSaltSimulationStore.getState().livePour)
  restartExperimentSession()
  assert.equal(useSaltSimulationStore.getState().livePour, null)
  assert.equal(useSaltSimulationStore.getState().streamRemainderMl, 0)
  assert.deepEqual(useSaltSimulationStore.getState().experiment.waterMl, initial.waterMl)
})

test('spatula and boat conserve solid mass; measuring an empty boat is prohibited', () => {
  restartExperimentSession()
  assert.equal(acknowledgeLabSafety(), true)
  for (const id of ['water', 'graduated-cylinder', 'spatula', 'sodium-chloride', 'weighing-boat'])
    place(id)
  pourUntil(
    'water',
    'graduated-cylinder',
    () => useSaltSimulationStore.getState().experiment.waterMl['graduated-cylinder'] === 100,
  )
  pourUntil(
    'graduated-cylinder',
    'beaker',
    () => useSaltSimulationStore.getState().experiment.waterMl.beaker === 100,
  )
  assert.equal(useSaltSimulationStore.getState().workflow.stepIndex, 4)
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    false,
  )
  assert.equal(
    useSaltSimulationStore
      .getState()
      .dispatch({ kind: 'record-salt-measurement', selectedMassG: 5 }),
    false,
  )
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'spatula',
      targetId: 'sodium-chloride',
      gesture: 'scoop',
    }),
    true,
  )
  assert.equal(useSaltSimulationStore.getState().experiment.saltOnSpatulaG, 5)
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'spatula',
      targetId: 'sodium-chloride',
      gesture: 'scoop',
    }),
    false,
  )
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'spatula',
      targetId: 'weighing-boat',
      gesture: 'release',
    }),
    true,
  )
  const m = useSaltSimulationStore.getState().experiment
  assert.equal(m.saltStockG + m.saltOnSpatulaG + m.saltOnBoatG + m.saltInBeakerG, 100)
  assert.equal(m.saltOnBoatG, 5)
  assert.equal(useSaltSimulationStore.getState().workflow.measurements.saltG, null)
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    true,
  )
  assert.equal(useSaltSimulationStore.getState().workflow.measurements.saltG, 5)
  restartExperimentSession()
})

test('circular stirring accepts a genuine sweep, never stationary jitter or linear shaking', () => {
  const center = { x: 0, z: 0 }
  let circle = initialCircularGesture()
  for (let index = 0; index <= 28; index++) {
    const theta = (index / 28) * Math.PI * 2
    circle = traceCircularGesture(
      circle,
      { x: Math.cos(theta) * 0.15, z: Math.sin(theta) * 0.15 },
      center,
      index * 35,
    )
  }
  assert.equal(isCircularStir(circle, 1000), true)

  let stationary = initialCircularGesture()
  for (let i = 0; i < 30; i++)
    stationary = traceCircularGesture(stationary, { x: 0.15, z: 0 }, center, i * 35)
  assert.equal(isCircularStir(stationary, 1100), false)

  let shake = initialCircularGesture()
  for (let i = 0; i < 30; i++)
    shake = traceCircularGesture(
      shake,
      { x: 0.15 * Math.cos(i % 2 === 0 ? 0 : 0.5), z: 0.15 * Math.sin(i % 2 === 0 ? 0 : 0.5) },
      center,
      i * 35,
    )
  assert.equal(isCircularStir(shake, 1100), false)
})
