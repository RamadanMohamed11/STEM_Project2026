import assert from 'node:assert/strict'
import test, { beforeEach } from 'node:test'
import {
  useLabSceneStore as scene,
  MAX_BENCH_HISTORY,
} from '../src/features/simulations/state/useLabSceneStore.ts'
import {
  useBenchLiquidsStore as liquids,
  benchVolumeMl,
} from '../src/features/simulations/state/useBenchLiquidsStore.ts'
import { useLabSafetyStore as safety } from '../src/features/simulations/state/useLabSafetyStore.ts'
import { HOT_TOUCH_C } from '../src/features/simulations/lib/benchHeating.ts'
import { useSaltSimulationStore as salt } from '../src/features/simulations/state/useSaltSimulationStore.ts'

const s = scene.getState
const b = liquids.getState
const volume = (id) => benchVolumeMl(b(), id)
const total = () => b().ids.reduce((sum, id) => sum + volume(id), 0) + b().spilledTotalMl
const close = (a, b) => assert.ok(Math.abs(a - b) < 0.1, `${a} differs from ${b}`)
function pour(source = 'wash-bottle', target = 'beaker-100', ml = 10) {
  assert.equal(b().pourAmount(source, target, ml), true)
  for (let i = 0; b().pour && i < 2000; i++) b().tick(33)
  assert.equal(b().pour, null)
}
function temperature(id, value) {
  liquids.setState((state) => ({
    lab: {
      ...state.lab,
      containers: {
        ...state.lab.containers,
        [id]: { ...state.lab.containers[id], temperatureC: value },
      },
    },
  }))
}
beforeEach(() => {
  s().resetEquipment()
  b().reset()
  safety.getState().clear()
  for (const id of ['wash-bottle', 'beaker-100', 'test-tube', 'dropper'])
    assert.ok(s().addToBench(id))
})

test('undo/redo of removal restores substances, amounts and temperature, without overwriting another vessel', () => {
  pour()
  // A dissolved solute is stored alongside the solvent, not just a volume scalar.
  liquids.setState((state) => ({
    lab: {
      ...state.lab,
      containers: {
        ...state.lab.containers,
        'beaker-100': { temperatureC: 34, contents: { water: 10, 'hydrochloric-acid': 1 } },
      },
    },
  }))
  const expected = structuredClone(b().lab.containers['beaker-100'])
  s().removeFromBench('beaker-100')
  assert.equal(b().lab.containers['beaker-100'], undefined)
  assert.deepEqual(Object.keys(s().past.at(-1).liquids.containers), ['beaker-100'])
  temperature('test-tube', 31)
  assert.equal(s().undo(), true)
  assert.deepEqual(b().lab.containers['beaker-100'], expected)
  assert.equal(b().lab.containers['test-tube'].temperatureC, 31)
  assert.equal(s().redo(), true)
  assert.equal(b().lab.containers['beaker-100'], undefined)
  assert.equal(s().undo(), true)
  assert.deepEqual(b().lab.containers['beaker-100'], expected)
})

test('undo/redo of a pour restores both vessels and temperature and conserves volume to 0.1 mL', () => {
  temperature('wash-bottle', 37)
  const before = structuredClone(b().lab.containers),
    initial = total()
  const count = s().past.length
  pour('wash-bottle', 'beaker-100', 23.4)
  const after = structuredClone(b().lab.containers)
  assert.equal(s().past.length, count + 1, 'one entry for an animated pour, not one per frame')
  assert.deepEqual(Object.keys(s().past.at(-1).liquids.containers).sort(), [
    'beaker-100',
    'wash-bottle',
  ])
  close(total(), initial)
  assert.equal(s().undo(), true)
  assert.deepEqual(b().lab.containers, before)
  close(total(), initial)
  assert.equal(s().redo(), true)
  assert.deepEqual(b().lab.containers, after)
  close(total(), initial)
  assert.equal(s().undo(), true)
  close(total(), initial)
})

test('undo restores a used stock bottle atomically without a transient refill', () => {
  pour()
  s().removeFromBench('wash-bottle')
  const observed = []
  const unsubscribe = liquids.subscribe(() => observed.push(total()))
  assert.equal(s().undo(), true)
  unsubscribe()
  assert.ok(observed.length > 0)
  for (const amount of observed) close(amount, 450)
  close(volume('wash-bottle'), 440)
})

test('spilled liquid is restored with its pour so undo/redo cannot create spill or water', () => {
  const initial = total()
  pour('wash-bottle', 'test-tube', 50)
  assert.ok(b().spilledTotalMl > 0)
  const spilled = b().spilledTotalMl
  close(total(), initial)
  assert.equal(s().undo(), true)
  assert.equal(b().spilledTotalMl, 0)
  assert.equal(volume('test-tube'), 0)
  close(total(), initial)
  assert.equal(s().redo(), true)
  close(b().spilledTotalMl, spilled)
  close(total(), initial)
})

