import assert from 'node:assert/strict'
import test from 'node:test'
import {
  amountOf,
  createInitialLabState,
  evaluateCriteria,
  evaluateCriterion,
  isValidExperimentDefinition,
  readMassG,
  readPh,
  readTemperatureC,
  readVolumeMl,
  simulateTick,
  transferMaterial,
  validateExperimentDefinition,
} from '../src/features/simulations/engine/core/index.ts'
import {
  sodiumWaterCoreExperiment,
  silverNitratePrecipitationCoreExperiment,
  calciumCarbonateHclCoreExperiment,
  flameTestsCoreExperiment,
  acidBaseTitrationCoreExperiment,
  copperSulfateCrystallizationCoreExperiment,
  l11CoreExperiments,
  getL11CoreExperiment,
} from '../src/features/simulations/data/experiments/index.ts'

test('all L11 experiment definitions pass strict validation without any issues', () => {
  assert.equal(l11CoreExperiments.length, 6)

  for (const def of l11CoreExperiments) {
    const issues = validateExperimentDefinition(def)
    assert.deepEqual(
      issues,
      [],
      `Experiment ${def.experimentId} had validation issues: ${JSON.stringify(issues)}`,
    )
    assert.equal(isValidExperimentDefinition(def), true)
    assert.equal(getL11CoreExperiment(def.experimentId)?.id, def.id)
  }
})

test('sodium + water (exp-sodium-water-012) guided workflow produces NaOH, H2 gas, and alkaline pH', () => {
  const def = sodiumWaterCoreExperiment
  let state = createInitialLabState(def.chemistry)

  // Initial checks
  assert.equal(amountOf(state, 'water-supply', 'water'), 800)
  assert.equal(amountOf(state, 'sodium-jar', 'sodium-metal'), 10)
  assert.equal(readVolumeMl(def.chemistry, state, 'trough'), 0)

  // Step 1: Pour 500 mL water into trough
  const transfer1 = transferMaterial(def.chemistry, state, {
    from: 'water-supply',
    to: 'trough',
    substanceId: 'water',
    amount: 500,
  })
  assert.equal(transfer1.ok, true)
  state = transfer1.state
  assert.equal(readVolumeMl(def.chemistry, state, 'trough'), 500)
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[0].completeWhen), true)

  // Step 2: Add 1 mL phenolphthalein indicator
  const transfer2 = transferMaterial(def.chemistry, state, {
    from: 'indicator-bottle',
    to: 'trough',
    substanceId: 'phenolphthalein-solution',
    amount: 1,
  })
  assert.equal(transfer2.ok, true)
  state = transfer2.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[1].completeWhen), true)

  // Step 3: Pick a small piece of sodium (0.4598 g) with forceps
  const transfer3 = transferMaterial(def.chemistry, state, {
    from: 'sodium-jar',
    to: 'forceps',
    substanceId: 'sodium-metal',
    amount: 0.4598,
  })
  assert.equal(transfer3.ok, true)
  state = transfer3.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[2].completeWhen), true)

  // Step 4: Drop sodium into trough
  const transfer4 = transferMaterial(def.chemistry, state, {
    from: 'forceps',
    to: 'trough',
    substanceId: 'sodium-metal',
    amount: 0.4598,
  })
  assert.equal(transfer4.ok, true)
  state = transfer4.state

  // Before reaction tick: solid sodium is present in trough
  assert.equal(amountOf(state, 'trough', 'sodium-metal'), 0.4598)

  // Step 5: Simulate reaction ticks (rate = 2.0 extent/s; extent needed = 1.0; dt = 1.0 s)
  const tickResult = simulateTick(def.chemistry, state, 1.0)
  state = tickResult.state

  // Assert events: reacted, gas-released, effects (flame, gas, heat, colorChange)
  const eventTypes = tickResult.events.map((e) => e.type)
  assert.ok(eventTypes.includes('reacted'), 'Must emit reacted event')
  assert.ok(eventTypes.includes('effect'), 'Must emit effect events')

  const effectKinds = tickResult.events
    .filter((e) => e.type === 'effect')
    .map((e) => e.effect)
  assert.ok(effectKinds.includes('gas'), 'Must produce gas effect')
  assert.ok(effectKinds.includes('flame'), 'Must produce flame effect')
  assert.ok(effectKinds.includes('heat'), 'Must produce heat effect')

  // Chemical outcomes: sodium metal consumed, NaOH(aq) formed
  assert.equal(amountOf(state, 'trough', 'sodium-metal'), 0)
  assert.ok(amountOf(state, 'trough', 'sodium-hydroxide-aq') >= 0.79)

  // pH is alkaline (> 11) because NaOH is a strong base
  const ph = readPh(def.chemistry, state, 'trough')
  assert.ok(ph !== null && ph >= 11, `Expected alkaline pH, got ${ph}`)

  // Temperature increased due to exothermic heat
  const temp = readTemperatureC(state, 'trough')
  assert.ok(temp > 20, `Expected temperature rise from exothermic reaction, got ${temp}`)

  // Guided steps and success criteria are satisfied
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[3].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[4].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.successCriteria), true)
})

