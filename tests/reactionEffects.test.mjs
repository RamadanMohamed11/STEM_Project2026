import assert from 'node:assert/strict'
import test from 'node:test'
import {
  simulateTick,
  validateChemistryDefinition,
} from '../src/features/simulations/engine/core/index.ts'
import {
  DEFAULT_EFFECT_COLORS,
  EFFECT_KINDS,
  EXPLOSION_S,
  HOLD_S,
  PARTICLE_BUDGET,
  advanceEffects,
  approachColor,
  effectColor,
  effectKey,
  effectMotion,
  emptyEffects,
  ingestEffectEvents,
  mixHex,
  parseHex,
  particleCount,
} from '../src/features/simulations/lib/reactionEffects.ts'
import {
  EFFECTS_DEMO_CONDITIONS,
  EFFECTS_DEMO_DEFINITION,
  EFFECTS_DEMO_VESSELS,
} from '../src/features/simulations/data/effectsDemoDefinition.ts'
import { useReactionEffectsStore } from '../src/features/simulations/state/useReactionEffectsStore.ts'

const effectEvent = (containerId, effect, intensity = 1, sourceId = 'rule') => ({
  type: 'effect',
  containerId,
  effect,
  intensity,
  sourceId,
})

function run(state, seconds, step = 1 / 30, events = () => []) {
  let next = state
  for (let t = 0; t < seconds; t += step) {
    next = ingestEffectEvents(next, events(t))
    next = advanceEffects(next, step)
  }
  return next
}

test('an effect eases in while events arrive, holds, then fades out and is removed', () => {
  const key = effectKey('flask', 'gas')
  let state = ingestEffectEvents(emptyEffects(), [effectEvent('flask', 'gas', 0.8)])
  assert.equal(state.effects[key].intensity, 0, 'starts invisible')
  state = run(state, 1, 1 / 30, () => [effectEvent('flask', 'gas', 0.8)])
  assert.ok(Math.abs(state.effects[key].intensity - 0.8) < 0.05, 'reaches the event intensity')
  state = run(state, HOLD_S * 0.5)
  assert.ok(state.effects[key].intensity > 0.7, 'held briefly between events')
  state = run(state, 6)
  assert.equal(state.effects[key], undefined, 'gone after events stop')
  // Non-effect events are ignored and leave the state untouched.
  const same = ingestEffectEvents(state, [
    { type: 'hazard', containerId: 'x', hazard: 'h', sourceId: 's' },
  ])
  assert.equal(same, state)
})

test('settled precipitate lingers much longer than a flame', () => {
  let state = emptyEffects()
  state = run(state, 1, 1 / 30, () => [effectEvent('a', 'precipitate'), effectEvent('b', 'flame')])
  state = run(state, 3)
  assert.ok(state.effects[effectKey('a', 'precipitate')], 'precipitate still visible')
  assert.equal(state.effects[effectKey('b', 'flame')], undefined, 'flame already out')
})

test('an explosion is a one-shot burst that is not restarted by events inside it', () => {
  const key = effectKey('tube', 'explosion')
  let state = ingestEffectEvents(emptyEffects(), [effectEvent('tube', 'explosion')])
  assert.equal(state.effects[key].burst, 1)
  assert.equal(state.effects[key].intensity, 1)
  state = run(state, EXPLOSION_S * 0.5, 1 / 30, () => [effectEvent('tube', 'explosion')])
  assert.equal(state.effects[key].burst, 1, 'same burst')
  assert.ok(state.effects[key].intensity < 0.6)
  state = run(state, EXPLOSION_S)
  assert.equal(state.effects[key], undefined, 'burst finished')
  state = ingestEffectEvents(state, [effectEvent('tube', 'explosion')])
  assert.equal(state.effects[key].burst, 1, 'a new burst after it ended starts fresh')
})