test('dropper fill and drops share the timeline and restore both inventories', () => {
  const initial = total()
  assert.equal(b().fillDropper('wash-bottle', 'dropper'), true)
  assert.equal(b().addDrop('dropper', 'test-tube'), true)
  const after = structuredClone(b().lab.containers)
  close(volume('dropper'), 0.95)
  assert.equal(s().undo(), true)
  close(volume('dropper'), 1)
  assert.equal(volume('test-tube'), 0)
  assert.equal(s().undo(), true)
  assert.equal(volume('dropper'), 0)
  assert.equal(s().redo(), true)
  assert.equal(s().redo(), true)
  assert.deepEqual(b().lab.containers, after)
  close(total(), initial)
})

test('hot item blocks undo and redo without changing either history pointer or the physical state', () => {
  s().rotate('beaker-100', 1)
  temperature('beaker-100', HOT_TOUCH_C)
  const past = s().past,
    future = s().future,
    layout = s().rotations
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, past)
  assert.strictEqual(s().future, future)
  assert.strictEqual(s().rotations, layout)
  assert.equal(b().hotTouch.itemId, 'beaker-100')
  assert.ok(safety.getState().mistakes.some((entry) => entry.key === 'hot-touch:beaker-100'))
  temperature('beaker-100', HOT_TOUCH_C - 0.1)
  assert.equal(s().undo(), true)
  temperature('beaker-100', 80)
  const blockedPast = s().past,
    blockedFuture = s().future
  assert.equal(s().redo(), false)
  assert.strictEqual(s().past, blockedPast)
  assert.strictEqual(s().future, blockedFuture)
  temperature('beaker-100', 22)
  assert.equal(s().redo(), true)
})

test('hot vessel blocks pour undo and undo of its placement; hot snapped children also block holder moves', () => {
  pour()
  temperature('beaker-100', 65)
  const past = s().past
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, past)
  close(volume('beaker-100'), 10)
  temperature('beaker-100', 22)
  assert.equal(s().undo(), true)
  assert.ok(s().addToBench('tripod'))
  s().setRelationship({ actorId: 'beaker-100', targetId: 'tripod', kind: 'snapped' })
  const at = s().positions.tripod
  s().beginDrag('tripod')
  s().move('tripod', { x: at.x + 0.04, z: at.z })
  s().finishDrag()
  temperature('beaker-100', 90)
  const move = s().past
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, move)
  assert.equal(b().hotTouch.itemId, 'beaker-100')
})

test('history turns off a stationary burner when its vessel is undone and never automatically relights it', () => {
  assert.ok(s().addToBench('tripod'))
  assert.ok(s().addToBench('bunsen-burner'))
  s().setRelationship({ actorId: 'bunsen-burner', targetId: 'tripod', kind: 'snapped' })
  s().removeFromBench('test-tube')
  assert.ok(s().addToBench('test-tube'))
  s().setRelationship({ actorId: 'test-tube', targetId: 'tripod', kind: 'snapped' })
  assert.equal(b().setLit('bunsen-burner', true, s().relationships), true)
  assert.equal(
    s().undo(),
    true,
    'the cold vessel can be removed while the burner remains stationary',
  )
  assert.deepEqual(b().lit, [])
  assert.equal(s().redo(), true)
  assert.deepEqual(b().lit, [], 'restoring a heater layout cannot ignite fuel')
  b().setLit('bunsen-burner', true, s().relationships)
  s().rotate('dropper', 1)
  assert.equal(s().undo(), true, 'unrelated history must not extinguish a valid setup')
  assert.deepEqual(b().lit, ['bunsen-burner'])
})

test('lit burners and their tripods block undo/redo just like direct handling', () => {
  for (const id of ['tripod', 'bunsen-burner']) assert.ok(s().addToBench(id))
  s().rotate('bunsen-burner', 1)
  s().setRelationship({ actorId: 'bunsen-burner', targetId: 'tripod', kind: 'snapped' })
  b().setLit('bunsen-burner', true, s().relationships)
  const past = s().past
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, past)
  assert.equal(b().hotTouch.itemId, 'bunsen-burner')
  b().setLit('bunsen-burner', false)
  s().rotate('tripod', 1)
  b().setLit('bunsen-burner', true, s().relationships)
  const holderPast = s().past
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, holderPast)
  assert.equal(b().hotTouch.itemId, 'tripod')
})

