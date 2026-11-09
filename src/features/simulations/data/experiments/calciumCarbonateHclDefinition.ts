import type { CoreExperimentDefinition } from '../../engine/core/index.ts'
import {
  CALCIUM_ION,
  CARBONATE_ION,
  HYDROCHLORIC_ACID_PARTICLES,
  WATER_PARTICLES,
} from '../particleSpecies.ts'

/**
 * L11: Reaction of metal carbonates with dilute acid producing carbon dioxide gas (Grade 2 Term 1).
 * CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)↑
 * Rapid effervescence and dissolution of solid carbonate with gas liberation.
 */
export const calciumCarbonateHclCoreExperiment: CoreExperimentDefinition = {
  schemaVersion: 1,
  id: 'core-oxides-carbonate-hcl-009',
  experimentId: 'exp-oxides-009',
  version: '1.0.0',
  title: 'Reaction of Calcium Carbonate with Hydrochloric Acid',
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
        id: 'calcium-carbonate',
        name: 'Calcium carbonate powder',
        formula: 'CaCO₃',
        state: 'solid',
        color: '#f8fafc',
        opacity: 1,
        molarMassGPerMol: 100.087,
        particles: [
          { species: CALCIUM_ION, per: 1 },
          { species: CARBONATE_ION, per: 1 },
        ],
      },
      {
        id: 'hcl-aq',
        name: 'Hydrochloric acid 1.0 M',
        formula: 'HCl(aq)',
        state: 'aqueous',
        color: '#e2e8f0',
        opacity: 0.05,
        molarMassGPerMol: 36.461,
        acidBase: { type: 'acid', equivalentsPerMol: 1 },
        hazards: ['corrosive'],
        particles: HYDROCHLORIC_ACID_PARTICLES,
      },
      {
        id: 'calcium-chloride-aq',
        name: 'Calcium chloride solution',
        formula: 'CaCl₂(aq)',
        state: 'aqueous',
        color: '#f1f5f9',
        opacity: 0.05,
        molarMassGPerMol: 110.984,
        particles: [{ species: CALCIUM_ION, per: 1 }],
      },
      {
        id: 'carbon-dioxide',
        name: 'Carbon dioxide gas',
        formula: 'CO₂',
        state: 'gas',
        color: '#ffffff',
        opacity: 0,
        molarMassGPerMol: 44.009,
      },
    ],
    containers: [
      {
        id: 'conical-flask',
        label: 'Erlenmeyer conical flask',
        equipmentId: 'beaker',
        capacity: { value: 250, unit: 'mL' },
        accepts: ['liquid', 'aqueous', 'solid', 'gas'],
        open: true,
      },
      {
        id: 'carbonate-jar',
        label: 'Calcium carbonate jar',
        equipmentId: 'sodium-chloride',
        capacity: { value: 50, unit: 'g' },
        accepts: ['solid'],
        open: true,
        initialContents: [{ substanceId: 'calcium-carbonate', amount: 20 }],
      },
      {
        id: 'spatula',
        label: 'Laboratory spatula',
        equipmentId: 'spatula',
        capacity: { value: 5, unit: 'g' },
        accepts: ['solid'],
        open: true,
      },
      {
        id: 'acid-cylinder',
        label: 'Graduated cylinder with dilute HCl',
        equipmentId: 'graduated-cylinder',
        capacity: { value: 100, unit: 'mL' },
        accepts: ['liquid', 'aqueous'],
        open: true,
        initialContents: [
          { substanceId: 'water', amount: 40 },
          { substanceId: 'hcl-aq', amount: 1.458 },
        ],
      },
    ],
    processes: [],
    reactions: [
      {
        id: 'caco3-hcl-effervescence',
        label: 'Dissolution of calcium carbonate in hydrochloric acid',
        equation: 'CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)↑',
        // Per 0.01 mol extent unit:
        reactants: [
          { substanceId: 'calcium-carbonate', amount: 1.00087 },
          { substanceId: 'hcl-aq', amount: 0.72922 },
        ],
        // Products: 1.10984 g CaCl2 + 0.18015 g H2O + 0.44009 g CO2 = 1.73008 g (diff 0.00001 g, < 0.001%).
        products: [
          { substanceId: 'calcium-chloride-aq', amount: 1.10984 },
          { substanceId: 'water', amount: 0.18015 },
          { substanceId: 'carbon-dioxide', amount: 0.44009 },
        ],
        ratePerSecond: 2.0,
        effects: ['gas', 'dissolve'],
        hazards: ['corrosive'],
        observation:
          'Brisk effervescence with rapid evolution of colorless carbon dioxide gas bubbles as the solid calcium carbonate dissolves into solution.',
      },
    ],
  },
  allowedEquipment: ['beaker', 'sodium-chloride', 'spatula', 'graduated-cylinder'],
  allowedSubstances: [
    'water',
    'calcium-carbonate',
    'hcl-aq',
    'calcium-chloride-aq',
    'carbon-dioxide',
  ],
  guidedSteps: [
    {
      id: 'scoop-carbonate',
      title: 'Scoop calcium carbonate powder',
      instruction: 'Scoop 1.0 g of calcium carbonate powder using the spatula.',
      expectedAction: {
        kind: 'transfer',
        from: 'carbonate-jar',
        to: 'spatula',
        substanceId: 'calcium-carbonate',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'spatula',
          substanceId: 'calcium-carbonate',
          operator: 'gte',
          value: 1.0,
        },
      ],
    },
    {
      id: 'add-carbonate-to-flask',
      title: 'Place carbonate into flask',
      instruction: 'Transfer the scooped calcium carbonate into the conical flask.',
      expectedAction: {
        kind: 'transfer',
        from: 'spatula',
        to: 'conical-flask',
        substanceId: 'calcium-carbonate',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'conical-flask',
          substanceId: 'calcium-carbonate',
          operator: 'gte',
          value: 1.0,
        },
      ],
    },
    {
      id: 'pour-acid',
      title: 'Add dilute hydrochloric acid',
      instruction: 'Pour the hydrochloric acid solution into the conical flask.',
      expectedAction: {
        kind: 'transfer',
        from: 'acid-cylinder',
        to: 'conical-flask',
        substanceId: 'hcl-aq',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'conical-flask',
          substanceId: 'calcium-chloride-aq',
          operator: 'gte',
          value: 1.0,
        },
      ],
    },
    {
      id: 'observe-effervescence',
      title: 'Observe CO₂ gas effervescence',
      instruction:
        'Observe rapid bubbling and effervescence of evolved carbon dioxide gas as the solid dissolves completely.',
      expectedAction: { kind: 'observe' },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'conical-flask',
          substanceId: 'calcium-carbonate',
          operator: 'eq',
          value: 0,
        },
        {
          kind: 'amount',
          containerId: 'conical-flask',
          substanceId: 'calcium-chloride-aq',
          operator: 'gte',
          value: 1.1,
        },
      ],
    },
  ],
  successCriteria: [
    {
      kind: 'amount',
      containerId: 'conical-flask',
      substanceId: 'calcium-carbonate',
      operator: 'eq',
      value: 0,
    },
    {
      kind: 'amount',
      containerId: 'conical-flask',
      substanceId: 'calcium-chloride-aq',
      operator: 'gte',
      value: 1.1,
    },
  ],
  hazards: ['corrosive'],
}
