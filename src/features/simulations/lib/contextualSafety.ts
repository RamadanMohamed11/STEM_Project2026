import type { Experiment, SafetyMetadata } from '@/types/experiment.ts'
import type {
  ExperimentWorkflowDefinition,
  WorkflowState,
  WorkflowStepId,
  WorkflowValidation,
} from '../engine/workflowTypes.ts'
import { saltExperimentDefinition } from '../data/saltExperimentDefinition.ts'
import { equipmentRegistry } from '../three/sceneConfig.ts'
import { getHazards } from '../../safety/data/hazards.ts'

/**
 * Four reusable contextual safety & operational warning levels for T24:
 * - `info`: General safety awareness and model information
 * - `caution`: Step-specific safe handling reminder ("Be Careful")
 * - `warning`: Important safety requirement or chemical handling rule
 * - `blocked`: Invalid, out-of-order, or unsupported action ("This Action Is Not Allowed")
 */
export type SafetyWarningLevel = 'info' | 'caution' | 'warning' | 'blocked'

export interface SafetyWarningLevelMeta {
  level: SafetyWarningLevel
  badgeLabel: string
  defaultTitle: string
  ariaRole: 'status' | 'alert'
}

export const SAFETY_WARNING_LEVEL_META: Readonly<
  Record<SafetyWarningLevel, SafetyWarningLevelMeta>
> = {
  info: {
    level: 'info',
    badgeLabel: 'General Information',
    defaultTitle: 'Laboratory Safety Information',
    ariaRole: 'status',
  },
  caution: {
    level: 'caution',
    badgeLabel: 'Be Careful',
    defaultTitle: 'Be Careful — Safe Handling Reminder',
    ariaRole: 'status',
  },
  warning: {
    level: 'warning',
    badgeLabel: 'Important Safety Warning',
    defaultTitle: 'Important Safety Warning',
    ariaRole: 'status',
  },
  blocked: {
    level: 'blocked',
    badgeLabel: 'This Action Is Not Allowed',
    defaultTitle: 'This Action Is Not Allowed',
    ariaRole: 'alert',
  },
}

export interface ContextualSafetyNotice {
  id: string
  level: SafetyWarningLevel
  badgeLabel: string
  title: string
  message: string
  actionGuidance?: string
  stepId?: WorkflowStepId
  code?: string
  dismissible: boolean
}

export interface SafetyRuleStatus {
  id: string
  instruction: string
  required: boolean
  acknowledged: boolean
}

export interface ContextualSafetyInput {
  experiment?: Pick<Experiment, 'id' | 'title' | 'safety' | 'status' | 'hazards' | 'hazardSteps'>
  definition?: ExperimentWorkflowDefinition
  workflow?: WorkflowState
  validation?: WorkflowValidation | null
  feedback?: { ok: boolean; message: string } | string | null
  selectedId?: string | null
  hoveredId?: string | null
  placedIds?: readonly string[]
  actorId?: string | null
  targetId?: string | null
}

export interface ContextualSafetyState {
  primaryNotice: ContextualSafetyNotice | null
  blockedNotice: ContextualSafetyNotice | null
  stepPrecaution: ContextualSafetyNotice | null
  generalNotice: ContextualSafetyNotice | null
  notices: readonly ContextualSafetyNotice[]
  safetyRules: readonly SafetyRuleStatus[]
}

function getEquipmentTitle(id: string): string {
  return equipmentRegistry.find((item) => item.id === id)?.label.toLowerCase() ?? id
}

const STEP_SAFETY_PRECAUTIONS: Readonly<
  Record<
    string,
    {
      level: SafetyWarningLevel
      title: string
      message: string
      actionGuidance: string
    }
  >
