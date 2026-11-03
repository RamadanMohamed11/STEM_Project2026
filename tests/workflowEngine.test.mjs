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
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useSaltSimulationStore } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import { getExperimentSessionSnapshot } from '../src/features/simulations/state/sessionSelectors.ts'

const fullBench = [
  'beaker',
  'graduated-cylinder',
  'water',
  'sodium-chloride',
  'digital-balance',
  'stirring-rod',
  'spatula',
  'weighing-boat',
]
const water = { kind: 'pour', source: 'water', target: 'graduated-cylinder', amountMl: 100 }
const transfer = { kind: 'pour', source: 'graduated-cylinder', target: 'beaker', amountMl: 100 }
const scoop = { kind: 'scoop-salt', tool: 'spatula', source: 'sodium-chloride', massG: 5 }
const deposit = { kind: 'deposit-salt', tool: 'spatula', target: 'weighing-boat', massG: 5 }
const salt = { kind: 'add-substance', source: 'weighing-boat', target: 'beaker', massG: 5 }
const stir = { kind: 'stir', tool: 'stirring-rod', target: 'beaker' }

function makeSession() {
  let workflow = initialWorkflowState(definition)
  let chemistry = initialSaltExperimentState()
  const act = (action, placedIds = fullBench) => {
    const result = transitionWorkflow(definition, workflow, chemistry, placedIds, action)
    if (result.validation.valid) workflow = result.state
    return result
  }
  const command = (cmd, placedIds = fullBench) => {
    const scientific = executeSaltCommand(chemistry, cmd, placedIds)
    assert.equal(scientific.ok, true, 'Test command must be valid chemistry')
    const result = transitionWorkflow(definition, workflow, scientific.state, placedIds, {
      kind: 'command',
      command: cmd,
      beforeChemistry: chemistry,
    })
    if (result.validation.valid) {
      workflow = result.state
      chemistry = scientific.state
    }
    return result
  }
  return {
    act,
    command,
    get workflow() {
      return workflow
    },
    get chemistry() {
      return chemistry
    },
  }
}

function advanceSetup(session) {
  assert.equal(session.act({ kind: 'acknowledge-safety' }).validation.valid, true)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.workflow.stepIndex, 2)
}

function weighSalt(session) {
  assert.equal(session.command(scoop).validation.valid, true)
  assert.equal(session.command(deposit).validation.valid, true)
  assert.equal(session.chemistry.saltOnBoatG, 5)
  assert.equal(
    session.act({ kind: 'record-salt-measurement', selectedMassG: 5 }).validation.valid,
    true,
  )
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
}

test('T08 definition is rendering-independent and contains nine ordered typed stages and safety rules', () => {
  assert.equal(definition.experimentId, 'exp-salt-water-001')
  assert.deepEqual(
    definition.steps.map((s) => s.id),
    [
      'prepare',
      'place-beaker',
      'measure-water',
      'transfer-water',
      'measure-salt',
      'add-salt',
      'stir',
      'observe',
      'review',
    ],
  )
  assert.equal(definition.measurementRequirements.waterMl.exact, 100)
  assert.equal(definition.measurementRequirements.saltG.exact, 5)
  assert.ok(definition.safetyRules.every((r) => r.instruction.length > 10))
  assert.ok(definition.resultExplanation.includes('no new compound'))
})

test('safety and placement checks block premature progression without changing workflow', () => {
  const session = makeSession()
  assert.equal(session.workflow.stepIndex, 0)
  const early = session.act({ kind: 'validate-step' })
  assert.equal(early.validation.valid, false)
  assert.ok(early.validation.code)
  assert.equal(session.workflow.stepIndex, 0)
  assert.equal(session.act({ kind: 'acknowledge-safety' }).validation.valid, true)
  assert.equal(session.workflow.stepIndex, 0)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.workflow.stepIndex, 1)
  assert.equal(session.act({ kind: 'validate-step' }, ['digital-balance']).validation.valid, false)
  assert.equal(session.workflow.stepIndex, 1)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.workflow.stepIndex, 2)
})

