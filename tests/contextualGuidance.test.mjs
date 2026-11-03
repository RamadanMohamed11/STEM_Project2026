import assert from 'node:assert/strict'
import test from 'node:test'
import { getContextualGuidance } from '../src/features/simulations/lib/contextualGuidance.ts'
import { saltExperimentDefinition as definition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import { initialSaltExperimentState } from '../src/features/simulations/engine/saltExperiment.ts'
import { initialWorkflowState } from '../src/features/simulations/engine/workflow.ts'
import { equipmentRegistry } from '../src/features/simulations/three/sceneConfig.ts'

const equipmentIds = Object.freeze(equipmentRegistry.map(({ id }) => id))
const initialPositions = () =>
  Object.fromEntries(
    equipmentRegistry.map(({ id, defaultPosition }) => [id, { ...defaultPosition }]),
  )
const indexFor = (id) => definition.steps.findIndex((step) => step.id === id)

/** Minimal plain-data fixture; no React, physics, WebGL or global store. */
function fixture(stepId = 'prepare', overrides = {}) {
  const baseWorkflow = initialWorkflowState(definition)
  const workflow = {
    ...baseWorkflow,
    stepIndex: indexFor(stepId),
    ...overrides.workflow,
  }
  return {
    workflow,
    experiment: { ...initialSaltExperimentState(), ...overrides.experiment },
    placedIds: equipmentIds,
    selectedId: null,
    hoveredId: null,
    draggingId: null,
    positions: initialPositions(),
    relationships: {},
    livePour: null,
    validation: null,
    feedback: null,
    events: [],
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => key !== 'workflow' && key !== 'experiment'),
    ),
  }
}

test('safety is the first explicit instruction with no invented equipment action', () => {
  const guide = getContextualGuidance(fixture())
  assert.equal(guide.stepId, 'prepare')
  assert.match(guide.instruction, /safety.*acknowledge/i)
  assert.equal(guide.progress, 0)
  assert.equal(guide.targetId, null)
  assert.equal(guide.interactionHint, null)
  assert.equal(guide.tone, 'neutral')
})

test('placement reflects the actual inventory preview, without validating anything', () => {
  const noBeaker = equipmentIds.filter((id) => id !== 'beaker')
  const input = fixture('place-beaker', {
    placedIds: noBeaker,
    placementId: 'beaker',
  })
  const snapshot = structuredClone(input)
  const guide = getContextualGuidance(input)
  assert.equal(guide.actorId, 'beaker')
  assert.match(guide.interactionHint, /position the beaker/i)
  assert.equal(guide.targetId, null)
  assert.equal(guide.progress, 11)
  assert.deepEqual(input, snapshot, 'selector must never mutate its input')
})

test('a pre-placed beaker is reported as present rather than asking for redundant placement', () => {
  const guide = getContextualGuidance(fixture('place-beaker'))
  assert.match(guide.instruction, /already placed/i)
  assert.equal(guide.progress, 11)
})

test('water measurement uses the true remaining quantity and valid cylinder target', () => {
  const input = fixture('measure-water', { selectedId: 'water' })
  const far = getContextualGuidance(input)
  assert.equal(far.targetId, 'graduated-cylinder')
  assert.equal(far.proximity, 'far')
  assert.match(far.instruction, /100 mL/i)
  assert.match(far.interactionHint, /closer.*graduated cylinder/i)

  input.positions.water = { x: -0.94, z: -0.19 }
  input.hoveredId = 'graduated-cylinder'
  const near = getContextualGuidance(input)
  assert.equal(near.proximity, 'near')
  assert.match(near.interactionHint, /in range/i)
  assert.equal(near.progress, 22)
})

test('held live pour updates the instruction from real 37 mL and never fakes completion', () => {
  const input = fixture('measure-water', {
    selectedId: 'water',
    draggingId: 'water',
    experiment: {
      waterMl: { water: 363, 'graduated-cylinder': 37, beaker: 0 },
    },
    livePour: { sourceId: 'water', targetId: 'graduated-cylinder', angle: 0.64 },
  })
  const guidance = getContextualGuidance(input)
  assert.match(guidance.instruction, /63 mL more/i)
  assert.match(guidance.interactionHint, /Water is flowing/i)
  assert.equal(guidance.tone, 'success')
  assert.equal(guidance.progress, 22)
  input.experiment.waterMl['graduated-cylinder'] = 100
  input.experiment.waterMl.water = 300
  input.livePour = null
  assert.match(getContextualGuidance(input).instruction, /100 mL.*checked/i)
})

