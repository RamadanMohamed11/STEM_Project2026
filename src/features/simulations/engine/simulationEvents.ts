import {
  isValidSaltExperimentState,
  maximumDissolvedSaltG,
  STIR_DISSOLUTION_G_PER_ACTION,
  undissolvedSaltG,
} from './saltExperiment.ts'
import type { SaltExperimentState } from './types.ts'
import { transitionWorkflow } from './workflow.ts'
import type {
  ExperimentWorkflowDefinition,
  WorkflowAction,
  WorkflowState,
  WorkflowTransition,
  WorkflowValidation,
} from './workflowTypes.ts'

export type MaterialTransferEvent = {
  type: 'MATERIAL_TRANSFER_COMPLETED' | 'MATERIAL_TRANSFER_INTERRUPTED'
  operationId: string
  requestId: string
  experimentId: string
  sourceId: string
  targetId: string
  materialId: 'water' | 'NaCl'
  quantity: { value: number; unit: 'mL' | 'g' }
  sequence: number
}

/** Semantic facts published AFTER the physical action has committed to chemistry. */
export type SimulationEvent =
  | MaterialTransferEvent
  | { type: 'SAFETY_ACKNOWLEDGED' }
  | { type: 'EQUIPMENT_PLACEMENT_VALIDATED'; equipmentId: string }
  | {
      type: 'LIQUID_TRANSFER_COMPLETED'
      sourceId: string
      targetId: string
      quantity: { value: number; unit: 'mL' }
      /** Optional model-derived total in the receiving vessel. */
      totalVolumeMl?: number
    }
  | {
      type: 'SOLID_TRANSFER_COMPLETED'
      sourceId: string
      targetId: string
      substance: 'NaCl'
      quantity: { value: number; unit: 'g' }
    }
  | {
      type: 'MASS_MEASUREMENT_RECORDED'
      sourceId: string
      targetId: string
      substance: 'NaCl'
      quantity: { value: number; unit: 'g' }
    }
  | {
      type: 'STIRRING_REQUIREMENT_COMPLETED'
      toolId: string
      targetId: string
      quantity: { value: number; unit: 'g' }
      cycles: number
    }
  | { type: 'OBSERVATION_RECORDED'; observation: 'no-visible-solid' | 'visible-solid' }
  | { type: 'REVIEW_INSPECTED' }

/** Reject malformed JS payloads before indexing event registries or reading fields. */
export function isSimulationEvent(value: unknown): value is SimulationEvent {
  if (!value || typeof value !== 'object' || !('type' in value)) return false
  const event = value as Record<string, unknown>
  const quantity = event.quantity as Record<string, unknown> | null | undefined
  const hasQuantity = (unit: string, allowZero = false) =>
    !!quantity &&
    typeof quantity === 'object' &&
    quantity.unit === unit &&
    typeof quantity.value === 'number' &&
    Number.isFinite(quantity.value) &&
    (allowZero ? quantity.value >= 0 : quantity.value > 0)
  const route = () => typeof event.sourceId === 'string' && typeof event.targetId === 'string'
  switch (event.type) {
    case 'MATERIAL_TRANSFER_COMPLETED':
    case 'MATERIAL_TRANSFER_INTERRUPTED':
      return (
        route() &&
        typeof event.operationId === 'string' &&
        event.operationId.length > 0 &&
        typeof event.requestId === 'string' &&
        event.requestId.length > 0 &&
        typeof event.experimentId === 'string' &&
        event.experimentId.length > 0 &&
        (event.materialId === 'water' || event.materialId === 'NaCl') &&
        hasQuantity(
          event.materialId === 'water' ? 'mL' : 'g',
          event.type === 'MATERIAL_TRANSFER_INTERRUPTED',
        ) &&
        Number.isSafeInteger(event.sequence) &&
        (event.sequence as number) > 0
      )
    case 'SAFETY_ACKNOWLEDGED':
    case 'REVIEW_INSPECTED':
      return true
    case 'EQUIPMENT_PLACEMENT_VALIDATED':
      return typeof event.equipmentId === 'string'
    case 'LIQUID_TRANSFER_COMPLETED':
      return (
        route() &&
        hasQuantity('mL') &&
        (event.totalVolumeMl === undefined ||
          (typeof event.totalVolumeMl === 'number' && Number.isFinite(event.totalVolumeMl)))
      )
    case 'SOLID_TRANSFER_COMPLETED':
    case 'MASS_MEASUREMENT_RECORDED':
      return route() && event.substance === 'NaCl' && hasQuantity('g')
    case 'STIRRING_REQUIREMENT_COMPLETED':
      return (
        typeof event.toolId === 'string' &&
        typeof event.targetId === 'string' &&
        hasQuantity('g') &&
        Number.isSafeInteger(event.cycles) &&
        (event.cycles as number) > 0
      )
    case 'OBSERVATION_RECORDED':
      return event.observation === 'no-visible-solid' || event.observation === 'visible-solid'
    default:
      return false
  }
}