test('undo cannot remove a hot newly placed vessel, nor can redo remove a restored hot vessel', () => {
  assert.ok(s().addToBench('erlenmeyer-flask'))
  temperature('erlenmeyer-flask', 50)
  const past = s().past
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, past)
  assert.ok(s().placedIds.includes('erlenmeyer-flask'))
  temperature('erlenmeyer-flask', 32)
  s().removeFromBench('erlenmeyer-flask')
  assert.equal(s().undo(), true)
  temperature('erlenmeyer-flask', 60)
  const future = s().future
  assert.equal(s().redo(), false)
  assert.strictEqual(s().future, future)
  assert.ok(s().placedIds.includes('erlenmeyer-flask'))
})

test('unrecorded evaporation cannot be reversed by a stale pour entry and recreate material', () => {
  pour()
  const past = s().past
  liquids.setState((state) => ({
    lab: {
      ...state.lab,
      containers: {
        ...state.lab.containers,
        'beaker-100': { contents: { water: 9 }, temperatureC: 22 },
      },
    },
  }))
  const initial = total()
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, past)
  close(total(), initial)
  assert.match(s().feedback, /liquid changed/i)
})

test('evaporation during a pour cannot be recreated by undo even after the heater is turned off and the vessels cool', () => {
  for (const id of ['tripod', 'bunsen-burner']) assert.ok(s().addToBench(id))
  const rig = {
    'beaker-100': { actorId: 'beaker-100', targetId: 'tripod', kind: 'snapped' },
    'bunsen-burner': { actorId: 'bunsen-burner', targetId: 'tripod', kind: 'snapped' },
  }
  scene.setState({ relationships: rig })
  liquids.setState((state) => ({
    lab: {
      ...state.lab,
      containers: {
        ...state.lab.containers,
        'wash-bottle': { contents: { water: 440 }, temperatureC: 99.9 },
        'beaker-100': { contents: { water: 10 }, temperatureC: 99.9 },
      },
    },
  }))
  const initial = total()
  b().setLit('bunsen-burner', true, rig)
  assert.equal(b().pourAmount('wash-bottle', 'beaker-100', 20), true)
  for (let i = 0; b().pour && i < 2000; i++) {
    b().tick(33)
    if (b().pour?.remainingMl === 0) b().setLit('bunsen-burner', false, rig)
    b().react(33, rig)
  }
  b().setLit('bunsen-burner', false, rig)
  for (
    let i = 0;
    i < 2000 &&
    Math.max(
      b().lab.containers['wash-bottle'].temperatureC,
      b().lab.containers['beaker-100'].temperatureC,
    ) >= HOT_TOUCH_C;
    i++
  )
    b().react(250, rig)
  const after = total(),
    past = s().past
  assert.ok(initial - after > 0.1, 'real engine evaporation occurred during the pour')
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, past)
  close(total(), after)
  assert.match(s().feedback, /material changed during the pour/i)
})

test('waste-bin removal and bench reset restore only removed vessel contents; layout moves never rewind liquids', () => {
  pour()
  const filled = structuredClone(b().lab.containers['beaker-100'])
  const at = { ...s().positions['beaker-100'] }
  s().beginDrag('beaker-100')
  s().dropInWasteBin('beaker-100')
  assert.equal(s().undo(), true)
  assert.deepEqual(s().positions['beaker-100'], at)
  assert.deepEqual(b().lab.containers['beaker-100'], filled)
  s().resetBench()
  assert.equal(s().undo(), true)
  assert.deepEqual(b().lab.containers['beaker-100'], filled)
  s().rotate('beaker-100', 1)
  temperature('beaker-100', 40)
  assert.equal(s().undo(), true)
  assert.equal(
    b().lab.containers['beaker-100'].temperatureC,
    40,
    'layout-only moves do not rewind thermal time',
  )
})

test('history remains bounded, new pours clear redo and active pours lock undo', () => {
  for (let i = 0; i < 25; i++) pour('wash-bottle', 'beaker-100', 1)
  assert.equal(s().past.length, MAX_BENCH_HISTORY)
  assert.equal(s().undo(), true)
  assert.equal(s().future.length, 1)
  pour('wash-bottle', 'test-tube', 1)
  assert.equal(s().future.length, 0)
  assert.equal(b().pourAmount('wash-bottle', 'test-tube', 1), true)
  const past = s().past
  assert.equal(s().undo(), false)
  assert.strictEqual(s().past, past)
})

test('practice history never touches the guided salt chemistry, workflow or validated receipts', () => {
  const before = salt.getState()
  pour()
  s().undo()
  s().redo()
  assert.strictEqual(salt.getState().experiment, before.experiment)
  assert.strictEqual(salt.getState().workflow, before.workflow)
  assert.strictEqual(salt.getState().events, before.events)
})
