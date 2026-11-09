import assert from 'node:assert/strict'
import test from 'node:test'
import {
  amountOf,
  createInitialLabState,
  evaluateCriteria,
  evaluateCriterion,
  isValidExperimentDefinition,
  readColor,
  readMassG,
  readPh,
  readTemperatureC,
  readVolumeMl,
  saturationLimitG,
  simulateTick,
  transferMaterial,
  validateChemistryDefinition,
  validateExperimentDefinition,
} from '../src/features/simulations/engine/core/index.ts'
import {
  saltCoreExperiment,
  saltDissolutionProcess,
} from '../src/features/simulations/data/saltCoreDefinition.ts'
import {
  executeSaltCommand,
  initialSaltExperimentState,
  labStateToSaltState,
  saltStateToLabState,
} from '../src/features/simulations/engine/saltExperiment.ts'
import {
  allCoreExperiments,
  getCoreExperiment,
  getRegisteredExperimentIds,
  registryIssues,
  resolveSimulation,
} from '../src/features/simulations/lib/simulationRegistry.ts'

// ---------------------------------------------------------------------------
// Test-only fixture chemistry (not app experiments; L11 adds real ones as data)
// ---------------------------------------------------------------------------

const substances = [
  {
    id: 'water',
    name: 'Water',
    formula: 'H₂O',
    state: 'liquid',
    color: '#d6ecff',
    opacity: 0.1,
    densityGPerMl: 1,
    boilingPointC: 100,
  },
  {
    id: 'salt',
    name: 'Sodium chloride',
    formula: 'NaCl',
    state: 'solid',
    color: '#ffffff',
    opacity: 1,
  },
  {
    id: 'salt-aq',
    name: 'NaCl(aq)',
    formula: 'NaCl(aq)',
    state: 'aqueous',
    color: '#d6ecff',
    opacity: 0,
    molarMassGPerMol: 58.44,
  },
  {
    id: 'silver-nitrate-aq',
    name: 'Silver nitrate',
    formula: 'AgNO₃(aq)',
    state: 'aqueous',
    color: '#eeeeee',
    opacity: 0,
    molarMassGPerMol: 169.87,
  },
  {
    id: 'silver-chloride',
    name: 'Silver chloride',
    formula: 'AgCl',
    state: 'solid',
    color: '#f4f4f4',
    opacity: 1,
  },
  {
    id: 'sodium-nitrate-aq',
    name: 'Sodium nitrate',
    formula: 'NaNO₃(aq)',
    state: 'aqueous',
    color: '#ffffff',
    opacity: 0,
  },
  {
    id: 'calcium-carbonate',
    name: 'Calcium carbonate',
    formula: 'CaCO₃',
    state: 'solid',
    color: '#fafafa',
    opacity: 1,
  },
  {
    id: 'hcl-aq',
    name: 'Hydrochloric acid',
    formula: 'HCl(aq)',
    state: 'aqueous',
    color: '#ffffff',
    opacity: 0,
    molarMassGPerMol: 36.46,
    acidBase: { type: 'acid', equivalentsPerMol: 1 },
    hazards: ['corrosive'],
  },
  {
    id: 'naoh-aq',
    name: 'Sodium hydroxide',
    formula: 'NaOH(aq)',
    state: 'aqueous',
    color: '#ffffff',
    opacity: 0,
    molarMassGPerMol: 40,
    acidBase: { type: 'base', equivalentsPerMol: 1 },
    hazards: ['corrosive'],
  },
  {
    id: 'calcium-chloride-aq',
    name: 'Calcium chloride',
    formula: 'CaCl₂(aq)',
    state: 'aqueous',
    color: '#ffffff',
    opacity: 0,
  },
  { id: 'carbon-dioxide', name: 'Carbon dioxide', formula: 'CO₂', state: 'gas', color: '#ffffff' },
  {
    id: 'blue-dye-aq',
    name: 'Blue dye',
    formula: 'dye',
    state: 'aqueous',
    color: '#0000ff',
    opacity: 1,
  },
]

