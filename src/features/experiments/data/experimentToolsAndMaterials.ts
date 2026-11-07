import type {
  ExperimentToolsAndMaterialsData,
} from '../types/toolsAndMaterials'

/**
 * Structured presentation data for experiment tools and chemical materials.
 * Separates educational guidance from executable 3D simulation rules.
 */
export const saltDissolutionToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-salt-water-001',
  reviewStatus: 'draft',
  measurementDisclaimer:
    'Quantities reflect educational simulation targets, not certified analytical measurements.',
  tools: [
    {
      id: 'beaker',
      name: 'Beaker',
      visual: 'beaker',
      shortExplanation: 'A flat-bottomed cylindrical glass container with a pouring spout.',
      purpose: 'Holds the water solvent and provides space for adding and stirring the solid salt.',
      specification: '250 mL Borosilicate Glass',
      safetyNote:
        'Inspect for chips or cracks before use. Support by the body and base when handling.',
    },
    {
      id: 'graduated-cylinder',
      name: 'Graduated Cylinder',
      visual: 'graduated-cylinder',
      shortExplanation: 'A tall, narrow glass cylinder marked with calibrated measurement lines.',
      purpose: 'Measures exactly 100 mL of water before transferring it into the reaction beaker.',
      specification: '100 mL Calibrated Glass',
      safetyNote:
        'Always read the bottom of the curved meniscus at eye level on a flat, level surface.',
    },
    {
      id: 'stirring-rod',
      name: 'Glass Stirring Rod',
      visual: 'stirring-rod',
      shortExplanation: 'A solid glass rod with smooth, rounded, fire-polished ends.',
      purpose: 'Helps mix liquids and speeds up the dissolution of solid salt crystals in water.',
      specification: 'Solid Borosilicate Glass',
      safetyNote:
        'Stir gently in circular motions without striking the glass bottom or sides of the beaker.',
    },
    {
      id: 'digital-balance',
      name: 'Digital Balance',
      visual: 'digital-balance',
      shortExplanation: 'An electronic weighing device that displays mass on a digital readout.',
      purpose:
        'Measures the net mass of sodium chloride placed in the tared weighing boat (5.00 g).',
      specification: 'Two-decimal electronic balance (0.01 g precision)',
      safetyNote:
        'Tare the balance with the empty weighing boat before adding crystals; keep the pan dry.',
    },
    {
      id: 'spatula',
      name: 'Laboratory Spatula',
      visual: 'spatula',
      shortExplanation: 'A handheld stainless-steel tool with a flat blade and a shallow scoop.',
      purpose:
        'Transfers small portions of solid sodium chloride cleanly from the reagent bottle into the weighing boat.',
      specification: 'Stainless Steel Scoop Spatula',
      safetyNote:
        'Use only clean, dry spatulas. Never return excess chemical powder to the stock jar.',
    },
    {
      id: 'weighing-boat',
      name: 'Weighing Boat',
      visual: 'weighing-boat',
      shortExplanation: 'A shallow, flexible dish used to hold solid chemical samples on a balance.',
      purpose:
        'Contains the scooped salt crystals during weighing and flexes easily to pour them into the beaker.',
      specification: 'Polystyrene shallow weighing dish',
      safetyNote:
        'Ensure the dish is completely dry before adding powders to avoid sticking or chemical clumps.',
    },
  ],
  materials: [
    {
      id: 'water',
      name: 'Water',
      formula: 'H₂O',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid at room temperature',
      role: 'Solvent',
      purpose: 'Acts as the solvent that disperses and dissolves sodium and chloride ions.',
      stockQuantity: {
        amount: 400,
        unit: 'mL',
        label: 'Stock Supply',
        description: '400 mL supply container on the laboratory bench',
      },
      requiredQuantity: {
        amount: 100,
        unit: 'mL',
        label: 'Experiment Target',
        description: '100 mL measured in the graduated cylinder',
      },
      safetyNotes: [
        'Never drink or taste water from a laboratory container.',
        'Wipe up any water spills immediately to prevent slipping.',
      ],
      isModelEstimated: true,
    },
    {
      id: 'sodium-chloride',
      name: 'Sodium Chloride',
      formula: 'NaCl',
      visual: 'sodium-chloride',
      physicalAppearance: 'White crystalline solid (table salt crystals)',
      role: 'Solute',
      purpose:
        'Acts as the solid ionic solute that dissolves into separate sodium (Na⁺) and chloride (Cl⁻) ions.',
      stockQuantity: {
        amount: 100,
        unit: 'g',
        label: 'Stock Supply',
        description: '100 g solid reagent container on the laboratory bench',
      },
      requiredQuantity: {
        amount: 5,
        unit: 'g',
        label: 'Experiment Target',
        description: '5 g weighed on the digital balance',
      },
      safetyNotes: [
        'Do not taste or ingest laboratory-grade chemical reagents.',
        'Keep the container tightly capped when not in use to avoid moisture absorption.',
      ],
      isModelEstimated: true,
    },
  ],
}

/** Registry of tools and materials for supported experiments. */
export const experimentToolsAndMaterialsCatalog: readonly ExperimentToolsAndMaterialsData[] = [
  saltDissolutionToolsAndMaterials,
]

/**
 * Returns structured tools and materials data for an experiment if available.
 * Planned experiments without verified laboratory configurations return undefined
 * to avoid presenting fabricated requirements.
 */
export function getExperimentToolsAndMaterials(
  experimentId: string,
): ExperimentToolsAndMaterialsData | undefined {
  return experimentToolsAndMaterialsCatalog.find((item) => item.experimentId === experimentId)
}