test('cylinder-to-beaker instruction follows beaker volume, not prior cylinder reading', () => {
  const input = fixture('transfer-water', {
    selectedId: 'graduated-cylinder',
    experiment: {
      waterMl: { water: 300, 'graduated-cylinder': 100, beaker: 0 },
    },
  })
  assert.equal(getContextualGuidance(input).actorId, 'graduated-cylinder')
  assert.equal(getContextualGuidance(input).targetId, 'beaker')
  assert.match(getContextualGuidance(input).instruction, /100 mL remaining/i)
  input.experiment.waterMl.beaker = 42
  input.experiment.waterMl['graduated-cylinder'] = 58
  assert.match(getContextualGuidance(input).instruction, /58 mL remaining/i)
  input.experiment.waterMl.beaker = 100
  input.experiment.waterMl['graduated-cylinder'] = 0
  assert.match(getContextualGuidance(input).instruction, /100 mL.*checked automatically/i)
})

test('salt workflow guides actual spatula scoop, deposit and balance attachment', () => {
  const input = fixture('measure-salt', { selectedId: 'spatula' })
  let guide = getContextualGuidance(input)
  assert.equal(guide.targetId, 'sodium-chloride')
  assert.match(guide.instruction, /scoop.*5 g/i)

  input.experiment.saltOnSpatulaG = 5
  guide = getContextualGuidance(input)
  assert.equal(guide.actorId, 'spatula')
  assert.equal(guide.targetId, 'weighing-boat')
  assert.match(guide.instruction, /5 g.*weighing boat/i)
  input.experiment.saltOnSpatulaG = 0
  input.experiment.saltOnBoatG = 5
  input.selectedId = 'weighing-boat'
  guide = getContextualGuidance(input)
  assert.equal(guide.targetId, 'digital-balance')
  assert.match(guide.instruction, /digital balance/i)
  input.relationships = {
    'weighing-boat': {
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      kind: 'balance-contact',
    },
  }
  guide = getContextualGuidance(input)
  assert.match(guide.instruction, /on the balance.*5 g/i)
  assert.match(guide.instruction, /checked automatically/i)
})

test('weighed boat pours into beaker; direct NaCl jar is never suggested', () => {
  const input = fixture('add-salt', {
    selectedId: 'sodium-chloride',
    workflow: { measurements: { waterMl: 100, saltG: 5 } },
  })
  let guide = getContextualGuidance(input)
  assert.equal(guide.actorId, 'weighing-boat')
  assert.equal(guide.targetId, null, 'jar selection cannot highlight a receiver')
  assert.match(guide.interactionHint, /needs the weighing boat/i)
  input.selectedId = 'weighing-boat'
  guide = getContextualGuidance(input)
  assert.equal(guide.targetId, 'beaker')
  assert.match(guide.instruction, /Tilt the weighed 5 g NaCl/i)
})

test('stirring indicates remaining crystals and a circular motion rather than shaking', () => {
  const input = fixture('stir', {
    selectedId: 'stirring-rod',
    experiment: { saltInBeakerG: 5, dissolvedSaltG: 0 },
  })
  assert.match(getContextualGuidance(input).instruction, /5 g.*undissolved/i)
  assert.match(getContextualGuidance(input).interactionHint, /sustained circles/i)
  input.experiment.dissolvedSaltG = 4
  assert.match(getContextualGuidance(input).instruction, /1 g.*undissolved/i)
  input.experiment.dissolvedSaltG = 5
  assert.match(getContextualGuidance(input).instruction, /No undissolved salt remains/i)
})