> = {
  prepare: {
    level: 'warning',
    title: 'Important Safety Warning — Confirm Precautions First',
    message:
      'Wear suitable protective eyewear, keep glassware stable on the bench, and never taste or drink any substance from a laboratory container.',
    actionGuidance:
      'Review all safety rules and confirm safety before handling laboratory apparatus or materials.',
  },
  'place-beaker': {
    level: 'caution',
    title: 'Be Careful — Position Glassware Securely',
    message:
      'Place the glass beaker flat on a clear area of the workbench away from the bench edge so it cannot tip or roll.',
    actionGuidance: 'Make sure the beaker rests stably on the bench surface before pouring.',
  },
  'measure-water': {
    level: 'caution',
    title: 'Be Careful — Measure Liquid Volume Accurately',
    message:
      'Transfer water steadily into the 100 mL graduated cylinder without exceeding its 100 mL capacity, and read the bottom of the curved liquid meniscus at eye level.',
    actionGuidance:
      'Select the water container and graduated cylinder to transfer 100 mL without overfilling.',
  },
  'transfer-water': {
    level: 'caution',
    title: 'Be Careful — Pour Liquids Smoothly',
    message:
      'Transfer the measured 100 mL of water smoothly from the graduated cylinder into the beaker to avoid splashes or water spills on the bench.',
    actionGuidance:
      'Select the graduated cylinder and beaker to complete the 100 mL liquid transfer.',
  },
  'measure-salt': {
    level: 'caution',
    title: 'Be Careful — Use Clean Tools for Solid Reagents',
    message:
      'Never touch laboratory chemicals with bare hands or pour solid reagents directly from the storage jar. Always use the clean spatula and a weighing boat on the balance.',
    actionGuidance:
      'Use the spatula to transfer 5 g of NaCl into the weighing boat, then place the loaded boat on the balance pan.',
  },
  'add-salt': {
    level: 'caution',
    title: 'Be Careful — Transfer Measured Solid into the Beaker',
    message:
      'Add only the weighed 5 g sodium chloride portion from the weighing boat into the water-filled beaker so no solid crystals spill onto the bench.',
    actionGuidance:
      'Select the loaded weighing boat and the beaker to transfer the weighed 5 g NaCl portion.',
  },
  stir: {
    level: 'caution',
    title: 'Be Careful — Stir Gently with the Glass Rod',
    message:
      'Move the glass stirring rod in smooth, continuous circles inside the beaker. Avoid striking the glass walls or bottom forcefully.',
    actionGuidance:
      'Drag the stirring rod in gentle circular strokes inside the beaker until all 5 g of NaCl dissolves.',
  },
  observe: {
    level: 'info',
    title: 'General Information — Safe Visual Inspection',
    message:
      'Observe the solution from the side and top of the beaker at a safe distance. Never taste a laboratory solution to check whether a solute has dissolved.',
    actionGuidance:
      'Inspect the clear homogeneous solution in the beaker and record your observation.',
  },
  review: {
    level: 'info',
    title: 'General Information — Model & Laboratory Awareness',
    message:
      'Aqueous sodium chloride is low-risk, but in a real school laboratory you should clean your bench and wash your hands after completing the experiment.',
    actionGuidance:
      'Inspect the finished solution in the beaker to complete your experiment review.',
  },
}

const BLOCKED_CODE_DETAILS: Readonly<
  Record<
    string,
    {
      title: string
      actionGuidance: string
    }
  >
