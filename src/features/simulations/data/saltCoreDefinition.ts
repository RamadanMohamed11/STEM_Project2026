import type { CoreExperimentDefinition, DissolutionProcess } from '../engine/core/index.ts'
import { SODIUM_CHLORIDE_PARTICLES, WATER_PARTICLES } from './particleSpecies.ts'

/**
 * L1: the salt-dissolution experiment described as data for the generic engine.
 * Container ids match the existing inventory ids so the 3D scene and workflow keep working.
 * The legacy `SaltExperimentState` used by the UI is a projection of this model
 * (see engine/saltExperiment.ts).
 */
export const saltDissolutionProcess: DissolutionProcess = {
  kind: 'dissolution',
  id: 'nacl-dissolves-in-water',
  soluteId: 'sodium-chloride',
  solventId: 'water',
  dissolvedId: 'sodium-chloride-aq',
  /** Illustrative approximate NaCl solubility near 20 °C, not calibrated to a measured experiment. */
  solubilityGPer100Ml: 35.9,
  /** Deliberately simplified teaching rate: 4 g per 1.5 s of active stirring. */
  rateGPerSecondStirred: (4 * 1000) / 1500,
  rateGPerSecondUnstirred: 0,
}

export const saltCoreExperiment: CoreExperimentDefinition = {
  schemaVersion: 1,
  id: 'core-salt-dissolution-001',
  experimentId: 'exp-salt-water-001',
  version: '1.0.0',
  title: 'Preparing an aqueous sodium chloride solution',
  chemistry: {
    schemaVersion: 1,
    ambientTemperatureC: 20,
    coolingPerSecond: 0.02,
    substances: [
      {
        id: 'water',
        name: 'Water',
        formula: 'H₂O',
        state: 'liquid',
        color: '#d6ecff',
        opacity: 0.15,
        densityGPerMl: 1,
        molarMassGPerMol: 18.015,
        boilingPointC: 100,
        particles: WATER_PARTICLES,
      },
      {
        id: 'sodium-chloride',
        name: 'Sodium chloride',
        formula: 'NaCl',
        state: 'solid',
        color: '#ffffff',
        opacity: 1,
        molarMassGPerMol: 58.44,
        hazards: ['irritant'],
        particles: SODIUM_CHLORIDE_PARTICLES,
      },
      {
        id: 'sodium-chloride-aq',
        name: 'Dissolved sodium chloride (Na⁺ and Cl⁻ ions)',
        formula: 'NaCl(aq)',
        state: 'aqueous',
        color: '#d6ecff',
        opacity: 0,
        molarMassGPerMol: 58.44,
        particles: SODIUM_CHLORIDE_PARTICLES,
      },
    ],
    containers: [
      {
        id: 'water',
        label: 'Water container',
        equipmentId: 'water',
        capacity: { value: 500, unit: 'mL' },
        accepts: ['liquid'],
        open: true,
        initialContents: [{ substanceId: 'water', amount: 400 }],
      },
      {
        id: 'graduated-cylinder',
        label: 'Graduated cylinder',
        equipmentId: 'graduated-cylinder',
        capacity: { value: 100, unit: 'mL' },
        accepts: ['liquid'],
        open: true,
      },
      {
        id: 'beaker',
        label: 'Beaker',
        equipmentId: 'beaker',
        capacity: { value: 250, unit: 'mL' },
        accepts: ['liquid', 'solid', 'aqueous'],
        open: true,
      },
      {
        id: 'sodium-chloride',
        label: 'Sodium chloride jar',
        equipmentId: 'sodium-chloride',
        capacity: { value: 100, unit: 'g' },
        accepts: ['solid'],
        open: true,
        initialContents: [{ substanceId: 'sodium-chloride', amount: 100 }],
      },
      {
        id: 'spatula',
        label: 'Spatula',
        equipmentId: 'spatula',
        capacity: { value: 5, unit: 'g' },
        accepts: ['solid'],
        open: true,
      },
      {
        id: 'weighing-boat',
        label: 'Weighing boat',
        equipmentId: 'weighing-boat',
        capacity: { value: 25, unit: 'g' },
        accepts: ['solid'],
        open: true,
      },
    ],
    processes: [saltDissolutionProcess],
    reactions: [],
  },
  allowedEquipment: [
    'beaker',
    'graduated-cylinder',
    'stirring-rod',
    'digital-balance',
    'spatula',
    'weighing-boat',
  ],
  allowedSubstances: ['water', 'sodium-chloride'],
  guidedSteps: [
    {
      id: 'measure-water',
      title: 'Measure 100 mL water',
      instruction: 'Pour exactly 100 mL of water into the graduated cylinder.',
      expectedAction: {
        kind: 'transfer',
        from: 'water',
        to: 'graduated-cylinder',
        substanceId: 'water',
      },
      completeWhen: [
        { kind: 'volume', containerId: 'graduated-cylinder', operator: 'eq', value: 100 },
      ],
    },
    {
      id: 'pour-water',
      title: 'Pour water into beaker',
      instruction: 'Transfer the measured water into the beaker.',
      expectedAction: {
        kind: 'transfer',
        from: 'graduated-cylinder',
        to: 'beaker',
        substanceId: 'water',
      },
      completeWhen: [{ kind: 'volume', containerId: 'beaker', operator: 'eq', value: 100 }],
    },
    {
      id: 'scoop-salt',
      title: 'Scoop 5 g NaCl',
      instruction: 'Scoop 5 g of sodium chloride with the spatula.',
      expectedAction: {
        kind: 'transfer',
        from: 'sodium-chloride',
        to: 'spatula',
        substanceId: 'sodium-chloride',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'spatula',
          substanceId: 'sodium-chloride',
          operator: 'eq',
          value: 5,
        },
      ],
    },
    {
      id: 'weigh-salt',
      title: 'Weigh the salt',
      instruction: 'Deposit the salt on the weighing boat.',
      expectedAction: {
        kind: 'transfer',
        from: 'spatula',
        to: 'weighing-boat',
        substanceId: 'sodium-chloride',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'weighing-boat',
          substanceId: 'sodium-chloride',
          operator: 'eq',
          value: 5,
        },
      ],
    },
    {
      id: 'add-salt',
      title: 'Add 5 g NaCl',
      instruction: 'Add the weighed salt to the water in the beaker.',
      expectedAction: {
        kind: 'transfer',
        from: 'weighing-boat',
        to: 'beaker',
        substanceId: 'sodium-chloride',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'beaker',
          substanceId: 'sodium-chloride',
          operator: 'eq',
          value: 5,
        },
      ],
    },
    {
      id: 'stir',
      title: 'Stir until no solid remains',
      instruction: 'Stir the beaker until all the salt has dissolved.',
      expectedAction: { kind: 'stir', containerId: 'beaker' },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'beaker',
          substanceId: 'sodium-chloride',
          operator: 'eq',
          value: 0,
        },
        {
          kind: 'amount',
          containerId: 'beaker',
          substanceId: 'sodium-chloride-aq',
          operator: 'eq',
          value: 5,
        },
      ],
    },
  ],
  successCriteria: [
    { kind: 'volume', containerId: 'beaker', operator: 'eq', value: 100 },
    {
      kind: 'amount',
      containerId: 'beaker',
      substanceId: 'sodium-chloride-aq',
      operator: 'eq',
      value: 5,
    },
    {
      kind: 'amount',
      containerId: 'beaker',
      substanceId: 'sodium-chloride',
      operator: 'eq',
      value: 0,
    },
  ],
  hazards: ['irritant'],
}
