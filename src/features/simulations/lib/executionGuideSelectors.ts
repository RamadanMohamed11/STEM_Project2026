import type {
  ExperimentWorkflowDefinition,
  WorkflowState,
  WorkflowStepDefinition,
} from '../engine/workflowTypes.ts'
import type { SaltExperimentState } from '../engine/types.ts'
import { undissolvedSaltG } from '../engine/saltExperiment.ts'

/** Pure adapter from an educational workflow to contextual UI; no rendering dependency. */
export function getRequiredEquipment(step: WorkflowStepDefinition): string[] {
  return [
    ...new Set([
      ...step.requirements.flatMap((rule) => (rule.kind === 'placed' ? [...rule.ids] : [])),
      ...(step.commands ?? []).flatMap((command) => [...command.requiredPlacedIds]),
    ]),
  ]
}

function describeCommand(step: WorkflowStepDefinition, workflow: WorkflowState): string {
  const rule = step.commands?.[0]
  if (!rule) return 'Complete the current supported operation.'
  if (rule.kind === 'pour')
    return `Transfer exactly ${rule.amountMl} mL from ${rule.source} to ${rule.target} by holding and tilting the source vessel over its receiver.`
  if (rule.kind === 'scoop-salt')
    return 'Insert the spatula into the NaCl jar, scoop the 5 g demonstration portion, and transfer its crystals to the weighing boat.'
  if (rule.kind === 'add-substance') {
    const mass = rule.massG === 'recorded-salt' ? workflow.measurements.saltG : rule.massG
    return `Tilt the weighing boat to add ${mass ?? 'the recorded amount of'} g of sodium chloride to the beaker.`
  }
  return 'Move the stirring rod tip in genuine repeated circles inside the beaker until no modelled solid remains.'
}

export function getNextAction(
  definition: ExperimentWorkflowDefinition,
  workflow: WorkflowState,
  experiment: SaltExperimentState,
  placedIds: readonly string[],
): string {
  if (workflow.completed) return 'Review your completed results or restart the experiment.'
  const step = definition.steps[workflow.stepIndex]
  if (!step) return 'The experiment definition is missing the current step.'
  const missing = getRequiredEquipment(step).filter((id) => !placedIds.includes(id))
  if (missing.length) return `Place the required equipment on the 3D bench: ${missing.join(', ')}.`
  if (step.legalActions.includes('acknowledge-safety') && !workflow.safetyAcknowledged)
    return 'Read the safety precautions and choose Acknowledge precautions.'
  if (
    step.id === 'measure-water' &&
    experiment.waterMl['graduated-cylinder'] < 100 &&
    (workflow.commandEvidence[step.id] ?? 0) > 0
  )
    return `Keep the source tilted until the graduated cylinder reaches 100 mL (currently ${experiment.waterMl['graduated-cylinder']} mL).`
  if (
    step.id === 'transfer-water' &&
    experiment.waterMl.beaker < 100 &&
    (workflow.commandEvidence[step.id] ?? 0) > 0
  )
    return `Continue tilting the cylinder above the beaker until it holds exactly 100 mL (currently ${experiment.waterMl.beaker} mL).`
  if (step.id === 'measure-salt' && workflow.measurements.saltG === null) {
    if (experiment.saltOnSpatulaG > 0)
      return 'Bring the loaded spatula over the weighing boat and deposit its 5 g portion.'
    if (experiment.saltOnBoatG > 0)
      return 'Place the loaded weighing boat on the simulated tared balance to record its actual modelled mass.'
  }
  if (step.legalActions.includes('command') && (workflow.commandEvidence[step.id] ?? 0) === 0)
    return describeCommand(step, workflow)
  if (
    step.legalActions.includes('record-water-measurement') &&
    workflow.measurements.waterMl === null
  )
    return 'Record the actual modelled volume shown in the graduated cylinder.'
  if (step.legalActions.includes('record-salt-measurement') && workflow.measurements.saltG === null)
    return experiment.saltOnSpatulaG > 0
      ? 'Move the loaded spatula above the weighing boat to deposit its contents.'
      : experiment.saltOnBoatG > 0
        ? 'Place the loaded weighing boat on the simulated balance to read the net mass.'
        : 'Use the spatula to scoop NaCl from the jar.'
  if (step.commands?.some((command) => command.kind === 'stir') && undissolvedSaltG(experiment) > 0)
    return describeCommand(step, workflow)
  if (step.legalActions.includes('record-observation') && !workflow.observationRecorded)
    return 'Inspect the beaker and record the supported observation of no visible solid.'
  if (step.legalActions.includes('finish-review') && !workflow.reviewRecorded)
    return 'Review the recorded quantities and scientific explanation, then confirm your review.'
  return 'The observed physical state is validated automatically when all required conditions are satisfied.'
}
