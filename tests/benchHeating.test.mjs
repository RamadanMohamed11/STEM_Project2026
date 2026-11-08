import assert from 'node:assert/strict'
import test from 'node:test'
import { simulateTick } from '../src/features/simulations/engine/core/index.ts'
import {
  HOT_TOUCH_C,
  burnerUnder,
  heatingConditions,
  heatingRate,
  HEAT_SOURCES,
  hotTouchReason,
  vesselOver,
} from '../src/features/simulations/lib/benchHeating.ts'
import { effectKey } from '../src/features/simulations/lib/reactionEffects.ts'
import {
  benchTemperatureC,
  benchVolumeMl,
  useBenchLiquidsStore,
} from '../src/features/simulations/state/useBenchLiquidsStore.ts'
import { useReactionEffectsStore } from '../src/features/simulations/state/useReactionEffectsStore.ts'

const snap = (actorId, targetId) => ({ kind: 'snapped', actorId, targetId })
const RIG = {
  'bunsen-burner': snap('bunsen-burner', 'tripod'),
  'beaker-100': snap('beaker-100', 'tripod'),
}
const store = () => useBenchLiquidsStore.getState()

function runPour(seconds = 30) {
  for (let t = 0; t < seconds * 1000 && store().pour; t += 33) store().tick(33)
}
function heat(seconds, relationships = RIG, step = 250) {
  for (let t = 0; t < seconds * 1000; t += step) store().react(step, relationships)
}

test('a burner under a tripod heats the vessel on that tripod, and only when lit', () => {
  assert.equal(burnerUnder('beaker-100', RIG), 'bunsen-burner')
  assert.equal(burnerUnder('beaker-100', { 'beaker-100': snap('beaker-100', 'clamp-stand') }), null)
  assert.equal(burnerUnder('erlenmeyer-flask', RIG), null, 'not on the tripod')
  assert.equal(vesselOver('bunsen-burner', RIG, ['erlenmeyer-flask', 'beaker-100']), 'beaker-100')
  const volume = () => 50
  assert.deepEqual(heatingConditions(['beaker-100'], RIG, [], volume), {}, 'unlit: no heat')
  const rates = heatingConditions(['beaker-100'], RIG, ['bunsen-burner'], volume)
  assert.ok(Math.abs(rates['beaker-100'] - 3.2) < 1e-9, '1.6 °C/s per 100 mL → 3.2 °C/s for 50 mL')
  const bunsen = HEAT_SOURCES['bunsen-burner']
  assert.ok(heatingRate(bunsen, 20) > heatingRate(bunsen, 200), 'smaller volumes heat faster')
  assert.ok(heatingRate(HEAT_SOURCES['spirit-lamp'], 100) < heatingRate(bunsen, 100))
  assert.equal(heatingRate(bunsen, 0), heatingRate(bunsen, 15), 'empty vessel is capped')
})

test('heating raises the temperature, water boils at 100 °C and boils away; it cools when off', () => {
  store().reset()
  useReactionEffectsStore.getState().clear()
  store().sync(['tripod', 'bunsen-burner', 'beaker-100', 'wash-bottle'])
  store().pourAmount('wash-bottle', 'beaker-100', 50)
  runPour()
  assert.ok(Math.abs(benchVolumeMl(store(), 'beaker-100') - 50) < 1e-9)
  assert.equal(benchTemperatureC(store(), 'beaker-100'), 22)

  heat(5)
  assert.equal(benchTemperatureC(store(), 'beaker-100'), 22, 'unlit burner does nothing')
  assert.ok(store().setLit('bunsen-burner', true))
  assert.ok(!store().setLit('beaker-100', true), 'only heat sources can be lit')
  heat(10)
  const warm = benchTemperatureC(store(), 'beaker-100')
  assert.ok(warm > 45 && warm < 60, `about 3.2 °C/s for 10 s (got ${warm.toFixed(1)})`)
  assert.equal(benchTemperatureC(store(), 'wash-bottle'), 22, 'the bottle on the bench stays cool')

  heat(40)
  assert.equal(benchTemperatureC(store(), 'beaker-100'), 100, 'held at the boiling point')
  const before = benchVolumeMl(store(), 'beaker-100')
  heat(10)
  const after = benchVolumeMl(store(), 'beaker-100')
  assert.ok(before - after > 2, `boiling evaporates water (${(before - after).toFixed(2)} mL)`)
  assert.ok(
    useReactionEffectsStore.getState().effects[effectKey('beaker-100', 'gas')],
    'boiling shows bubbles and steam (engine evaporated event → gas effect)',
  )

  store().setLit('bunsen-burner', false)
  heat(30)
  const cooled = benchTemperatureC(store(), 'beaker-100')
  assert.ok(cooled < 100 && cooled > 22, `cooling towards room temperature (${cooled.toFixed(1)})`)
  assert.equal(benchVolumeMl(store(), 'beaker-100'), after, 'no boiling once the flame is off')
})

