/**
 * L6 dev demo: one small, mass-balanced reaction (or process) per engine effect type, each in its
 * own library vessel. Used only by the dev-only effects page and the L6 tests — not a playable
 * experiment. Effects are produced by the L1 engine's `simulateTick`, never triggered directly.
 */
import type {
  ChemistryDefinition,
  EffectKind,
  SubstanceDefinition,
  TickConditions,
} from '../engine/core/index.ts'

const s = (
  id: string,
  name: string,
  formula: string,
  state: SubstanceDefinition['state'],
  color: string,
  extra: Partial<SubstanceDefinition> = {},
): SubstanceDefinition => ({ id, name, formula, state, color, ...extra })

const SUBSTANCES: readonly SubstanceDefinition[] = [
  // The engine blends colour by amount × opacity, so clear water gets a low weight; otherwise
  // 15 mL of water would swamp 0.4 g of an intensely coloured complex.
  s('water', 'Water', 'H₂O', 'liquid', '#d5e9e9', { opacity: 0.02, densityGPerMl: 1 }),
  // colorChange — iron(III) thiocyanate
  s('fecl3', 'Iron(III) chloride', 'FeCl₃(aq)', 'aqueous', '#e8b450', { opacity: 0.35 }),
  s('kscn', 'Potassium thiocyanate', 'KSCN(aq)', 'aqueous', '#ffffff', { opacity: 0 }),
  s('fescn3', 'Iron(III) thiocyanate', 'Fe(SCN)₃(aq)', 'aqueous', '#a3121c', { opacity: 0.9 }),
  s('kcl', 'Potassium chloride', 'KCl(aq)', 'aqueous', '#ffffff', { opacity: 0 }),
  // precipitate — silver chloride
  s('agno3', 'Silver nitrate', 'AgNO₃(aq)', 'aqueous', '#ffffff', { opacity: 0 }),
  s('nacl-aq', 'Sodium chloride', 'NaCl(aq)', 'aqueous', '#ffffff', { opacity: 0 }),
  s('agcl', 'Silver chloride', 'AgCl(s)', 'solid', '#f4f4ef'),
  s('nano3', 'Sodium nitrate', 'NaNO₃(aq)', 'aqueous', '#ffffff', { opacity: 0 }),
  // gas — marble chips in acid
  s('caco3', 'Calcium carbonate', 'CaCO₃(s)', 'solid', '#efeee8'),
  s('hcl-aq', 'Hydrogen chloride (dissolved)', 'HCl(aq)', 'aqueous', '#ffffff', { opacity: 0 }),
  s('cacl2', 'Calcium chloride', 'CaCl₂(aq)', 'aqueous', '#ffffff', { opacity: 0 }),
  s('co2', 'Carbon dioxide', 'CO₂(g)', 'gas', '#ffffff'),
  // flame — sodium flame test (sodium chloride vaporised in the flame)
  s('nacl-s', 'Sodium chloride', 'NaCl(s)', 'solid', '#fbfbfb'),
  s('nacl-g', 'Sodium chloride vapour', 'NaCl(g)', 'gas', '#ffb21c'),
  // smoke — ammonia meets hydrogen chloride
  s('nh3-g', 'Ammonia', 'NH₃(g)', 'gas', '#ffffff'),
  s('hcl-g', 'Hydrogen chloride', 'HCl(g)', 'gas', '#ffffff'),
  s('nh4cl', 'Ammonium chloride', 'NH₄Cl(s)', 'solid', '#f1f1f1'),
  // heat — neutralisation
  s('naoh-aq', 'Sodium hydroxide', 'NaOH(aq)', 'aqueous', '#ffffff', { opacity: 0 }),
  // explosion — hydrogen "pop" test
  s('h2', 'Hydrogen', 'H₂(g)', 'gas', '#ffffff'),
  s('o2', 'Oxygen', 'O₂(g)', 'gas', '#ffffff'),
  // dissolve — copper(II) sulfate crystals
  s('cuso4-s', 'Copper(II) sulfate', 'CuSO₄(s)', 'solid', '#3b7fd1'),
  s('cuso4-aq', 'Copper(II) sulfate', 'CuSO₄(aq)', 'aqueous', '#2f7fe0', { opacity: 0.55 }),
]