test('effect colours come from the reaction products; colourless products use defaults', () => {
  const d = EFFECTS_DEMO_DEFINITION
  assert.equal(effectColor(d, 'precipitate', 'silver-chloride'), '#f4f4ef', 'white AgCl')
  assert.equal(effectColor(d, 'colorChange', 'iron-thiocyanate'), '#a3121c', 'blood-red complex')
  assert.equal(effectColor(d, 'dissolve', 'cuso4-dissolves'), '#2f7fe0', 'blue CuSO₄(aq)')
  assert.equal(effectColor(d, 'flame', 'sodium-flame'), '#ffb21c', 'sodium yellow')
  assert.equal(effectColor(d, 'gas', 'marble-acid'), DEFAULT_EFFECT_COLORS.gas, 'CO₂ colourless')
  assert.equal(effectColor(undefined, 'smoke', 'x'), DEFAULT_EFFECT_COLORS.smoke)
})

test('demo definition is valid and every effect kind is produced by the engine itself', () => {
  assert.deepEqual(validateChemistryDefinition(EFFECTS_DEMO_DEFINITION), [])
  assert.deepEqual(
    [...new Set(EFFECTS_DEMO_VESSELS.map((v) => v.effect))].sort(),
    [...EFFECT_KINDS].sort(),
    'one demo vessel per effect kind',
  )
  const d = EFFECTS_DEMO_DEFINITION
  let lab = {
    timeS: 0,
    containers: Object.fromEntries(
      d.containers.map((c) => [
        c.id,
        {
          temperatureC: 22,
          contents: Object.fromEntries(
            (c.initialContents ?? []).map((e) => [e.substanceId, e.amount]),
          ),
        },
      ]),
    ),
  }
  const seen = new Map()
  let effects = emptyEffects()
  for (let i = 0; i < 300; i++) {
    const result = simulateTick(d, lab, 0.1, EFFECTS_DEMO_CONDITIONS)
    assert.ok(result.ok)
    lab = result.state
    for (const event of result.events)
      if (event.type === 'effect')
        seen.set(event.containerId, [...(seen.get(event.containerId) ?? []), event.effect])
    effects = advanceEffects(ingestEffectEvents(effects, result.events, d), 0.1)
  }
  for (const vessel of EFFECTS_DEMO_VESSELS)
    assert.ok(
      seen.get(vessel.id)?.includes(vessel.effect),
      `${vessel.id} produced ${vessel.effect}`,
    )
  const heat = lab.containers['demo-heat'].temperatureC
  assert.ok(heat > 22, `neutralisation warmed the beaker (${heat.toFixed(1)} °C)`)
})

test('particle counts stay within the budget; reduced motion uses fewer and no shake', () => {
  const full = effectMotion(false)
  const reduced = effectMotion(true)
  assert.equal(full.shake, true)
  assert.equal(reduced.shake, false)
  for (const kind of EFFECT_KINDS) {
    assert.equal(particleCount(kind, 0, full), 0, `${kind} hidden at zero`)
    assert.ok(particleCount(kind, 1, full) <= PARTICLE_BUDGET[kind])
    assert.ok(particleCount(kind, 1, reduced) <= particleCount(kind, 1, full))
  }
  const total = Object.values(PARTICLE_BUDGET).reduce((a, b) => a + b, 0)
  assert.ok(total <= 400, `all effects at once stay under 400 instances (${total})`)
})

test('colour transitions are smooth and converge', () => {
  assert.deepEqual(parseHex('#fff'), [255, 255, 255])
  assert.equal(parseHex('nope'), null)
  assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080')
  let color = '#e8b450'
  const seen = new Set()
  for (let i = 0; i < 60; i++) {
    color = approachColor(color, '#a3121c', 1 / 30)
    seen.add(color)
  }
  assert.ok(seen.size > 20, 'many intermediate colours, not a jump')
  for (let i = 0; i < 300; i++) color = approachColor(color, '#a3121c', 1 / 30)
  assert.equal(color, '#a3121c')
})

test('the effects store ingests engine events and clears per container', () => {
  const store = useReactionEffectsStore.getState
  store().clear()
  store().ingest([effectEvent('a', 'smoke'), effectEvent('b', 'heat')])
  assert.equal(Object.keys(store().effects).length, 2)
  store().tick(0.1)
  assert.ok(store().effects[effectKey('a', 'smoke')].intensity > 0)
  store().clear('a')
  assert.deepEqual(Object.keys(store().effects), [effectKey('b', 'heat')])
  store().clear()
})