test('wrong operation sequence and wrong target reject valid chemistry without committing it', () => {
  const session = makeSession()
  advanceSetup(session)
  const wrong = session.command({ kind: 'pour', source: 'water', target: 'beaker', amountMl: 100 })
  assert.equal(wrong.validation.valid, false)
  assert.equal(session.workflow.stepIndex, 2)
  assert.equal(session.chemistry.waterMl.beaker, 0)
  assert.equal(
    session.act({ kind: 'record-water-measurement', valueMl: 100 }).validation.valid,
    false,
  )
  assert.equal(session.workflow.measurements.waterMl, null)
})

test('real cylinder content is required to record the 100 mL measurement', () => {
  const session = makeSession()
  advanceSetup(session)
  assert.equal(session.command(water).validation.valid, true)
  assert.equal(session.chemistry.waterMl['graduated-cylinder'], 100)
  assert.equal(
    session.act({ kind: 'record-water-measurement', valueMl: 50 }).validation.valid,
    false,
  )
  assert.equal(
    session.act({ kind: 'record-water-measurement', valueMl: 100 }).validation.valid,
    true,
  )
  assert.equal(session.workflow.measurements.waterMl, 100)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.workflow.stepIndex, 3)
  assert.equal(session.command(transfer).validation.valid, true)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.chemistry.waterMl.beaker, 100)
  assert.equal(session.chemistry.waterMl['graduated-cylinder'], 0)
})

test('chosen 5 g salt must be recorded and used; invalid additions remain atomic', () => {
  const session = makeSession()
  advanceSetup(session)
  session.command(water)
  session.act({ kind: 'record-water-measurement', valueMl: 100 })
  session.act({ kind: 'validate-step' })
  session.command(transfer)
  session.act({ kind: 'validate-step' })
  assert.equal(session.workflow.stepIndex, 4)
  assert.equal(
    session.act({ kind: 'record-salt-measurement', selectedMassG: 10 }).validation.valid,
    false,
  )
  assert.equal(
    session.act({ kind: 'record-salt-measurement', selectedMassG: 5 }).validation.valid,
    false,
  )
  weighSalt(session)
  assert.equal(session.workflow.measurements.saltG, 5)
  assert.equal(executeSaltCommand(session.chemistry, { ...salt, massG: 10 }, fullBench).ok, false)
  assert.equal(session.chemistry.saltInBeakerG, 0)
  assert.equal(session.command(salt).validation.valid, true)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.chemistry.saltStockG, 95)
  assert.equal(session.chemistry.saltInBeakerG, 5)
})

test('stirring progresses only with actual state changes and observation/review complete it', () => {
  const session = makeSession()
  advanceSetup(session)
  session.command(water)
  session.act({ kind: 'record-water-measurement', valueMl: 100 })
  session.act({ kind: 'validate-step' })
  session.command(transfer)
  session.act({ kind: 'validate-step' })
  weighSalt(session)
  session.command(salt)
  session.act({ kind: 'validate-step' })
  assert.equal(session.workflow.stepIndex, 6)
  assert.equal(session.command(stir).validation.valid, true)
  assert.equal(session.chemistry.dissolvedSaltG, 4)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, false)
  assert.equal(session.workflow.completed, false)
  assert.equal(session.command(stir).validation.valid, true)
  assert.equal(session.chemistry.dissolvedSaltG, 5)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.workflow.stepIndex, 7)
  assert.equal(
    session.act({ kind: 'record-observation', observation: 'visible-solid' }).validation.valid,
    false,
  )
  assert.equal(
    session.act({ kind: 'record-observation', observation: 'no-visible-solid' }).validation.valid,
    true,
  )
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.workflow.stepIndex, 8)
  assert.equal(session.act({ kind: 'finish-review' }).validation.valid, true)
  assert.equal(session.act({ kind: 'validate-step' }).validation.valid, true)
  assert.equal(session.workflow.completed, true)
  assert.equal(session.act({ kind: 'finish-review' }).validation.valid, false)
  assert.equal(
    session.command({ kind: 'pour', source: 'water', target: 'beaker', amountMl: 25 }).validation
      .valid,
    false,
  )
})

