import { executeSaltCommand, undissolvedSaltG } from './saltExperiment.ts'
import type { SaltExperimentState, SimulationCommand } from './types.ts'
import type {
  ExperimentWorkflowDefinition,
  WorkflowAction,
  WorkflowCommandRule,
  WorkflowPredicate,
  WorkflowState,
  WorkflowStepDefinition,
  WorkflowTransition,
  WorkflowValidation,
  WorkflowValueOperator,
} from './workflowTypes.ts'

export type {
  ExperimentWorkflowDefinition,
  WorkflowAction,
  WorkflowActionKind,
  WorkflowCommandRule,
  WorkflowPredicate,
  WorkflowStageId,
  WorkflowState,
  WorkflowStepDefinition,
  WorkflowStepId,
  WorkflowTransition,
  WorkflowValidation,
} from './workflowTypes.ts'
/** Alias for callers using the generic validation terminology. */
export type ValidationResult = WorkflowValidation

function chemistryCopy(value: SaltExperimentState): SaltExperimentState {
  return { ...value, waterMl: { ...value.waterMl } }
}

/** Compare authoritative physical quantities, avoiding JSON key-order assumptions. */
function sameChemistry(a: SaltExperimentState, b: SaltExperimentState): boolean {
  return (
    a.waterMl.water === b.waterMl.water &&
    a.waterMl.beaker === b.waterMl.beaker &&
    a.waterMl['graduated-cylinder'] === b.waterMl['graduated-cylinder'] &&
    a.saltStockG === b.saltStockG &&
    a.saltOnSpatulaG === b.saltOnSpatulaG &&
    a.saltOnBoatG === b.saltOnBoatG &&
    a.saltInBeakerG === b.saltInBeakerG &&
    a.dissolvedSaltG === b.dissolvedSaltG &&
    a.operations === b.operations &&
    a.stirCount === b.stirCount
  )
}

function validation(
  stepId: string,
  valid: boolean,
  code: string,
  message: string,
  severity: WorkflowValidation['severity'] = valid ? 'success' : 'warning',
): WorkflowValidation {
  return { valid, code, severity, message, stepId }
}

function respond(workflow: WorkflowState, issue: WorkflowValidation): WorkflowTransition {
  return { state: { ...workflow, validation: issue }, validation: issue }
}

function compare(actual: unknown, operator: WorkflowValueOperator, expected: number): boolean {
  if (typeof actual !== 'number' || !Number.isFinite(actual)) return false
  if (operator === 'eq') return Math.abs(actual - expected) < 0.00001
  if (operator === 'ne') return Math.abs(actual - expected) >= 0.00001
  if (operator === 'gte') return actual >= expected - 0.00001
  return actual <= expected + 0.00001
}

function chemistryValue(chemistry: SaltExperimentState, path: string): unknown {
  if (path === 'undissolvedSaltG') return undissolvedSaltG(chemistry)
  const parts = path.split('.')
  let value: unknown = chemistry
  for (const part of parts) {
    if (typeof value !== 'object' || value === null || !(part in value)) return undefined
    value = (value as Record<string, unknown>)[part]
  }
  return value
}

function evaluatePredicate(
  def: ExperimentWorkflowDefinition,
  step: WorkflowStepDefinition,
  workflow: WorkflowState,
  chemistry: SaltExperimentState,
  placedIds: readonly string[],
  rule: WorkflowPredicate,
): WorkflowValidation | null {
  let satisfied = false
  switch (rule.kind) {
    case 'safety':
      satisfied = workflow.safetyAcknowledged
      break
    case 'inventory':
      satisfied = rule.ids.every((id) => def.availableInventory.includes(id))
      break
    case 'placed':
      satisfied = rule.ids.every((id) => placedIds.includes(id))
      break
    case 'chemistry':
      satisfied = compare(chemistryValue(chemistry, rule.path), rule.operator, rule.value)
      break
    case 'measurement':
      satisfied = compare(workflow.measurements[rule.field], rule.operator, rule.value)
      break
    case 'observation':
      satisfied = workflow.observationRecorded
      break
    case 'review':
      satisfied = workflow.reviewRecorded
      break
    case 'command-evidence':
      satisfied = (workflow.commandEvidence[step.id] ?? 0) >= rule.minCount
      break
  }
  return satisfied ? null : validation(step.id, false, rule.code, rule.message, 'warning')
}