test('incompatible hovered apparatus warns without generating a false physical action', () => {
  const input = fixture('measure-water', {
    selectedId: 'water',
    hoveredId: 'sodium-chloride',
  })
  const guide = getContextualGuidance(input)
  assert.equal(guide.targetId, 'graduated-cylinder')
  assert.equal(guide.tone, 'warning')
  assert.match(guide.feedback, /not the correct target/i)
  assert.match(guide.feedback, /graduated cylinder/i)
  assert.equal(input.workflow.stepIndex, 2)
  assert.equal(input.experiment.operations, 0)
})

test('missing equipment never highlights unavailable receivers', () => {
  const input = fixture('measure-water', {
    selectedId: 'water',
    placedIds: ['water', 'beaker', 'digital-balance'],
  })
  const guide = getContextualGuidance(input)
  assert.equal(guide.targetId, null)
  assert.equal(guide.proximity, null)
  assert.match(guide.interactionHint, /Place the graduated cylinder/i)
})

test('current actionable error wins; stale previous-step errors and successes are hidden', () => {
  const input = fixture('measure-water', {
    validation: {
      valid: false,
      severity: 'warning',
      code: 'WRONG_TARGET',
      stepId: 'measure-water',
      message: 'Pour into the graduated cylinder.',
    },
    feedback: { ok: false, message: 'Prior error' },
  })
  let guide = getContextualGuidance(input)
  assert.equal(guide.tone, 'warning')
  assert.equal(guide.feedback, 'Pour into the graduated cylinder.')
  input.validation = {
    ...input.validation,
    stepId: 'place-beaker',
    message: 'Old beaker placement warning.',
  }
  input.feedback = { ok: true, message: 'Old stage passed.' }
  guide = getContextualGuidance(input)
  assert.equal(guide.tone, 'neutral')
  assert.equal(guide.feedback, null)
})

test('accepted scoop can show local success, but never leaks to a later stage', () => {
  const scoopEvent = {
    type: 'SOLID_TRANSFER_COMPLETED',
    sourceId: 'sodium-chloride',
    targetId: 'spatula',
    substance: 'NaCl',
    quantity: { value: 5, unit: 'g' },
  }
  const input = fixture('measure-salt', {
    events: [scoopEvent],
    workflow: {
      eventEvidence: { 'measure-salt:SOLID_TRANSFER_COMPLETED:sodium-chloride:spatula': true },
    },
    experiment: { saltOnSpatulaG: 5 },
  })
  assert.equal(getContextualGuidance(input).tone, 'success')
  assert.match(getContextualGuidance(input).feedback, /scooped/i)
  input.workflow.stepIndex = indexFor('add-salt')
  assert.equal(getContextualGuidance(input).tone, 'neutral')
  assert.equal(getContextualGuidance(input).feedback, null)
})

test('observation, review and completed experience reflect actual workflow state', () => {
  const observe = getContextualGuidance(
    fixture('observe', {
      experiment: { saltInBeakerG: 5, dissolvedSaltG: 5 },
    }),
  )
  assert.match(observe.instruction, /no undissolved solid/i)
  assert.equal(observe.progress, 78)
  const review = getContextualGuidance(
    fixture('review', {
      workflow: { measurements: { waterMl: 100, saltG: 5 } },
    }),
  )
  assert.equal(review.targetId, 'beaker')
  assert.match(review.instruction, /Inspect the 3D beaker/i)
  const inspected = getContextualGuidance(
    fixture('review', {
      selectedId: 'beaker',
      workflow: { measurements: { waterMl: 100, saltG: 5 } },
    }),
  )
  assert.match(inspected.interactionHint, /select the beaker/i)
  const complete = getContextualGuidance(
    fixture('review', {
      workflow: { completed: true },
    }),
  )
  assert.equal(complete.progress, 100)
  assert.equal(complete.tone, 'success')
  assert.equal(complete.targetId, null)
})

test('reset starts with safety, zero progress and no stale event feedback', () => {
  const oldEvent = { type: 'REVIEW_INSPECTED' }
  const reset = fixture('prepare', {
    workflow: initialWorkflowState(definition),
    events: [oldEvent],
    validation: null,
    feedback: null,
  })
  const guide = getContextualGuidance(reset)
  assert.equal(guide.stepId, 'prepare')
  assert.equal(guide.progress, 0)
  assert.equal(guide.feedback, null)
  assert.equal(guide.tone, 'neutral')
})
