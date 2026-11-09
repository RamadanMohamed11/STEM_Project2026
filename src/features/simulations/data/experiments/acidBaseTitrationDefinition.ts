import type { CoreExperimentDefinition } from '../../engine/core/index.ts'
import {
  HYDROCHLORIC_ACID_PARTICLES,
  SODIUM_CHLORIDE_PARTICLES,
  SODIUM_HYDROXIDE_PARTICLES,
  WATER_PARTICLES,
} from '../particleSpecies.ts'

/**
 * L11: Acid-base neutralization titration with phenolphthalein indicator (Grade 1 Term 1 / Grade 3 Term 1).
 * HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)
 * Quantitative neutralization monitored by sharp pH transition at equivalence point.
 */
export const acidBaseTitrationCoreExperiment: CoreExperimentDefinition = {
  schemaVersion: 1,
  id: 'core-titration-neutralization-005',
  experimentId: 'exp-titration-005',
  version: '1.0.0',
  title: 'Acid-Base Neutralization Titration',
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
        id: 'hcl-aq',
        name: 'Hydrochloric acid standard solution 0.1 M',
        formula: 'HCl(aq)',
        state: 'aqueous',
        color: '#e0f2fe',
        opacity: 0.05,
        molarMassGPerMol: 36.461,
        acidBase: { type: 'acid', equivalentsPerMol: 1 },
        hazards: ['corrosive'],
        particles: HYDROCHLORIC_ACID_PARTICLES,
      },
      {
        id: 'naoh-aq',
        name: 'Sodium hydroxide titrant 0.1 M',
        formula: 'NaOH(aq)',
        state: 'aqueous',
        color: '#f0fdf4',
        opacity: 0.05,
        molarMassGPerMol: 39.997,
        acidBase: { type: 'base', equivalentsPerMol: 1 },
        hazards: ['corrosive'],
        particles: SODIUM_HYDROXIDE_PARTICLES,
      },
      {
        id: 'nacl-aq',
        name: 'Sodium chloride neutral solution',
        formula: 'NaCl(aq)',
        state: 'aqueous',
        color: '#f8fafc',
        opacity: 0,
        molarMassGPerMol: 58.443,
        particles: SODIUM_CHLORIDE_PARTICLES,
      },
      {
        id: 'phenolphthalein-indicator',
        name: 'Phenolphthalein indicator',
        formula: 'C₂₀H₁₄O₄',
        state: 'liquid',
        color: '#fdf2f8',
        opacity: 0.05,
        densityGPerMl: 1,
      },
    ],
    containers: [
      {
        id: 'erlenmeyer-flask',
        label: 'Titration conical flask',
        equipmentId: 'beaker',
        capacity: { value: 250, unit: 'mL' },
        accepts: ['liquid', 'aqueous'],
        open: true,
      },
      {
        id: 'burette',
        label: 'Graduated burette with NaOH titrant',
        equipmentId: 'graduated-cylinder',
        capacity: { value: 50, unit: 'mL' },
        accepts: ['liquid', 'aqueous'],
        open: true,
        initialContents: [
          { substanceId: 'water', amount: 45 },
          { substanceId: 'naoh-aq', amount: 0.79994 },
        ],
      },
      {
        id: 'acid-pipette',
        label: 'Pipette with 0.1 M HCl aliquot',
        equipmentId: 'pipette',
        capacity: { value: 25, unit: 'mL' },
        accepts: ['liquid', 'aqueous'],
        open: true,
        initialContents: [
          { substanceId: 'water', amount: 20 },
          { substanceId: 'hcl-aq', amount: 0.36461 },
        ],
      },
      {
        id: 'indicator-bottle',
        label: 'Phenolphthalein dropper bottle',
        equipmentId: 'wash-bottle',
        capacity: { value: 25, unit: 'mL' },
        accepts: ['liquid'],
        open: true,
        initialContents: [{ substanceId: 'phenolphthalein-indicator', amount: 20 }],
      },
    ],
    processes: [],
    reactions: [
      {
        id: 'acid-base-neutralization',
        label: 'Neutralization of hydrochloric acid by sodium hydroxide',
        equation: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)',
        // Per 0.01 mol extent unit:
        reactants: [
          { substanceId: 'hcl-aq', amount: 0.36461 },
          { substanceId: 'naoh-aq', amount: 0.39997 },
        ],
        // Products: 0.58443 g NaCl + 0.18015 g H2O = 0.76458 g (Exact 100%).
        products: [
          { substanceId: 'nacl-aq', amount: 0.58443 },
          { substanceId: 'water', amount: 0.18015 },
        ],
        ratePerSecond: 4.0,
        temperatureChangeCPer100Ml: 3.5,
        effects: ['colorChange', 'heat'],
        observation:
          'Neutralization occurs rapidly, transitioning through neutral pH 7 with heat liberation.',
      },
    ],
  },
  allowedEquipment: ['beaker', 'graduated-cylinder', 'pipette', 'wash-bottle'],
  allowedSubstances: [
    'water',
    'hcl-aq',
    'naoh-aq',
    'nacl-aq',
    'phenolphthalein-indicator',
  ],
  guidedSteps: [
    {
      id: 'deliver-acid-aliquot',
      title: 'Transfer 20 mL HCl aliquot to flask',
      instruction:
        'Transfer the hydrochloric acid solution from the pipette into the Erlenmeyer flask.',
      expectedAction: {
        kind: 'transfer',
        from: 'acid-pipette',
        to: 'erlenmeyer-flask',
        substanceId: 'hcl-aq',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'erlenmeyer-flask',
          substanceId: 'hcl-aq',
          operator: 'gte',
          value: 0.36,
        },
      ],
    },
    {
      id: 'add-phenolphthalein',
      title: 'Add phenolphthalein drops',
      instruction: 'Add 1 mL of phenolphthalein indicator into the acid in the flask.',
      expectedAction: {
        kind: 'transfer',
        from: 'indicator-bottle',
        to: 'erlenmeyer-flask',
        substanceId: 'phenolphthalein-indicator',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'erlenmeyer-flask',
          substanceId: 'phenolphthalein-indicator',
          operator: 'gte',
          value: 1,
        },
      ],
    },
    {
      id: 'titrate-with-naoh',
      title: 'Titrate with 0.1 M NaOH until endpoint',
      instruction:
        'Deliver NaOH titrant from the burette into the flask until exact neutralization.',
      expectedAction: {
        kind: 'transfer',
        from: 'burette',
        to: 'erlenmeyer-flask',
        substanceId: 'naoh-aq',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'erlenmeyer-flask',
          substanceId: 'nacl-aq',
          operator: 'gte',
          value: 0.58,
        },
      ],
    },
    {
      id: 'observe-endpoint',
      title: 'Observe neutralization endpoint',
      instruction:
        'Observe neutral salt formation with complete consumption of the acidic reagent.',
      expectedAction: { kind: 'observe' },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'erlenmeyer-flask',
          substanceId: 'hcl-aq',
          operator: 'eq',
          value: 0,
        },
        {
          kind: 'amount',
          containerId: 'erlenmeyer-flask',
          substanceId: 'nacl-aq',
          operator: 'gte',
          value: 0.58,
        },
      ],
    },
  ],
  successCriteria: [
    {
      kind: 'amount',
      containerId: 'erlenmeyer-flask',
      substanceId: 'nacl-aq',
      operator: 'gte',
      value: 0.58,
    },
    {
      kind: 'amount',
      containerId: 'erlenmeyer-flask',
      substanceId: 'hcl-aq',
      operator: 'eq',
      value: 0,
    },
  ],
  hazards: ['corrosive'],
}
