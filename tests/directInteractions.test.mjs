import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findSpatialAffordance,
  isSpatialTarget,
} from '../src/features/simulations/engine/spatialInteractions.ts'
import {
  acknowledgeLabSafety,
  advanceValidatedWorkflow,
  handlePhysicalInteraction,
  inspectFinalSolution,
  updatePhysicalPour,
  stopPhysicalPour,
} from '../src/features/simulations/state/directInteractions.ts'
import {
  findGestureTarget,
  overBeakerOpening,
} from '../src/features/simulations/three/equipmentGestures.ts'
import { restartExperimentSession } from '../src/features/simulations/state/sessionActions.ts'
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useSaltSimulationStore } from '../src/features/simulations/state/useSaltSimulationStore.ts'

function finishVisualEffect() {
  const simulation = useSaltSimulationStore.getState()
  if (simulation.effect) simulation.stopEffect(simulation.effect.id)
  advanceValidatedWorkflow()
}

test('semantic 3D affordances reject wrong actors, targets and gestures', () => {
  assert.equal(findSpatialAffordance('water', 'beaker', 'tilt'), null)
  assert.equal(findSpatialAffordance('water', 'graduated-cylinder', 'release'), null)
  assert.equal(findSpatialAffordance('sodium-chloride', 'digital-balance', 'tilt'), null)
  assert.equal(isSpatialTarget('stirring-rod', 'beaker'), true)
  assert.equal(isSpatialTarget('digital-balance', 'water'), false)
  restartExperimentSession()
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'water',
      targetId: 'graduated-cylinder',
      gesture: 'tilt',
      magnitude: 0.4,
    }),
    false,
  )
  assert.equal(useSaltSimulationStore.getState().experiment.waterMl.water, 400)
  assert.equal(
    findGestureTarget('water', 'tilt', { x: 0, z: 0 }, ['water', 'graduated-cylinder'], {
      water: { x: 0, z: 0 },
      'graduated-cylinder': { x: 0.7, z: 0 },
    }),
    'graduated-cylinder',
  )
  assert.equal(
    findGestureTarget('water', 'tilt', { x: 0, z: 0 }, ['water', 'graduated-cylinder'], {
      water: { x: 0, z: 0 },
      'graduated-cylinder': { x: 2, z: 0 },
    }),
    null,
  )
  assert.equal(overBeakerOpening({ x: 0.55, z: 0.08 }, ['beaker'], {}), true)
  assert.equal(overBeakerOpening({ x: 1.5, z: 0.08 }, ['beaker'], {}), false)
})

