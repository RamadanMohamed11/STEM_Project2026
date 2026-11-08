import { saltDissolutionWorkspace } from '../../simulations/data/saltDissolutionWorkspace.ts'
import { saltExperimentDefinition } from '../../simulations/data/saltExperimentDefinition.ts'
import {
  clampGuideStage,
  findInventoryItem,
  guidePositionPercent,
} from '../../simulations/lib/workspaceSelectors.ts'
import type { ExperimentWorkflowDefinition } from '../../simulations/engine/workflowTypes.ts'
import type { InventoryItem } from '@/types/laboratory'
import type {
  EducationalLearningStage,
  ExperimentLearningStagesData,
  LinkedSimulationStep,
} from '../types/learningStages.ts'

/**
 * Resolves simulation workflow step metadata by step ID without coupling the
 * educational viewer to live simulation state or mutating execution progress.
 */
export function resolveLinkedSimulationSteps(
  definition: ExperimentWorkflowDefinition,
  stepIds: readonly string[],
): readonly LinkedSimulationStep[] {
  const result: LinkedSimulationStep[] = []
  for (const stepId of stepIds) {
    const stepIndex = definition.steps.findIndex((item) => item.id === stepId)
    if (stepIndex === -1) continue
    const step = definition.steps[stepIndex]
    const stage = definition.stages.find((group) => group.id === step.stageId)
    result.push({
      stepId: step.id,
      stepNumber: stepIndex + 1,
      title: step.title,
      stageTitle: stage?.title ?? 'Procedure',
    })
  }
  return result
}

/**
 * Resolves inventory items by their canonical IDs from a laboratory presentation.
 */
export function resolveStageInventoryItems(
  inventory: readonly InventoryItem[],
  itemIds: readonly string[],
): readonly InventoryItem[] {
  const result: InventoryItem[] = []
  for (const id of itemIds) {
    const found = findInventoryItem(inventory, id)
    if (found) result.push(found)
  }
  return result
}

const baseStages = saltDissolutionWorkspace.stages
const baseInventory = saltDissolutionWorkspace.inventory