function checkRules(
  def: ExperimentWorkflowDefinition,
  step: WorkflowStepDefinition,
  workflow: WorkflowState,
  chemistry: SaltExperimentState,
  placedIds: readonly string[],
  rules: readonly WorkflowPredicate[],
): WorkflowValidation | null {
  for (const rule of rules) {
    const issue = evaluatePredicate(def, step, workflow, chemistry, placedIds, rule)
    if (issue) return issue
  }
  return null
}

function commandMismatch(
  stepId: string,
  rule: WorkflowCommandRule,
  command: SimulationCommand,
  selectedSaltG: number | null,
): WorkflowValidation | null {
  const differs = (actual: string, expected: string) => actual !== expected
  if (command.kind !== rule.kind) {
    return validation(stepId, false, 'WRONG_EQUIPMENT', 'Use the required apparatus for this step.')
  }
  if (command.kind === 'pour' && rule.kind === 'pour') {
    if (differs(command.source, rule.source))
      return validation(stepId, false, 'WRONG_EQUIPMENT', `Pour from ${rule.source}.`)
    if (differs(command.target, rule.target))
      return validation(stepId, false, 'WRONG_TARGET', `Pour into ${rule.target}.`)
    // A single physical pour gesture can deliver several valid aliquots.
    // Completion requires the exact cumulative recorded vessel volume.
    if (command.amountMl <= 0 || command.amountMl > rule.amountMl)
      return validation(stepId, false, 'WRONG_RANGE', `Transfer no more than ${rule.amountMl} mL.`)
    return null
  }
  if (command.kind === 'scoop-salt' && rule.kind === 'scoop-salt') {
    if (
      command.tool !== rule.tool ||
      command.source !== rule.source ||
      command.massG !== rule.massG
    )
      return validation(
        stepId,
        false,
        'WRONG_SCOOP',
        'Scoop the modelled 5 g NaCl portion with the spatula.',
      )
    return null
  }
  if (command.kind === 'deposit-salt' && rule.kind === 'deposit-salt') {
    if (
      command.tool !== rule.tool ||
      command.target !== rule.target ||
      command.massG !== rule.massG
    )
      return validation(
        stepId,
        false,
        'WRONG_DEPOSIT',
        'Deposit the 5 g spatula load in the weighing boat.',
      )
    return null
  }
  if (command.kind === 'add-substance' && rule.kind === 'add-substance') {
    if (differs(command.source, rule.source))
      return validation(stepId, false, 'WRONG_EQUIPMENT', `Use ${rule.source}.`)
    if (differs(command.target, rule.target))
      return validation(stepId, false, 'WRONG_TARGET', `Add salt to ${rule.target}.`)
    const targetMass = rule.massG === 'recorded-salt' ? selectedSaltG : rule.massG
    if (targetMass === null)
      return validation(
        stepId,
        false,
        'MEASUREMENT_REQUIRED',
        'Select and record a salt mass before adding it.',
      )
    if (command.massG !== targetMass)
      return validation(stepId, false, 'WRONG_RANGE', `Add exactly the recorded ${targetMass} g.`)
    return null
  }
  if (command.kind === 'stir' && rule.kind === 'stir') {
    if (differs(command.tool, rule.tool))
      return validation(stepId, false, 'WRONG_EQUIPMENT', `Use the ${rule.tool}.`)
    if (differs(command.target, rule.target))
      return validation(stepId, false, 'WRONG_TARGET', `Stir the ${rule.target}.`)
    return null
  }
  return validation(
    stepId,
    false,
    'UNSUPPORTED_COMMAND',
    'This operation is not supported by the workflow.',
  )
}

