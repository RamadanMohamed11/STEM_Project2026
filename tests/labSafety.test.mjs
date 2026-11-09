import assert from 'node:assert/strict'
import test from 'node:test'
import { getHazard } from '../src/features/safety/data/hazards.ts'
import { useLabReadinessStore } from '../src/features/safety/state/useLabReadinessStore.ts'
import { LAB_SAFETY_RULES } from '../src/features/simulations/data/safetyRules.ts'
import { evaluateSafety } from '../src/features/simulations/lib/safetyRules.ts'
import { effectKey } from '../src/features/simulations/lib/reactionEffects.ts'
import { useBenchLiquidsStore } from '../src/features/simulations/state/useBenchLiquidsStore.ts'
import { useLabSafetyStore } from '../src/features/simulations/state/useLabSafetyStore.ts'
import { useReactionEffectsStore } from '../src/features/simulations/state/useReactionEffectsStore.ts'

const view = (id, state, extra = {}) => ({
  id,
  state,
  hazards: [],
  concentrated: false,
  incompatibleWith: [],
  ...extra,
})
const WATER = view('water', 'liquid')
const CONC_ACID = view('conc-h2so4', 'liquid', { hazards: ['corrosive'], concentrated: true })
const DILUTE_ACID = view('hcl', 'liquid', { hazards: ['corrosive'] })
const BLEACH = view('bleach', 'aqueous', { incompatibleWith: ['hcl'] })
const ids = (violations) => violations.map((v) => v.ruleId)
const goggles = { goggles: true }
const noGoggles = { goggles: false }
const pour = (source, target) => ({ type: 'pour', sourceId: 'a', targetId: 'b', source, target })

test('rules are valid data: unique ids and hazards from the T41 catalogue', () => {
  const seen = new Set()
  for (const rule of LAB_SAFETY_RULES) {
    assert.ok(!seen.has(rule.id), rule.id)
    seen.add(rule.id)
    assert.ok(getHazard(rule.hazard), `${rule.id} hazard ${rule.hazard}`)
    assert.ok(rule.explanation.length > 40, `${rule.id} explains the right practice`)
  }
})

test('water into concentrated acid is flagged; acid into water is not', () => {
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, pour([WATER], [CONC_ACID]), goggles)), [
    'water-into-concentrated-acid',
  ])
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, pour([CONC_ACID], [WATER]), goggles)), [])
  const [violation] = evaluateSafety(LAB_SAFETY_RULES, pour([WATER], [CONC_ACID]), goggles)
  assert.equal(violation.effect, 'heat')
  assert.equal(violation.key, 'water-into-concentrated-acid:b')
})

test('corrosives and flames need goggles; incompatible chemicals are flagged', () => {
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, pour([DILUTE_ACID], [WATER]), noGoggles)), [
    'corrosive-without-goggles',
  ])
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, pour([DILUTE_ACID], [WATER]), goggles)), [])
  const dip = { type: 'dip', instrumentId: 'ph-paper', targetId: 'b', target: [DILUTE_ACID] }
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, dip, noGoggles)), [
    'corrosive-without-goggles',
  ])
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, pour([WATER], [WATER]), noGoggles)), [])
  const light = {
    type: 'light',
    burnerId: 'bunsen-burner',
    vesselId: 'b',
    vesselVolumeMl: 50,
    vesselOpen: true,
  }
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, light, noGoggles)), [
    'flame-without-goggles',
  ])
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, light, goggles)), [])
  const mix = evaluateSafety(LAB_SAFETY_RULES, pour([BLEACH], [DILUTE_ACID]), goggles)
  assert.deepEqual(ids(mix), ['incompatible-chemicals'])
  assert.equal(mix[0].effect, 'smoke')
})

test('heating rules: empty vessel, closed container, boiling dry', () => {
  const light = (extra) => ({
    type: 'light',
    burnerId: 'bb',
    vesselId: 'v',
    vesselVolumeMl: 50,
    vesselOpen: true,
    ...extra,
  })
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, light({ vesselVolumeMl: 0 }), goggles)), [
    'heating-empty-vessel',
  ])
  assert.deepEqual(
    ids(evaluateSafety(LAB_SAFETY_RULES, light({ vesselId: null, vesselVolumeMl: 0 }), goggles)),
    [],
  )
  const closed = evaluateSafety(LAB_SAFETY_RULES, light({ vesselOpen: false }), goggles)
  assert.deepEqual(ids(closed), ['heating-closed-vessel'])
  assert.equal(closed[0].effect, 'explosion')
  const heating = (extra) => ({
    type: 'heating',
    vesselId: 'v',
    volumeMl: 20,
    previousVolumeMl: 20,
    temperatureC: 60,
    open: true,
    ...extra,
  })
  assert.deepEqual(ids(evaluateSafety(LAB_SAFETY_RULES, heating({}), goggles)), [])
  assert.deepEqual(
    ids(evaluateSafety(LAB_SAFETY_RULES, heating({ open: false, temperatureC: 85 }), goggles)),
    ['heating-closed-vessel'],
  )
  assert.deepEqual(
    ids(evaluateSafety(LAB_SAFETY_RULES, heating({ volumeMl: 0, temperatureC: 100 }), goggles)),
    ['boiled-dry'],
  )
  assert.deepEqual(
    ids(
      evaluateSafety(
        LAB_SAFETY_RULES,
        heating({ volumeMl: 0, previousVolumeMl: 0, temperatureC: 250 }),
        goggles,
      ),
    ),
    [],
    'a vessel that was never filled did not "boil dry"',
  )
})

