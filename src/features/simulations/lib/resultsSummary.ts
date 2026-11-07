import type { Experiment } from '@/types/experiment.ts'
import type { ExperimentWorkflowDefinition, WorkflowState } from '../engine/workflowTypes.ts'
import type { SaltExperimentState } from '../engine/types.ts'
import {
  SOLUBILITY_G_PER_100ML,
  STIR_DISSOLUTION_G_PER_ACTION,
  undissolvedSaltG,
} from '../engine/saltExperiment.ts'

export type ResultsAvailabilityState =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'unavailable'
  | 'incompatible'

export interface StudentActionRecord {
  id: string
  stepNumber: number
  title: string
  summary: string
  completed: boolean
  active: boolean
}

export interface SimulatedMeasurementItem {
  id: string
  label: string
  shortLabel: string
  value: string
  recorded: boolean
  sourceNote: string
}

export interface ExperimentResultsSummary {
  experimentId: string
  experimentTitle: string
  workflowTitle: string
  availability: ResultsAvailabilityState
  statusLabel:
    | 'Not Started'
    | 'In Progress'
    | 'Completed'
    | 'Results Unavailable'
    | 'Session Out of Sync'
  statusHeadline: string
  statusMessage: string
  validatedSteps: number
  totalSteps: number
  progressPercent: number
  currentStepTitle: string | null
  currentStepDescription: string | null
  safetyAcknowledged: boolean
  quantities: {
    waterUsedMl: number | null
    saltAddedG: number | null
    beakerWaterMl: number
    cylinderWaterMl: number
    waterStockRemainingMl: number
    saltInBeakerG: number
    dissolvedSaltG: number
    undissolvedSaltG: number
    saltOnBoatG: number
    saltOnSpatulaG: number
    stirCount: number
    operationsCount: number
  }
  measurements: readonly SimulatedMeasurementItem[]
  studentActions: readonly StudentActionRecord[]
  simulatedObservations: {
    recorded: boolean
    headline: string
    summary: string
    details: readonly string[]
    scopeDisclaimer: string
  }
  scientificExplanation: {
    headline: string
    summary: string
    ionProcessExplanation: string
    physicalChangeClarification: string
  }
  modelAssumptions: readonly string[]
  finalConclusions: readonly string[]
}

export interface ResultsSummaryInput {
  experiment: Pick<Experiment, 'id' | 'title' | 'status'>
  definition?: ExperimentWorkflowDefinition
  workflow?: WorkflowState
  chemistry?: SaltExperimentState
  placedIds?: readonly string[]
  sessionPhase?: 'ready' | 'in-progress' | 'completed' | 'unavailable' | 'incompatible'
}

