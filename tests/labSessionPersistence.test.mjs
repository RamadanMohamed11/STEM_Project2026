import assert from 'node:assert/strict'
import test, { beforeEach, afterEach } from 'node:test'
import { saltExperimentDefinition as definition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import {
  captureLabSession,
  applyLabSession,
  createLabSessionPersistence,
  labSessionPersistence,
} from '../src/features/simulations/state/labSessionPersistence.ts'
import {
  decodeLabSession,
  labSessionKey,
} from '../src/features/simulations/lib/labSessionSnapshot.ts'
import { useLabSceneStore as scene } from '../src/features/simulations/state/useLabSceneStore.ts'
import {
  useBenchLiquidsStore as bench,
  benchVolumeMl,
} from '../src/features/simulations/state/useBenchLiquidsStore.ts'
import { useSaltSimulationStore as salt } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import { useLabSafetyStore as safety } from '../src/features/simulations/state/useLabSafetyStore.ts'
import { useMeasurementLogStore as log } from '../src/features/simulations/state/useMeasurementLogStore.ts'
import {
  acknowledgeLabSafety,
  handlePhysicalInteraction,
} from '../src/features/simulations/state/directInteractions.ts'
import { restartExperimentSession } from '../src/features/simulations/state/sessionActions.ts'

const id = definition.experimentId
const key = labSessionKey(id)
let persistence
function memory() {
  const data = new Map(),
    writes = []
  return {
    data,
    writes,
    getItem: (k) => data.get(k) ?? null,
    setItem(k, v) {
      data.set(k, v)
      writes.push(k)
    },
    removeItem: (k) => data.delete(k),
  }
}
function clock() {
  let now = 10000,
    n = 0
  const timers = new Map()
  return {
    now: () => now,
    schedule: (fn, delay) => {
      timers.set(++n, { fn, at: now + delay })
      return n
    },
    cancel: (n) => timers.delete(n),
    advance(ms) {
      const until = now + ms
      while (true) {
        const task = [...timers]
          .filter(([, v]) => v.at <= until)
          .sort((a, b) => a[1].at - b[1].at)[0]
        if (!task) break
        now = task[1].at
        timers.delete(task[0])
        task[1].fn()
      }
      now = until
    },
  }
}
function setup(storage = memory()) {
  const time = clock()
  persistence = createLabSessionPersistence({ storage: () => storage, ...time })
  persistence.initialize()
  return { storage, time }
}
function add(...ids) {
  for (const id of ids) assert.ok(scene.getState().addToBench(id), id)
}
function roundTrip() {
  const json = JSON.stringify(captureLabSession(12000))
  const decoded = decodeLabSession(json, id)
  assert.ok(decoded)
  applyLabSession(decoded)
  return decoded
}
beforeEach(() => {
  labSessionPersistence.dispose()
  restartExperimentSession()
  bench.getState().reset()
  safety.getState().setMode('guided')
})
afterEach(() => {
  persistence?.dispose()
  persistence = undefined
  labSessionPersistence.dispose()
  delete globalThis.sessionStorage
})

test('measurement log round trip retains rows/tare/elapsed time and stops transient recording', () => {
  log.getState().begin(id, 1000)
  for (const value of [22, 24])
    log.getState().record(
      {
        instrument: 'thermometer',
        quantity: 'temperature',
        targetId: 'beaker-100',
        targetLabel: 'Beaker',
        value,
      },
      2000,
    )
  log.getState().setTare('digital-balance~2', 45)
  log.getState().startStopwatch(10000)
  log.getState().setOpen(true)
  log.getState().setAutoRecord({ targetId: 'beaker-100', everyS: 1 })
  const expected = roundTrip()
  assert.deepEqual(log.getState().rows, expected.measurements.rows)
  assert.deepEqual(log.getState().tare, expected.measurements.tare)
  assert.deepEqual(log.getState().stopwatch, { running: false, sinceMs: null, accumulatedS: 2 })
  assert.equal(log.getState().autoRecord, null)
  assert.equal(log.getState().open, false)
})
test('safety round trip retains mode/mistake counts without replaying alerts', () => {
  safety.getState().begin(id)
  safety.getState().setMode('free')
  safety.getState().recordHotTouch('beaker-100', 'Too hot to handle.')
  safety.getState().recordHotTouch('beaker-100', 'Too hot to handle.')
  const expected = roundTrip()
  assert.equal(safety.getState().mode, 'free')
  assert.deepEqual(safety.getState().mistakes, expected.safety.mistakes)
  assert.equal(safety.getState().mistakes[0].count, 2)
  assert.equal(safety.getState().alert, null)
})
test('scene round trip retains instances, transforms and snaps, clears selection/history', () => {
  add('wash-bottle', 'beaker-100', 'tripod')
  const s = scene.getState()
  s.snapTo('beaker-100', 'tripod', s.positions.tripod)
  s.rotate('wash-bottle', 1)
  s.select('wash-bottle')
  const expected = roundTrip()
  assert.deepEqual(scene.getState().placedIds, expected.scene.placedIds)
  for (const id of expected.scene.placedIds) {
    assert.deepEqual(scene.getState().positions[id], expected.scene.positions[id])
    assert.equal(scene.getState().rotations[id], expected.scene.rotations[id])
  }
  assert.deepEqual(scene.getState().relationships, expected.scene.relationships)
  assert.equal(scene.getState().selectedId, null)
  assert.deepEqual(scene.getState().past, [])
})
test('bench round trip restores both poured quantities, temperatures and lit burners', () => {
  add('wash-bottle', 'beaker-100', 'bunsen-burner')
  assert.equal(bench.getState().pourAmount('wash-bottle', 'beaker-100', 10), true)
  for (let i = 0; bench.getState().pour && i < 1000; i++) bench.getState().tick(33)
  bench.setState((s) => ({
    lab: {
      ...s.lab,
      containers: {
        ...s.lab.containers,
        'beaker-100': { contents: s.lab.containers['beaker-100'].contents, temperatureC: 42 },
      },
    },
    lit: ['bunsen-burner'],
  }))
  const expected = roundTrip()
  assert.deepEqual(bench.getState().lab, expected.bench.lab)
  assert.deepEqual(bench.getState().lit, ['bunsen-burner'])
  assert.ok(Math.abs(benchVolumeMl(bench.getState(), 'beaker-100') - 10) < 0.1)
  assert.ok(Math.abs(benchVolumeMl(bench.getState(), 'wash-bottle') - 440) < 0.1)
  assert.equal(bench.getState().pour, null)
})
test('salt workflow round trip retains exact evidence, chemistry and checkpoint without advancing', () => {
  assert.equal(acknowledgeLabSafety(), true)
  assert.equal(salt.getState().workflow.stepIndex, 2)
  const expected = roundTrip()
  assert.deepEqual(salt.getState().experiment, expected.salt.experiment)
  assert.deepEqual(salt.getState().workflow, expected.salt.workflow)
  assert.deepEqual(salt.getState().events, expected.salt.events)
  assert.equal(salt.getState().workflow.completed, false)
  assert.equal(salt.getState().effect, null)
})
test('restored Free mode remains paused and returning Guided retains its original step', () => {
  acknowledgeLabSafety()
  safety.getState().setMode('free')
  const workflow = structuredClone(salt.getState().workflow)
  roundTrip()
  assert.equal(salt.getState().dispatch({ kind: 'validate-step' }), false)
  assert.deepEqual(salt.getState().workflow, workflow)
  safety.getState().setMode('guided')
  assert.deepEqual(salt.getState().workflow, workflow)
})

test('a restored transfer reserves receipt identities and the real workflow can finish', () => {
  acknowledgeLabSafety()
  add('water', 'graduated-cylinder', 'sodium-chloride', 'spatula', 'weighing-boat', 'stirring-rod')
  const transfer = (sourceId, targetId, materialId, amount, requestId) => {
    const result = salt.getState().beginTransfer({
      sourceId,
      targetId,
      materialId,
      amount,
      unit: materialId === 'water' ? 'mL' : 'g',
      requestId,
    })
    assert.equal(result.ok, true, result.message)
    for (let n = 0; salt.getState().transfer && n < 1000; n++) salt.getState().advanceTransfer(250)
    assert.equal(salt.getState().transfer, null)
  }
  transfer('water', 'graduated-cylinder', 'water', 100, 'i3-first-water')
  const first = salt.getState().events.find((e) => e.type === 'MATERIAL_TRANSFER_COMPLETED')
  roundTrip()
  assert.equal(salt.getState().workflow.stepIndex, 3)
  assert.equal(
    salt.getState().beginTransfer({
      sourceId: 'water',
      targetId: 'graduated-cylinder',
      materialId: 'water',
      amount: 100,
      unit: 'mL',
      requestId: 'i3-first-water',
    }).ok,
    false,
  )
  transfer('graduated-cylinder', 'beaker', 'water', 100, 'i3-second-water')
  const second = salt
    .getState()
    .events.filter((e) => e.type === 'MATERIAL_TRANSFER_COMPLETED')
    .at(-1)
  assert.ok(
    Number(second.operationId.split('-').at(-1)) > Number(first.operationId.split('-').at(-1)),
  )
  assert.ok(second.sequence > first.sequence)
  transfer('sodium-chloride', 'spatula', 'NaCl', 5, 'i3-scoop')
  transfer('spatula', 'weighing-boat', 'NaCl', 5, 'i3-deposit')
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    true,
  )
  transfer('weighing-boat', 'beaker', 'NaCl', 5, 'i3-salt')
  for (let n = 0; n < 2; n++) {
    assert.equal(
      salt.getState().execute({ kind: 'stir', tool: 'stirring-rod', target: 'beaker' }),
      true,
    )
    if (salt.getState().effect) salt.getState().stopEffect(salt.getState().effect.id)
  }
  assert.equal(salt.getState().emit({ type: 'REVIEW_INSPECTED' }), true)
  assert.equal(salt.getState().workflow.completed, true)
  const expected = roundTrip()
  assert.equal(salt.getState().workflow.completed, true)
  assert.deepEqual(salt.getState().workflow, expected.salt.workflow)
})
test('in-flight guided transfer is stopped, quantities retained, no fabricated receipt or completion', () => {
  acknowledgeLabSafety()
  add('water', 'graduated-cylinder')
  assert.equal(
    salt.getState().beginTransfer({
      requestId: 'i3-interrupted',
      sourceId: 'water',
      targetId: 'graduated-cylinder',
      amount: 100,
      materialId: 'water',
      unit: 'mL',
    }).ok,
    true,
  )
  salt.getState().advanceTransfer(200)
  const before = structuredClone(salt.getState().experiment)
  roundTrip()
  assert.equal(salt.getState().transfer, null)
  assert.deepEqual(salt.getState().experiment, before)
  assert.match(salt.getState().guidedResumeIssue, /Reset the experiment/)
  assert.equal(salt.getState().workflow.stepIndex, 2)
  assert.equal(salt.getState().workflow.completed, false)
})
test('schema mismatch, definition mismatch, foreign experiment and corrupt JSON discard the entire entry', () => {
  const snapshot = captureLabSession()
  for (const json of [
    '{oops',
    'null',
    '[]',
    JSON.stringify({ ...snapshot, version: 0 }),
    JSON.stringify({ ...snapshot, definitionVersion: '0' }),
    JSON.stringify({ ...snapshot, coreVersion: '0' }),
    JSON.stringify({ ...snapshot, experimentId: 'other' }),
  ]) {
    assert.equal(decodeLabSession(json, id), null)
    const storage = memory()
    storage.data.set(key, json)
    const { time } = setup(storage)
    assert.equal(salt.getState().workflow.stepIndex, 0)
    assert.equal(log.getState().rows.length, 0)
    assert.equal(storage.data.has(key), false)
    assert.equal(persistence.wasRestored(), false)
    time.advance(2000)
    assert.equal(storage.data.has(key), false)
    persistence.dispose()
  }
})
test('invalid nested values, unknown vessels, cycles, over-capacity liquids and false completion are rejected', () => {
  add('wash-bottle', 'beaker-100')
  const snapshot = captureLabSession()
  const invalid = [
    (s) => {
      s.measurements.rows = [{ id: 'x' }]
    },
    (s) => {
      s.safety.mode = 'invalid'
    },
    (s) => {
      s.salt.workflow.stepIndex = 1000
    },
    (s) => {
      s.salt.workflow.completed = true
    },
    (s) => {
      s.salt.experiment.waterMl.water = -1
    },
    (s) => {
      s.scene.placedIds.push('unknown')
    },
    (s) => {
      s.scene.positions['wash-bottle'].x = 999
    },
    (s) => {
      s.bench.lab.containers['wash-bottle'].temperatureC = null
    },
    (s) => {
      s.bench.lab.containers['wash-bottle'].contents.water = 501
    },
    (s) => {
      s.bench.lit = ['beaker-100']
    },
    (s) => {
      s.scene.relationships = {
        'wash-bottle': { actorId: 'wash-bottle', targetId: 'beaker-100', kind: 'snapped' },
        'beaker-100': { actorId: 'beaker-100', targetId: 'wash-bottle', kind: 'snapped' },
      }
    },
  ]
  for (const mutate of invalid) {
    const s = structuredClone(snapshot)
    mutate(s)
    assert.equal(decodeLabSession(JSON.stringify(s), id), null)
  }
})
test('JSON cannot overwrite store action functions with injected properties', () => {
  const snapshot = captureLabSession()
  snapshot.scene.resetBench = null
  snapshot.salt.reset = null
  snapshot.safety.clear = null
  const loaded = decodeLabSession(JSON.stringify(snapshot), id)
  assert.ok(loaded)
  applyLabSession(loaded)
  assert.equal(typeof scene.getState().resetBench, 'function')
  assert.equal(typeof salt.getState().reset, 'function')
  assert.equal(typeof safety.getState().clear, 'function')
})
test('continuous updates save at most once per second; UI-only changes never write', () => {
  const { storage, time } = setup()
  log.getState().setOpen(true)
  scene.getState().select('beaker')
  safety.getState().dismissAlert()
  time.advance(1000)
  assert.equal(storage.writes.length, 0)
  add('wash-bottle')
  time.advance(0)
  assert.equal(storage.writes.length, 1)
  for (let i = 0; i < 99; i++) {
    bench.getState().react(10)
    bench.setState((s) => ({ lab: { ...s.lab, timeS: s.lab.timeS + 0.01 } }))
    persistence.flush()
    time.advance(10)
  }
  assert.equal(storage.writes.length, 1)
  time.advance(10)
  assert.equal(storage.writes.length, 2)
})
test('Reset bench removes the saved copy and cancels pending writes; blocked hot reset retains it', () => {
  const { storage, time } = setup()
  add('wash-bottle')
  time.advance(0)
  bench.setState((s) => ({
    lab: {
      ...s.lab,
      containers: { 'wash-bottle': { contents: { water: 450 }, temperatureC: 70 } },
    },
  }))
  scene.getState().resetBench()
  assert.equal(storage.data.has(key), true)
  bench.setState((s) => ({
    lab: {
      ...s.lab,
      containers: { 'wash-bottle': { contents: { water: 450 }, temperatureC: 22 } },
    },
  }))
  scene.getState().resetBench()
  assert.equal(storage.data.has(key), false)
  time.advance(2000)
  assert.equal(storage.data.has(key), false)
})