const precipitation = {
  id: 'silver-chloride-precipitation',
  label: 'Silver chloride precipitation',
  equation: 'AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)',
  // Per extent unit = 0.01 mol.
  reactants: [
    { substanceId: 'silver-nitrate-aq', amount: 1.6987 },
    { substanceId: 'salt-aq', amount: 0.5844 },
  ],
  products: [
    { substanceId: 'silver-chloride', amount: 1.4332 },
    { substanceId: 'sodium-nitrate-aq', amount: 0.8499 },
  ],
  ratePerSecond: 1000,
  effects: ['precipitate', 'colorChange'],
  observation: 'A white precipitate of silver chloride forms.',
}

const carbonate = {
  id: 'carbonate-acid',
  label: 'Calcium carbonate and hydrochloric acid',
  reactants: [
    { substanceId: 'calcium-carbonate', amount: 1.0009 },
    { substanceId: 'hcl-aq', amount: 0.7292 },
  ],
  products: [
    { substanceId: 'calcium-chloride-aq', amount: 1.1098 },
    { substanceId: 'water', amount: 0.1802 },
    { substanceId: 'carbon-dioxide', amount: 0.4401 },
  ],
  ratePerSecond: 0.5,
  temperatureChangeCPer100Ml: 0.2,
  effects: ['gas'],
  hazards: ['toxic-gas'],
  observation: 'Bubbles of carbon dioxide are given off.',
}

const neutralisation = {
  id: 'neutralisation',
  label: 'Neutralisation',
  reactants: [
    { substanceId: 'hcl-aq', amount: 0.3646 },
    { substanceId: 'naoh-aq', amount: 0.4 },
  ],
  products: [
    { substanceId: 'salt-aq', amount: 0.5844 },
    { substanceId: 'water', amount: 0.1802 },
  ],
  ratePerSecond: 1000,
  temperatureChangeCPer100Ml: 0.5,
  effects: ['heat'],
  observation: 'The solution warms slightly.',
}

const hotOnly = {
  id: 'needs-heat',
  label: 'Reaction above 60 °C',
  reactants: [{ substanceId: 'salt', amount: 1 }],
  products: [{ substanceId: 'silver-chloride', amount: 1 }],
  ratePerSecond: 1,
  conditions: { minTemperatureC: 60 },
  effects: ['colorChange'],
  observation: 'Changes only when hot.',
}

function beaker(id, initialContents = [], open = true, capacity = 250) {
  return {
    id,
    label: id,
    equipmentId: 'beaker',
    capacity: { value: capacity, unit: 'mL' },
    accepts: ['liquid', 'solid', 'aqueous', 'gas'],
    open,
    initialContents,
  }
}

function fixture(overrides = {}) {
  return {
    schemaVersion: 1,
    ambientTemperatureC: 20,
    coolingPerSecond: 0.05,
    substances,
    containers: [
      beaker('a', [{ substanceId: 'water', amount: 100 }]),
      beaker('b'),
      beaker('closed', [], false),
      {
        id: 'scoop',
        label: 'Scoop',
        equipmentId: 'spatula',
        capacity: { value: 5, unit: 'g' },
        accepts: ['solid'],
        open: true,
        initialContents: [{ substanceId: 'salt', amount: 5 }],
      },
      {
        id: 'jar',
        label: 'Jar',
        equipmentId: 'jar',
        capacity: { value: 500, unit: 'g' },
        accepts: ['solid'],
        open: true,
        initialContents: [
          { substanceId: 'salt', amount: 200 },
          { substanceId: 'calcium-carbonate', amount: 50 },
        ],
      },
    ],
    processes: [
      {
        kind: 'dissolution',
        id: 'salt-dissolves',
        soluteId: 'salt',
        solventId: 'water',
        dissolvedId: 'salt-aq',
        solubilityGPer100Ml: 36,
        solubilityPerDegreeC: 0.1,
        rateGPerSecondStirred: 2,
      },
      { kind: 'evaporation', id: 'water-boils', substanceId: 'water', rateMlPerSecond: 1 },
    ],
    reactions: [precipitation, carbonate, neutralisation, hotOnly],
    ...overrides,
  }
}

function put(state, containerId, contents) {
  const container = state.containers[containerId]
  return {
    ...state,
    containers: {
      ...state.containers,
      [containerId]: { ...container, contents: { ...container.contents, ...contents } },
    },
  }
}

function run(def, state, seconds, conditions = {}, step = 1) {
  const events = []
  for (let t = 0; t < seconds; t += step) {
    const result = simulateTick(def, state, step, conditions)
    assert.equal(result.ok, true)
    state = result.state
    events.push(...result.events)
  }
  return { state, events }
}