> = {
  SAFETY_REQUIRED: {
    title: 'This Action Is Not Allowed Before Confirming Safety',
    actionGuidance: 'Confirm the laboratory safety rules first before starting the procedure.',
  },
  BEAKER_NOT_PLACED: {
    title: 'This Action Is Not Allowed Without the Beaker on the Bench',
    actionGuidance: 'Place the glass beaker onto the workbench before proceeding.',
  },
  MEASUREMENT_EQUIPMENT_MISSING: {
    title: 'This Action Is Not Allowed — Required Glassware Missing',
    actionGuidance: 'Place both the water container and the graduated cylinder on the workbench.',
  },
  BALANCE_OR_SALT_MISSING: {
    title: 'This Action Is Not Allowed — Weighing Equipment Missing',
    actionGuidance:
      'Place the sodium chloride jar, spatula, weighing boat, and digital balance on the bench.',
  },
  MISSING_EQUIPMENT: {
    title: 'This Action Is Not Allowed — Required Equipment Not Placed',
    actionGuidance: 'Place the required laboratory tools on the workbench before performing this step.',
  },
  BOAT_NOT_ON_BALANCE: {
    title: 'This Action Is Not Allowed — Weighing Boat Not on Balance',
    actionGuidance:
      'Drag the loaded weighing boat onto the digital balance pan before recording the mass.',
  },
  WRONG_EQUIPMENT: {
    title: 'This Action Is Not Allowed — Incorrect Equipment Selected',
    actionGuidance: 'Check the current step instructions and use the required laboratory tool.',
  },
  WRONG_TARGET: {
    title: 'This Action Is Not Allowed — Incorrect Target Vessel',
    actionGuidance: 'Select the correct receiving vessel specified for the current step.',
  },
  WRONG_RANGE: {
    title: 'This Action Is Not Allowed — Quantity Outside Allowed Range',
    actionGuidance:
      'Use a positive quantity that stays within the vessel capacity and step requirement.',
  },
  WRONG_LIQUID_ROUTE: {
    title: 'This Action Is Not Allowed — Invalid Liquid Transfer Route',
    actionGuidance:
      'Measure water in the graduated cylinder first, then pour from the cylinder into the beaker.',
  },
  WRONG_SOLID_ROUTE: {
    title: 'This Action Is Not Allowed — Invalid Solid Transfer Route',
    actionGuidance:
      'Never pour NaCl directly from the reagent jar into the beaker. Use the spatula and weighing boat first.',
  },
  EARLY_ACTION: {
    title: 'This Action Is Not Allowed — Step Out of Sequence',
    actionGuidance: 'Complete and validate the current procedural step before moving ahead.',
  },
  EARLY_COMMAND: {
    title: 'This Action Is Not Allowed During This Step',
    actionGuidance: 'Follow the current step instruction before attempting a transfer or stir.',
  },
  UNSUPPORTED_ACTION: {
    title: 'This Action Is Not Allowed in This Step',
    actionGuidance: 'Use only the scientific operation required by the active step.',
  },
  UNSUPPORTED_COMMAND: {
    title: 'This Action Is Not Allowed by the Simulation',
    actionGuidance: 'Choose a supported laboratory tool and receiver for this experiment.',
  },
  OBSERVATION_TOO_EARLY: {
    title: 'This Action Is Not Allowed — Undissolved Solid Remains',
    actionGuidance:
      'Continue stirring the beaker with the glass rod until all 5 g of NaCl has dissolved.',
  },
  OBSERVATION_UNSUPPORTED: {
    title: 'This Action Is Not Allowed — Solution Not Yet Clear',
    actionGuidance:
      'Stir the solution until no undissolved solid crystals remain before recording a clear solution.',
  },
  UNDISSOLVED_SALT_REMAINS: {
    title: 'This Action Is Not Allowed — Dissolution Incomplete',
    actionGuidance: 'Use the stirring rod in circular strokes until 0 g of solid NaCl remains.',
  },
  ALREADY_COMPLETED: {
    title: 'This Action Is Not Allowed — Experiment Already Completed',
    actionGuidance: 'Review your final results or restart the experiment to run a new trial.',
  },
  'interaction-busy': {
    title: 'This Action Is Not Allowed While Equipment Is Moving',
    actionGuidance:
      'Wait for the active material transfer or equipment movement to finish safely.',
  },
  'invalid-scientific-operation': {
    title: 'This Action Is Not Allowed — Invalid Scientific Operation',
    actionGuidance:
      'Verify that both vessels are on the bench, contain sufficient material, and have free capacity.',
  },
}

