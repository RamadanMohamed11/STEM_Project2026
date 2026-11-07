import type {
  ExperimentAssessmentDefinition,
  MultipleChoiceQuestion,
} from '../../../types/assessment.ts'

export const SALT_DISSOLUTION_EXPERIMENT_ID = 'exp-salt-water-001'
export const SALT_DISSOLUTION_ASSESSMENT_ID = 'assessment-salt-water-001'

/**
 * Draft demonstration multiple-choice questions for "Dissolving Salt in Water".
 * Not an official curriculum exam or university-approved question bank.
 */
export const saltDissolutionQuestions: readonly MultipleChoiceQuestion[] = [
  {
    id: 'q-salt-001-cylinder-purpose',
    experimentId: SALT_DISSOLUTION_EXPERIMENT_ID,
    version: '1.0.0',
    order: 1,
    prompt: 'What is the main purpose of the graduated cylinder in the salt dissolution experiment?',
    options: [
      {
        id: 'opt-salt-001-measure-water',
        order: 1,
        text: 'To measure an accurate volume of liquid water (100 mL) before pouring it into the beaker',
      },
      {
        id: 'opt-salt-001-weigh-salt',
        order: 2,
        text: 'To measure the mass of solid sodium chloride crystals in grams',
      },
      {
        id: 'opt-salt-001-stir-mixture',
        order: 3,
        text: 'To stir the salt and water mixture until the solid crystals disappear',
      },
      {
        id: 'opt-salt-001-store-reagent',
        order: 4,
        text: 'To store dry solid chemicals on the laboratory shelf',
      },
    ],
    correctOptionId: 'opt-salt-001-measure-water',
    explanation:
      'A graduated cylinder has volume scale markings designed to measure liquid volumes accurately, such as the 100 mL of water used in this experiment. Balances measure mass, and beakers hold liquids for mixing.',
    difficulty: 'beginner',
    learningObjectiveId: 'salt-tools',
    reviewStatus: 'draft',
    tags: ['equipment', 'graduated-cylinder', 'volume'],
  },
  {
    id: 'q-salt-002-meniscus-reading',
    experimentId: SALT_DISSOLUTION_EXPERIMENT_ID,
    version: '1.0.0',
    order: 2,
    prompt: 'How should you read the water volume in a graduated cylinder for an accurate measurement?',
    options: [
      {
        id: 'opt-salt-002-above-angle',
        order: 1,
        text: 'Look down from above the top rim while holding the cylinder in your hand',
      },
      {
        id: 'opt-salt-002-eye-level-meniscus',
        order: 2,
        text: 'Keep the cylinder on a flat bench and read the bottom of the curved liquid surface (meniscus) at eye level',
      },
      {
        id: 'opt-salt-002-top-edge',
        order: 3,
        text: 'Read the highest edge where water touches the glass wall from below',
      },
      {
        id: 'opt-salt-002-estimate-beaker',
        order: 4,
        text: 'Guess the volume without looking at the scale marks on the cylinder',
      },
    ],
    correctOptionId: 'opt-salt-002-eye-level-meniscus',
    explanation:
      'Water curves downward in a narrow glass cylinder, forming a meniscus. Placing the cylinder on a flat surface and reading the lowest point of the meniscus at eye level prevents viewing-angle errors.',
    difficulty: 'beginner',
    learningObjectiveId: 'salt-water-volume',
    reviewStatus: 'draft',
    tags: ['measurement', 'meniscus', 'graduated-cylinder'],
  },
  {
    id: 'q-salt-003-weighing-salt',
    experimentId: SALT_DISSOLUTION_EXPERIMENT_ID,
    version: '1.0.0',
    order: 3,
    prompt:
      'Which procedure safely and accurately measures 5 g of solid sodium chloride (NaCl) in the virtual laboratory?',
    options: [
      {
        id: 'opt-salt-003-pour-from-jar',
        order: 1,
        text: 'Pour salt directly from the storage jar into the water beaker without weighing it',
      },
      {
        id: 'opt-salt-003-bare-hands',
        order: 2,
        text: 'Pick up salt crystals with bare hands and place them directly onto the metal balance pan',
      },
      {
        id: 'opt-salt-003-spatula-and-boat',
        order: 3,
        text: 'Use the clean spatula to transfer NaCl into a weighing boat and weigh the loaded boat on the tared digital balance',
      },
      {
        id: 'opt-salt-003-graduated-cylinder',
        order: 4,
        text: 'Pour dry salt crystals into the wet graduated cylinder to read their mass in milliliters',
      },
    ],
    correctOptionId: 'opt-salt-003-spatula-and-boat',
    explanation:
      'Solid laboratory reagents should never be touched with bare hands or poured directly from the storage jar into a reaction vessel. Using a clean spatula and a tared weighing boat on the balance protects the chemical stock and measures the 5 g net mass cleanly.',
    difficulty: 'beginner',
    learningObjectiveId: 'salt-mass',
    reviewStatus: 'draft',
    tags: ['measurement', 'mass', 'spatula', 'weighing-boat', 'digital-balance'],
  },
  {
    id: 'q-salt-004-stirring-rod-function',
    experimentId: SALT_DISSOLUTION_EXPERIMENT_ID,
    version: '1.0.0',
    order: 4,
    prompt: 'What is the function of the glass stirring rod after adding salt to the water in the beaker?',
    options: [
      {
        id: 'opt-salt-004-circulate-and-dissolve',
        order: 1,
        text: 'It gently circulates the water so the solid salt particles spread out and dissolve evenly',
      },
      {
        id: 'opt-salt-004-measure-temperature',
        order: 2,
        text: 'It measures the exact temperature change of the liquid in degrees Celsius',
      },
      {
        id: 'opt-salt-004-filter-solid',
        order: 3,
        text: 'It filters undissolved salt out of the beaker like filter paper',
      },
      {
        id: 'opt-salt-004-heat-solution',
        order: 4,
        text: 'It boils the water so the salt melts into a liquid metal',
      },
    ],
    correctOptionId: 'opt-salt-004-circulate-and-dissolve',
    explanation:
      'Moving the glass stirring rod in gentle circular strokes mixes the water and salt crystals. This brings fresh water molecules around the crystals so the solute dissolves faster and forms a uniform solution.',
    difficulty: 'beginner',
    learningObjectiveId: 'salt-tools',
    reviewStatus: 'draft',
    tags: ['equipment', 'stirring-rod', 'dissolution'],
  },
  {
    id: 'q-salt-005-what-happens-when-dissolved',
    experimentId: SALT_DISSOLUTION_EXPERIMENT_ID,
    version: '1.0.0',
    order: 5,
    prompt: 'What happens to the 5 g of sodium chloride when it completely dissolves in 100 mL of water?',
    options: [
      {
        id: 'opt-salt-005-destroyed',
        order: 1,
        text: 'The salt is destroyed and its mass disappears completely from the beaker',
      },
      {
        id: 'opt-salt-005-ions-disperse',
        order: 2,
        text: 'The salt separates into tiny sodium (Na+) and chloride (Cl-) ions that spread evenly through the water to form a clear homogeneous solution',
      },
      {
        id: 'opt-salt-005-turns-to-gas',
        order: 3,
        text: 'The salt turns into a gas and escapes into the air above the bench',
      },
      {
        id: 'opt-salt-005-settles-bottom',
        order: 4,
        text: 'All 5 g of salt remains visible as a white solid layer at the bottom of the beaker',
      },
    ],
    correctOptionId: 'opt-salt-005-ions-disperse',
    explanation:
      'When sodium chloride dissolves in water, polar water molecules surround and separate the Na+ and Cl- ions. Even though you can no longer see solid white grains, all 5 g of dissolved salt remains evenly distributed throughout the clear homogeneous solution.',
    difficulty: 'beginner',
    learningObjectiveId: 'salt-dissolving',
    reviewStatus: 'draft',
    tags: ['solution', 'ions', 'homogeneous-mixture'],
  },
  {
    id: 'q-salt-006-physical-not-chemical',
    experimentId: SALT_DISSOLUTION_EXPERIMENT_ID,
    version: '1.0.0',
    order: 6,
    prompt: 'Does dissolving sodium chloride (NaCl) in water create a new chemical substance?',
    options: [
      {
        id: 'opt-salt-006-no-physical-process',
        order: 1,
        text: 'No. Dissolving salt in water is a physical process in which existing Na+ and Cl- ions disperse in water without forming a new chemical compound',
      },
      {
        id: 'opt-salt-006-yes-new-compound',
        order: 2,
        text: 'Yes. Salt and water combine chemically to form a new insoluble solid compound',
      },
      {
        id: 'opt-salt-006-yes-hydrogen-gas',
        order: 3,
        text: 'Yes. Salt breaks water molecules apart to release hydrogen and oxygen gas bubbles',
      },
      {
        id: 'opt-salt-006-yes-atoms-change',
        order: 4,
        text: 'Yes. The sodium and chlorine atoms turn into water molecules during stirring',
      },
    ],
    correctOptionId: 'opt-salt-006-no-physical-process',
    explanation:
      'Dissolving NaCl in water is a physical change, not a chemical reaction. Existing Na+ and Cl- ions separate from the crystal lattice and become surrounded by water molecules, and no new chemical substance is formed.',
    difficulty: 'intermediate',
    learningObjectiveId: 'salt-observation',
    reviewStatus: 'draft',
    tags: ['physical-change', 'dissolution', 'scientific-accuracy'],
  },
]

export const saltDissolutionAssessment: ExperimentAssessmentDefinition = {
  id: SALT_DISSOLUTION_ASSESSMENT_ID,
  experimentId: SALT_DISSOLUTION_EXPERIMENT_ID,
  version: '1.0.0',
  title: 'Dissolving Salt in Water — Post-Experiment Concept Check',
  description:
    'Review the laboratory tools, measurement techniques, observations, and scientific principles from the salt dissolution experiment.',
  scopeDisclaimer:
    'Draft demonstration assessment content for educational review. Not an official school examination or approved university assessment.',
  availabilityStatus: 'draft-demo',
  reviewStatus: 'draft',
  questionOrdering: 'ordered-by-field',
  passingScore: {
    status: 'unconfigured-draft',
    note: 'Passing score thresholds are not enforced for draft demonstration content.',
  },
  allowMultipleAttempts: true,
  questions: saltDissolutionQuestions,
}
