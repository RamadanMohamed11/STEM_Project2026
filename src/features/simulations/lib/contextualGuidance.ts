import { saltExperimentDefinition } from '../data/saltExperimentDefinition.ts'
import { undissolvedSaltG } from '../engine/saltExperiment.ts'
import type { SimulationEvent } from '../engine/simulationEvents.ts'
import { findSpatialAffordance, type SpatialRelationship } from '../engine/spatialInteractions.ts'
import type { SaltExperimentState } from '../engine/types.ts'
import type { WorkflowState, WorkflowValidation } from '../engine/workflowTypes.ts'
import { findGestureTarget } from '../three/equipmentGestures.ts'
import { equipmentRegistry, type Point2D } from '../three/sceneConfig.ts'

export interface ContextualGuidanceInput {
  workflow: WorkflowState
  experiment: SaltExperimentState
  placedIds: readonly string[]
  selectedId: string | null
  hoveredId: string | null
  draggingId: string | null
  positions: Record<string, Point2D>
  relationships: Readonly<Record<string, SpatialRelationship>>
  livePour: { sourceId: string; targetId: string; angle: number } | null
  validation: WorkflowValidation | null
  feedback: { ok: boolean; message: string } | string | null
  events: readonly SimulationEvent[]
  placementId?: string | null
}

export interface ContextualGuidance {
  stepTitle: string
  stepId: string
  instruction: string
  interactionHint: string | null
  /** Expected physical actor for the current workflow action. */
  actorId: string | null
  /** Highlight only an applicable, placed receiver while its actor is engaged. */
  targetId: string | null
  /** Derived from the same collision-gap semantics used by the 3D gestures. */
  proximity: 'near' | 'far' | null
  tone: 'neutral' | 'success' | 'warning'
  feedback: string | null
  /** Completed, validated workflow steps / total steps, on a 0–100 scale. */
  progress: number
}

type Gesture = 'release' | 'tilt' | 'scoop' | 'stir'

interface PhysicalAction {
  actorId: string | null
  targetId: string | null
  gesture: Gesture | null
  instruction: string
  hint: string
}

const WATER_ML = saltExperimentDefinition.measurementRequirements.waterMl.exact
const SALT_G = saltExperimentDefinition.measurementRequirements.saltG.exact
const EPSILON = 0.0001

function equipmentName(id: string): string {
  return equipmentRegistry.find((entry) => entry.id === id)?.label.toLowerCase() ?? id
}