function validateCommand(
  def: ExperimentWorkflowDefinition,
  workflow: WorkflowState,
  step: WorkflowStepDefinition,
  afterChemistry: SaltExperimentState,
  placedIds: readonly string[],
  action: Extract<WorkflowAction, { kind: 'command' }>,
): WorkflowTransition {
  const rules = step.commands ?? []
  if (rules.length === 0)
    return respond(
      workflow,
      validation(step.id, false, 'EARLY_COMMAND', 'This step does not accept chemistry commands.'),
    )

  const sameKind = rules.filter((rule) => rule.kind === action.command.kind)
  if (sameKind.length === 0)
    return respond(
      workflow,
      validation(step.id, false, 'WRONG_EQUIPMENT', 'Use the equipment requested by this step.'),
    )
  let matchedRule: WorkflowCommandRule | undefined
  let mismatch: WorkflowValidation | null = null
  for (const rule of sameKind) {
    const issue = commandMismatch(step.id, rule, action.command, workflow.measurements.saltG)
    if (!issue) {
      matchedRule = rule
      break
    }
    mismatch ??= issue
  }
  if (!matchedRule)
    return respond(
      workflow,
      mismatch ?? validation(step.id, false, 'UNSUPPORTED_COMMAND', 'Unknown command.'),
    )

  if (!matchedRule.requiredPlacedIds.every((id) => placedIds.includes(id))) {
    return respond(
      workflow,
      validation(
        step.id,
        false,
        'MISSING_EQUIPMENT',
        `Place ${matchedRule.requiredPlacedIds.filter((id) => !placedIds.includes(id)).join(', ')} on the bench.`,
      ),
    )
  }
  if (def.chemistryEngine !== 'salt-dissolution') {
    return respond(
      workflow,
      validation(
        step.id,
        false,
        'UNSUPPORTED_ENGINE',
        'This experiment engine is unavailable.',
        'error',
      ),
    )
  }

  if (!sameChemistry(action.beforeChemistry, workflow.chemistryCheckpoint)) {
    return respond(
      workflow,
      validation(
        step.id,
        false,
        'STALE_CHEMISTRY',
        'The experiment has changed outside the validated workflow.',
        'error',
      ),
    )
  }
  const expected = executeSaltCommand(action.beforeChemistry, action.command, placedIds)
  if (
    !expected.ok ||
    expected.state.operations !== action.beforeChemistry.operations + 1 ||
    !sameChemistry(expected.state, afterChemistry)
  ) {
    return respond(
      workflow,
      validation(
        step.id,
        false,
        'UNVERIFIED_TRANSITION',
        'The chemistry state does not prove this command succeeded.',
        'error',
      ),
    )
  }

  const next: WorkflowState = {
    ...workflow,
    chemistryCheckpoint: chemistryCopy(afterChemistry),
    commandEvidence: {
      ...workflow.commandEvidence,
      [step.id]: (workflow.commandEvidence[step.id] ?? 0) + 1,
    },
  }
  return respond(next, validation(step.id, true, 'COMMAND_ACCEPTED', expected.message))
}

/** Creates a fresh state without sharing mutable chemistry records across sessions. */
export function initialWorkflowState(def: ExperimentWorkflowDefinition): WorkflowState {
  const firstStep = def.steps[0]
  if (!firstStep) throw new Error('Workflow definition must contain at least one step.')
  const firstStageIndex = def.stages.findIndex((stage) => stage.id === firstStep.stageId)
  if (firstStageIndex < 0) throw new Error('First workflow step references an unknown stage.')
  const ready = validation(firstStep.id, true, 'READY', `Ready: ${firstStep.title}.`, 'info')
  return {
    stepIndex: 0,
    stageIndex: firstStageIndex,
    measurements: { waterMl: null, saltG: null },
    safetyAcknowledged: false,
    observationRecorded: false,
    reviewRecorded: false,
    completed: false,
    validation: ready,
    commandEvidence: {},
    chemistryCheckpoint: chemistryCopy(def.initialConditions.chemistry),
  }
}