export const saltDissolutionLearningStages: ExperimentLearningStagesData = {
  experimentId: 'exp-salt-water-001',
  experimentTitle: 'Dissolving Salt in Water',
  reviewStatus: 'draft',
  reactionClassificationNote:
    'Dissolving sodium chloride (NaCl) in water (H₂O) is a physical dissolution process, not a chemical reaction. Existing Na⁺ and Cl⁻ ions disperse into the water without forming a new chemical compound.',
  simulationSeparationNote:
    'This five-stage learning guide is for reading and preparation. Navigating these stages does not advance or complete steps in the 3D virtual laboratory.',
  stages: [
    {
      ...baseStages[0],
      order: 1,
      categoryLabel: 'Stage 1 · Apparatus & Glassware',
      subtitle: 'Choosing the right tools for measuring, weighing, and mixing',
      summary:
        'Each tool on the laboratory bench has a specific job. Before handling any chemicals, identify the beaker, graduated cylinder, glass stirring rod, digital balance, laboratory spatula, and weighing boat.',
      steps: [
        ...baseStages[0].steps,
        'Keep the digital balance on a flat, stable surface and place a clean weighing boat on its pan before weighing solids.',
      ],
      scientificExplanation:
        'Beakers are designed for holding and mixing liquids, while graduated cylinders use narrow, calibrated columns to measure liquid volumes accurately (100 mL). The digital balance and tared weighing boat let you measure solid mass (5 g of NaCl) cleanly without placing crystals directly on the balance pan.',
      relatedInventoryIds: [
        'beaker',
        'graduated-cylinder',
        'stirring-rod',
        'digital-balance',
        'spatula',
        'weighing-boat',
      ],
      relatedItems: resolveStageInventoryItems(baseInventory, [
        'beaker',
        'graduated-cylinder',
        'stirring-rod',
        'digital-balance',
        'spatula',
        'weighing-boat',
      ]),
      linkedSimulationSteps: resolveLinkedSimulationSteps(saltExperimentDefinition, [
        'prepare',
        'place-beaker',
      ]),
      highlights: [
        'Beaker — Holds and mixes liquids.',
        'Graduated Cylinder — Measures 100 mL of water.',
        'Digital Balance & Weighing Boat — Weighs 5 g of salt.',
        'Glass Stirring Rod — Helps mix liquids.',
      ],
      video: {
        status: 'coming-soon',
        title: 'Introduction to Solution Preparation Equipment',
        description:
          'A demonstration video introducing the beaker, graduated cylinder, digital balance, weighing boat, spatula, and glass stirring rod is being prepared.',
        durationLabel: 'Demonstration clip pending',
      },
      extension: {
        reviewStatus: 'draft',
        illustrationKey: 'salt-equipment-overview',
        keyConcepts: ['volumetric measurement', 'tared weighing', 'glassware handling'],
        futureAiPromptContext: {
          focusTopic: 'Selecting appropriate glassware and balances for solution preparation',
          scientificGuardrails: [
            'Beaker graduations are approximate; use the graduated cylinder for 100 mL.',
            'The digital balance in the virtual lab is a teaching model, not a calibrated instrument.',
          ],
        },
      },
    },
    {
      ...baseStages[1],
      order: 2,
      categoryLabel: 'Stage 2 · Solvent & Solute',
      subtitle: 'Understanding water (H₂O) as the solvent and sodium chloride (NaCl) as the solute',
      processClassification: 'physical-dissolution',
      processBadgeLabel: 'Solvent & Solute · Physical Process',
      summary:
        'This experiment uses water and sodium chloride. Because no chemical reaction takes place, they act as a liquid solvent and a solid solute rather than chemical reactants forming a new compound.',
      steps: [
        ...baseStages[1].steps,
        'Confirm the required quantities: 100 mL of water (from the 400 mL supply container) and 5 g of sodium chloride (from the 100 g reagent jar).',
      ],
      scientificExplanation:
        'Sodium chloride (NaCl) is an ionic solid made of sodium ions (Na⁺) and chloride ions (Cl⁻) arranged in a crystal lattice. Water (H₂O) is a polar liquid solvent whose molecules surround and separate those ions so they disperse evenly.',
      relatedInventoryIds: ['water', 'sodium-chloride'],
      relatedItems: resolveStageInventoryItems(baseInventory, ['water', 'sodium-chloride']),
      linkedSimulationSteps: resolveLinkedSimulationSteps(saltExperimentDefinition, ['prepare']),
      highlights: [
        'Water (H₂O) — Clear, colorless liquid solvent (100 mL required from 400 mL stock).',
        'Sodium Chloride (NaCl) — White crystalline solid solute (5 g required from 100 g stock).',
        'Safety rule — Never taste or drink from any laboratory container.',
      ],
      video: {
        status: 'coming-soon',
        title: 'Solvent and Solute Roles: Water and Sodium Chloride',
        description:
          'A demonstration video examining laboratory-grade sodium chloride crystals and proper water solvent handling is being prepared.',
        durationLabel: 'Demonstration clip pending',
      },
      extension: {
        reviewStatus: 'draft',
        illustrationKey: 'solvent-solute-comparison',
        keyConcepts: ['solvent', 'solute', 'aqueous solution', 'ionic crystal'],
        futureAiPromptContext: {
          focusTopic: 'Distinguishing a solvent and solute from chemical reactants',
          scientificGuardrails: [
            'Do not describe dissolving NaCl in water as a chemical reaction.',
            'Existing Na+ and Cl- ions separate; no new compound is created.',
          ],
        },
      },
    },
    {
      ...baseStages[2],
      order: 3,
      categoryLabel: 'Stage 3 · Step-by-Step Method',
      subtitle: 'Measuring water, weighing salt, combining, and stirring gently',
      summary:
        'Follow an ordered procedure to prepare the aqueous salt solution: measure 100 mL of water first, pour it into the beaker, weigh 5 g of salt in the weighing boat, add the salt to the water, and stir until the crystals dissolve.',
      steps: [
        'Measure 100 mL of water in the graduated cylinder and pour it into the beaker.',
        'Use the laboratory spatula to scoop 5 g of sodium chloride into the tared weighing boat on the digital balance.',
        'Add 5 g of salt from the weighing boat into the beaker of water.',
        'Stir until the salt dissolves completely using gentle circular motions with the glass stirring rod.',
      ],
      scientificExplanation:
        'Placing the measured 100 mL of water into the beaker before adding the 5 g of solid salt prevents crystals from sticking to dry glass and avoids splashing. Gentle circular stirring moves water across the crystal surfaces so the solid dissolves smoothly.',
      relatedInventoryIds: [
        'graduated-cylinder',
        'beaker',
        'spatula',
        'weighing-boat',
        'stirring-rod',
      ],
      relatedItems: resolveStageInventoryItems(baseInventory, [
        'graduated-cylinder',
        'beaker',
        'spatula',
        'weighing-boat',
        'stirring-rod',
      ]),
      linkedSimulationSteps: resolveLinkedSimulationSteps(saltExperimentDefinition, [
        'transfer-water',
        'add-salt',
        'stir',
      ]),
      highlights: [
        'Measure 100 mL of water.',
        'Add 5 g of salt.',
        'Stir until the salt dissolves.',
      ],
      video: {
        status: 'coming-soon',
        title: 'Step-by-Step Solution Preparation Procedure',
        description:
          'A demonstration video showing how to pour 100 mL of water, transfer 5 g of salt from the weighing boat, and stir with a glass rod is being prepared.',
        durationLabel: 'Demonstration clip pending',
      },
      extension: {
        reviewStatus: 'draft',
        illustrationKey: 'solution-procedure-steps',
        keyConcepts: ['liquid transfer', 'solid transfer', 'circular stirring'],
        futureAiPromptContext: {
          focusTopic: 'Why procedural order and gentle circular stirring matter in solution preparation',
          scientificGuardrails: [
            'Use only the verified quantities: 100 mL water and 5 g NaCl.',
            'Transfer salt via the spatula and weighing boat, never directly from the reagent jar into the beaker.',
          ],
        },
      },
    },
    {
      ...baseStages[3],
      order: 4,
      categoryLabel: 'Stage 4 · Volume & Mass Recording',
      subtitle: 'Reading the 100 mL liquid meniscus and recording the 5 g net solid mass',
      processClassification: 'measurement-technique',
      processBadgeLabel: '100 mL Water + 5 g NaCl',
      summary:
        'Accurate observation starts with recording how much solvent and solute you use. Measure water volume in milliliters (100 mL) and sodium chloride mass in grams (5 g).',
      steps: [
        'Read the bottom of the curved water meniscus at eye level to confirm 100 mL in the graduated cylinder.',
        'Place the loaded weighing boat on the digital balance pan to confirm 5 g of net sodium chloride mass.',
        'Record 100 mL of water and 5 g of salt, then note whether any solid crystals remain after stirring.',
      ],
      scientificExplanation:
        'Water curves slightly against glass walls, forming a concave meniscus; reading the bottom of that curve at eye level prevents parallax errors. Taring the balance with the empty weighing boat ensures you measure only the 5 g of salt inside the dish.',
      relatedInventoryIds: [
        'graduated-cylinder',
        'digital-balance',
        'weighing-boat',
        'water',
        'sodium-chloride',
      ],
      relatedItems: resolveStageInventoryItems(baseInventory, [
        'graduated-cylinder',
        'digital-balance',
        'weighing-boat',
        'water',
        'sodium-chloride',
      ]),
      linkedSimulationSteps: resolveLinkedSimulationSteps(saltExperimentDefinition, [
        'measure-water',
        'measure-salt',
      ]),
      highlights: [
        'Water volume target: 100 mL (measured in the graduated cylinder).',
        'Salt mass target: 5 g (weighed in a tared weighing boat).',
        'Important: Simulation values are deterministic teaching quantities, not calibrated hardware measurements.',
      ],
      video: {
        status: 'coming-soon',
        title: 'How to Read a Meniscus and Use a Tared Balance',
        description:
          'A close-up video demonstrating eye-level meniscus readings at 100 mL and tared weighing of 5 g of salt is being prepared.',
        durationLabel: 'Demonstration clip pending',
      },
      extension: {
        reviewStatus: 'draft',
        illustrationKey: 'meniscus-and-balance-reading',
        keyConcepts: ['meniscus', 'parallax error', 'tare weight', 'net mass'],
        futureAiPromptContext: {
          focusTopic: 'Measuring liquid volume in milliliters and solid mass in grams',
          scientificGuardrails: [
            'Remind students that the virtual balance and cylinder use deterministic simulation rules.',
          ],
        },
      },
    },
    {
      ...baseStages[4],
      order: 5,
      categoryLabel: 'Stage 5 · Physical Dissolution & Results',
      subtitle: 'Explaining physical dissolution and why no new chemical compound forms',
      processClassification: 'physical-dissolution',
      processBadgeLabel: 'Physical Dissolution · No Chemical Reaction',
      summary:
        'After stirring 5 g of sodium chloride into 100 mL of water, the white crystals are no longer visible. The result is a clear, homogeneous aqueous solution produced by physical dissolution rather than a chemical reaction.',
      steps: [
        'Inspect the beaker after stirring to confirm that no visible solid salt crystals remain at the bottom.',
        'Observe that 5 g of NaCl dissolves completely in 100 mL of water, forming a clear homogeneous solution.',
        'Conclude that dissolving salt in water is a physical process: existing Na⁺ and Cl⁻ ions disperse in water without forming a new chemical substance.',
      ],
      scientificExplanation:
        'When sodium chloride dissolves in water, polar water molecules surround and separate the existing Na⁺ and Cl⁻ ions from the crystal lattice. Even though the solid disappears from view, the ions remain unchanged in solution and could be recovered as solid NaCl if the water evaporated.',
      relatedInventoryIds: ['beaker', 'water', 'sodium-chloride'],
      relatedItems: resolveStageInventoryItems(baseInventory, [
        'beaker',
        'water',
        'sodium-chloride',
      ]),
      linkedSimulationSteps: resolveLinkedSimulationSteps(saltExperimentDefinition, [
        'observe',
        'review',
      ]),
      highlights: [
        'Final solution: 100 mL of water containing 5 g of dissolved NaCl (0 g undissolved solid).',
        'Visual observation: Clear, uniform liquid with no settled crystals.',
        'Scientific conclusion: Physical dissolution disperses existing Na⁺ and Cl⁻ ions; no new compound is formed.',
      ],
      video: {
        status: 'coming-soon',
        title: 'Physical Dissolution and Final Solution Inspection',
        description:
          'A demonstration video comparing undissolved salt crystals with a fully dissolved clear aqueous solution is being prepared.',
        durationLabel: 'Demonstration clip pending',
      },
      extension: {
        reviewStatus: 'draft',
        illustrationKey: 'aqueous-ion-dispersion',
        keyConcepts: ['physical dissolution', 'homogeneous solution', 'hydrated ions', 'reversibility'],
        futureAiPromptContext: {
          focusTopic: 'Why dissolving NaCl in water is a physical change and not a chemical reaction',
          scientificGuardrails: [
            'Never claim a chemical reaction or new compound occurs when NaCl dissolves in H2O.',
            'State clearly that dissolution kinetics in the virtual lab are simplified educational rules.',
          ],
        },
      },
    },
  ],
}