test('a running stopwatch is checkpointed at 1 Hz even on an otherwise idle bench', () => {
  const { storage, time } = setup()
  log.getState().startStopwatch(time.now())
  time.advance(0)
  assert.equal(storage.writes.length, 1)
  time.advance(3500)
  assert.equal(storage.writes.length, 4)
  assert.equal(JSON.parse(storage.data.get(key)).measurements.elapsedS, 3)
  log.getState().stopStopwatch(time.now())
  time.advance(500)
  assert.equal(JSON.parse(storage.data.get(key)).measurements.elapsedS, 3.5)
  const count = storage.writes.length
  time.advance(3000)
  assert.equal(storage.writes.length, count)
})
test('Reset experiment clears storage and does not resurrect the old pending checkpoint', () => {
  const storage = memory()
  globalThis.sessionStorage = storage
  labSessionPersistence.initialize()
  acknowledgeLabSafety()
  labSessionPersistence.flush()
  assert.equal(storage.data.has(key), true)
  safety.getState().recordHotTouch('beaker', 'Hot')
  restartExperimentSession()
  labSessionPersistence.flush()
  assert.equal(storage.data.has(key), false)
  assert.equal(salt.getState().workflow.stepIndex, 0)
})
test('storage getter, reads, quota writes and removes may all throw without breaking the lab', () => {
  for (const storage of [
    () => {
      throw Error('denied')
    },
    () => ({
      getItem() {
        throw Error('denied')
      },
      setItem() {
        throw Error('quota')
      },
      removeItem() {
        throw Error('denied')
      },
    }),
  ]) {
    const time = clock()
    persistence = createLabSessionPersistence({ storage, ...time })
    assert.doesNotThrow(() => persistence.initialize())
    add('wash-bottle')
    assert.doesNotThrow(() => time.advance(1000))
    assert.doesNotThrow(() => persistence.clear())
    persistence.dispose()
  }
})
test('storage is isolated by experiment ID and a valid restored notice can be dismissed', () => {
  const storage = memory()
  acknowledgeLabSafety()
  storage.data.set(labSessionKey('other'), JSON.stringify(captureLabSession()))
  setup(storage)
  assert.equal(persistence.wasRestored(), false)
  persistence.dispose()
  storage.data.set(key, JSON.stringify(captureLabSession()))
  setup(storage)
  assert.equal(persistence.wasRestored(), true)
  let notices = 0
  const unsub = persistence.subscribe(() => notices++)
  persistence.dismiss()
  assert.equal(persistence.wasRestored(), false)
  assert.equal(notices, 1)
  unsub()
  assert.equal(storage.data.has(labSessionKey('other')), true)
})