const EPSILON = 0.00001
const eq = (left: number, right: number): boolean =>
  Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < EPSILON

function identicalChemistry(a: SaltExperimentState, b: SaltExperimentState): boolean {
  return (
    eq(a.waterMl.water, b.waterMl.water) &&
    eq(a.waterMl['graduated-cylinder'], b.waterMl['graduated-cylinder']) &&
    eq(a.waterMl.beaker, b.waterMl.beaker) &&
    eq(a.saltStockG, b.saltStockG) &&
    eq(a.saltOnSpatulaG, b.saltOnSpatulaG) &&
    eq(a.saltOnBoatG, b.saltOnBoatG) &&
    eq(a.saltInBeakerG, b.saltInBeakerG) &&
    eq(a.dissolvedSaltG, b.dissolvedSaltG) &&
    a.operations === b.operations &&
    a.stirCount === b.stirCount
  )
}

function result(
  state: WorkflowState,
  stepId: string,
  valid: boolean,
  code: string,
  message: string,
  severity: WorkflowValidation['severity'] = valid ? 'success' : 'warning',
): WorkflowTransition {
  const validation: WorkflowValidation = {
    valid,
    code,
    message,
    severity,
    stepId,
  }
  return { state: { ...state, validation }, validation }
}

function reject(
  workflow: WorkflowState,
  stepId: string,
  code: string,
  message: string,
  severity: WorkflowValidation['severity'] = 'warning',
): WorkflowTransition {
  const validation: WorkflowValidation = {
    valid: false,
    code,
    message,
    severity,
    stepId,
  }
  return { state: { ...workflow, validation }, validation }
}

function allPlaced(placedIds: readonly string[], ids: readonly string[]): boolean {
  return ids.every((id) => placedIds.includes(id))
}

function massConserved(def: ExperimentWorkflowDefinition, chemistry: SaltExperimentState): boolean {
  const mass = [
    chemistry.saltStockG,
    chemistry.saltOnSpatulaG,
    chemistry.saltOnBoatG,
    chemistry.saltInBeakerG,
  ]
  return (
    mass.every((value) => Number.isFinite(value) && value >= 0) &&
    eq(
      mass.reduce((sum, value) => sum + value, 0),
      def.initialConditions.chemistry.saltStockG +
        def.initialConditions.chemistry.saltOnSpatulaG +
        def.initialConditions.chemistry.saltOnBoatG +
        def.initialConditions.chemistry.saltInBeakerG,
    ) &&
    chemistry.dissolvedSaltG >= 0 &&
    chemistry.dissolvedSaltG <= chemistry.saltInBeakerG
  )
}

function waterConserved(
  def: ExperimentWorkflowDefinition,
  chemistry: SaltExperimentState,
): boolean {
  const volumes = [
    chemistry.waterMl.water,
    chemistry.waterMl['graduated-cylinder'],
    chemistry.waterMl.beaker,
  ]
  const initial = def.initialConditions.chemistry.waterMl
  return (
    volumes.every(
      (value) => Number.isFinite(value) && Number(value.toFixed(1)) === value && value >= 0,
    ) &&
    eq(
      volumes.reduce((sum, value) => sum + value, 0),
      initial.water + initial['graduated-cylinder'] + initial.beaker,
    )
  )
}

function hasAcceptedCommand(workflow: WorkflowState, stepId: string, count: number): boolean {
  return (workflow.commandEvidence[stepId] ?? 0) >= count
}