import { allSyllabusLearningStages } from './syllabusLearningStages.ts'
export * from './syllabusLearningStages.ts'

export const experimentLearningStagesCatalog: readonly ExperimentLearningStagesData[] = [
  saltDissolutionLearningStages,
  ...allSyllabusLearningStages,
]

/**
 * Returns the 5-stage educational learning package for a supported experiment.
 * Planned or unverified experiments return undefined so fabricated procedures
 * or observations are never displayed.
 */
export function getExperimentLearningStages(
  experimentId: string,
): ExperimentLearningStagesData | undefined {
  return experimentLearningStagesCatalog.find((item) => item.experimentId === experimentId)
}

/**
 * Safely resolves the active stage, clamped index, reading progress percentage,
 * and Previous/Next boundary flags.
 */
export function getLearningStageNavigationState(
  stages: readonly EducationalLearningStage[] | undefined,
  requestedIndex: number,
) {
  const list = stages ?? []
  if (list.length === 0) {
    return {
      stage: undefined,
      activeIndex: 0,
      totalStages: 0,
      progressPercent: 0,
      hasPrevious: false,
      hasNext: false,
    }
  }
  const activeIndex = clampGuideStage(requestedIndex, list.length)
  return {
    stage: list[activeIndex],
    activeIndex,
    totalStages: list.length,
    progressPercent: guidePositionPercent(activeIndex, list.length),
    hasPrevious: activeIndex > 0,
    hasNext: activeIndex < list.length - 1,
  }
}