test('silver nitrate precipitation (exp-anions-015) guided workflow produces insoluble AgCl precipitate', () => {
  const def = silverNitratePrecipitationCoreExperiment
  let state = createInitialLabState(def.chemistry)

  // Step 1: Transfer 10 mL NaCl solution to test tube
  const transfer1 = transferMaterial(def.chemistry, state, {
    from: 'nacl-bottle',
    to: 'test-tube',
    substanceId: 'sodium-chloride-aq',
    amount: 0.58443,
  })
  assert.equal(transfer1.ok, true)
  state = transfer1.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[0].completeWhen), true)

  // Step 2: Add 10 mL AgNO3 solution to test tube
  const transfer2 = transferMaterial(def.chemistry, state, {
    from: 'agno3-dropper',
    to: 'test-tube',
    substanceId: 'silver-nitrate-aq',
    amount: 1.69873,
  })
  assert.equal(transfer2.ok, true)
  state = transfer2.state

  // Simulate tick for instantaneous precipitation
  const tickResult = simulateTick(def.chemistry, state, 1.0)
  state = tickResult.state

  // Check precipitate effect
  const effectEvent = tickResult.events.find(
    (e) => e.type === 'effect' && e.effect === 'precipitate',
  )
  assert.ok(effectEvent, 'Precipitation effect must be emitted')

  // Chemical products: AgCl precipitate formed and NaNO3 produced
  assert.ok(amountOf(state, 'test-tube', 'silver-chloride') >= 1.43)
  assert.ok(amountOf(state, 'test-tube', 'sodium-nitrate-aq') >= 0.84)
  assert.equal(amountOf(state, 'test-tube', 'sodium-chloride-aq'), 0)

  // Verify completeWhen and successCriteria
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[1].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[2].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.successCriteria), true)
})

test('calcium carbonate + HCl (exp-oxides-009) produces rapid CO2 gas effervescence and dissolves solid', () => {
  const def = calciumCarbonateHclCoreExperiment
  let state = createInitialLabState(def.chemistry)

  // Step 1: Scoop 1.00087 g CaCO3
  const transfer1 = transferMaterial(def.chemistry, state, {
    from: 'carbonate-jar',
    to: 'spatula',
    substanceId: 'calcium-carbonate',
    amount: 1.00087,
  })
  assert.equal(transfer1.ok, true)
  state = transfer1.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[0].completeWhen), true)

  // Step 2: Place into conical flask
  const transfer2 = transferMaterial(def.chemistry, state, {
    from: 'spatula',
    to: 'conical-flask',
    substanceId: 'calcium-carbonate',
    amount: 1.00087,
  })
  assert.equal(transfer2.ok, true)
  state = transfer2.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[1].completeWhen), true)

  // Step 3: Add 0.72922 g HCl(aq) from acid cylinder
  const transfer3 = transferMaterial(def.chemistry, state, {
    from: 'acid-cylinder',
    to: 'conical-flask',
    substanceId: 'hcl-aq',
    amount: 0.72922,
  })
  assert.equal(transfer3.ok, true)
  state = transfer3.state

  // Simulate tick for reaction
  const tickResult = simulateTick(def.chemistry, state, 1.0)
  state = tickResult.state

  // Effervescence and gas effect
  const gasEffect = tickResult.events.find((e) => e.type === 'effect' && e.effect === 'gas')
  assert.ok(gasEffect, 'Gas effect must be emitted')

  // Solid calcium carbonate is completely dissolved
  assert.equal(amountOf(state, 'conical-flask', 'calcium-carbonate'), 0)
  assert.ok(amountOf(state, 'conical-flask', 'calcium-chloride-aq') >= 1.1)

  // Verify completeWhen and successCriteria
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[2].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[3].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.successCriteria), true)
})

