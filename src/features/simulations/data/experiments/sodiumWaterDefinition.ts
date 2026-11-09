import type { CoreExperimentDefinition } from '../../engine/core/index.ts'
import { SODIUM_HYDROXIDE_PARTICLES, SODIUM_ION, WATER_PARTICLES } from '../particleSpecies.ts'

/**
 * L11: Reaction of metallic sodium with water (Grade 2 Term 2).
 * 2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)↑
 * Highly exothermic redox displacement producing alkaline sodium hydroxide and flammable hydrogen gas.
 */
export const sodiumWaterCoreExperiment: CoreExperimentDefinition = {
  schemaVersion: 1,
  id: 'core-sodium-water-012',
  experimentId: 'exp-sodium-water-012',
  version: '1.0.0',
  title: 'Reaction of Sodium with Water',
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
        id: 'sodium-metal',
        name: 'Metallic sodium',
        formula: 'Na',
        state: 'solid',
        color: '#d0d4dc',
        opacity: 1,
        molarMassGPerMol: 22.99,
        hazards: ['flammable', 'corrosive'],
        particles: [{ species: SODIUM_ION, per: 1 }],
      },
      {
        id: 'sodium-hydroxide-aq',
        name: 'Sodium hydroxide solution',
        formula: 'NaOH(aq)',
        state: 'aqueous',
        color: '#e0f2fe',
        opacity: 0.1,
        molarMassGPerMol: 39.997,
        acidBase: { type: 'base', equivalentsPerMol: 1 },
        hazards: ['corrosive'],
        particles: SODIUM_HYDROXIDE_PARTICLES,
      },
      {
        id: 'hydrogen-gas',
        name: 'Hydrogen gas',
        formula: 'H₂',
        state: 'gas',
        color: '#ffffff',
        opacity: 0,
        molarMassGPerMol: 2.016,
        hazards: ['flammable', 'explosive'],
      },
      {
        id: 'phenolphthalein-solution',
        name: 'Phenolphthalein indicator',
        formula: 'C₂₀H₁₄O₄',
        state: 'liquid',
        color: '#f8fafc',
        opacity: 0.05,
        densityGPerMl: 1,
        hazards: ['flammable'],
      },
    ],
    containers: [
      {
        id: 'water-supply',
        label: 'Water container',
        equipmentId: 'water',
        capacity: { value: 1000, unit: 'mL' },
        accepts: ['liquid'],
        open: true,
        initialContents: [{ substanceId: 'water', amount: 800 }],
      },
      {
        id: 'trough',
        label: 'Reaction trough (or large beaker)',
        equipmentId: 'beaker',
        capacity: { value: 1000, unit: 'mL' },
        accepts: ['liquid', 'solid', 'aqueous', 'gas'],
        open: true,
      },
      {
        id: 'sodium-jar',
        label: 'Sodium jar (under mineral oil)',
        equipmentId: 'sodium-chloride',
        capacity: { value: 50, unit: 'g' },
        accepts: ['solid'],
        open: true,
        initialContents: [{ substanceId: 'sodium-metal', amount: 10 }],
      },
      {
        id: 'forceps',
        label: 'Laboratory forceps',
        equipmentId: 'spatula',
        capacity: { value: 5, unit: 'g' },
        accepts: ['solid'],
        open: true,
      },
      {
        id: 'indicator-bottle',
        label: 'Phenolphthalein dropper',
        equipmentId: 'wash-bottle',
        capacity: { value: 50, unit: 'mL' },
        accepts: ['liquid'],
        open: true,
        initialContents: [{ substanceId: 'phenolphthalein-solution', amount: 30 }],
      },
    ],
    processes: [],
    reactions: [
      {
        id: 'sodium-water-redox',
        label: 'Reaction of sodium with water',
        equation: '2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)↑',
        // Per 0.01 mol extent unit (0.02 mol Na = 0.4598 g, 0.02 mol H2O = 0.3603 g)
        reactants: [
          { substanceId: 'sodium-metal', amount: 0.4598 },
          { substanceId: 'water', amount: 0.3603 },
        ],
        // Products: 0.02 mol NaOH = 0.79994 g, 0.01 mol H2 = 0.02016 g. Total = 0.82010 g (Exact 100%).
        products: [
          { substanceId: 'sodium-hydroxide-aq', amount: 0.79994 },
          { substanceId: 'hydrogen-gas', amount: 0.02016 },
        ],
        ratePerSecond: 2.0,
        temperatureChangeCPer100Ml: 12.0,
        effects: ['gas', 'flame', 'heat', 'colorChange'],
        hazards: ['flammable', 'corrosive', 'hot-surface'],
        observation:
          'Metallic sodium melts into a silvery sphere darting rapidly across the surface with vigorous effervescence, flame, and generates an alkaline hydroxide solution.',
      },
    ],
  },
  allowedEquipment: ['beaker', 'spatula', 'water', 'sodium-chloride', 'wash-bottle'],
  allowedSubstances: [
    'water',
    'sodium-metal',
    'sodium-hydroxide-aq',
    'hydrogen-gas',
    'phenolphthalein-solution',
  ],
  guidedSteps: [
    {
      id: 'pour-water-to-trough',
      title: 'Fill trough with water',
      instruction: 'Pour 500 mL of water into the reaction trough.',
      expectedAction: {
        kind: 'transfer',
        from: 'water-supply',
        to: 'trough',
        substanceId: 'water',
      },
      completeWhen: [{ kind: 'volume', containerId: 'trough', operator: 'gte', value: 500 }],
    },
    {
      id: 'add-indicator',
      title: 'Add phenolphthalein indicator',
      instruction: 'Add 1 mL of phenolphthalein indicator to the water in the trough.',
      expectedAction: {
        kind: 'transfer',
        from: 'indicator-bottle',
        to: 'trough',
        substanceId: 'phenolphthalein-solution',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'trough',
          substanceId: 'phenolphthalein-solution',
          operator: 'gte',
          value: 1,
        },
      ],
    },
    {
      id: 'take-sodium-sample',
      title: 'Pick a small piece of sodium',
      instruction:
        'Use the forceps to retrieve a small piece of sodium metal (0.46 g) from the jar.',
      expectedAction: {
        kind: 'transfer',
        from: 'sodium-jar',
        to: 'forceps',
        substanceId: 'sodium-metal',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'forceps',
          substanceId: 'sodium-metal',
          operator: 'gte',
          value: 0.45,
        },
      ],
    },
    {
      id: 'add-sodium-to-water',
      title: 'Place sodium into the water',
      instruction:
        'Transfer the sodium piece from forceps into the water trough behind the safety shield.',
      expectedAction: {
        kind: 'transfer',
        from: 'forceps',
        to: 'trough',
        substanceId: 'sodium-metal',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'trough',
          substanceId: 'sodium-hydroxide-aq',
          operator: 'gte',
          value: 0.7,
        },
        {
          kind: 'amount',
          containerId: 'trough',
          substanceId: 'sodium-metal',
          operator: 'eq',
          value: 0,
        },
      ],
    },
    {
      id: 'observe-reaction',
      title: 'Observe reaction phenomena',
      instruction:
        'Observe the molten sodium sphere darting on the water, hydrogen gas evolution, and indicator turning pink.',
      expectedAction: { kind: 'observe' },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'trough',
          substanceId: 'sodium-hydroxide-aq',
          operator: 'gte',
          value: 0.79,
        },
        { kind: 'ph', containerId: 'trough', operator: 'gte', value: 11 },
      ],
    },
  ],
  successCriteria: [
    { kind: 'volume', containerId: 'trough', operator: 'gte', value: 500 },
    {
      kind: 'amount',
      containerId: 'trough',
      substanceId: 'sodium-hydroxide-aq',
      operator: 'gte',
      value: 0.79,
    },
    {
      kind: 'amount',
      containerId: 'trough',
      substanceId: 'sodium-metal',
      operator: 'eq',
      value: 0,
    },
    { kind: 'ph', containerId: 'trough', operator: 'gte', value: 11 },
  ],
  hazards: ['flammable', 'corrosive', 'hot-surface', 'explosive'],
}