/**
 * Pure reducer. The chemistry argument is already the POST-command chemistry for
 * 'command' actions. Non-command actions must supply the unchanged current state.
 * Nothing progresses until validate-step checks the configured evidence predicates.
 */
export function transitionWorkflow(
  def: ExperimentWorkflowDefinition,
  workflow: WorkflowState,
  chemistry: SaltExperimentState,
  placedIds: readonly string[],
  action: WorkflowAction,
): WorkflowTransition {
  const step = def.steps[workflow.stepIndex]
  if (!step)
    return respond(
      workflow,
      validation('unknown', false, 'INVALID_STEP', 'Workflow step is unavailable.', 'error'),
    )
  if (workflow.completed)
    return respond(
      workflow,
      validation(
        step.id,
        false,
        'ALREADY_COMPLETED',
        'The experiment is complete; restart to run again.',
      ),
    )
  if (!step.legalActions.includes(action.kind)) {
    const laterAllowed = def.steps
      .slice(workflow.stepIndex + 1)
      .some((item) => item.legalActions.includes(action.kind))
    return respond(
      workflow,
      validation(
        step.id,
        false,
        laterAllowed ? 'EARLY_ACTION' : 'UNSUPPORTED_ACTION',
        laterAllowed
          ? `Finish ${step.title} before attempting ${action.kind}.`
          : `Action ${action.kind} is not legal in ${step.title}.`,
      ),
    )
  }

  if (action.kind === 'command')
    return validateCommand(def, workflow, step, chemistry, placedIds, action)

  if (!sameChemistry(chemistry, workflow.chemistryCheckpoint)) {
    return respond(
      workflow,
      validation(
        step.id,
        false,
        'STALE_CHEMISTRY',
        'The current chemistry differs from the validated workflow.',
        'error',
      ),
    )
  }

  if (action.kind === 'acknowledge-safety') {
    if (workflow.safetyAcknowledged)
      return respond(
        workflow,
        validation(step.id, false, 'ALREADY_ACKNOWLEDGED', 'Safety was already acknowledged.'),
      )
    const allItems = [...def.requiredEquipment, ...def.requiredMaterials]
    if (!allItems.every((id) => def.availableInventory.includes(id)))
      return respond(
        workflow,
        validation(
          step.id,
          false,
          'INVENTORY_INCOMPLETE',
          'Some required tools or materials are missing.',
        ),
      )
    return respond(
      { ...workflow, safetyAcknowledged: true },
      validation(
        step.id,
        true,
        'SAFETY_ACKNOWLEDGED',
        'Safety rules acknowledged and inventory verified.',
      ),
    )
  }

  if (action.kind === 'record-water-measurement') {
    const realVolume = chemistry.waterMl['graduated-cylinder']
    const required = def.measurementRequirements.waterMl.exact
    if (!placedIds.includes('graduated-cylinder') || (workflow.commandEvidence[step.id] ?? 0) < 1)
      return respond(
        workflow,
        validation(
          step.id,
          false,
          'WATER_NOT_MEASURED',
          'Place and fill the graduated cylinder before recording.',
        ),
      )
    if (realVolume !== required || (action.valueMl !== undefined && action.valueMl !== realVolume))
      return respond(
        workflow,
        validation(
          step.id,
          false,
          'WATER_READING_MISMATCH',
          `Record the derived ${required} mL cylinder volume.`,
        ),
      )
    if (workflow.measurements.waterMl !== null)
      return respond(
        workflow,
        validation(
          step.id,
          false,
          'WATER_ALREADY_RECORDED',
          'The water quantity is already recorded.',
        ),
      )
    return respond(
      { ...workflow, measurements: { ...workflow.measurements, waterMl: realVolume } },
      validation(
        step.id,
        true,
        'WATER_RECORDED',
        `Recorded ${realVolume} mL from the simulated cylinder.`,
      ),
    )
  }

  if (action.kind === 'record-salt-measurement') {
    const required = def.measurementRequirements.saltG.exact
    if (!['digital-balance', 'weighing-boat'].every((id) => placedIds.includes(id)))
      return respond(
        workflow,
        validation(
          step.id,
          false,
          'BALANCE_OR_SALT_MISSING',
          'Place the weighing boat and balance first.',
        ),
      )
    if (
      !Number.isInteger(action.selectedMassG) ||
      action.selectedMassG !== required ||
      chemistry.saltOnBoatG !== required ||
      chemistry.saltOnSpatulaG !== 0
    )
      return respond(
        workflow,
        validation(
          step.id,
          false,
          'SALT_SELECTION_RANGE',
          `The weighing boat must actually contain exactly ${required} g of modelled NaCl.`,
        ),
      )
    if (workflow.measurements.saltG !== null)
      return respond(
        workflow,
        validation(step.id, false, 'SALT_ALREADY_RECORDED', 'A salt portion is already selected.'),
      )
    return respond(
      { ...workflow, measurements: { ...workflow.measurements, saltG: required } },
      validation(
        step.id,
        true,
        'SALT_SELECTED',
        `Recorded ${required} g NaCl from the modelled tared balance; not a calibrated real-world reading.`,
      ),
    )
  }

  if (action.kind === 'record-observation') {
    if (workflow.observationRecorded)
      return respond(
        workflow,
        validation(step.id, false, 'OBSERVATION_REPEATED', 'The observation is already recorded.'),
      )
    if (
      action.observation !== 'no-visible-solid' ||
      undissolvedSaltG(chemistry) > 0.0001 ||
      chemistry.stirCount < 1 ||
      chemistry.saltInBeakerG <= 0
    )
      return respond(
        workflow,
        validation(
          step.id,
          false,
          'OBSERVATION_UNSUPPORTED',
          'The simulation must show dissolved salt with no remaining solid before recording a clear solution.',
        ),
      )
    return respond(
      { ...workflow, observationRecorded: true },
      validation(
        step.id,
        true,
        'OBSERVATION_RECORDED',
        'Recorded: no visible undissolved salt remains.',
      ),
    )
  }

  if (action.kind === 'finish-review') {
    if (workflow.reviewRecorded)
      return respond(
        workflow,
        validation(step.id, false, 'REVIEW_REPEATED', 'Review already recorded.'),
      )
    const issue = checkRules(
      def,
      step,
      workflow,
      chemistry,
      placedIds,
      step.requirements.filter((requirement) => requirement.kind !== 'review'),
    )
    if (issue) return respond(workflow, issue)
    return respond(
      { ...workflow, reviewRecorded: true },
      validation(
        step.id,
        true,
        'REVIEW_RECORDED',
        'Review recorded. Validate to complete the experiment.',
      ),
    )
  }

  // validate-step is the only action allowed to advance the ordered step index.
  const issue = checkRules(def, step, workflow, chemistry, placedIds, step.requirements)
  if (issue) return respond(workflow, issue)
  const isFinal = workflow.stepIndex === def.steps.length - 1
  if (isFinal) {
    const completionIssue = checkRules(def, step, workflow, chemistry, placedIds, def.completion)
    if (completionIssue) return respond(workflow, completionIssue)
    return respond(
      { ...workflow, completed: true },
      validation(step.id, true, 'EXPERIMENT_COMPLETED', def.resultExplanation),
    )
  }
  const nextIndex = workflow.stepIndex + 1
  const nextStep = def.steps[nextIndex]
  const stageIndex = def.stages.findIndex((stage) => stage.id === nextStep.stageId)
  if (stageIndex < 0)
    return respond(
      workflow,
      validation(
        step.id,
        false,
        'INVALID_DEFINITION',
        'Next step references an unknown stage.',
        'error',
      ),
    )
  return respond(
    { ...workflow, stepIndex: nextIndex, stageIndex },
    validation(
      step.id,
      true,
      'STEP_COMPLETED',
      `Validated ${step.title}. Next: ${nextStep.title}.`,
    ),
  )
}