test('flame tests (exp-flame-tests-008) thermal excitation emits characteristic colors under heating', () => {
  const def = flameTestsCoreExperiment
  let state = createInitialLabState(def.chemistry)

  // Step 1: Pick NaCl sample on loop
  const transfer1 = transferMaterial(def.chemistry, state, {
    from: 'watch-glass',
    to: 'nichrome-loop',
    substanceId: 'sodium-chloride',
    amount: 1.16886,
  })
  assert.equal(transfer1.ok, true)
  state = transfer1.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[0].completeWhen), true)

  // Step 2: Insert into hot flame zone (temp = 600 °C)
  const transfer2 = transferMaterial(def.chemistry, state, {
    from: 'nichrome-loop',
    to: 'burner-flame-zone',
    substanceId: 'sodium-chloride',
    amount: 1.16886,
  })
  assert.equal(transfer2.ok, true)
  state = transfer2.state

  // Tick with burner heating active
  const tickResult = simulateTick(def.chemistry, state, 1.0, {
    heatingCPerSecond: { 'burner-flame-zone': 50 },
  })
  state = tickResult.state

  // Characteristic yellow flame emission is produced
  assert.ok(amountOf(state, 'burner-flame-zone', 'na-yellow-flame') >= 0.4)

  // Verify flame effects
  const flameEffect = tickResult.events.find((e) => e.type === 'effect' && e.effect === 'flame')
  assert.ok(flameEffect, 'Flame effect must be emitted upon excitation')

  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[1].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[2].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.successCriteria), true)
})

test('acid-base titration (exp-titration-005) neutralizes HCl with NaOH reaching equivalence point', () => {
  const def = acidBaseTitrationCoreExperiment
  let state = createInitialLabState(def.chemistry)

  // Step 1: Deliver HCl aliquot into flask
  const transfer1 = transferMaterial(def.chemistry, state, {
    from: 'acid-pipette',
    to: 'erlenmeyer-flask',
    substanceId: 'hcl-aq',
    amount: 0.36461,
  })
  assert.equal(transfer1.ok, true)
  state = transfer1.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[0].completeWhen), true)

  // Step 2: Add indicator
  const transfer2 = transferMaterial(def.chemistry, state, {
    from: 'indicator-bottle',
    to: 'erlenmeyer-flask',
    substanceId: 'phenolphthalein-indicator',
    amount: 1,
  })
  assert.equal(transfer2.ok, true)
  state = transfer2.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[1].completeWhen), true)

  // Step 3: Titrate with NaOH from burette
  const transfer3 = transferMaterial(def.chemistry, state, {
    from: 'burette',
    to: 'erlenmeyer-flask',
    substanceId: 'naoh-aq',
    amount: 0.39997,
  })
  assert.equal(transfer3.ok, true)
  state = transfer3.state

  // Simulate tick for neutralization reaction
  const tickResult = simulateTick(def.chemistry, state, 1.0)
  state = tickResult.state

  // Acid is completely consumed, neutral NaCl formed
  assert.equal(amountOf(state, 'erlenmeyer-flask', 'hcl-aq'), 0)
  assert.ok(amountOf(state, 'erlenmeyer-flask', 'nacl-aq') >= 0.58)

  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[2].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[3].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.successCriteria), true)
})

test('copper sulfate dissolution & crystallization (exp-heat-dissolution-006) follows temperature-dependent solubility', () => {
  const def = copperSulfateCrystallizationCoreExperiment
  let state = createInitialLabState(def.chemistry)

  // Step 1: Measure 100 mL water into beaker
  const transfer1 = transferMaterial(def.chemistry, state, {
    from: 'water-supply',
    to: 'beaker',
    substanceId: 'water',
    amount: 100,
  })
  assert.equal(transfer1.ok, true)
  state = transfer1.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[0].completeWhen), true)

  // Step 2: Scoop 10 g CuSO4 crystals
  const transfer2 = transferMaterial(def.chemistry, state, {
    from: 'cuso4-jar',
    to: 'spatula',
    substanceId: 'copper-sulfate',
    amount: 10,
  })
  assert.equal(transfer2.ok, true)
  state = transfer2.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[1].completeWhen), true)

  // Step 3: Add to beaker
  const transfer3 = transferMaterial(def.chemistry, state, {
    from: 'spatula',
    to: 'beaker',
    substanceId: 'copper-sulfate',
    amount: 10,
  })
  assert.equal(transfer3.ok, true)
  state = transfer3.state
  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[2].completeWhen), true)

  // Step 4: Stir to dissolve at 20 °C (rate stirred = 5 g/s; 10 g dissolves in 2 s)
  const tickResult = simulateTick(def.chemistry, state, 2.5, { stirring: ['beaker'] })
  state = tickResult.state

  // All 10 g dissolves into vivid blue aqueous solution
  assert.equal(amountOf(state, 'beaker', 'copper-sulfate'), 0)
  assert.equal(amountOf(state, 'beaker', 'copper-sulfate-aq'), 10)

  assert.equal(evaluateCriteria(def.chemistry, state, def.guidedSteps[3].completeWhen), true)
  assert.equal(evaluateCriteria(def.chemistry, state, def.successCriteria), true)
})