test('hot items cannot be handled: lit burner, tripod over a flame, vessel at 50 °C or more', () => {
  const temps = { 'beaker-100': 80, 'erlenmeyer-flask': 30 }
  const t = (id) => temps[id] ?? null
  assert.match(hotTouchReason('bunsen-burner', RIG, ['bunsen-burner'], t), /burner is lit/)
  assert.match(hotTouchReason('tripod', RIG, ['bunsen-burner'], t), /tripod/)
  assert.equal(hotTouchReason('tripod', RIG, [], t), null, 'cold tripod is fine')
  assert.match(hotTouchReason('beaker-100', RIG, [], t), /80 °C/)
  assert.equal(hotTouchReason('erlenmeyer-flask', RIG, [], t), null)
  assert.equal(HOT_TOUCH_C, 50)

  store().reset()
  store().sync(['tripod', 'bunsen-burner', 'beaker-100'])
  store().setLit('bunsen-burner', true)
  assert.ok(store().checkHotTouch('bunsen-burner', RIG))
  assert.equal(store().hotTouch.itemId, 'bunsen-burner')
  assert.equal(store().hotTouch.seq, 1)
  assert.ok(!store().checkHotTouch('beaker-100', RIG), 'empty beaker just placed is still cool')
  store().dismissHotTouch()
  assert.equal(store().hotTouch, null)
  // Removing a lit burner from the bench puts it out.
  store().sync(['tripod', 'beaker-100'])
  assert.deepEqual(store().lit, [])
})

test('temperature-dependent reactions use the engine conditions with bench heating', () => {
  const definition = {
    schemaVersion: 1,
    ambientTemperatureC: 22,
    coolingPerSecond: 0.02,
    substances: [
      {
        id: 'water',
        name: 'Water',
        formula: 'H₂O',
        state: 'liquid',
        color: '#d5e9e9',
        densityGPerMl: 1,
        boilingPointC: 100,
      },
      { id: 'a', name: 'A', formula: 'A', state: 'aqueous', color: '#ffffff' },
      { id: 'b', name: 'B', formula: 'B', state: 'aqueous', color: '#3050ff' },
    ],
    containers: [
      {
        id: 'beaker-100',
        label: 'Beaker',
        equipmentId: 'beaker-100',
        capacity: { value: 100, unit: 'mL' },
        accepts: ['liquid', 'aqueous'],
        open: true,
      },
    ],
    processes: [],
    reactions: [
      {
        id: 'warm-only',
        label: 'Needs 60 °C',
        reactants: [{ substanceId: 'a', amount: 1 }],
        products: [{ substanceId: 'b', amount: 1 }],
        ratePerSecond: 1,
        conditions: { minTemperatureC: 60 },
        effects: ['colorChange'],
        observation: 'Turns blue when hot.',
      },
    ],
  }
  let lab = {
    timeS: 0,
    containers: { 'beaker-100': { temperatureC: 22, contents: { water: 50, a: 5 } } },
  }
  const step = (lit) => {
    const heating = heatingConditions(['beaker-100'], RIG, lit, () => 50)
    const result = simulateTick(definition, lab, 0.5, { heatingCPerSecond: heating })
    lab = result.state
    return result.events
  }
  for (let i = 0; i < 10; i++) step([])
  assert.equal(lab.containers['beaker-100'].contents.a, 5, 'cold: no reaction')
  let reacted = false
  for (let i = 0; i < 40; i++)
    reacted = step(['bunsen-burner']).some((e) => e.type === 'reacted') || reacted
  assert.ok(reacted, 'reacts once the heated beaker passes 60 °C')
  assert.ok((lab.containers['beaker-100'].contents.a ?? 0) < 5)
})
