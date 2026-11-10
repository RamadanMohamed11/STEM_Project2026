import { saltExperimentDefinition as definition } from '../data/saltExperimentDefinition.ts'
import {
  canonicalQuantity,
  quantityUnits,
  reduceMaterialTransfer,
  resolvePairInteractions,
  sameTransferChemistry,
  type TransferOperation,
} from './materialTransfers.ts'
import {
  applySimulationEvent,
  isSimulationEvent,
  type MaterialTransferEvent,
} from './simulationEvents.ts'
import type { SaltExperimentState } from './types.ts'
import type { WorkflowState, WorkflowTransition, WorkflowValidation } from './workflowTypes.ts'

function response(
  workflow: WorkflowState,
  valid: boolean,
  code: string,
  message: string,
): WorkflowTransition {
  const validation: WorkflowValidation = {
    valid,
    code,
    message,
    severity: valid ? 'success' : 'warning',
    stepId: definition.steps[workflow.stepIndex]?.id ?? 'unknown',
  }
  return { state: { ...workflow, validation }, validation }
}

/** Reconstruct the cumulative result from the original snapshot, including one operation count. */
export function chemistryForTransfer(operation: TransferOperation): SaltExperimentState | null {
  const units = quantityUnits(operation.transferred, operation.materialId)
  if (units === null) return null
  return reduceMaterialTransfer(operation.beforeChemistry, operation, units, units > 0)
}

/** Tick adapter: never manufactures legacy commands or relaxes their whole-number rules. */
export function advanceMaterialTransferWorkflow(
  workflow: WorkflowState,
  before: SaltExperimentState,
  previous: TransferOperation,
  next: TransferOperation,
  placedIds: readonly string[],
  guided = true,
): { chemistry: SaltExperimentState; workflow: WorkflowState } | null {
  const stepId = definition.steps[workflow.stepIndex]?.id
  if (
    previous.operationId !== next.operationId ||
    (guided &&
      (previous.stepId !== stepId || !sameTransferChemistry(before, workflow.chemistryCheckpoint)))
  )
    return null
  const expectedBefore = chemistryForTransfer(previous)
  const expectedAfter = chemistryForTransfer(next)
  if (!expectedBefore || !expectedAfter || !sameTransferChemistry(before, expectedBefore))
    return null
  const previousUnits = quantityUnits(previous.transferred, previous.materialId)!
  const nextUnits = quantityUnits(next.transferred, next.materialId)!
  const requestedUnits = quantityUnits(next.amount, next.materialId)!
  if (nextUnits < previousUnits || nextUnits > requestedUnits) return null
  if (nextUnits === previousUnits) return { chemistry: before, workflow }
  const resolved = resolvePairInteractions(
    [next.sourceId, next.targetId],
    before,
    workflow,
    placedIds,
    guided,
  ).find(
    (item) =>
      item.sourceId === next.sourceId &&
      item.targetId === next.targetId &&
      item.materialId === next.materialId,
  )
  if (
    !resolved?.enabled ||
    nextUnits - previousUnits > (quantityUnits(resolved.maxAmount, next.materialId) ?? 0)
  )
    return null
  const started = previousUnits === 0
  return {
    chemistry: expectedAfter,
    workflow: guided
      ? {
          ...workflow,
          chemistryCheckpoint: expectedAfter,
          commandEvidence: {
            ...workflow.commandEvidence,
            [stepId]: (workflow.commandEvidence[stepId] ?? 0) + (started ? 1 : 0),
          },
        }
      : workflow,
  }
}

/** Receipt verification is intentionally separate from public applySimulationEvent.
 * Only the store supplies its actual active operation; a matching envelope alone is not evidence. */