/** Pure reducer pass-through: an accepted event triggers authoritative predicates, not a Next click. */
function advance(
  def: ExperimentWorkflowDefinition,
  workflow: WorkflowState,
  chemistry: SaltExperimentState,
  placedIds: readonly string[],
  eventKey: string,
  action?: WorkflowAction,
): WorkflowTransition {
  let working = workflow
  if (action) {
    const recorded = transitionWorkflow(def, working, chemistry, placedIds, action)
    if (!recorded.validation.valid) return recorded
    working = recorded.state
  }
  // A valid semantic event is a prerequisite for calling the existing pure
  // predicate reducer. This is not a procedure-button action or simulated
  // chemistry command.
  const verified = transitionWorkflow(def, working, chemistry, placedIds, { kind: 'validate-step' })
  if (!verified.validation.valid) return verified
  return {
    state: {
      ...verified.state,
      eventEvidence: { ...working.eventEvidence, [eventKey]: true },
    },
    validation: verified.validation,
  }
}

/** Accept an intermediate physical transfer without progressing the weighing step prematurely. */
function acceptIntermediate(
  workflow: WorkflowState,
  stepId: string,
  eventKey: string,
  message: string,
): WorkflowTransition {
  const next: WorkflowState = {
    ...workflow,
    eventEvidence: { ...workflow.eventEvidence, [eventKey]: true },
  }
  return result(next, stepId, true, 'SIMULATION_EVENT_RECORDED', message)
}

/**
 * Validate a post-action semantic event against the AUTHORITATIVE chemistry
 * checkpoint and ordered workflow evidence. Neither chemistry nor accepted
 * command counters can be changed by an event. Only the appropriate event
 * permits a pure predicate-verified step transition.
 *
 * World-space contact/scale attachment must be checked by the producer:
 * only placedIds, not contact coordinates or the relationship graph, are
 * available to this rendering-independent API.
 */