test('Zustand session executes the full validated workflow with synchronized scene data', () => {
  const lab = useLabSceneStore
  const simulation = useSaltSimulationStore
  lab.getState().resetEquipment()
  simulation.getState().reset()
  assert.equal(
    getExperimentSessionSnapshot().safetyWarnings.some((rule) => rule.blocking),
    true,
  )
  assert.equal(simulation.getState().emit({ type: 'SAFETY_ACKNOWLEDGED' }), true)
  assert.equal(
    simulation.getState().emit({ type: 'EQUIPMENT_PLACEMENT_VALIDATED', equipmentId: 'beaker' }),
    true,
  )
  for (const id of [
    'water',
    'graduated-cylinder',
    'sodium-chloride',
    'stirring-rod',
    'spatula',
    'weighing-boat',
  ]) {
    lab.getState().beginPlacement(id)
    assert.equal(getExperimentSessionSnapshot().interactionStatus, 'placing')
    assert.equal(lab.getState().confirmPlacement(), true)
  }
  const perform = (command) => {
    assert.equal(simulation.getState().execute(command), true)
    const effect = simulation.getState().effect
    if (effect) {
      assert.equal(getExperimentSessionSnapshot().interactionStatus, 'animating')
      simulation.getState().stopEffect(effect.id)
    }
  }
  const physicalPour = (source, target) => {
    for (let i = 0; i < 80 && simulation.getState().experiment.waterMl[target] < 100; i++) {
      assert.equal(simulation.getState().streamTick(source, target, 0.75, 100), true)
    }
    simulation.getState().stopStream()
    assert.equal(simulation.getState().experiment.waterMl[target], 100)
  }
  physicalPour('water', 'graduated-cylinder')
  assert.equal(simulation.getState().workflow.measurements.waterMl, 100)
  physicalPour('graduated-cylinder', 'beaker')
  assert.equal(simulation.getState().workflow.stepIndex, 4)
  perform(scoop)
  perform(deposit)
  lab.getState().setRelationship({
    actorId: 'weighing-boat',
    targetId: 'digital-balance',
    kind: 'balance-contact',
  })
  assert.equal(
    simulation.getState().emit({
      type: 'MASS_MEASUREMENT_RECORDED',
      sourceId: 'weighing-boat',
      targetId: 'digital-balance',
      substance: 'NaCl',
      quantity: { value: 5, unit: 'g' },
    }),
    true,
  )
  perform(salt)
  assert.equal(simulation.getState().workflow.stepIndex, 6)
  perform(stir)
  assert.equal(simulation.getState().workflow.stepIndex, 6)
  perform(stir)
  assert.equal(simulation.getState().workflow.stepIndex, 8)
  assert.equal(simulation.getState().workflow.completed, false)
  assert.equal(simulation.getState().emit({ type: 'REVIEW_INSPECTED' }), true)
  const snapshot = getExperimentSessionSnapshot()
  assert.equal(snapshot.experimentCompleted, true)
  assert.equal(snapshot.activeExperimentId, definition.experimentId)
  assert.deepEqual(snapshot.measurements, { waterMl: 100, saltG: 5 })
  assert.equal(snapshot.containers.beaker, 100)
  assert.equal(snapshot.substances.dissolvedSaltG, 5)
  assert.equal(
    snapshot.safetyWarnings.some((rule) => rule.blocking),
    false,
  )
  assert.equal(snapshot.interactionStatus, 'idle')
  assert.equal(snapshot.equipmentInstances.length, 8)
  assert.equal(simulation.getState().execute(water), false)
  simulation.getState().reset()
  lab.getState().resetEquipment()
  assert.equal(getExperimentSessionSnapshot().experimentCompleted, false)
})