test('held real-time pour and physical tools complete the nine-stage deterministic workflow', () => {
  restartExperimentSession()
  const lab = useLabSceneStore
  const simulation = useSaltSimulationStore
  assert.equal(acknowledgeLabSafety(), true)
  assert.equal(simulation.getState().workflow.stepIndex, 2)

  for (const id of [
    'water',
    'graduated-cylinder',
    'sodium-chloride',
    'stirring-rod',
    'spatula',
    'weighing-boat',
  ]) {
    lab.getState().beginPlacement(id)
    assert.equal(lab.getState().confirmPlacement(), true, 'Place ' + id)
  }

  assert.equal(
    updatePhysicalPour({ actorId: 'water', targetId: 'beaker', angle: 0.7, deltaMs: 100 }),
    false,
  )
  assert.equal(
    updatePhysicalPour({
      actorId: 'water',
      targetId: 'graduated-cylinder',
      angle: 0.2,
      deltaMs: 100,
    }),
    false,
  )
  for (
    let i = 0;
    i < 80 && simulation.getState().experiment.waterMl['graduated-cylinder'] < 100;
    i++
  ) {
    assert.equal(
      updatePhysicalPour({
        actorId: 'water',
        targetId: 'graduated-cylinder',
        angle: 0.75,
        deltaMs: 100,
      }),
      true,
    )
  }
  assert.equal(simulation.getState().workflow.stepIndex, 3)
  assert.equal(simulation.getState().experiment.waterMl['graduated-cylinder'], 100)
  stopPhysicalPour()
  assert.equal(simulation.getState().workflow.stepIndex, 3)
  assert.equal(simulation.getState().workflow.measurements.waterMl, 100)

  for (let i = 0; i < 80 && simulation.getState().experiment.waterMl.beaker < 100; i++) {
    assert.equal(
      updatePhysicalPour({
        actorId: 'graduated-cylinder',
        targetId: 'beaker',
        angle: 0.75,
        deltaMs: 100,
      }),
      true,
    )
  }
  stopPhysicalPour()
  assert.equal(simulation.getState().workflow.stepIndex, 4)
  assert.equal(simulation.getState().experiment.waterMl.beaker, 100)

  assert.equal(
    handlePhysicalInteraction({
      actorId: 'spatula',
      targetId: 'sodium-chloride',
      gesture: 'scoop',
    }),
    true,
  )
  assert.equal(simulation.getState().experiment.saltOnSpatulaG, 5)
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'spatula',
      targetId: 'weighing-boat',
      gesture: 'release',
    }),
    true,
  )
  assert.equal(simulation.getState().experiment.saltOnBoatG, 5)
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    true,
  )
  assert.equal(lab.getState().relationships['weighing-boat']?.kind, 'balance-contact')
  assert.equal(simulation.getState().workflow.measurements.saltG, 5)
  assert.equal(simulation.getState().workflow.stepIndex, 5)

  assert.equal(
    handlePhysicalInteraction({ actorId: 'weighing-boat', targetId: 'beaker', gesture: 'tilt' }),
    true,
  )
  finishVisualEffect()
  assert.equal(simulation.getState().experiment.saltInBeakerG, 5)
  assert.equal(simulation.getState().workflow.stepIndex, 6)

  assert.equal(
    handlePhysicalInteraction({ actorId: 'stirring-rod', targetId: 'beaker', gesture: 'release' }),
    false,
  )
  assert.equal(
    handlePhysicalInteraction({ actorId: 'stirring-rod', targetId: 'beaker', gesture: 'stir' }),
    true,
  )
  finishVisualEffect()
  assert.equal(simulation.getState().experiment.dissolvedSaltG, 4)
  assert.equal(simulation.getState().workflow.stepIndex, 6)
  assert.equal(
    handlePhysicalInteraction({ actorId: 'stirring-rod', targetId: 'beaker', gesture: 'stir' }),
    true,
  )
  finishVisualEffect()

  assert.equal(simulation.getState().workflow.stepIndex, 8)
  assert.equal(simulation.getState().workflow.completed, false)
  assert.equal(inspectFinalSolution('water'), false)
  assert.equal(inspectFinalSolution('beaker'), true)
  const final = simulation.getState()
  assert.equal(final.workflow.completed, true)
  assert.ok(final.events.some((event) => event.type === 'LIQUID_TRANSFER_COMPLETED'))
  assert.ok(final.events.some((event) => event.type === 'SOLID_TRANSFER_COMPLETED'))
  assert.ok(final.events.some((event) => event.type === 'STIRRING_REQUIREMENT_COMPLETED'))
  assert.equal(final.events.at(-1).type, 'REVIEW_INSPECTED')
  assert.equal(final.workflow.stepIndex, 8)
  assert.equal(final.workflow.measurements.saltG, 5)
  assert.equal(final.experiment.dissolvedSaltG, 5)
  assert.equal(final.experiment.waterMl.water, 300)
  assert.equal(final.experiment.waterMl['graduated-cylinder'], 0)
  assert.equal(final.experiment.waterMl.beaker, 100)
  assert.equal(final.experiment.saltStockG, 95)
  assert.equal(final.experiment.saltOnSpatulaG, 0)
  assert.equal(final.experiment.saltOnBoatG, 0)

  restartExperimentSession()
  assert.equal(simulation.getState().workflow.completed, false)
  assert.equal(simulation.getState().workflow.stepIndex, 0)
  assert.deepEqual(lab.getState().relationships, {})
})