export function applySimulationEvent(
  def: ExperimentWorkflowDefinition,
  workflow: WorkflowState,
  chemistry: SaltExperimentState,
  placedIds: readonly string[],
  event: SimulationEvent,
): WorkflowTransition {
  const step = def.steps[workflow.stepIndex]
  if (!step)
    return reject(workflow, 'unknown', 'INVALID_STEP', 'No current workflow step exists.', 'error')
  if (!isSimulationEvent(event))
    return reject(workflow, step.id, 'INVALID_EVENT', 'Malformed or unsupported simulation event.')
  if (
    event.type === 'MATERIAL_TRANSFER_COMPLETED' ||
    event.type === 'MATERIAL_TRANSFER_INTERRUPTED'
  )
    return reject(
      workflow,
      step.id,
      'UNAUTHENTICATED_TRANSFER',
      'Material receipts can only be issued by the authoritative transfer lifecycle, not public emit.',
    )
  if (workflow.completed)
    return reject(workflow, step.id, 'ALREADY_COMPLETED', 'The experiment is already completed.')
  if (def.chemistryEngine !== 'salt-dissolution')
    return reject(
      workflow,
      step.id,
      'UNSUPPORTED_ENGINE',
      'No event validator exists for this experiment.',
      'error',
    )
  if (!isValidSaltExperimentState(chemistry))
    return reject(
      workflow,
      step.id,
      'INVALID_SCIENTIFIC_STATE',
      'Scientific quantities are invalid.',
      'error',
    )
  if (!identicalChemistry(chemistry, workflow.chemistryCheckpoint))
    return reject(
      workflow,
      step.id,
      'STALE_CHEMISTRY',
      'The event does not match the accepted simulation state.',
      'error',
    )

  if (!massConserved(def, chemistry) || !waterConserved(def, chemistry))
    return reject(
      workflow,
      step.id,
      'INVALID_SCIENTIFIC_STATE',
      'Events require physical, capacity-bounded and conserved scientific quantities.',
      'error',
    )

  const expectedStep: Record<SimulationEvent['type'], readonly string[]> = {
    MATERIAL_TRANSFER_COMPLETED: [],
    MATERIAL_TRANSFER_INTERRUPTED: [],
    SAFETY_ACKNOWLEDGED: ['prepare'],
    EQUIPMENT_PLACEMENT_VALIDATED: ['place-beaker'],
    LIQUID_TRANSFER_COMPLETED: ['measure-water', 'transfer-water'],
    SOLID_TRANSFER_COMPLETED: ['measure-salt', 'add-salt'],
    MASS_MEASUREMENT_RECORDED: ['measure-salt'],
    STIRRING_REQUIREMENT_COMPLETED: ['stir'],
    OBSERVATION_RECORDED: ['observe'],
    REVIEW_INSPECTED: ['review'],
  }
  if (!expectedStep[event.type].includes(step.id))
    return reject(
      workflow,
      step.id,
      'OUT_OF_ORDER_EVENT',
      `${event.type} is not valid during ${step.title}.`,
    )

  const eventKey = [
    step.id,
    event.type,
    'sourceId' in event
      ? event.sourceId
      : 'toolId' in event
        ? event.toolId
        : 'equipmentId' in event
          ? event.equipmentId
          : '',
    'targetId' in event ? event.targetId : '',
  ].join(':')
  if (workflow.eventEvidence?.[eventKey])
    return reject(
      workflow,
      step.id,
      'DUPLICATE_EVENT',
      'This physical action was already recorded.',
    )

  switch (event.type) {
    case 'SAFETY_ACKNOWLEDGED': {
      // The safety event represents an actual acknowledgement; no progress
      // occurs from an animation or from inventory being present alone.
      return advance(
        def,
        workflow,
        chemistry,
        placedIds,
        eventKey,
        workflow.safetyAcknowledged ? undefined : { kind: 'acknowledge-safety' },
      )
    }

    case 'EQUIPMENT_PLACEMENT_VALIDATED': {
      if (event.equipmentId !== 'beaker' || !placedIds.includes(event.equipmentId))
        return reject(
          workflow,
          step.id,
          'PLACEMENT_UNVERIFIED',
          'The beaker must actually be placed on the laboratory workbench.',
        )
      return advance(def, workflow, chemistry, placedIds, eventKey)
    }

    case 'LIQUID_TRANSFER_COMPLETED': {
      const pourRule = step.commands?.find((command) => command.kind === 'pour')
      if (
        !pourRule ||
        pourRule.kind !== 'pour' ||
        event.sourceId !== pourRule.source ||
        event.targetId !== pourRule.target
      )
        return reject(
          workflow,
          step.id,
          'WRONG_LIQUID_ROUTE',
          'The measured water must come from the required vessel and enter the correct receiver.',
        )
      const required = pourRule.amountMl
      if (
        event.quantity?.unit !== 'mL' ||
        !eq(event.quantity.value, required) ||
        (event.totalVolumeMl !== undefined && !eq(event.totalVolumeMl, required))
      )
        return reject(
          workflow,
          step.id,
          'INCORRECT_WATER_QUANTITY',
          `The completed transfer must represent exactly ${required} mL.`,
        )
      if (!allPlaced(placedIds, pourRule.requiredPlacedIds))
        return reject(
          workflow,
          step.id,
          'MISSING_EQUIPMENT',
          'Place both liquid vessels on the bench.',
        )
      if (!hasAcceptedCommand(workflow, step.id, 1) || !waterConserved(def, chemistry))
        return reject(
          workflow,
          step.id,
          'UNVERIFIED_LIQUID_TRANSFER',
          'A validated physical transfer and conserved water quantities are required.',
        )
      const targetVolume = chemistry.waterMl[pourRule.target]
      if (!eq(targetVolume, required))
        return reject(
          workflow,
          step.id,
          'UNFINISHED_LIQUID_TRANSFER',
          'The receiving vessel must actually contain the specified water volume.',
        )
      const initial = def.initialConditions.chemistry.waterMl
      if (
        step.id === 'measure-water' &&
        (!eq(chemistry.waterMl.water, initial.water - required) ||
          !eq(chemistry.waterMl.beaker, initial.beaker))
      )
        return reject(
          workflow,
          step.id,
          'WRONG_WATER_DISTRIBUTION',
          'Water must have moved only into the graduated cylinder.',
        )
      if (
        step.id === 'transfer-water' &&
        (!eq(chemistry.waterMl['graduated-cylinder'], 0) ||
          !eq(chemistry.waterMl.water, initial.water - required) ||
          workflow.measurements.waterMl !== required)
      )
        return reject(
          workflow,
          step.id,
          'WRONG_WATER_DISTRIBUTION',
          'Transfer the previously measured water from the cylinder to the beaker.',
        )
      return advance(
        def,
        workflow,
        chemistry,
        placedIds,
        eventKey,
        step.id === 'measure-water' && workflow.measurements.waterMl === null
          ? { kind: 'record-water-measurement', valueMl: targetVolume }
          : undefined,
      )
    }

    case 'SOLID_TRANSFER_COMPLETED': {
      const saltRequired = def.measurementRequirements.saltG.exact
      if (
        event.substance !== 'NaCl' ||
        event.quantity?.unit !== 'g' ||
        !eq(event.quantity.value, saltRequired)
      )
        return reject(
          workflow,
          step.id,
          'INCORRECT_SALT_QUANTITY',
          'Only the actual specified mass of NaCl can satisfy this step.',
        )
      if (!massConserved(def, chemistry))
        return reject(
          workflow,
          step.id,
          'SALT_MASS_NOT_CONSERVED',
          'The NaCl inventory and transferred quantities must be conserved.',
        )
      const expectedStock = def.initialConditions.chemistry.saltStockG - saltRequired
      if (step.id === 'measure-salt') {
        if (!allPlaced(placedIds, ['sodium-chloride', 'spatula', 'weighing-boat']))
          return reject(
            workflow,
            step.id,
            'MISSING_EQUIPMENT',
            'Place the salt jar, spatula and weighing boat on the workbench.',
          )
        if (event.sourceId === 'sodium-chloride' && event.targetId === 'spatula') {
          if (
            !hasAcceptedCommand(workflow, step.id, 1) ||
            !eq(chemistry.saltStockG, expectedStock) ||
            !eq(chemistry.saltOnSpatulaG, saltRequired) ||
            !eq(chemistry.saltOnBoatG, 0) ||
            !eq(chemistry.saltInBeakerG, 0)
          )
            return reject(
              workflow,
              step.id,
              'UNVERIFIED_SCOOP',
              'The accepted scoop must actually put 5 g on the spatula.',
            )
          return acceptIntermediate(
            workflow,
            step.id,
            eventKey,
            'Verified NaCl scoop onto the spatula.',
          )
        }
        if (event.sourceId === 'spatula' && event.targetId === 'weighing-boat') {
          if (
            !hasAcceptedCommand(workflow, step.id, 2) ||
            !eq(chemistry.saltStockG, expectedStock) ||
            !eq(chemistry.saltOnSpatulaG, 0) ||
            !eq(chemistry.saltOnBoatG, saltRequired) ||
            !eq(chemistry.saltInBeakerG, 0)
          )
            return reject(
              workflow,
              step.id,
              'UNVERIFIED_SALT_DEPOSIT',
              'The spatula must actually deliver the selected NaCl into the weighing boat.',
            )
          return acceptIntermediate(
            workflow,
            step.id,
            eventKey,
            'Verified NaCl deposit in the weighing boat.',
          )
        }
        return reject(
          workflow,
          step.id,
          'WRONG_SOLID_ROUTE',
          'Scoop with the spatula, then transfer NaCl into the weighing boat.',
        )
      }
      if (event.sourceId !== 'weighing-boat' || event.targetId !== 'beaker')
        return reject(
          workflow,
          step.id,
          'WRONG_SOLID_ROUTE',
          'The measured NaCl must be poured from the weighing boat into the beaker.',
        )
      if (
        !allPlaced(placedIds, ['weighing-boat', 'beaker', 'digital-balance']) ||
        !hasAcceptedCommand(workflow, step.id, 1) ||
        workflow.measurements.saltG !== saltRequired ||
        !eq(chemistry.saltStockG, expectedStock) ||
        !eq(chemistry.saltInBeakerG, saltRequired) ||
        !eq(chemistry.saltOnBoatG, 0) ||
        !eq(chemistry.saltOnSpatulaG, 0) ||
        chemistry.waterMl.beaker !== def.measurementRequirements.waterMl.exact
      )
        return reject(
          workflow,
          step.id,
          'UNVERIFIED_SALT_ADDITION',
          'The recorded salt mass must actually be present in the water-filled beaker.',
        )
      return advance(def, workflow, chemistry, placedIds, eventKey)
    }

    case 'MASS_MEASUREMENT_RECORDED': {
      const saltRequired = def.measurementRequirements.saltG.exact
      if (
        event.sourceId !== 'weighing-boat' ||
        event.targetId !== 'digital-balance' ||
        event.substance !== 'NaCl' ||
        event.quantity?.unit !== 'g' ||
        !eq(event.quantity.value, saltRequired)
      )
        return reject(
          workflow,
          step.id,
          'WRONG_MASS_MEASUREMENT',
          'The loaded weighing boat must be weighed on the digital balance.',
        )
      if (
        !allPlaced(placedIds, ['sodium-chloride', 'spatula', 'weighing-boat', 'digital-balance']) ||
        !hasAcceptedCommand(workflow, step.id, 2) ||
        !massConserved(def, chemistry) ||
        !eq(chemistry.saltOnBoatG, saltRequired) ||
        !eq(chemistry.saltOnSpatulaG, 0) ||
        !eq(chemistry.saltStockG, def.initialConditions.chemistry.saltStockG - saltRequired)
      )
        return reject(
          workflow,
          step.id,
          'UNVERIFIED_MASS_MEASUREMENT',
          'The balance event requires actual accepted scoop/deposit commands and 5 g in the boat.',
        )
      if (workflow.measurements.saltG !== null && workflow.measurements.saltG !== saltRequired)
        return reject(
          workflow,
          step.id,
          'MASS_READING_MISMATCH',
          'The recorded NaCl mass differs from the measured model state.',
        )
      return advance(
        def,
        workflow,
        chemistry,
        placedIds,
        eventKey,
        workflow.measurements.saltG === null
          ? { kind: 'record-salt-measurement', selectedMassG: chemistry.saltOnBoatG }
          : undefined,
      )
    }

    case 'STIRRING_REQUIREMENT_COMPLETED': {
      const saltRequired = def.measurementRequirements.saltG.exact
      const minimumCycles = Math.ceil(saltRequired / STIR_DISSOLUTION_G_PER_ACTION)
      if (event.toolId !== 'stirring-rod' || event.targetId !== 'beaker')
        return reject(
          workflow,
          step.id,
          'WRONG_STIRRING_EQUIPMENT',
          'Stir the salt solution with the laboratory stirring rod.',
        )
      if (
        event.quantity?.unit !== 'g' ||
        !eq(event.quantity.value, chemistry.dissolvedSaltG) ||
        !Number.isInteger(event.cycles) ||
        event.cycles !== chemistry.stirCount
      )
        return reject(
          workflow,
          step.id,
          'STIRRING_EVIDENCE_MISMATCH',
          'Reported dissolved mass and cycles must match actual simulated chemistry.',
        )
      if (
        !allPlaced(placedIds, ['stirring-rod', 'beaker']) ||
        !hasAcceptedCommand(workflow, step.id, minimumCycles) ||
        chemistry.stirCount < minimumCycles ||
        chemistry.waterMl.beaker !== def.measurementRequirements.waterMl.exact ||
        workflow.measurements.saltG !== saltRequired ||
        !eq(chemistry.saltInBeakerG, saltRequired) ||
        !eq(chemistry.dissolvedSaltG, saltRequired) ||
        chemistry.dissolvedSaltG > maximumDissolvedSaltG(chemistry) + EPSILON ||
        undissolvedSaltG(chemistry) > EPSILON
      )
        return reject(
          workflow,
          step.id,
          'STIRRING_INCOMPLETE',
          'Continue valid stirring until all salt has dissolved within the modelled solubility limit.',
        )
      return advance(def, workflow, chemistry, placedIds, eventKey)
    }

    case 'OBSERVATION_RECORDED':
      if (
        !placedIds.includes('beaker') ||
        event.observation !== 'no-visible-solid' ||
        undissolvedSaltG(chemistry) > EPSILON ||
        chemistry.stirCount < 1 ||
        chemistry.saltInBeakerG <= 0
      )
        return reject(
          workflow,
          step.id,
          'OBSERVATION_UNVERIFIED',
          'A clear solution can only be observed when no undissolved solid remains.',
        )
      return advance(
        def,
        workflow,
        chemistry,
        placedIds,
        eventKey,
        workflow.observationRecorded
          ? undefined
          : { kind: 'record-observation', observation: event.observation },
      )

    case 'REVIEW_INSPECTED':
      if (!placedIds.includes('beaker'))
        return reject(
          workflow,
          step.id,
          'BEAKER_NOT_PLACED',
          'Place the solution beaker before inspecting it.',
        )
      return advance(
        def,
        workflow,
        chemistry,
        placedIds,
        eventKey,
        workflow.reviewRecorded ? undefined : { kind: 'finish-review' },
      )
  }
}