const close = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} ≉ ${expected}`)

// ---------------------------------------------------------------------------
// Validation and registry
// ---------------------------------------------------------------------------

test('fixture and salt definitions validate; the registry exposes salt with no issues', () => {
  assert.deepEqual(validateChemistryDefinition(fixture()), [])
  assert.deepEqual(validateExperimentDefinition(saltCoreExperiment), [])
  assert.equal(isValidExperimentDefinition(saltCoreExperiment), true)
  assert.deepEqual(getRegisteredExperimentIds(), ['exp-salt-water-001'])
  assert.deepEqual(registryIssues.get('exp-salt-water-001'), [])
  assert.equal(allCoreExperiments.length, 7)
  for (const def of allCoreExperiments) {
    assert.deepEqual(validateExperimentDefinition(def), [])
    assert.equal(getCoreExperiment(def.experimentId)?.id, def.id)
  }
  const registration = resolveSimulation({ id: 'exp-salt-water-001', status: 'demo' })
  assert.equal(registration.core, saltCoreExperiment)
  assert.equal(registration.definition.experimentId, 'exp-salt-water-001')
  assert.equal(resolveSimulation({ id: 'exp-salt-water-001', status: 'planned' }), undefined)
  assert.equal(resolveSimulation({ id: 'exp-unknown-999', status: 'demo' }), undefined)
})

test('validator reports broken definitions with useful paths', () => {
  const messages = (def) =>
    validateChemistryDefinition(def)
      .map((i) => `${i.path}: ${i.message}`)
      .join('\n')
  assert.match(messages(null), /must be an object/)
  assert.match(messages({ ...fixture(), schemaVersion: 2 }), /schemaVersion/)
  assert.match(
    messages({ ...fixture(), substances: [...substances, substances[0]] }),
    /Duplicate substance id "water"/,
  )
  assert.match(
    messages({
      ...fixture(),
      substances: [{ ...substances[0], color: 'blue' }, ...substances.slice(1)],
    }),
    /Colour/,
  )
  assert.match(
    messages({
      ...fixture(),
      substances: [{ ...substances[0], state: 'plasma' }, ...substances.slice(1)],
    }),
    /Unknown physical state/,
  )
  assert.match(
    messages({ ...fixture(), containers: [beaker('a', [{ substanceId: 'water', amount: 300 }])] }),
    /exceed capacity/,
  )
  assert.match(
    messages({ ...fixture(), containers: [beaker('a', [{ substanceId: 'mystery', amount: 1 }])] }),
    /Unknown substance "mystery"/,
  )
  assert.match(
    messages({ ...fixture(), containers: [beaker('a'), beaker('a')] }),
    /Duplicate container id/,
  )
  assert.match(
    messages({
      ...fixture(),
      containers: [{ ...beaker('a'), capacity: { value: -1, unit: 'L' } }],
    }),
    /Capacity/,
  )
  assert.match(
    messages({
      ...fixture(),
      reactions: [{ ...precipitation, products: [{ substanceId: 'silver-chloride', amount: 1 }] }],
    }),
    /Mass is not conserved/,
  )
  assert.match(
    messages({ ...fixture(), reactions: [{ ...precipitation, reactants: [] }] }),
    /At least one reactant/,
  )
  assert.match(
    messages({ ...fixture(), reactions: [{ ...precipitation, effects: ['sparkles'] }] }),
    /Unknown effect/,
  )
  assert.match(
    messages({ ...fixture(), reactions: [{ ...precipitation, ratePerSecond: 0 }] }),
    /ratePerSecond/,
  )
  assert.match(
    messages({ ...fixture(), reactions: [precipitation, precipitation] }),
    /Duplicate reaction id/,
  )
  assert.match(
    messages({ ...fixture(), processes: [{ ...fixture().processes[0], solventId: 'salt' }] }),
    /Solvent must be a liquid/,
  )
  assert.match(
    messages({
      ...fixture(),
      processes: [{ kind: 'evaporation', id: 'x', substanceId: 'salt', rateMlPerSecond: 1 }],
    }),
    /Evaporation needs a liquid/,
  )

  const badExperiment = {
    ...saltCoreExperiment,
    allowedSubstances: ['unobtainium'],
    successCriteria: [
      {
        kind: 'amount',
        containerId: 'nowhere',
        substanceId: 'water',
        operator: 'about',
        value: 'x',
      },
    ],
    guidedSteps: [
      {
        ...saltCoreExperiment.guidedSteps[0],
        expectedAction: { kind: 'transfer', from: 'x', to: 'beaker', substanceId: 'water' },
      },
      saltCoreExperiment.guidedSteps[0],
    ],
  }
  const issues = validateExperimentDefinition(badExperiment)
    .map((i) => i.path + ' ' + i.message)
    .join('\n')
  for (const expected of [
    /Unknown substance "unobtainium"/,
    /Unknown container/,
    /Unknown operator/,
    /Must be a number/,
    /Duplicate step id/,
  ])
    assert.match(issues, expected)
  assert.equal(isValidExperimentDefinition(badExperiment), false)
})

// ---------------------------------------------------------------------------
// Transfers and overflow
// ---------------------------------------------------------------------------

test('transfers conserve material and reject invalid requests with codes', () => {
  const def = fixture()
  const state = createInitialLabState(def)
  const moved = transferMaterial(def, state, {
    from: 'a',
    to: 'b',
    substanceId: 'water',
    amount: 40,
  })
  assert.equal(moved.ok, true)
  assert.equal(amountOf(moved.state, 'a', 'water'), 60)
  assert.equal(amountOf(moved.state, 'b', 'water'), 40)
  assert.deepEqual(moved.events, [
    { type: 'transferred', from: 'a', to: 'b', substanceId: 'water', amount: 40, unit: 'mL' },
  ])
  assert.equal(state.containers.b.contents.water, undefined, 'input state is not mutated')

  const code = (request) => transferMaterial(def, state, request).code
  assert.equal(code({ from: 'a', to: 'a', substanceId: 'water', amount: 1 }), 'SAME_CONTAINER')
  assert.equal(
    code({ from: 'a', to: 'nowhere', substanceId: 'water', amount: 1 }),
    'UNKNOWN_CONTAINER',
  )
  assert.equal(
    code({ from: 'a', to: 'b', substanceId: 'unobtainium', amount: 1 }),
    'UNKNOWN_SUBSTANCE',
  )
  assert.equal(code({ from: 'a', to: 'b', substanceId: 'water', amount: 0 }), 'INVALID_AMOUNT')
  assert.equal(
    code({ from: 'a', to: 'b', substanceId: 'water', amount: Number.NaN }),
    'INVALID_AMOUNT',
  )
  assert.equal(
    code({ from: 'a', to: 'b', substanceId: 'water', amount: 101 }),
    'INSUFFICIENT_AMOUNT',
  )
  assert.equal(code({ from: 'a', to: 'scoop', substanceId: 'water', amount: 1 }), 'NOT_ACCEPTED')
  assert.equal(
    code({ from: 'jar', to: 'scoop', substanceId: 'salt', amount: 1 }),
    'CAPACITY_EXCEEDED',
  )
})

test('overflow: reject by default, or fill to capacity and report the spill', () => {
  const def = fixture({
    containers: [
      beaker('big', [{ substanceId: 'water', amount: 200 }], true, 500),
      beaker('small', [], true, 50),
    ],
  })
  const state = createInitialLabState(def)
  const rejected = transferMaterial(def, state, {
    from: 'big',
    to: 'small',
    substanceId: 'water',
    amount: 80,
  })
  assert.equal(rejected.code, 'CAPACITY_EXCEEDED')
  assert.equal(rejected.state, state)
  const spilled = transferMaterial(def, state, {
    from: 'big',
    to: 'small',
    substanceId: 'water',
    amount: 80,
    onOverflow: 'spill',
  })
  assert.equal(spilled.ok, true)
  assert.equal(readVolumeMl(def, spilled.state, 'small'), 50)
  assert.equal(readVolumeMl(def, spilled.state, 'big'), 120)
  assert.deepEqual(spilled.events.at(-1), {
    type: 'overflow',
    containerId: 'small',
    substanceId: 'water',
    amount: 30,
    unit: 'mL',
  })
})

// ---------------------------------------------------------------------------
// Dissolution, saturation, temperature
// ---------------------------------------------------------------------------

test('dissolving needs stirring, follows rate × time and stops at the solubility limit', () => {
  const def = fixture({ reactions: [] })
  let state = put(createInitialLabState(def), 'a', { salt: 50 })
  const still = simulateTick(def, state, 1)
  assert.equal(amountOf(still.state, 'a', 'salt-aq'), 0, 'no dissolving without stirring')

  const stirred = simulateTick(def, state, 1.5, { stirring: ['a'] })
  close(amountOf(stirred.state, 'a', 'salt-aq'), 3)
  close(amountOf(stirred.state, 'a', 'salt'), 47)
  assert.ok(stirred.events.some((e) => e.type === 'dissolved' && e.amount === 3))
  assert.ok(stirred.events.some((e) => e.type === 'effect' && e.effect === 'dissolve'))

  const process = def.processes[0]
  close(saturationLimitG(process, state, 'a'), 36)
  const saturated = run(def, state, 30, { stirring: ['a'] })
  close(amountOf(saturated.state, 'a', 'salt-aq'), 36)
  close(amountOf(saturated.state, 'a', 'salt'), 14)
  assert.ok(saturated.events.some((e) => e.type === 'saturated' && e.containerId === 'a'))
  state = saturated.state
  close(readMassG(def, state, 'a'), 150, 1e-6) // 100 g water + 50 g salt, conserved
})

test('heating raises solubility; cooling crystallises the excess; the lab cools toward ambient', () => {
  const def = fixture({ reactions: [] })
  let state = put(createInitialLabState(def), 'a', { salt: 50 })
  state = run(def, state, 40, { stirring: ['a'], heatingCPerSecond: { a: 1 } }).state
  close(readTemperatureC(state, 'a'), 60)
  close(amountOf(state, 'a', 'salt-aq'), 40) // 36 + 0.1 × 40 °C
  const cooled = run(def, state, 120)
  assert.ok(readTemperatureC(cooled.state, 'a') < 25)
  assert.ok(amountOf(cooled.state, 'a', 'salt-aq') < 37)
  close(amountOf(cooled.state, 'a', 'salt-aq') + amountOf(cooled.state, 'a', 'salt'), 50)
  assert.ok(cooled.events.some((e) => e.type === 'effect' && e.effect === 'precipitate'))
})

test('a boiling liquid holds 100 °C and evaporates only while heated', () => {
  const def = fixture({ reactions: [] })
  let state = createInitialLabState(def)
  const { state: boiled, events } = run(def, state, 100, { heatingCPerSecond: { a: 2 } })
  close(readTemperatureC(boiled, 'a'), 100)
  assert.ok(readVolumeMl(def, boiled, 'a') < 100)
  assert.ok(events.some((e) => e.type === 'evaporated'))
  const volume = readVolumeMl(def, boiled, 'a')
  state = run(def, boiled, 10).state
  close(readVolumeMl(def, state, 'a'), volume)
})

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

test('precipitation: limiting reagent, conserved mass, precipitate and colour events', () => {
  const def = fixture()
  let state = put(createInitialLabState(def), 'a', {
    'silver-nitrate-aq': 1.6987 * 2,
    'salt-aq': 0.5844,
  })
  const before = readMassG(def, state, 'a')
  const result = simulateTick(def, state, 0.1)
  state = result.state
  close(amountOf(state, 'a', 'salt-aq'), 0)
  close(amountOf(state, 'a', 'silver-nitrate-aq'), 1.6987)
  close(amountOf(state, 'a', 'silver-chloride'), 1.4332)
  close(readMassG(def, state, 'a'), before, 1e-9)
  const reacted = result.events.find((e) => e.type === 'reacted')
  assert.equal(reacted.ruleId, 'silver-chloride-precipitation')
  close(reacted.extent, 1)
  assert.match(reacted.observation, /white precipitate/)
  assert.deepEqual(
    result.events
      .filter((e) => e.type === 'effect' && e.sourceId === 'silver-chloride-precipitation')
      .map((e) => e.effect),
    ['precipitate', 'colorChange'],
  )
})

test('gas production: rate-limited, open containers release CO₂, closed ones keep it', () => {
  const def = fixture()
  const start = (id) =>
    put(createInitialLabState(def), id, { 'calcium-carbonate': 2.0018, 'hcl-aq': 1.4584 })

  const open = run(def, start('b'), 2, {}, 1)
  const released = open.events
    .filter((e) => e.type === 'gas-released')
    .reduce((sum, e) => sum + e.amount, 0)
  close(released, 0.4401) // 0.5 extent/s × 2 s × 0.4401 g
  close(amountOf(open.state, 'b', 'carbon-dioxide'), 0)
  close(readMassG(def, open.state, 'b') + released, 2.0018 + 1.4584, 1e-9)
  assert.ok(open.events.some((e) => e.type === 'effect' && e.effect === 'gas'))
  assert.ok(open.events.some((e) => e.type === 'hazard' && e.hazard === 'toxic-gas'))
  assert.ok(readTemperatureC(open.state, 'b') > 20, 'exothermic')

  const closed = run(def, start('closed'), 2)
  close(amountOf(closed.state, 'closed', 'carbon-dioxide'), 0.4401)
  assert.equal(closed.events.filter((e) => e.type === 'gas-released').length, 0)
})

test('temperature conditions gate reactions', () => {
  const def = fixture({ processes: [] })
  const state = put(createInitialLabState(def), 'b', { salt: 5 })
  assert.equal(amountOf(simulateTick(def, state, 1).state, 'b', 'silver-chloride'), 0)
  const hot = run(def, state, 45, { heatingCPerSecond: { b: 1 } })
  assert.ok(amountOf(hot.state, 'b', 'silver-chloride') > 0)
  assert.ok(hot.events.some((e) => e.type === 'reacted' && e.ruleId === 'needs-heat'))
})

test('pH: strong acid ≈ 1, neutralised ≈ 7, excess base > 7; no liquid → null', () => {
  const def = fixture()
  // 0.01 mol HCl in 100 mL → 0.1 M → pH 1.
  let state = put(createInitialLabState(def), 'a', { 'hcl-aq': 0.3646 })
  close(readPh(def, state, 'a'), 1, 1e-6)
  state = put(state, 'a', { 'naoh-aq': 0.4 })
  state = simulateTick(def, state, 0.1).state
  close(readPh(def, state, 'a'), 7, 1e-6)
  state = put(state, 'a', { 'naoh-aq': 0.04 })
  assert.ok(readPh(def, state, 'a') > 11.9)
  assert.equal(readPh(def, state, 'b'), null)
})

test('colour blend, measurement readers and criteria', () => {
  const def = fixture()
  let state = put(createInitialLabState(def), 'b', { 'blue-dye-aq': 1 })
  assert.equal(readColor(def, state, 'b'), '#0000ff')
  state = put(state, 'b', { water: 10 })
  assert.match(readColor(def, state, 'b'), /^#[0-9a-f]{6}$/)
  assert.equal(readColor(def, createInitialLabState(def), 'b'), null)
  assert.equal(
    evaluateCriterion(def, state, { kind: 'volume', containerId: 'b', operator: 'eq', value: 10 }),
    true,
  )
  assert.equal(
    evaluateCriterion(def, state, { kind: 'volume', containerId: 'b', operator: 'gt', value: 10 }),
    false,
  )
  assert.equal(
    evaluateCriterion(def, state, {
      kind: 'temperature',
      containerId: 'b',
      operator: 'lte',
      value: 20,
    }),
    true,
  )
  assert.equal(
    evaluateCriterion(def, state, { kind: 'ph', containerId: 'b', operator: 'eq', value: 7 }),
    true,
  )
  assert.equal(
    evaluateCriterion(def, state, { kind: 'ph', containerId: 'scoop', operator: 'eq', value: 7 }),
    false,
    'no liquid → not met',
  )
  assert.equal(
    evaluateCriteria(def, state, [
      { kind: 'amount', containerId: 'b', substanceId: 'blue-dye-aq', operator: 'gte', value: 1 },
      { kind: 'amount', containerId: 'b', substanceId: 'blue-dye-aq', operator: 'ne', value: 2 },
      { kind: 'amount', containerId: 'b', substanceId: 'blue-dye-aq', operator: 'lt', value: 2 },
    ]),
    true,
  )
})

test('ticks are deterministic, reject invalid steps and do not mutate input', () => {
  const def = fixture()
  const state = put(createInitialLabState(def), 'b', {
    'calcium-carbonate': 2,
    'hcl-aq': 1.4,
    salt: 3,
    water: 50,
  })
  const snapshot = JSON.stringify(state)
  const a = simulateTick(def, state, 0.7, { stirring: ['b'], heatingCPerSecond: { b: 3 } })
  const b = simulateTick(def, state, 0.7, { stirring: ['b'], heatingCPerSecond: { b: 3 } })
  assert.deepEqual(a, b)
  assert.equal(JSON.stringify(state), snapshot)
  for (const dt of [-1, Number.NaN, Infinity, 61])
    assert.equal(simulateTick(def, state, dt).code, 'INVALID_TIME_STEP')
  const zero = simulateTick(def, state, 0)
  assert.equal(zero.ok, true)
  assert.deepEqual(zero.state.containers, state.containers)
})

// ---------------------------------------------------------------------------
// Salt on the core engine
// ---------------------------------------------------------------------------

test('salt experiment runs on the core engine directly and meets its success criteria', () => {
  const chemistry = saltCoreExperiment.chemistry
  let state = createInitialLabState(chemistry)
  const moves = [
    ['water', 'graduated-cylinder', 'water', 100],
    ['graduated-cylinder', 'beaker', 'water', 100],
    ['sodium-chloride', 'spatula', 'sodium-chloride', 5],
    ['spatula', 'weighing-boat', 'sodium-chloride', 5],
    ['weighing-boat', 'beaker', 'sodium-chloride', 5],
  ]
  const steps = saltCoreExperiment.guidedSteps
  for (const [i, [from, to, substanceId, amount]] of moves.entries()) {
    const result = transferMaterial(chemistry, state, { from, to, substanceId, amount })
    assert.equal(result.ok, true, `${from} → ${to}`)
    state = result.state
    assert.equal(evaluateCriteria(chemistry, state, steps[i].completeWhen), true, steps[i].id)
  }
  assert.equal(evaluateCriteria(chemistry, state, saltCoreExperiment.successCriteria), false)
  state = simulateTick(chemistry, state, 1).state
  assert.equal(amountOf(state, 'beaker', 'sodium-chloride-aq'), 0, 'no stirring, no dissolving')
  state = run(chemistry, state, 2, { stirring: ['beaker'] }).state
  assert.equal(evaluateCriteria(chemistry, state, steps.at(-1).completeWhen), true)
  assert.equal(evaluateCriteria(chemistry, state, saltCoreExperiment.successCriteria), true)
  close(saturationLimitG(saltDissolutionProcess, state, 'beaker'), 35.9)
})

test('legacy salt state is an exact projection of the core state through a full run', () => {
  const placed = [
    'water',
    'graduated-cylinder',
    'beaker',
    'sodium-chloride',
    'spatula',
    'weighing-boat',
    'stirring-rod',
    'digital-balance',
  ]
  const commands = [
    { kind: 'pour', source: 'water', target: 'graduated-cylinder', amountMl: 100 },
    { kind: 'pour', source: 'graduated-cylinder', target: 'beaker', amountMl: 100 },
    { kind: 'scoop-salt', tool: 'spatula', source: 'sodium-chloride', massG: 5 },
    { kind: 'deposit-salt', tool: 'spatula', target: 'weighing-boat', massG: 5 },
    { kind: 'add-substance', source: 'weighing-boat', target: 'beaker', massG: 5 },
    { kind: 'stir', tool: 'stirring-rod', target: 'beaker', elapsedMs: 1000 },
    { kind: 'stir', tool: 'stirring-rod', target: 'beaker' },
  ]
  let state = initialSaltExperimentState()
  assert.deepEqual(
    labStateToSaltState(createInitialLabState(saltCoreExperiment.chemistry), state),
    state,
  )
  for (const command of commands) {
    const result = executeSaltCommand(state, command, placed)
    assert.equal(result.ok, true, `${command.kind}: ${result.message}`)
    state = result.state
    const back = labStateToSaltState(saltStateToLabState(state), state)
    for (const key of [
      'saltStockG',
      'saltOnSpatulaG',
      'saltOnBoatG',
      'saltInBeakerG',
      'dissolvedSaltG',
    ])
      close(back[key], state[key], 1e-12)
    assert.deepEqual(back.waterMl, state.waterMl)
  }
  assert.equal(state.dissolvedSaltG, 5)
  assert.equal(
    evaluateCriteria(
      saltCoreExperiment.chemistry,
      saltStateToLabState(state),
      saltCoreExperiment.successCriteria,
    ),
    true,
  )
})