export function verifyMaterialTransferReceipt(
  event: MaterialTransferEvent,
  operation: TransferOperation,
  before: SaltExperimentState,
  after: SaltExperimentState,
): boolean {
  const expected = chemistryForTransfer(operation)
  return (
    isSimulationEvent(event) &&
    !!expected &&
    event.operationId === operation.operationId &&
    event.requestId === operation.requestId &&
    event.experimentId === definition.experimentId &&
    event.sourceId === operation.sourceId &&
    event.targetId === operation.targetId &&
    event.materialId === operation.materialId &&
    event.quantity.unit === operation.unit &&
    event.quantity.value === operation.transferred &&
    operation.elapsedMs === operation.durationMs &&
    (operation.cancelled
      ? event.type === 'MATERIAL_TRANSFER_INTERRUPTED'
      : event.type === 'MATERIAL_TRANSFER_COMPLETED' &&
        operation.transferred === operation.amount) &&
    sameTransferChemistry(before, operation.beforeChemistry) &&
    sameTransferChemistry(after, expected)
  )
}

/** Authenticated receipts may satisfy cumulative predicates. An unfinished portion is valid
 * evidence but is never advertised as the completion of its requested amount. */
export function finishMaterialTransferWorkflow(
  workflow: WorkflowState,
  chemistry: SaltExperimentState,
  operation: TransferOperation,
  event: MaterialTransferEvent,
  placedIds: readonly string[],
): WorkflowTransition {
  const key = `material:${operation.operationId}`
  if (
    !verifyMaterialTransferReceipt(event, operation, operation.beforeChemistry, chemistry) ||
    !sameTransferChemistry(chemistry, workflow.chemistryCheckpoint) ||
    definition.steps[workflow.stepIndex]?.id !== operation.stepId ||
    workflow.eventEvidence?.[key]
  )
    return response(
      workflow,
      false,
      'UNVERIFIED_MATERIAL_TRANSFER',
      'The material receipt does not match the actual operation and before/after quantities.',
    )
  let result = response(
    workflow,
    true,
    event.type,
    operation.cancelled
      ? `Transfer interrupted; ${canonicalQuantity(quantityUnits(operation.transferred, operation.materialId)!, operation.materialId)} ${operation.unit} retained at the destination.`
      : `Transferred ${operation.transferred} ${operation.unit}; cumulative quantities verified.`,
  )
  const waterRequired = definition.measurementRequirements.waterMl.exact
  const saltRequired = definition.measurementRequirements.saltG.exact
  if (
    operation.stepId === 'measure-water' &&
    chemistry.waterMl['graduated-cylinder'] === waterRequired
  ) {
    result = applySimulationEvent(definition, workflow, chemistry, placedIds, {
      type: 'LIQUID_TRANSFER_COMPLETED',
      sourceId: 'water',
      targetId: 'graduated-cylinder',
      quantity: { value: waterRequired, unit: 'mL' },
      totalVolumeMl: waterRequired,
    })
  } else if (
    operation.stepId === 'transfer-water' &&
    chemistry.waterMl.beaker === waterRequired &&
    chemistry.waterMl['graduated-cylinder'] === 0 &&
    workflow.measurements.waterMl === waterRequired
  ) {
    result = applySimulationEvent(definition, workflow, chemistry, placedIds, {
      type: 'LIQUID_TRANSFER_COMPLETED',
      sourceId: 'graduated-cylinder',
      targetId: 'beaker',
      quantity: { value: waterRequired, unit: 'mL' },
      totalVolumeMl: waterRequired,
    })
  } else if (
    operation.stepId === 'add-salt' &&
    chemistry.saltInBeakerG === saltRequired &&
    chemistry.saltOnBoatG === 0
  ) {
    result = applySimulationEvent(definition, workflow, chemistry, placedIds, {
      type: 'SOLID_TRANSFER_COMPLETED',
      sourceId: 'weighing-boat',
      targetId: 'beaker',
      substance: 'NaCl',
      quantity: { value: saltRequired, unit: 'g' },
    })
  }
  if (!result.validation.valid) return result
  return {
    ...result,
    state: { ...result.state, eventEvidence: { ...result.state.eventEvidence, [key]: true } },
  }
}
