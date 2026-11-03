import assert from 'node:assert/strict'
import test from 'node:test'
import { saltExperimentDefinition as definition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import { initialSaltExperimentState } from '../src/features/simulations/engine/saltExperiment.ts'
import { initialWorkflowState } from '../src/features/simulations/engine/workflow.ts'
import {
  getNextAction,
  getRequiredEquipment,
} from '../src/features/simulations/lib/executionGuideSelectors.ts'
import { restartExperimentSession } from '../src/features/simulations/state/sessionActions.ts'
import { getExperimentSessionSnapshot } from '../src/features/simulations/state/sessionSelectors.ts'
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useSaltSimulationStore } from '../src/features/simulations/state/useSaltSimulationStore.ts'

test('guide starts at the actual validated step, showing contextual next action', () => {
  const start = initialWorkflowState(definition)
  assert.equal(start.stepIndex, 0)
  assert.match(
    getNextAction(definition, start, initialSaltExperimentState(), ['beaker']),
    /Acknowledge precautions/,
  )
  const atMeasure = { ...start, stepIndex: 2, safetyAcknowledged: true }
  assert.deepEqual(getRequiredEquipment(definition.steps[2]), ['water', 'graduated-cylinder'])
  assert.match(
    getNextAction(definition, atMeasure, initialSaltExperimentState(), ['beaker']),
    /Place the required equipment/,
  )
  assert.match(
    getNextAction(definition, atMeasure, initialSaltExperimentState(), [
      'beaker',
      'water',
      'graduated-cylinder',
    ]),
    /Transfer exactly 100 mL/,
  )
  const afterPour = { ...atMeasure, commandEvidence: { 'measure-water': 1 } }
  const partialWater = {
    ...initialSaltExperimentState(),
    waterMl: { water: 350, 'graduated-cylinder': 50, beaker: 0 },
  }
  assert.match(
    getNextAction(definition, afterPour, partialWater, ['beaker', 'water', 'graduated-cylinder']),
    /Keep the source tilted/,
  )
  const fullWater = {
    ...initialSaltExperimentState(),
    waterMl: { water: 300, 'graduated-cylinder': 100, beaker: 0 },
  }
  assert.match(
    getNextAction(definition, afterPour, fullWater, ['beaker', 'water', 'graduated-cylinder']),
    /Record the actual modelled volume/,
  )
  const afterRecording = { ...afterPour, measurements: { waterMl: 100, saltG: null } }
  assert.match(
    getNextAction(definition, afterRecording, fullWater, ['beaker', 'water', 'graduated-cylinder']),
    /validated automatically/,
  )
})

test('guide distinguishes partial dissolution, observation, and completed state', () => {
  const start = initialWorkflowState(definition)
  const chemistry = initialSaltExperimentState()
  const stirStep = {
    ...start,
    stepIndex: 6,
    measurements: { waterMl: 100, saltG: 5 },
    commandEvidence: { stir: 1 },
  }
  const partial = {
    ...chemistry,
    waterMl: { ...chemistry.waterMl, beaker: 100 },
    saltInBeakerG: 5,
    dissolvedSaltG: 4,
  }
  assert.match(
    getNextAction(definition, stirStep, partial, ['beaker', 'stirring-rod']),
    /repeated circles/,
  )
  const finishedDissolving = { ...partial, dissolvedSaltG: 5 }
  assert.match(
    getNextAction(definition, stirStep, finishedDissolving, ['beaker', 'stirring-rod']),
    /validated automatically/,
  )
  assert.match(
    getNextAction(definition, { ...start, stepIndex: 7 }, finishedDissolving, ['beaker']),
    /record the supported observation/,
  )
  assert.match(
    getNextAction(definition, { ...start, completed: true }, finishedDissolving, ['beaker']),
    /completed results/,
  )
})