function buildStudentActionSummary(
  stepId: string,
  completed: boolean,
  workflow: WorkflowState,
  chemistry: SaltExperimentState,
): string {
  switch (stepId) {
    case 'prepare':
      return completed || workflow.safetyAcknowledged
        ? 'Laboratory safety rules acknowledged and required tools/materials verified.'
        : 'Pending acknowledgement of laboratory safety rules.'
    case 'place-beaker':
      return completed
        ? '250 mL glass beaker positioned securely on the 3D workbench.'
        : 'Pending placement validation of the 250 mL beaker on the bench.'
    case 'measure-water':
      return workflow.measurements.waterMl !== null
        ? `Measured and recorded ${workflow.measurements.waterMl} mL of water in the graduated cylinder.`
        : chemistry.waterMl['graduated-cylinder'] > 0
          ? `Partially transferred ${chemistry.waterMl['graduated-cylinder']} mL into the graduated cylinder (100 mL required).`
          : 'No water measured in the graduated cylinder yet.'
    case 'transfer-water':
      return completed || chemistry.waterMl.beaker >= 100
        ? `Transferred ${chemistry.waterMl.beaker} mL of measured water from the graduated cylinder into the beaker.`
        : chemistry.waterMl.beaker > 0
          ? `Partially transferred ${chemistry.waterMl.beaker} mL of water into the beaker (100 mL required).`
          : 'Measured water has not yet been transferred into the beaker.'
    case 'measure-salt':
      return workflow.measurements.saltG !== null
        ? `Scooped ${workflow.measurements.saltG} g of solid NaCl with the spatula and weighed it in the tared weighing boat on the balance.`
        : chemistry.saltOnBoatG > 0
          ? `Deposited ${chemistry.saltOnBoatG} g of NaCl in the weighing boat; awaiting tared balance recording.`
          : chemistry.saltOnSpatulaG > 0
            ? `Scooped ${chemistry.saltOnSpatulaG} g of NaCl onto the spatula; awaiting deposit into the weighing boat.`
            : 'No sodium chloride scooped or weighed yet.'
    case 'add-salt':
      return completed || chemistry.saltInBeakerG >= 5
        ? `Added the weighed ${chemistry.saltInBeakerG} g portion of NaCl from the weighing boat into the water-filled beaker.`
        : chemistry.saltInBeakerG > 0
          ? `Partially added ${chemistry.saltInBeakerG} g of NaCl into the beaker.`
          : 'Weighed sodium chloride has not yet been added to the beaker.'
    case 'stir': {
      const remaining = undissolvedSaltG(chemistry)
      return completed
        ? `Stirred the solution with the glass rod (${chemistry.stirCount} stirring action${chemistry.stirCount === 1 ? '' : 's'}) until 0 g of solid NaCl remained.`
        : chemistry.stirCount > 0
          ? `Stirred ${chemistry.stirCount} time${chemistry.stirCount === 1 ? '' : 's'}: ${chemistry.dissolvedSaltG.toFixed(2)} g dissolved, ${remaining.toFixed(2)} g solid remaining.`
          : 'Solution has not been stirred with the glass rod yet.'
    }
    case 'observe':
      return completed || workflow.observationRecorded
        ? 'Inspected the beaker and recorded that no visible solid crystals remain in the clear solution.'
        : 'Observation of the final solution has not been recorded yet.'
    case 'review':
      return completed || workflow.reviewRecorded
        ? 'Reviewed the recorded measurements, observations, and scientific explanation to complete the experiment.'
        : 'Final experiment review has not been confirmed yet.'
    default:
      return completed ? 'Step validated.' : 'Step pending.'
  }
}

/**
 * Pure selector that derives a scientifically accurate, state-verified summary of
 * experiment results across all availability phases without mutating state or
 * duplicating calculations.
 */