function quantity(value: number, unit: string): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${Number(safe.toFixed(2))} ${unit}`
}

function actionForState(
  workflow: WorkflowState,
  experiment: SaltExperimentState,
  relationships: ContextualGuidanceInput['relationships'],
): PhysicalAction {
  const cylinderMl = experiment.waterMl['graduated-cylinder']
  const beakerMl = experiment.waterMl.beaker
  const noPhysicalAction = (instruction: string): PhysicalAction => ({
    actorId: null,
    targetId: null,
    gesture: null,
    instruction,
    hint: '',
  })

  switch (saltExperimentDefinition.steps[workflow.stepIndex]?.id) {
    case 'prepare':
      return noPhysicalAction(
        workflow.safetyAcknowledged
          ? 'Safety acknowledged. Check that the required apparatus is available.'
          : 'Read the laboratory safety rules and acknowledge them before handling equipment.',
      )

    case 'place-beaker':
      return {
        actorId: 'beaker',
        targetId: null,
        gesture: null,
        instruction: 'Place the beaker securely on the workbench.',
        hint: 'Choose the beaker from the inventory and place it on a clear bench area.',
      }

    case 'measure-water': {
      const remaining = Math.max(0, WATER_ML - cylinderMl)
      return {
        actorId: 'water',
        targetId: 'graduated-cylinder',
        gesture: 'tilt',
        instruction:
          remaining > 0
            ? `Tilt the water container toward the graduated cylinder until it contains ${WATER_ML} mL. Add ${quantity(remaining, 'mL')} more.`
            : `The graduated cylinder contains ${quantity(cylinderMl, 'mL')}. The reading is checked from the actual simulation.`,
        hint: 'Left-drag the visible TILT handle downward; move sideways to align with the cylinder. Straighten or release to stop.',
      }
    }

    case 'transfer-water': {
      const remaining = Math.max(0, WATER_ML - beakerMl)
      return {
        actorId: 'graduated-cylinder',
        targetId: 'beaker',
        gesture: 'tilt',
        instruction:
          remaining > 0
            ? `Pour the measured water from the graduated cylinder into the beaker. ${quantity(remaining, 'mL')} remaining.`
            : `The beaker contains ${quantity(beakerMl, 'mL')}. The transfer is checked automatically.`,
        hint: "Left-drag the cylinder's visible TILT handle downward near the beaker. Keep holding to pour.",
      }
    }

    case 'measure-salt':
      if (workflow.measurements.saltG === SALT_G)
        return noPhysicalAction(
          'The modelled balance reading is recorded. The next stage is validated automatically.',
        )
      if (experiment.saltOnBoatG > 0) {
        const onBalance =
          relationships['weighing-boat']?.targetId === 'digital-balance' &&
          relationships['weighing-boat']?.kind === 'balance-contact'
        return {
          actorId: 'weighing-boat',
          targetId: 'digital-balance',
          gesture: 'release',
          instruction: onBalance
            ? `The loaded weighing boat is on the balance (${quantity(experiment.saltOnBoatG, 'g')} NaCl). The simulated reading is checked automatically.`
            : `Bring the weighing boat containing ${quantity(experiment.saltOnBoatG, 'g')} of NaCl to the digital balance.`,
          hint: 'Drag the loaded weighing boat beside the balance and release to position it on the pan.',
        }
      }
      if (experiment.saltOnSpatulaG > 0)
        return {
          actorId: 'spatula',
          targetId: 'weighing-boat',
          gesture: 'release',
          instruction: `Transfer the ${quantity(experiment.saltOnSpatulaG, 'g')} NaCl on the spatula into the weighing boat.`,
          hint: 'Drag the loaded spatula beside the weighing boat and release to deposit the salt.',
        }
      return {
        actorId: 'spatula',
        targetId: 'sodium-chloride',
        gesture: 'scoop',
        instruction: `Insert the spatula into the NaCl jar and scoop the modelled ${SALT_G} g portion.`,
        hint: 'Guide the spatula tip into the open jar, move it inside the mouth, then release.',
      }

    case 'add-salt':
      return {
        actorId: 'weighing-boat',
        targetId: 'beaker',
        gesture: 'tilt',
        instruction:
          experiment.saltInBeakerG >= SALT_G
            ? `The beaker now contains ${quantity(experiment.saltInBeakerG, 'g')} of NaCl. Await validation.`
            : `Tilt the weighed ${workflow.measurements.saltG ?? SALT_G} g NaCl from the weighing boat into the water-filled beaker.`,
        hint: "Left-drag the weighing boat's visible TILT handle downward beside the beaker to release its measured salt.",
      }

    case 'stir': {
      const remaining = undissolvedSaltG(experiment)
      return {
        actorId: 'stirring-rod',
        targetId: 'beaker',
        gesture: 'stir',
        instruction:
          remaining > EPSILON
            ? `Insert the stirring rod into the beaker and make complete circles. ${quantity(remaining, 'g')} NaCl remains undissolved.`
            : 'No undissolved salt remains. The completed stirring is checked automatically.',
        hint: 'Move the rod tip in sustained circles inside the beaker; shaking in place does not count.',
      }
    }

    case 'observe':
      return noPhysicalAction(
        undissolvedSaltG(experiment) <= EPSILON
          ? 'Observe the beaker: no undissolved solid remains in the modelled solution.'
          : 'Inspect the beaker and wait until the model shows no undissolved crystals.',
      )

    case 'review':
      return {
        actorId: null,
        targetId: 'beaker',
        gesture: null,
        instruction: `Inspect the 3D beaker to review the modelled ${workflow.measurements.waterMl ?? WATER_ML} mL water and ${workflow.measurements.saltG ?? SALT_G} g NaCl results.`,
        hint: 'Select the beaker to inspect the finished solution and complete the review.',
      }

    default:
      return noPhysicalAction('Follow the validated laboratory procedure.')
  }
}

function isCurrentPhysicalEvent(event: SimulationEvent, stepId: string): boolean {
  switch (stepId) {
    case 'measure-salt':
      return (
        event.type === 'SOLID_TRANSFER_COMPLETED' &&
        (event.targetId === 'spatula' || event.targetId === 'weighing-boat')
      )
    case 'measure-water':
      return event.type === 'LIQUID_TRANSFER_COMPLETED' && event.targetId === 'graduated-cylinder'
    case 'transfer-water':
      return event.type === 'LIQUID_TRANSFER_COMPLETED' && event.targetId === 'beaker'
    default:
      return false
  }
}

/**
 * Read-only contextual guide selector. In particular, selecting an actor or
 * hovering a receiver NEVER performs an interaction or advances a step.
 */
export function getContextualGuidance(input: ContextualGuidanceInput): ContextualGuidance {
  const {
    workflow,
    experiment,
    placedIds,
    selectedId,
    hoveredId,
    draggingId,
    positions,
    relationships,
    livePour,
    validation,
    feedback,
    events,
    placementId,
  } = input
  const step = saltExperimentDefinition.steps[workflow.stepIndex]
  const progress = workflow.completed
    ? 100
    : Math.round(
        (Math.min(Math.max(workflow.stepIndex, 0), saltExperimentDefinition.steps.length) /
          saltExperimentDefinition.steps.length) *
          100,
      )
  if (workflow.completed) {
    return {
      stepId: 'completed',
      stepTitle: 'Experiment complete',
      instruction: 'All experimental steps are verified. Review the results or restart.',
      interactionHint: null,
      actorId: null,
      targetId: null,
      proximity: null,
      tone: 'success',
      feedback: 'Experiment completed successfully.',
      progress,
    }
  }
  if (!step) {
    return {
      stepId: 'unknown',
      stepTitle: 'Experiment unavailable',
      instruction: 'The current experiment step could not be found.',
      interactionHint: null,
      actorId: null,
      targetId: null,
      proximity: null,
      tone: 'warning',
      feedback: null,
      progress,
    }
  }

  const action = actionForState(workflow, experiment, relationships)
  const instruction =
    step.id === 'place-beaker' && placedIds.includes('beaker')
      ? 'The beaker is already placed on the workbench. Its placement is being verified.'
      : action.instruction
  const activeId = draggingId ?? selectedId ?? hoveredId
  const engaged = activeId !== null && activeId === action.actorId
  const actorPlaced = action.actorId !== null && placedIds.includes(action.actorId)
  const targetPlaced = action.targetId !== null && placedIds.includes(action.targetId)
  const targetId =
    (engaged && actorPlaced && targetPlaced) || (step.id === 'review' && targetPlaced)
      ? action.targetId
      : null
  let proximity: ContextualGuidance['proximity'] = null
  let interactionHint: string | null = null
  let tone: ContextualGuidance['tone'] = 'neutral'
  let visibleFeedback: string | null = null

  if (placementId) {
    interactionHint = `Position the ${equipmentName(placementId)} on a clear part of the workbench.`
  } else if (step.id === 'review' && (selectedId === 'beaker' || hoveredId === 'beaker')) {
    interactionHint = action.hint
  } else if (engaged) {
    interactionHint = action.hint || null
    if (action.gesture && actorPlaced && targetId && action.actorId) {
      const actor = equipmentRegistry.find((equipment) => equipment.id === action.actorId)
      const actorPosition = positions[action.actorId] ?? actor?.defaultPosition
      if (actorPosition) {
        const nearby = findGestureTarget(
          action.actorId,
          action.gesture,
          actorPosition,
          placedIds,
          positions,
        )
        proximity = nearby === targetId ? 'near' : 'far'
        if (proximity === 'near')
          interactionHint = `${equipmentName(targetId)} is in range. ${action.hint}`
        else
          interactionHint = `Move the ${equipmentName(action.actorId)} closer to the ${equipmentName(targetId)}. ${action.hint}`
      }
      if (
        hoveredId &&
        hoveredId !== action.actorId &&
        hoveredId !== targetId &&
        placedIds.includes(hoveredId) &&
        !findSpatialAffordance(action.actorId, hoveredId, action.gesture)
      ) {
        tone = 'warning'
        visibleFeedback = `The ${equipmentName(hoveredId)} is not the correct target. Use the ${equipmentName(targetId)}.`
      }
    }
  } else if (activeId && placedIds.includes(activeId) && action.actorId) {
    interactionHint = `This step needs the ${equipmentName(action.actorId)}.`
  }

  if (livePour && (step.id === 'measure-water' || step.id === 'transfer-water')) {
    if (livePour.sourceId === action.actorId && livePour.targetId === action.targetId) {
      interactionHint =
        'Water is flowing. Hold the tilt to continue; straighten or move away to stop.'
      tone = 'success'
    }
  }

  if (!placementId && !actorPlaced && action.actorId && step.id !== 'review') {
    const name = equipmentName(action.actorId)
    interactionHint = `Place the ${name} on the bench before using it.`
  } else if (!placementId && action.targetId && !targetPlaced) {
    interactionHint = `Place the ${equipmentName(action.targetId)} on the bench first.`
  }

  // Never repeat a success from the prior step, or show the generic READY /
  // STEP_COMPLETED workflow status as a fresh physical-action notification.
  const issue =
    validation && !validation.valid && validation.stepId === step.id ? validation.message : null
  if (issue) {
    tone = 'warning'
    visibleFeedback = issue
  } else if (!validation && feedback && typeof feedback !== 'string' && !feedback.ok) {
    tone = 'warning'
    visibleFeedback = feedback.message
  } else if (events.length && workflow.eventEvidence) {
    const mostRecent = events[events.length - 1]
    if (
      isCurrentPhysicalEvent(mostRecent, step.id) &&
      Object.keys(workflow.eventEvidence).some((key) =>
        key.startsWith(`${step.id}:${mostRecent.type}:`),
      )
    ) {
      tone = 'success'
      if (step.id === 'measure-salt') {
        visibleFeedback =
          mostRecent.type === 'SOLID_TRANSFER_COMPLETED' && mostRecent.targetId === 'spatula'
            ? 'NaCl scooped onto the spatula.'
            : 'NaCl transferred into the weighing boat.'
      }
    }
  }

  return {
    stepId: step.id,
    stepTitle: step.title,
    instruction,
    interactionHint,
    actorId: action.actorId,
    targetId,
    proximity,
    tone,
    feedback: visibleFeedback,
    progress,
  }
}