export interface DemoVessel {
  id: string
  effect: EffectKind
  title: string
  modelId: string
}

/** Demo vessels, left to right. */
export const EFFECTS_DEMO_VESSELS: readonly DemoVessel[] = [
  { id: 'demo-color', effect: 'colorChange', title: 'Colour change', modelId: 'test-tube' },
  { id: 'demo-precipitate', effect: 'precipitate', title: 'Precipitate', modelId: 'beaker-100' },
  { id: 'demo-gas', effect: 'gas', title: 'Gas bubbles', modelId: 'erlenmeyer-flask' },
  { id: 'demo-flame', effect: 'flame', title: 'Flame', modelId: 'evaporating-dish' },
  { id: 'demo-smoke', effect: 'smoke', title: 'Smoke', modelId: 'gas-jar' },
  { id: 'demo-heat', effect: 'heat', title: 'Heat', modelId: 'beaker-100' },
  { id: 'demo-explosion', effect: 'explosion', title: 'Pop', modelId: 'test-tube' },
  { id: 'demo-dissolve', effect: 'dissolve', title: 'Dissolving', modelId: 'beaker-100' },
]

const liquidVessel = (
  id: string,
  equipmentId: string,
  capacity: number,
  contents: { substanceId: string; amount: number }[],
  open = true,
) => ({
  id,
  label: id,
  equipmentId,
  capacity: { value: capacity, unit: 'mL' as const },
  accepts: ['solid', 'liquid', 'aqueous', 'gas'] as const,
  open,
  initialContents: contents,
})