function buildBlockedNoticeFromValidation(
  validation: WorkflowValidation | null | undefined,
  feedback: ContextualSafetyInput['feedback'],
  currentStepId: string | undefined,
  hoveredId: string | null | undefined,
  actorId: string | null | undefined,
  targetId: string | null | undefined,
  placedIds: readonly string[],
): ContextualSafetyNotice | null {
  if (validation && !validation.valid && (!currentStepId || validation.stepId === currentStepId)) {
    const details = BLOCKED_CODE_DETAILS[validation.code]
    const sanitizeMessage = validation.message.replace(/tilt/gi, 'transfer')
    return {
      id: `blocked-validation-${validation.code}`,
      level: 'blocked',
      badgeLabel: SAFETY_WARNING_LEVEL_META.blocked.badgeLabel,
      title: details?.title ?? SAFETY_WARNING_LEVEL_META.blocked.defaultTitle,
      message: sanitizeMessage,
      actionGuidance:
        details?.actionGuidance ??
        'Follow the current step instructions and use the required apparatus.',
      stepId: validation.stepId,
      code: validation.code,
      dismissible: true,
    }
  }

  if (feedback && typeof feedback !== 'string' && !feedback.ok && feedback.message) {
    const sanitizeMessage = feedback.message.replace(/tilt/gi, 'transfer')
    return {
      id: 'blocked-feedback',
      level: 'blocked',
      badgeLabel: SAFETY_WARNING_LEVEL_META.blocked.badgeLabel,
      title: SAFETY_WARNING_LEVEL_META.blocked.defaultTitle,
      message: sanitizeMessage,
      actionGuidance:
        'Check the required equipment, step order, and vessel capacity before trying again.',
      stepId: currentStepId,
      code: 'FEEDBACK_REJECTED',
      dismissible: true,
    }
  }

  if (
    actorId &&
    targetId &&
    hoveredId &&
    hoveredId !== actorId &&
    hoveredId !== targetId &&
    placedIds.includes(hoveredId)
  ) {
    const hoveredName = getEquipmentTitle(hoveredId)
    const targetName = getEquipmentTitle(targetId)
    return {
      id: `blocked-hover-${actorId}-${hoveredId}`,
      level: 'blocked',
      badgeLabel: SAFETY_WARNING_LEVEL_META.blocked.badgeLabel,
      title: 'This Action Is Not Allowed — Incompatible Target',
      message: `The ${hoveredName} is not the correct receiver for this step. Use the ${targetName} instead.`,
      actionGuidance: `Select or move toward the ${targetName} to perform the current step safely.`,
      stepId: currentStepId,
      code: 'INCOMPATIBLE_HOVER_TARGET',
      dismissible: true,
    }
  }

  return null
}

function buildGeneralSafetyNotice(
  safety?: SafetyMetadata,
  experimentTitle?: string,
): ContextualSafetyNotice | null {
  if (!safety) return null
  const level: SafetyWarningLevel =
    safety.level === 'high' ? 'warning' : safety.level === 'moderate' ? 'caution' : 'info'
  const meta = SAFETY_WARNING_LEVEL_META[level]
  const ppeText =
    safety.recommendedPpe && safety.recommendedPpe.length > 0
      ? `Recommended protection: ${safety.recommendedPpe.join(', ')}.`
      : ''
  const supervisionText = safety.requiresSupervision
    ? 'Follow instructor supervision in a physical school laboratory.'
    : ''

  return {
    id: `general-safety-${level}`,
    level,
    badgeLabel: meta.badgeLabel,
    title:
      level === 'warning'
        ? 'Important Safety Warning — Laboratory Precautions'
        : level === 'caution'
          ? 'Be Careful — Laboratory Safety Guidance'
          : `General Information — ${experimentTitle ? `${experimentTitle} Safety` : 'Laboratory Safety'}`,
    message:
      safety.note ??
      'Follow standard secondary school chemistry safety rules and handle all glassware with care.',
    actionGuidance: [ppeText, supervisionText].filter(Boolean).join(' ') || undefined,
    dismissible: false,
  }
}

/**
 * Pure, deterministic selector that derives contextual safety notices and warning
 * levels from the active experiment, workflow state, and attempted student interaction.
 * Never mutates scientific state or invents unsupported chemical hazards.
 */
