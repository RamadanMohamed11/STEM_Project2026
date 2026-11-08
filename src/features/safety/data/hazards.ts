/** Draft teaching guidance, not a GHS classification or an experiment risk assessment. */
export type HazardId =
  'flammable' | 'toxic-gas' | 'explosive' | 'corrosive' | 'oxidizer' | 'hot-surface' | 'irritant'
export type ProtectiveEquipment = 'coat' | 'goggles' | 'gloves'
export interface HazardDefinition {
  id: HazardId
  label: string
  description: string
  icon: 'flame' | 'wind' | 'explosion' | 'corrosive' | 'oxidizer' | 'heat' | 'irritant'
  precautions: readonly string[]
  requiredPpe: readonly ProtectiveEquipment[]
  engineeringControls: readonly 'fume-hood'[]
}
export const hazardCatalog: Readonly<Record<HazardId, HazardDefinition>> = {
  flammable: {
    id: 'flammable',
    label: 'Flammable',
    description: 'This material can catch fire.',
    icon: 'flame',
    precautions: [
      'Keep away from flames, sparks and other ignition sources.',
      'Use only the amount and method approved by your teacher.',
    ],
    requiredPpe: ['coat', 'goggles'],
    engineeringControls: [],
  },
  'toxic-gas': {
    id: 'toxic-gas',
    label: 'Toxic Gas',
    description: 'Breathing this gas can cause serious harm.',
    icon: 'wind',
    precautions: [
      'Do not smell the gas or breathe it in.',
      'Work only under teacher supervision with an approved working fume hood.',
    ],
    requiredPpe: ['coat', 'goggles'],
    engineeringControls: ['fume-hood'],
  },
  explosive: {
    id: 'explosive',
    label: 'Explosion Risk',
    description: 'A rapid release of energy can cause serious injury.',
    icon: 'explosion',
    precautions: [
      'Do not attempt this activity without a teacher-approved risk assessment and suitable controls.',
      'Do not heat, strike or mix materials unless the reviewed procedure permits it.',
    ],
    requiredPpe: ['coat', 'goggles'],
    engineeringControls: [],
  },
  corrosive: {
    id: 'corrosive',
    label: 'Corrosive',
    description: 'Contact can damage skin and eyes.',
    icon: 'corrosive',
    precautions: [
      'Avoid splashes and direct contact.',
      'Use gloves selected for the chemical. Tell your teacher immediately about a spill or contact.',
    ],
    requiredPpe: ['coat', 'goggles', 'gloves'],
    engineeringControls: [],
  },
  oxidizer: {
    id: 'oxidizer',
    label: 'Oxidizer',
    description: 'This material can make a fire stronger.',
    icon: 'oxidizer',
    precautions: [
      'Keep away from fuels and other incompatible materials.',
      'Follow the storage and handling instructions for the specific chemical.',
    ],
    requiredPpe: ['coat', 'goggles'],
    engineeringControls: [],
  },
  'hot-surface': {
    id: 'hot-surface',
    label: 'Hot Surface',
    description: 'Hot tools and containers can burn skin.',
    icon: 'heat',
    precautions: [
      'Allow equipment to cool as instructed.',
      'Use suitable tongs or heat protection chosen by your teacher; chemical gloves may not protect against heat.',
    ],
    requiredPpe: ['coat', 'goggles'],
    engineeringControls: [],
  },
  irritant: {
    id: 'irritant',
    label: 'Irritant',
    description: 'Contact or exposure may irritate skin, eyes or airways.',
    icon: 'irritant',
    precautions: [
      'Avoid contact and breathing dust or vapour.',
      'Use the protection and ventilation selected for this activity.',
    ],
    requiredPpe: ['coat', 'goggles'],
    engineeringControls: [],
  },
}
export function getHazard(id: string): HazardDefinition | undefined {
  return Object.hasOwn(hazardCatalog, id) ? hazardCatalog[id as HazardId] : undefined
}
export function getHazards(ids: readonly string[] = []): readonly HazardDefinition[] {
  return [...new Set(ids)].flatMap((id) => {
    const hazard = getHazard(id)
    return hazard ? [hazard] : []
  })
}
