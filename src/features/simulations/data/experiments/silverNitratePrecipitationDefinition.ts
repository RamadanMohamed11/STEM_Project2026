import type { CoreExperimentDefinition } from '../../engine/core/index.ts'
import {
  SILVER_CHLORIDE_PARTICLES,
  SILVER_NITRATE_PARTICLES,
  SODIUM_CHLORIDE_PARTICLES,
  WATER_PARTICLES,
} from '../particleSpecies.ts'

/**
 * L11: Detection of chloride anions using silver nitrate solution (Grade 3 Term 1 / Grade 1 Term 1).
 * AgNO₃(aq) + NaCl(aq) → AgCl(s)↓ + NaNO₃(aq)
 * Formation of an insoluble white curdy precipitate of silver chloride (AgCl).
 */
export const silverNitratePrecipitationCoreExperiment: CoreExperimentDefinition = {
  schemaVersion: 1,
  id: 'core-anions-silver-nitrate-015',
  experimentId: 'exp-anions-015',
  version: '1.0.0',
  title: 'Detection of Chloride Anions by Silver Nitrate Precipitation',
  chemistry: {
    schemaVersion: 1,
    ambientTemperatureC: 20,
    coolingPerSecond: 0.02,
    substances: [
      {
        id: 'water',
        name: 'Deionised water',
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
        id: 'sodium-chloride-aq',
        name: 'Sodium chloride solution 0.1 M',
        formula: 'NaCl(aq)',
        state: 'aqueous',
        color: '#f0f9ff',
        opacity: 0.05,
        molarMassGPerMol: 58.443,
        particles: SODIUM_CHLORIDE_PARTICLES,
      },
      {
        id: 'silver-nitrate-aq',
        name: 'Silver nitrate solution 0.1 M',
        formula: 'AgNO₃(aq)',
        state: 'aqueous',
        color: '#f8fafc',
        opacity: 0.05,
        molarMassGPerMol: 169.873,
        hazards: ['corrosive', 'irritant'],
        particles: SILVER_NITRATE_PARTICLES,
      },
      {
        id: 'silver-chloride',
        name: 'Silver chloride precipitate',
        formula: 'AgCl(s)',
        state: 'solid',
        color: '#ffffff',
        opacity: 1,
        molarMassGPerMol: 143.321,
        particles: SILVER_CHLORIDE_PARTICLES,
      },
      {
        id: 'sodium-nitrate-aq',
        name: 'Sodium nitrate solution',
        formula: 'NaNO₃(aq)',
        state: 'aqueous',
        color: '#f8fafc',
        opacity: 0,
        molarMassGPerMol: 84.995,
      },
    ],
    containers: [
      {
        id: 'test-tube',
        label: 'Reaction test tube',
        equipmentId: 'test-tube',
        capacity: { value: 50, unit: 'mL' },
        accepts: ['liquid', 'aqueous', 'solid'],
        open: true,
      },
      {
        id: 'nacl-bottle',
        label: 'NaCl solution bottle',
        equipmentId: 'beaker',
        capacity: { value: 100, unit: 'mL' },
        accepts: ['liquid', 'aqueous'],
        open: true,
        initialContents: [
          { substanceId: 'water', amount: 50 },
          { substanceId: 'sodium-chloride-aq', amount: 2.922 },
        ],
      },
      {
        id: 'agno3-dropper',
        label: 'Silver nitrate reagent dropper',
        equipmentId: 'wash-bottle',
        capacity: { value: 50, unit: 'mL' },
        accepts: ['liquid', 'aqueous'],
        open: true,
        initialContents: [
          { substanceId: 'water', amount: 40 },
          { substanceId: 'silver-nitrate-aq', amount: 6.795 },
        ],
      },
      {
        id: 'pipette',
        label: 'Graduated pipette',
        equipmentId: 'pipette',
        capacity: { value: 10, unit: 'mL' },
        accepts: ['liquid', 'aqueous'],
        open: true,
      },
    ],
    processes: [],
    reactions: [
      {
        id: 'agcl-precipitation',
        label: 'Precipitation of silver chloride',
        equation: 'AgNO₃(aq) + NaCl(aq) → AgCl(s)↓ + NaNO₃(aq)',
        // Per 0.01 mol extent unit:
        reactants: [
          { substanceId: 'silver-nitrate-aq', amount: 1.69873 },
          { substanceId: 'sodium-chloride-aq', amount: 0.58443 },
        ],
        // Products: 1.43321 g AgCl + 0.84995 g NaNO3 = 2.28316 g (Exact 100%).
        products: [
          { substanceId: 'silver-chloride', amount: 1.43321 },
          { substanceId: 'sodium-nitrate-aq', amount: 0.84995 },
        ],
        ratePerSecond: 5.0,
        effects: ['precipitate', 'colorChange'],
        hazards: ['corrosive'],
        observation:
          'A white, curdy precipitate of silver chloride (AgCl) forms instantaneously upon addition of silver nitrate.',
      },
    ],
  },
  allowedEquipment: ['test-tube', 'beaker', 'wash-bottle', 'pipette', 'test-tube-rack'],
  allowedSubstances: [
    'water',
    'sodium-chloride-aq',
    'silver-nitrate-aq',
    'silver-chloride',
    'sodium-nitrate-aq',
  ],
  guidedSteps: [
    {
      id: 'pipette-nacl',
      title: 'Transfer NaCl solution to test tube',
      instruction:
        'Pour 10 mL of aqueous sodium chloride solution from the reagent bottle into the test tube.',
      expectedAction: {
        kind: 'transfer',
        from: 'nacl-bottle',
        to: 'test-tube',
        substanceId: 'sodium-chloride-aq',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'test-tube',
          substanceId: 'sodium-chloride-aq',
          operator: 'gte',
          value: 0.58,
        },
      ],
    },
    {
      id: 'add-agno3',
      title: 'Add silver nitrate dropwise',
      instruction: 'Add 10 mL of silver nitrate solution to the test tube.',
      expectedAction: {
        kind: 'transfer',
        from: 'agno3-dropper',
        to: 'test-tube',
        substanceId: 'silver-nitrate-aq',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'test-tube',
          substanceId: 'silver-chloride',
          operator: 'gte',
          value: 1.4,
        },
      ],
    },
    {
      id: 'observe-curdy-precipitate',
      title: 'Observe white AgCl precipitate',
      instruction:
        'Confirm the formation of insoluble curdy white silver chloride precipitate indicating chloride anions.',
      expectedAction: { kind: 'observe' },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'test-tube',
          substanceId: 'silver-chloride',
          operator: 'gte',
          value: 1.4,
        },
      ],
    },
  ],
  successCriteria: [
    {
      kind: 'amount',
      containerId: 'test-tube',
      substanceId: 'silver-chloride',
      operator: 'gte',
      value: 1.4,
    },
    {
      kind: 'amount',
      containerId: 'test-tube',
      substanceId: 'sodium-nitrate-aq',
      operator: 'gte',
      value: 0.8,
    },
  ],
  hazards: ['corrosive', 'irritant'],
}