export function getContextualSafetyState(
  input: ContextualSafetyInput = {},
): ContextualSafetyState {
  const {
    experiment,
    definition = saltExperimentDefinition,
    workflow,
    validation = null,
    feedback = null,
    hoveredId = null,
    placedIds = [],
    actorId = null,
    targetId = null,
  } = input

  const safetyRules: SafetyRuleStatus[] = definition.safetyRules.map((rule) => ({
    id: rule.id,
    instruction: rule.instruction,
    required: rule.required,
    acknowledged: Boolean(workflow?.safetyAcknowledged),
  }))

  const generalNotice = buildGeneralSafetyNotice(experiment?.safety, experiment?.title)

  if (!workflow) {
    const notices = generalNotice ? [generalNotice] : []
    return {
      primaryNotice: generalNotice,
      blockedNotice: null,
      stepPrecaution: null,
      generalNotice,
      notices,
      safetyRules,
    }
  }

  const currentStep = definition.steps[workflow.stepIndex]
  const currentStepId = workflow.completed ? 'completed' : currentStep?.id

  const blockedNotice = buildBlockedNoticeFromValidation(
    validation,
    feedback,
    currentStepId,
    hoveredId,
    actorId,
    targetId,
    placedIds,
  )

  let stepPrecaution: ContextualSafetyNotice | null = null
  if (workflow.completed) {
    stepPrecaution = {
      id: 'step-safety-completed',
      level: 'info',
      badgeLabel: SAFETY_WARNING_LEVEL_META.info.badgeLabel,
      title: 'General Information — Post-Experiment Safety & Model Summary',
      message:
        'All procedural steps are complete. In a real chemistry lab, dispose of aqueous salt solutions as directed by your teacher, rinse glassware with clean water, and wash your hands.',
      actionGuidance:
        'Remember that all recorded values in this virtual lab come from a deterministic educational model, not calibrated physical sensors.',
      stepId: 'completed',
      dismissible: true,
    }
  } else if (currentStepId === 'prepare' && workflow.safetyAcknowledged) {
    stepPrecaution = {
      id: 'step-safety-acknowledged',
      level: 'info',
      badgeLabel: SAFETY_WARNING_LEVEL_META.info.badgeLabel,
      title: 'General Information — Safety Precautions Confirmed',
      message:
        'You have confirmed the laboratory safety rules. Keep protective eyewear on and handle all glassware gently throughout the activity.',
      actionGuidance: 'Verify that your required apparatus is ready on the workbench.',
      stepId: 'prepare',
      dismissible: true,
    }
  } else if (currentStepId && STEP_SAFETY_PRECAUTIONS[currentStepId]) {
    const config = STEP_SAFETY_PRECAUTIONS[currentStepId]
    const meta = SAFETY_WARNING_LEVEL_META[config.level]
    stepPrecaution = {
      id: `step-safety-${currentStepId}`,
      level: config.level,
      badgeLabel: meta.badgeLabel,
      title: config.title,
      message: config.message,
      actionGuidance: config.actionGuidance,
      stepId: currentStepId,
      dismissible: config.level !== 'warning',
    }
  }

  const stepHazards = getHazards(experiment?.hazardSteps?.filter(step => step.stepId === currentStepId).flatMap(step => step.hazards))
  if (!workflow.completed && stepHazards.length > 0) {
    stepPrecaution = {
      id: `hazards-${experiment?.id}-${currentStepId}`,
      level: 'warning',
      badgeLabel: SAFETY_WARNING_LEVEL_META.warning.badgeLabel,
      title: stepHazards.map(hazard => hazard.label).join(' · '),
      message: stepHazards.map(hazard => hazard.description).join(' '),
      actionGuidance: stepHazards.flatMap(hazard => hazard.precautions).join(' '),
      stepId: currentStepId,
      dismissible: false,
    }
  }

  const notices: ContextualSafetyNotice[] = []
  if (blockedNotice) notices.push(blockedNotice)
  if (stepPrecaution) notices.push(stepPrecaution)
  if (
    generalNotice &&
    (!stepPrecaution || generalNotice.id !== stepPrecaution.id) &&
    generalNotice.level !== 'info'
  ) {
    notices.push(generalNotice)
  } else if (generalNotice && notices.length === 0) {
    notices.push(generalNotice)
  }

  const primaryNotice = blockedNotice ?? stepPrecaution ?? generalNotice ?? null

  return {
    primaryNotice,
    blockedNotice,
    stepPrecaution,
    generalNotice,
    notices,
    safetyRules,
  }
}
