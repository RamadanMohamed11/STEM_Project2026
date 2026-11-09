import type { CoreExperimentDefinition, DissolutionProcess } from '../../engine/core/index.ts'
import {
  COPPER_SULFATE_PARTICLES,
  WATER_PARTICLES,
} from '../particleSpecies.ts'

/**
 * L11: Dissolution and temperature-dependent crystallization of copper(II) sulfate (Grade 1 Term 2).
 * Investigates how solubility scales with temperature and demonstrates crystallization on cooling.
 * Solubility: 20.7 g / 100 mL at 20 °C; 53.7 g / 100 mL at 80 °C (+0.55 g / 100 mL / °C).
 */
export const copperSulfateDissolutionProcess: DissolutionProcess = {
  kind: 'dissolution',
  id: 'cuso4-dissolution-process',
  soluteId: 'copper-sulfate',
  solventId: 'water',
  dissolvedId: 'copper-sulfate-aq',
  solubilityGPer100Ml: 20.7,
  solubilityPerDegreeC: 0.55,
  rateGPerSecondStirred: 5.0,
  rateGPerSecondUnstirred: 1.0,
}

export const copperSulfateCrystallizationCoreExperiment: CoreExperimentDefinition = {
  schemaVersion: 1,
  id: 'core-heat-dissolution-cuso4-006',
  experimentId: 'exp-heat-dissolution-006',
  version: '1.0.0',
  title: 'Dissolution and Crystallization of Copper(II) Sulfate',
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
        id: 'copper-sulfate',
        name: 'Copper(II) sulfate crystals',
        formula: 'CuSO₄',
        state: 'solid',
        color: '#2563eb',
        opacity: 1,
        molarMassGPerMol: 159.609,
        hazards: ['irritant'],
        particles: COPPER_SULFATE_PARTICLES,
      },
      {
        id: 'copper-sulfate-aq',
        name: 'Copper(II) sulfate aqueous solution',
        formula: 'CuSO₄(aq)',
        state: 'aqueous',
        color: '#1d4ed8',
        opacity: 0.7,
        molarMassGPerMol: 159.609,
        hazards: ['irritant'],
        particles: COPPER_SULFATE_PARTICLES,
      },
    ],
    containers: [
      {
        id: 'beaker',
        label: 'Dissolution beaker',
        equipmentId: 'beaker',
        capacity: { value: 250, unit: 'mL' },
        accepts: ['liquid', 'solid', 'aqueous'],
        open: true,
      },
      {
        id: 'water-supply',
        label: 'Water container',
        equipmentId: 'water',
        capacity: { value: 500, unit: 'mL' },
        accepts: ['liquid'],
        open: true,
        initialContents: [{ substanceId: 'water', amount: 300 }],
      },
      {
        id: 'cuso4-jar',
        label: 'Copper(II) sulfate reagent jar',
        equipmentId: 'sodium-chloride',
        capacity: { value: 100, unit: 'g' },
        accepts: ['solid'],
        open: true,
        initialContents: [{ substanceId: 'copper-sulfate', amount: 80 }],
      },
      {
        id: 'spatula',
        label: 'Laboratory spatula',
        equipmentId: 'spatula',
        capacity: { value: 10, unit: 'g' },
        accepts: ['solid'],
        open: true,
      },
    ],
    processes: [copperSulfateDissolutionProcess],
    reactions: [],
  },
  allowedEquipment: ['beaker', 'water', 'sodium-chloride', 'spatula', 'stirring-rod'],
  allowedSubstances: ['water', 'copper-sulfate', 'copper-sulfate-aq'],
  guidedSteps: [
    {
      id: 'pour-water-to-beaker',
      title: 'Measure 100 mL water',
      instruction: 'Transfer 100 mL of water into the beaker.',
      expectedAction: {
        kind: 'transfer',
        from: 'water-supply',
        to: 'beaker',
        substanceId: 'water',
      },
      completeWhen: [{ kind: 'volume', containerId: 'beaker', operator: 'gte', value: 100 }],
    },
    {
      id: 'scoop-cuso4',
      title: 'Scoop copper sulfate crystals',
      instruction: 'Scoop 10 g of copper(II) sulfate crystals with the spatula.',
      expectedAction: {
        kind: 'transfer',
        from: 'cuso4-jar',
        to: 'spatula',
        substanceId: 'copper-sulfate',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'spatula',
          substanceId: 'copper-sulfate',
          operator: 'gte',
          value: 10,
        },
      ],
    },
    {
      id: 'add-cuso4-to-beaker',
      title: 'Add crystals into beaker',
      instruction: 'Add the crystals into the water in the beaker.',
      expectedAction: {
        kind: 'transfer',
        from: 'spatula',
        to: 'beaker',
        substanceId: 'copper-sulfate',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'beaker',
          substanceId: 'copper-sulfate',
          operator: 'gte',
          value: 10,
        },
      ],
    },
    {
      id: 'stir-solution',
      title: 'Stir to dissolve solute',
      instruction:
        'Stir until all copper sulfate dissolves to form a deep blue solution.',
      expectedAction: { kind: 'stir', containerId: 'beaker' },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'beaker',
          substanceId: 'copper-sulfate',
          operator: 'eq',
          value: 0,
        },
        {
          kind: 'amount',
          containerId: 'beaker',
          substanceId: 'copper-sulfate-aq',
          operator: 'gte',
          value: 10,
        },
      ],
    },
  ],
  successCriteria: [
    { kind: 'volume', containerId: 'beaker', operator: 'gte', value: 100 },
    {
      kind: 'amount',
      containerId: 'beaker',
      substanceId: 'copper-sulfate-aq',
      operator: 'gte',
      value: 10,
    },
    {
      kind: 'amount',
      containerId: 'beaker',
      substanceId: 'copper-sulfate',
      operator: 'eq',
      value: 0,
    },
  ],
  hazards: ['irritant'],
}
