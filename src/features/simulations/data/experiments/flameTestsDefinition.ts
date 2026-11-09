import type { CoreExperimentDefinition } from '../../engine/core/index.ts'
import {
  CALCIUM_ION,
  CHLORIDE_ION,
  COPPER_ION,
  POTASSIUM_ION,
  SODIUM_ION,
} from '../particleSpecies.ts'

/**
 * L11: Flame tests for identifying alkali and alkaline earth cations (Grade 2 Term 1).
 * Thermal excitation in a non-luminous Bunsen burner flame (>500 °C) produces diagnostic emission colors:
 * - Sodium (Na⁺): Golden-yellow flame (589 nm)
 * - Potassium (K⁺): Lilac / violet flame (766 nm)
 * - Calcium (Ca²⁺): Brick-red flame (622 nm)
 * - Copper(II) (Cu²⁺): Blue-green flame (510 nm)
 */
export const flameTestsCoreExperiment: CoreExperimentDefinition = {
  schemaVersion: 1,
  id: 'core-flame-tests-008',
  experimentId: 'exp-flame-tests-008',
  version: '1.0.0',
  title: 'Flame Tests for Metal Cations',
  chemistry: {
    schemaVersion: 1,
    ambientTemperatureC: 20,
    coolingPerSecond: 0.02,
    substances: [
      {
        id: 'sodium-chloride',
        name: 'Sodium chloride salt',
        formula: 'NaCl',
        state: 'solid',
        color: '#ffffff',
        opacity: 1,
        molarMassGPerMol: 58.443,
        particles: [
          { species: SODIUM_ION, per: 1 },
          { species: CHLORIDE_ION, per: 1 },
        ],
      },
      {
        id: 'potassium-chloride',
        name: 'Potassium chloride salt',
        formula: 'KCl',
        state: 'solid',
        color: '#f8fafc',
        opacity: 1,
        molarMassGPerMol: 74.551,
        particles: [
          { species: POTASSIUM_ION, per: 1 },
          { species: CHLORIDE_ION, per: 1 },
        ],
      },
      {
        id: 'calcium-chloride',
        name: 'Calcium chloride salt',
        formula: 'CaCl₂',
        state: 'solid',
        color: '#f1f5f9',
        opacity: 1,
        molarMassGPerMol: 110.984,
        particles: [
          { species: CALCIUM_ION, per: 1 },
          { species: CHLORIDE_ION, per: 2 },
        ],
      },
      {
        id: 'copper-chloride',
        name: 'Copper(II) chloride salt',
        formula: 'CuCl₂',
        state: 'solid',
        color: '#06b6d4',
        opacity: 1,
        molarMassGPerMol: 134.452,
        particles: [
          { species: COPPER_ION, per: 1 },
          { species: CHLORIDE_ION, per: 2 },
        ],
      },
      // Diagnostic excited gas emission species in flame:
      {
        id: 'na-yellow-flame',
        name: 'Sodium golden-yellow flame emission',
        formula: 'Na*(g)',
        state: 'gas',
        color: '#eab308',
        opacity: 0.9,
        molarMassGPerMol: 22.99,
      },
      {
        id: 'k-lilac-flame',
        name: 'Potassium lilac flame emission',
        formula: 'K*(g)',
        state: 'gas',
        color: '#c084fc',
        opacity: 0.9,
        molarMassGPerMol: 39.098,
      },
      {
        id: 'ca-brick-flame',
        name: 'Calcium brick-red flame emission',
        formula: 'Ca*(g)',
        state: 'gas',
        color: '#f97316',
        opacity: 0.9,
        molarMassGPerMol: 40.078,
      },
      {
        id: 'cu-bluegreen-flame',
        name: 'Copper blue-green flame emission',
        formula: 'Cu*(g)',
        state: 'gas',
        color: '#06b6d4',
        opacity: 0.9,
        molarMassGPerMol: 63.546,
      },
      {
        id: 'chloride-vapor',
        name: 'Chloride vapor',
        formula: 'Cl₂(g)',
        state: 'gas',
        color: '#fef08a',
        opacity: 0.1,
        molarMassGPerMol: 70.906,
      },
    ],
    containers: [
      {
        id: 'watch-glass',
        label: 'Watch glass with salt samples',
        equipmentId: 'watch-glass',
        capacity: { value: 50, unit: 'g' },
        accepts: ['solid'],
        open: true,
        initialContents: [
          { substanceId: 'sodium-chloride', amount: 5 },
          { substanceId: 'potassium-chloride', amount: 5 },
          { substanceId: 'calcium-chloride', amount: 5 },
          { substanceId: 'copper-chloride', amount: 5 },
        ],
      },
      {
        id: 'nichrome-loop',
        label: 'Platinum / nichrome wire loop',
        equipmentId: 'spatula',
        capacity: { value: 2, unit: 'g' },
        accepts: ['solid'],
        open: true,
      },
      {
        id: 'burner-flame-zone',
        label: 'Flame photometer observation chamber',
        equipmentId: 'beaker',
        capacity: { value: 100, unit: 'mL' },
        accepts: ['solid', 'gas'],
        open: false,
        initialTemperatureC: 600,
      },
    ],
    processes: [],
    reactions: [
      {
        id: 'sodium-flame-emission',
        label: 'Thermal excitation of sodium ions',
        equation: '2NaCl(s) + heat → 2Na*(g) + Cl₂(g)↑',
        // Per 0.01 mol extent unit: 2 mol NaCl = 1.16886 g
        reactants: [{ substanceId: 'sodium-chloride', amount: 1.16886 }],
        // Products: 2 mol Na* = 0.4598 g + 1 mol Cl2 = 0.70906 g = 1.16886 g (Exact 100%).
        products: [
          { substanceId: 'na-yellow-flame', amount: 0.4598 },
          { substanceId: 'chloride-vapor', amount: 0.70906 },
        ],
        ratePerSecond: 2.0,
        conditions: { minTemperatureC: 450, requiresHeating: true },
        effects: ['flame', 'colorChange', 'heat'],
        hazards: ['hot-surface'],
        observation: 'A brilliant, intense golden-yellow flame confirms the presence of sodium (Na⁺) ions.',
      },
      {
        id: 'potassium-flame-emission',
        label: 'Thermal excitation of potassium ions',
        equation: '2KCl(s) + heat → 2K*(g) + Cl₂(g)↑',
        // 2 mol KCl = 1.49102 g
        reactants: [{ substanceId: 'potassium-chloride', amount: 1.49102 }],
        // 2 mol K* = 0.78196 g + 1 mol Cl2 = 0.70906 g = 1.49102 g.
        products: [
          { substanceId: 'k-lilac-flame', amount: 0.78196 },
          { substanceId: 'chloride-vapor', amount: 0.70906 },
        ],
        ratePerSecond: 2.0,
        conditions: { minTemperatureC: 450, requiresHeating: true },
        effects: ['flame', 'colorChange', 'heat'],
        hazards: ['hot-surface'],
        observation: 'A delicate lilac / violet flame confirms the presence of potassium (K⁺) ions.',
      },
      {
        id: 'calcium-flame-emission',
        label: 'Thermal excitation of calcium ions',
        equation: 'CaCl₂(s) + heat → Ca*(g) + Cl₂(g)↑',
        // 1 mol CaCl2 = 1.10984 g
        reactants: [{ substanceId: 'calcium-chloride', amount: 1.10984 }],
        // 1 mol Ca* = 0.40078 g + 1 mol Cl2 = 0.70906 g = 1.10984 g.
        products: [
          { substanceId: 'ca-brick-flame', amount: 0.40078 },
          { substanceId: 'chloride-vapor', amount: 0.70906 },
        ],
        ratePerSecond: 2.0,
        conditions: { minTemperatureC: 450, requiresHeating: true },
        effects: ['flame', 'colorChange', 'heat'],
        hazards: ['hot-surface'],
        observation: 'A characteristic brick-red flame confirms the presence of calcium (Ca²⁺) ions.',
      },
      {
        id: 'copper-flame-emission',
        label: 'Thermal excitation of copper ions',
        equation: 'CuCl₂(s) + heat → Cu*(g) + Cl₂(g)↑',
        // 1 mol CuCl2 = 1.34452 g
        reactants: [{ substanceId: 'copper-chloride', amount: 1.34452 }],
        // 1 mol Cu* = 0.63546 g + 1 mol Cl2 = 0.70906 g = 1.34452 g.
        products: [
          { substanceId: 'cu-bluegreen-flame', amount: 0.63546 },
          { substanceId: 'chloride-vapor', amount: 0.70906 },
        ],
        ratePerSecond: 2.0,
        conditions: { minTemperatureC: 450, requiresHeating: true },
        effects: ['flame', 'colorChange', 'heat'],
        hazards: ['hot-surface'],
        observation: 'A bright blue-green flame confirms the presence of copper(II) (Cu²⁺) ions.',
      },
    ],
  },
  allowedEquipment: ['watch-glass', 'spatula', 'beaker'],
  allowedSubstances: [
    'sodium-chloride',
    'potassium-chloride',
    'calcium-chloride',
    'copper-chloride',
    'na-yellow-flame',
    'k-lilac-flame',
    'ca-brick-flame',
    'cu-bluegreen-flame',
    'chloride-vapor',
  ],
  guidedSteps: [
    {
      id: 'dip-wire-loop',
      title: 'Pick sodium chloride on wire loop',
      instruction: 'Moisten the loop and pick up a sample of sodium chloride (1.17 g).',
      expectedAction: {
        kind: 'transfer',
        from: 'watch-glass',
        to: 'nichrome-loop',
        substanceId: 'sodium-chloride',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'nichrome-loop',
          substanceId: 'sodium-chloride',
          operator: 'gte',
          value: 1.15,
        },
      ],
    },
    {
      id: 'insert-into-flame',
      title: 'Hold sample in the hot flame zone',
      instruction: 'Introduce the sample into the non-luminous flame (>500 °C).',
      expectedAction: {
        kind: 'transfer',
        from: 'nichrome-loop',
        to: 'burner-flame-zone',
        substanceId: 'sodium-chloride',
      },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'burner-flame-zone',
          substanceId: 'na-yellow-flame',
          operator: 'gte',
          value: 0.4,
        },
      ],
    },
    {
      id: 'observe-yellow-emission',
      title: 'Observe diagnostic flame color',
      instruction: 'Observe the persistent golden-yellow flame of sodium.',
      expectedAction: { kind: 'observe' },
      completeWhen: [
        {
          kind: 'amount',
          containerId: 'burner-flame-zone',
          substanceId: 'na-yellow-flame',
          operator: 'gte',
          value: 0.4,
        },
      ],
    },
  ],
  successCriteria: [
    {
      kind: 'amount',
      containerId: 'burner-flame-zone',
      substanceId: 'na-yellow-flame',
      operator: 'gte',
      value: 0.4,
    },
  ],
  hazards: ['hot-surface', 'flammable'],
}