export const EFFECTS_DEMO_DEFINITION: ChemistryDefinition = {
  schemaVersion: 1,
  ambientTemperatureC: 22,
  coolingPerSecond: 0.02,
  substances: SUBSTANCES,
  containers: [
    liquidVessel('demo-color', 'test-tube', 25, [
      { substanceId: 'water', amount: 15 },
      { substanceId: 'fecl3', amount: 0.32 },
      { substanceId: 'kscn', amount: 0.58 },
    ]),
    liquidVessel('demo-precipitate', 'beaker-100', 100, [
      { substanceId: 'water', amount: 60 },
      { substanceId: 'agno3', amount: 0.85 },
      { substanceId: 'nacl-aq', amount: 0.29 },
    ]),
    liquidVessel('demo-gas', 'erlenmeyer-flask', 250, [
      { substanceId: 'water', amount: 80 },
      { substanceId: 'hcl-aq', amount: 3.65 },
      { substanceId: 'caco3', amount: 5 },
    ]),
    liquidVessel('demo-flame', 'evaporating-dish', 60, [{ substanceId: 'nacl-s', amount: 0.5 }]),
    liquidVessel(
      'demo-smoke',
      'gas-jar',
      250,
      [
        { substanceId: 'nh3-g', amount: 0.17 },
        { substanceId: 'hcl-g', amount: 0.365 },
      ],
      false,
    ),
    liquidVessel('demo-heat', 'beaker-100', 100, [
      { substanceId: 'water', amount: 50 },
      { substanceId: 'hcl-aq', amount: 1.82 },
      { substanceId: 'naoh-aq', amount: 2 },
    ]),
    liquidVessel(
      'demo-explosion',
      'test-tube',
      25,
      [
        { substanceId: 'h2', amount: 0.004 },
        { substanceId: 'o2', amount: 0.032 },
      ],
      false,
    ),
    liquidVessel('demo-dissolve', 'beaker-100', 100, [
      { substanceId: 'water', amount: 60 },
      { substanceId: 'cuso4-s', amount: 3 },
    ]),
  ],
  processes: [
    {
      kind: 'dissolution',
      id: 'cuso4-dissolves',
      soluteId: 'cuso4-s',
      solventId: 'water',
      dissolvedId: 'cuso4-aq',
      solubilityGPer100Ml: 32,
      rateGPerSecondStirred: 0.35,
    },
  ],
  reactions: [
    {
      id: 'iron-thiocyanate',
      label: 'Iron(III) thiocyanate forms',
      equation: 'FeCl₃ + 3KSCN → Fe(SCN)₃ + 3KCl',
      reactants: [
        { substanceId: 'fecl3', amount: 0.16222 },
        { substanceId: 'kscn', amount: 0.29154 },
      ],
      products: [
        { substanceId: 'fescn3', amount: 0.23011 },
        { substanceId: 'kcl', amount: 0.22365 },
      ],
      ratePerSecond: 0.6,
      effects: ['colorChange'],
      observation: 'The pale yellow solution turns blood red.',
    },
    {
      id: 'silver-chloride',
      label: 'Silver chloride precipitates',
      equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
      reactants: [
        { substanceId: 'agno3', amount: 0.16987 },
        { substanceId: 'nacl-aq', amount: 0.05844 },
      ],
      products: [
        { substanceId: 'agcl', amount: 0.14332 },
        { substanceId: 'nano3', amount: 0.08499 },
      ],
      ratePerSecond: 0.5,
      effects: ['precipitate'],
      observation: 'A white precipitate forms and settles.',
    },
    {
      id: 'marble-acid',
      label: 'Carbon dioxide from marble',
      equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
      reactants: [
        { substanceId: 'caco3', amount: 0.10009 },
        { substanceId: 'hcl-aq', amount: 0.07292 },
      ],
      products: [
        { substanceId: 'cacl2', amount: 0.11098 },
        { substanceId: 'water', amount: 0.01802 },
        { substanceId: 'co2', amount: 0.04401 },
      ],
      ratePerSecond: 1.5,
      effects: ['gas'],
      observation: 'Bubbles of a colourless gas fizz out of the solution.',
    },
    {
      id: 'sodium-flame',
      label: 'Sodium flame test',
      equation: 'NaCl(s) → NaCl(g) (excited Na emits yellow light)',
      reactants: [{ substanceId: 'nacl-s', amount: 0.01 }],
      products: [{ substanceId: 'nacl-g', amount: 0.01 }],
      ratePerSecond: 2,
      conditions: { requiresHeating: true },
      effects: ['flame'],
      observation: 'An intense yellow-orange flame.',
    },
    {
      id: 'ammonium-chloride-smoke',
      label: 'Ammonium chloride smoke',
      equation: 'NH₃ + HCl → NH₄Cl',
      reactants: [
        { substanceId: 'nh3-g', amount: 0.01703 },
        { substanceId: 'hcl-g', amount: 0.03646 },
      ],
      products: [{ substanceId: 'nh4cl', amount: 0.05349 }],
      ratePerSecond: 2.5,
      effects: ['smoke'],
      observation: 'Dense white smoke fills the jar.',
    },
    {
      id: 'neutralisation-heat',
      label: 'Neutralisation releases heat',
      equation: 'HCl + NaOH → NaCl + H₂O',
      reactants: [
        { substanceId: 'hcl-aq', amount: 0.03646 },
        { substanceId: 'naoh-aq', amount: 0.04 },
      ],
      products: [
        { substanceId: 'nacl-aq', amount: 0.05844 },
        { substanceId: 'water', amount: 0.01802 },
      ],
      ratePerSecond: 4,
      temperatureChangeCPer100Ml: 0.3,
      effects: ['heat'],
      observation: 'The beaker becomes warm.',
    },
    {
      id: 'hydrogen-pop',
      label: 'Hydrogen pop test',
      equation: '2H₂ + O₂ → 2H₂O',
      reactants: [
        { substanceId: 'h2', amount: 0.004032 },
        { substanceId: 'o2', amount: 0.032 },
      ],
      products: [{ substanceId: 'water', amount: 0.036032 }],
      ratePerSecond: 20,
      conditions: { requiresHeating: true },
      effects: ['explosion'],
      hazards: ['explosive'],
      observation: 'A lit splint gives a squeaky pop.',
    },
  ],
}

/** External conditions the demo applies: stirring and a lit flame where the reaction needs it. */
export const EFFECTS_DEMO_CONDITIONS: TickConditions = {
  stirring: ['demo-dissolve'],
  heatingCPerSecond: { 'demo-flame': 40, 'demo-explosion': 40 },
}