export function getExperimentResultsSummary(
  input: ResultsSummaryInput,
): ExperimentResultsSummary {
  const {
    experiment,
    definition,
    workflow,
    chemistry,
    placedIds = [],
    sessionPhase,
  } = input

  if (!definition || !workflow || !chemistry || sessionPhase === 'unavailable') {
    return {
      experimentId: experiment.id,
      experimentTitle: experiment.title,
      workflowTitle: experiment.title,
      availability: 'unavailable',
      statusLabel: 'Results Unavailable',
      statusHeadline: 'Results Unavailable',
      statusMessage: 'This experiment does not have an available 3D lab.',
      validatedSteps: 0,
      totalSteps: 0,
      progressPercent: 0,
      currentStepTitle: null,
      currentStepDescription: null,
      safetyAcknowledged: false,
      quantities: {
        waterUsedMl: null,
        saltAddedG: null,
        beakerWaterMl: 0,
        cylinderWaterMl: 0,
        waterStockRemainingMl: 0,
        saltInBeakerG: 0,
        dissolvedSaltG: 0,
        undissolvedSaltG: 0,
        saltOnBoatG: 0,
        saltOnSpatulaG: 0,
        stirCount: 0,
        operationsCount: 0,
      },
      measurements: [],
      studentActions: [],
      simulatedObservations: {
        recorded: false,
        headline: 'No Simulated Observations Available',
        summary: 'This experiment does not have an active 3D simulation engine yet.',
        details: [],
        scopeDisclaimer:
          'Simulated observations are generated only by supported interactive 3D laboratory experiments.',
      },
      scientificExplanation: {
        headline: 'Scientific Explanation Pending Simulation Support',
        summary:
          'Review the Experiment Details page for learning objectives and conceptual background.',
        ionProcessExplanation: '',
        physicalChangeClarification: '',
      },
      modelAssumptions: [],
      finalConclusions: [],
    }
  }

  if (sessionPhase === 'incompatible') {
    return {
      experimentId: experiment.id,
      experimentTitle: experiment.title,
      workflowTitle: definition.title,
      availability: 'incompatible',
      statusLabel: 'Session Out of Sync',
      statusHeadline: 'No Experiment Results Yet',
      statusMessage:
        'The current session belongs to a different experiment or version. Open the lab to restart this experiment.',
      validatedSteps: 0,
      totalSteps: definition.steps.length,
      progressPercent: 0,
      currentStepTitle: definition.steps[0]?.title ?? null,
      currentStepDescription: definition.steps[0]?.description ?? null,
      safetyAcknowledged: false,
      quantities: {
        waterUsedMl: null,
        saltAddedG: null,
        beakerWaterMl: 0,
        cylinderWaterMl: 0,
        waterStockRemainingMl: definition.initialConditions.chemistry.waterMl.water,
        saltInBeakerG: 0,
        dissolvedSaltG: 0,
        undissolvedSaltG: 0,
        saltOnBoatG: 0,
        saltOnSpatulaG: 0,
        stirCount: 0,
        operationsCount: 0,
      },
      measurements: [],
      studentActions: [],
      simulatedObservations: {
        recorded: false,
        headline: 'Session Out of Sync',
        summary: 'Restart the experiment in the 3D laboratory to record valid observations.',
        details: [],
        scopeDisclaimer:
          'Observations are only shown for the active, version-matched experiment session.',
      },
      scientificExplanation: {
        headline: definition.title,
        summary: definition.resultExplanation,
        ionProcessExplanation:
          'When solid sodium chloride (NaCl) dissolves in water (H2O), polar water molecules surround and separate existing Na+ and Cl- ions so they disperse evenly throughout the liquid.',
        physicalChangeClarification:
          'Dissolving salt in water is a physical dissolution process, not a chemical reaction. No new chemical substance is formed.',
      },
      modelAssumptions: [],
      finalConclusions: [],
    }
  }

  const completed = workflow.completed
  const started =
    sessionPhase === 'in-progress' ||
    completed ||
    workflow.safetyAcknowledged ||
    workflow.stepIndex > 0 ||
    chemistry.operations > 0 ||
    placedIds.some((id) => !definition.initialConditions.placedIds.includes(id))

  const availability: ResultsAvailabilityState = completed
    ? 'completed'
    : started
      ? 'in-progress'
      : 'not-started'

  const totalSteps = definition.steps.length
  const validatedSteps = completed ? totalSteps : workflow.stepIndex
  const progressPercent =
    totalSteps > 0 ? Math.round((Math.min(validatedSteps, totalSteps) / totalSteps) * 100) : 0
  const currentStep = completed ? null : (definition.steps[workflow.stepIndex] ?? null)
  const remainingSolidG = undissolvedSaltG(chemistry)

  const quantities = {
    waterUsedMl: workflow.measurements.waterMl,
    saltAddedG: workflow.measurements.saltG,
    beakerWaterMl: chemistry.waterMl.beaker,
    cylinderWaterMl: chemistry.waterMl['graduated-cylinder'],
    waterStockRemainingMl: chemistry.waterMl.water,
    saltInBeakerG: chemistry.saltInBeakerG,
    dissolvedSaltG: chemistry.dissolvedSaltG,
    undissolvedSaltG: remainingSolidG,
    saltOnBoatG: chemistry.saltOnBoatG,
    saltOnSpatulaG: chemistry.saltOnSpatulaG,
    stirCount: chemistry.stirCount,
    operationsCount: chemistry.operations,
  }

  const measurements: SimulatedMeasurementItem[] = [
    {
      id: 'water-used',
      label: 'Recorded water volume',
      shortLabel: 'Water Used',
      value:
        workflow.measurements.waterMl !== null
          ? `${workflow.measurements.waterMl} mL`
          : 'Not recorded yet',
      recorded: workflow.measurements.waterMl !== null,
      sourceNote: 'Derived from the 100 mL graduated cylinder reading in the simulation.',
    },
    {
      id: 'salt-added',
      label: 'Modelled weighed sodium chloride mass',
      shortLabel: 'Salt Added',
      value:
        workflow.measurements.saltG !== null
          ? `${workflow.measurements.saltG} g`
          : 'Not recorded yet',
      recorded: workflow.measurements.saltG !== null,
      sourceNote: 'Derived from the simulated tared weighing boat on the digital balance.',
    },
    {
      id: 'beaker-water',
      label: 'Water remaining in beaker',
      shortLabel: 'Beaker Water Volume',
      value: `${chemistry.waterMl.beaker} mL`,
      recorded: chemistry.waterMl.beaker > 0,
      sourceNote: 'Current liquid volume inside the 250 mL glass beaker.',
    },
    {
      id: 'dissolved-salt',
      label: 'Modelled dissolved salt',
      shortLabel: 'Dissolved Salt in Solution',
      value: `${chemistry.dissolvedSaltG.toFixed(2)} g`,
      recorded: chemistry.dissolvedSaltG > 0,
      sourceNote: `Dispersed NaCl in solution (${remainingSolidG.toFixed(2)} g undissolved solid remaining).`,
    },
  ]

  const studentActions: StudentActionRecord[] = definition.steps.map((step, index) => {
    const stepDone = completed || index < workflow.stepIndex
    const stepActive = !completed && index === workflow.stepIndex
    return {
      id: step.id,
      stepNumber: index + 1,
      title: step.title,
      summary: buildStudentActionSummary(step.id, stepDone, workflow, chemistry),
      completed: stepDone,
      active: stepActive,
    }
  })

  const observationVerified =
    workflow.observationRecorded && remainingSolidG < 0.0001 && chemistry.saltInBeakerG > 0

  const simulatedObservations = {
    recorded: observationVerified,
    headline: observationVerified
      ? 'Salt dissolves in water, forming a homogeneous solution with no visible solid crystals remaining'
      : started
        ? 'Observation in progress — final solution state not yet verified'
        : 'No simulated observation recorded yet',
    summary: observationVerified
      ? 'No undissolved sodium chloride solid is represented in the beaker at the end of the activity. The 5 g of white crystalline NaCl dispersed completely throughout the 100 mL of water to form a clear, uniform aqueous solution.'
      : started
        ? chemistry.saltInBeakerG > 0
          ? remainingSolidG > 0.0001
            ? `The beaker currently contains ${chemistry.waterMl.beaker} mL of water and ${chemistry.saltInBeakerG} g of NaCl, with ${remainingSolidG.toFixed(2)} g of visible undissolved solid remaining at the bottom.`
            : 'All added salt is dissolved in the beaker, but the observation step has not yet been confirmed in the workflow.'
          : `The experiment is in progress (${validatedSteps} of ${totalSteps} steps validated). Salt has not yet been added and stirred in the beaker.`
        : 'Start the experiment in the 3D laboratory and complete the procedure to record your simulated observation.',
    details: observationVerified
      ? [
          `Solvent state: ${chemistry.waterMl.beaker} mL of clear liquid water in the 250 mL beaker.`,
          `Solute state: ${chemistry.dissolvedSaltG.toFixed(2)} g of NaCl completely dissolved (${remainingSolidG.toFixed(2)} g solid remaining).`,
          `Visual appearance: Transparent, single-phase homogeneous solution after ${chemistry.stirCount} confirmed stirring cycle${chemistry.stirCount === 1 ? '' : 's'}.`,
        ]
      : [
          `Current beaker liquid volume: ${chemistry.waterMl.beaker} mL.`,
          `Current NaCl in beaker: ${chemistry.saltInBeakerG} g (${chemistry.dissolvedSaltG.toFixed(2)} g dissolved, ${remainingSolidG.toFixed(2)} g undissolved).`,
        ],
    scopeDisclaimer:
      'This is an observation of the deterministic software model, not a physical sensor reading from a real-world laboratory.',
  }

  const scientificExplanation = {
    headline: 'Physical Dissolution of Sodium Chloride in Water',
    summary: definition.resultExplanation,
    ionProcessExplanation:
      'Sodium chloride (NaCl) is an ionic solid made of sodium ions (Na+) and chloride ions (Cl-). When added to water (H2O) and stirred, polar water molecules attract and surround the individual Na+ and Cl- ions, pulling them away from the crystal lattice so they disperse evenly throughout the liquid.',
    physicalChangeClarification:
      'Physical dissolution vs. chemical reaction: Dissolving NaCl in water is a physical change. The existing Na+ and Cl- ions separate and become hydrated in the aqueous solution, and no new chemical substance is formed.',
  }

  const modelAssumptions: readonly string[] = [
    `Solubility ceiling: Approximated as ${SOLUBILITY_G_PER_100ML} g of NaCl per 100 mL of water near 20°C (${((chemistry.waterMl.beaker || 100) * SOLUBILITY_G_PER_100ML) / 100} g maximum in 100 mL).`,
    `Stirring dissolution rate: Each confirmed circular stirring action dissolves up to ${STIR_DISSOLUTION_G_PER_ACTION} g of NaCl in this simplified teaching model rather than simulating continuous diffusion kinetics.`,
    'Model-derived balance reading: The 5 g net mass on the tared digital balance is derived from conserved simulation quantities, not a calibrated physical load cell.',
    'Constant room temperature & volume conservation: Temperature changes of dissolution and non-ideal volume contraction are omitted for secondary school clarity.',
  ]

  const finalConclusions: readonly string[] = completed
    ? [
        `Adding ${workflow.measurements.saltG ?? 5} g of sodium chloride (solute) to ${workflow.measurements.waterMl ?? 100} mL of water (solvent) and stirring produces a clear, uniform homogeneous aqueous solution.`,
        'Because 5 g of NaCl per 100 mL of water is well below the solubility limit (35.9 g per 100 mL at 20°C), the solution is unsaturated and all solid crystals dissolve completely.',
        'Dissolution of NaCl in water is a physical process in which existing Na+ and Cl- ions disperse evenly in the solvent without forming a new chemical compound.',
        'Accurate volume measurement in a graduated cylinder, tared mass measurement in a weighing boat, and gentle circular stirring with a glass rod ensure reliable, reproducible results.',
      ]
    : []

  return {
    experimentId: experiment.id,
    experimentTitle: experiment.title,
    workflowTitle: definition.title,
    availability,
    statusLabel: completed ? 'Completed' : started ? 'In Progress' : 'Not Started',
    statusHeadline: completed
      ? 'Experiment completed — Results'
      : 'No Experiment Results Yet',
    statusMessage: completed
      ? 'All 9 experimental steps have been validated by the simulation engine. Review your recorded measurements, observations, scientific explanation, and conclusions below.'
      : started
        ? `Your experiment is currently in progress (${validatedSteps} of ${totalSteps} steps validated). Available measurements and completed actions are shown below, while final conclusions unlock once all steps are finished.`
        : 'Complete the experiment in the 3D lab to see your verified results. Opening this page does not complete any steps.',
    validatedSteps,
    totalSteps,
    progressPercent,
    currentStepTitle: currentStep?.title ?? null,
    currentStepDescription: currentStep?.description ?? null,
    safetyAcknowledged: workflow.safetyAcknowledged,
    quantities,
    measurements,
    studentActions,
    simulatedObservations,
    scientificExplanation,
    modelAssumptions,
    finalConclusions,
  }
}