test('single retry action resets all chemistry, workflow, transforms, selection, previews, animations and camera', () => {
  const spatial = useLabSceneStore
  const educational = useSaltSimulationStore
  restartExperimentSession()
  const priorRevision = educational.getState().resetRevision
  const priorCamera = spatial.getState().cameraResetKey
  educational.getState().dispatch({ kind: 'acknowledge-safety' })
  educational.getState().dispatch({ kind: 'validate-step' })
  spatial.getState().beginPlacement('water')
  assert.equal(spatial.getState().confirmPlacement(), true)
  spatial.getState().move('beaker', { x: 0.9, z: 0.15 })
  spatial.getState().rotate('beaker', 1)
  spatial.getState().select('water')
  spatial.getState().setHovered('beaker')
  assert.equal(educational.getState().workflow.safetyAcknowledged, true)
  assert.ok(spatial.getState().rotations.beaker > 0)
  restartExperimentSession()
  const snapshot = getExperimentSessionSnapshot()
  assert.equal(snapshot.currentStepIndex, 0)
  assert.equal(snapshot.experimentCompleted, false)
  assert.deepEqual(snapshot.measurements, { waterMl: null, saltG: null })
  assert.deepEqual(snapshot.containers, { water: 400, 'graduated-cylinder': 0, beaker: 0 })
  assert.deepEqual(snapshot.substances, {
    saltStockG: 100,
    saltOnSpatulaG: 0,
    saltOnBoatG: 0,
    saltInBeakerG: 0,
    dissolvedSaltG: 0,
  })
  assert.equal(snapshot.selectedEquipmentId, null)
  assert.equal(snapshot.interactionStatus, 'idle')
  assert.deepEqual(
    snapshot.equipmentInstances
      .filter((item) => item.placed)
      .map((item) => item.id)
      .sort(),
    ['beaker', 'digital-balance'],
  )
  assert.ok(snapshot.equipmentInstances.every((item) => item.rotationY === 0))
  assert.equal(educational.getState().effect, null)
  assert.equal(educational.getState().validation, null)
  assert.equal(educational.getState().feedback, null)
  assert.deepEqual(educational.getState().events, [])
  assert.equal(educational.getState().workflow.safetyAcknowledged, false)
  assert.equal(educational.getState().resetRevision, priorRevision + 1)
  assert.equal(spatial.getState().cameraResetKey, priorCamera + 1)
  assert.equal(spatial.getState().placement, null)
  assert.equal(spatial.getState().hoveredId, null)
  assert.equal(spatial.getState().feedback, null)
  restartExperimentSession()
  assert.deepEqual(getExperimentSessionSnapshot().containers, snapshot.containers)
})

test('retry cancels an ongoing pour and a pending placement; stale effect completion cannot revive animation', () => {
  const lab = useLabSceneStore
  const simulation = useSaltSimulationStore
  restartExperimentSession()
  simulation.getState().dispatch({ kind: 'acknowledge-safety' })
  simulation.getState().dispatch({ kind: 'validate-step' })
  simulation.getState().dispatch({ kind: 'validate-step' })
  for (const id of ['water', 'graduated-cylinder']) {
    lab.getState().beginPlacement(id)
    assert.equal(lab.getState().confirmPlacement(), true)
  }
  assert.equal(
    simulation
      .getState()
      .execute({ kind: 'pour', source: 'water', target: 'graduated-cylinder', amountMl: 100 }),
    true,
  )
  const oldEffectId = simulation.getState().effect.id
  assert.equal(getExperimentSessionSnapshot().interactionStatus, 'animating')
  restartExperimentSession()
  assert.equal(simulation.getState().effect, null)
  assert.equal(simulation.getState().experiment.waterMl.water, 400)
  simulation.getState().stopEffect(oldEffectId)
  assert.equal(simulation.getState().effect, null)
  lab.getState().beginPlacement('sodium-chloride')
  assert.equal(getExperimentSessionSnapshot().interactionStatus, 'placing')
  restartExperimentSession()
  assert.equal(lab.getState().placement, null)
  assert.equal(getExperimentSessionSnapshot().interactionStatus, 'idle')
})

test('the live event dispatcher refuses fabricated transfers and unattached balance readings', () => {
  restartExperimentSession()
  const simulation = useSaltSimulationStore
  const scene = useLabSceneStore
  assert.equal(simulation.getState().emit({ type: 'SAFETY_ACKNOWLEDGED' }), true)
  assert.equal(
    simulation.getState().emit({ type: 'EQUIPMENT_PLACEMENT_VALIDATED', equipmentId: 'beaker' }),
    true,
  )
  for (const id of ['water', 'graduated-cylinder', 'weighing-boat']) {
    scene.getState().beginPlacement(id)
    assert.equal(scene.getState().confirmPlacement(), true)
  }
  const beforeWorkflow = simulation.getState().workflow
  const beforeChemistry = simulation.getState().experiment
  const beforeEvents = simulation.getState().events.length
  assert.equal(
    simulation.getState().emit({
      type: 'LIQUID_TRANSFER_COMPLETED',
      sourceId: 'water',
      targetId: 'graduated-cylinder',
      quantity: { value: 100, unit: 'mL' },
      totalVolumeMl: 100,
    }),
    false,
  )
  assert.equal(simulation.getState().workflow.stepIndex, beforeWorkflow.stepIndex)
  assert.equal(simulation.getState().experiment, beforeChemistry)
  assert.equal(simulation.getState().events.length, beforeEvents)
  assert.equal(
    simulation.getState().emit({
      type: 'MASS_MEASUREMENT_RECORDED',
      sourceId: 'weighing-boat',
      targetId: 'digital-balance',
      substance: 'NaCl',
      quantity: { value: 5, unit: 'g' },
    }),
    false,
  )
  assert.equal(simulation.getState().validation.code, 'BOAT_NOT_ON_BALANCE')
  assert.equal(simulation.getState().events.length, beforeEvents)
  restartExperimentSession()
  assert.deepEqual(simulation.getState().events, [])
  assert.equal(simulation.getState().workflow.stepIndex, 0)
})