test('the safety store records once per item, counts repeats, alerts and plays the effect', () => {
  const safety = () => useLabSafetyStore.getState()
  useReactionEffectsStore.getState().clear()
  safety().begin('exp-safety-1')
  safety().clear()
  useLabReadinessStore.getState().setGoggles(true)
  safety().report(pour([WATER], [CONC_ACID]))
  assert.deepEqual(
    safety().mistakes.map((m) => m.key),
    ['water-into-concentrated-acid:b'],
  )
  assert.equal(safety().alert.mistake.severity, 'danger')
  assert.ok(
    useReactionEffectsStore.getState().effects[effectKey('b', 'heat')],
    'rule effect played',
  )
  safety().report(pour([WATER], [CONC_ACID]))
  assert.equal(safety().mistakes.length, 1)
  assert.equal(safety().mistakes[0].count, 2, 'repeat counted, not listed twice')
  useLabReadinessStore.getState().setGoggles(false)
  safety().report(pour([DILUTE_ACID], [WATER]))
  assert.ok(safety().alert.needsGoggles, 'goggles alert offers to put them on')
  useLabReadinessStore.getState().setGoggles(true)
  assert.equal(safety().report(pour([DILUTE_ACID], [WATER])).length, 0)

  // Guided-step mistakes keep the workflow explanation; free mode records none.
  safety().recordStepMistake({
    code: 'CYLINDER_NOT_EMPTY',
    stepId: 's3',
    message: 'Pour all the water first.',
  })
  assert.equal(safety().mistakes.at(-1).explanation, 'Pour all the water first.')
  safety().setMode('free')
  const before = safety().mistakes.length
  safety().recordStepMistake({ code: 'X', stepId: 's4', message: 'ignored' })
  assert.equal(safety().mistakes.length, before)
  safety().setMode('guided')
  safety().begin('exp-safety-2')
  assert.equal(safety().mistakes.length, 0, 'another experiment starts a fresh record')
})

test('bench actions are checked: acid without goggles, empty vessel heating, boiling dry', () => {
  const bench = () => useBenchLiquidsStore.getState()
  const safety = () => useLabSafetyStore.getState()
  safety().begin('exp-safety-3')
  useLabReadinessStore.getState().setGoggles(false)
  bench().reset()
  const rig = {
    'bunsen-burner': { kind: 'snapped', actorId: 'bunsen-burner', targetId: 'tripod' },
    'beaker-100': { kind: 'snapped', actorId: 'beaker-100', targetId: 'tripod' },
  }
  bench().sync([
    'tripod',
    'bunsen-burner',
    'beaker-100',
    'wash-bottle',
    'hydrochloric-acid',
    'test-tube',
  ])
  bench().pourAmount('hydrochloric-acid', 'test-tube', 2)
  assert.ok(safety().mistakes.some((m) => m.key === 'corrosive-without-goggles:test-tube'))

  useLabReadinessStore.getState().setGoggles(true)
  bench().setLit('bunsen-burner', true, rig)
  assert.ok(safety().mistakes.some((m) => m.key === 'heating-empty-vessel:beaker-100'))
  assert.ok(!safety().mistakes.some((m) => m.ruleId === 'flame-without-goggles'), 'goggles on')
  bench().setLit('bunsen-burner', false, rig)

  bench().pourAmount('wash-bottle', 'beaker-100', 3)
  for (let t = 0; t < 20_000 && bench().pour; t += 33) bench().tick(33)
  bench().setLit('bunsen-burner', true, rig)
  for (let t = 0; t < 120_000; t += 250) bench().react(250, rig)
  assert.equal(bench().lab.containers['beaker-100'].contents.water ?? 0, 0, 'boiled away')
  assert.ok(safety().mistakes.some((m) => m.key === 'boiled-dry:beaker-100'))
  bench().reset()
})
