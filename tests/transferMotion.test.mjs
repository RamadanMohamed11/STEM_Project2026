import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { Group, Vector3 } from 'three'
import { initialSaltExperimentState } from '../src/features/simulations/engine/saltExperiment.ts'
import { saltExperimentDefinition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import { useSaltSimulationStore as authorityStore } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import { useLabSceneStore as labStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { acknowledgeLabSafety } from '../src/features/simulations/state/directInteractions.ts'
import {
  advanceTransferOperation,
  cancelTransferOperation,
} from '../src/features/simulations/engine/materialTransfers.ts'
import {
  getTransferEquipmentPose,
  getTransferFlowProgress,
  getTransferMovingEquipmentId,
  TRANSFER_LIFT_END,
  TRANSFER_TRAVEL_END,
  TRANSFER_TRAVEL_CLEARANCE,
} from '../src/features/simulations/three/transferMotion.ts'
import {
  PIVOT_HEIGHT,
  POUR_CLEARANCE,
  RECEIVER_RIM_HEIGHTS,
  SALT_JAR_RIM_HEIGHT,
  SPATULA_SPOON_CENTER,
} from '../src/features/simulations/three/equipmentPose.ts'
import {
  readEquipmentPointWorld,
  readOutletWorld,
  readSpatulaSpoonWorld,
  registerVisualAnchor,
  visualAnchors,
} from '../src/features/simulations/three/equipmentVisualAnchors.ts'

const HOME = { x: 0, y: 0.42, z: 0, rotationX: 0, rotationZ: 0 }
const positions = Object.freeze({
  water: Object.freeze({ x: -2.5, z: -1 }),
  'graduated-cylinder': Object.freeze({ x: 2.1, z: 0.9 }),
  beaker: Object.freeze({ x: -0.9, z: 0.7 }),
  'sodium-chloride': Object.freeze({ x: 2.5, z: 1 }),
  spatula: Object.freeze({ x: 1.3, z: -0.7 }),
  'weighing-boat': Object.freeze({ x: -1.6, z: -0.8 }),
})
const rotations = Object.freeze({
  water: 0.8,
  'graduated-cylinder': -0.4,
  beaker: 1.3,
  'sodium-chloride': 0.2,
  spatula: -1.2,
  'weighing-boat': 2.4,
})
const routes = [
  { sourceId: 'water', targetId: 'graduated-cylinder', kind: 'liquid', method: 'pour' },
  { sourceId: 'graduated-cylinder', targetId: 'beaker', kind: 'liquid', method: 'pour' },
  { sourceId: 'beaker', targetId: 'graduated-cylinder', kind: 'liquid', method: 'pour' },
  { sourceId: 'sodium-chloride', targetId: 'spatula', kind: 'solid', method: 'scoop' },
  { sourceId: 'spatula', targetId: 'weighing-boat', kind: 'solid', method: 'deposit' },
  { sourceId: 'weighing-boat', targetId: 'beaker', kind: 'solid', method: 'pour' },
]

function operation(overrides = {}) {
  const solid = overrides.kind === 'solid'
  return {
    operationId: 'motion-1',
    requestId: 'request-1',
    ...routes[0],
    materialId: solid ? 'NaCl' : 'water',
    amount: solid ? 1 : 10,
    transferred: 0,
    unit: solid ? 'g' : 'mL',
    elapsedMs: 0,
    durationMs: 3000,
    approachMs: 600,
    flowMs: 1800,
    returnMs: 600,
    cancelled: false,
    beforeChemistry: initialSaltExperimentState(),
    stepId: 'measure-water',
    sessionRevision: 0,
    ...overrides,
  }
}
function pose(op, id = getTransferMovingEquipmentId(op), p = positions, r = rotations, homeOffset) {
  return getTransferEquipmentPose(op, id, p, r, homeOffset)
}
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)
}
function closePose(a, b) {
  for (const key of Object.keys(HOME)) close(a[key], b[key])
}
function pivotFor(id, value) {
  const root = new Group()
  root.position.set(positions[id].x, 0.78, positions[id].z)
  root.rotation.y = rotations[id]
  const pivot = new Group()
  pivot.position.set(value.x, value.y, value.z)
  pivot.rotation.set(value.rotationX, 0, value.rotationZ, 'XYZ')
  root.add(pivot)
  registerVisualAnchor(id, pivot)
  return pivot
}

afterEach(() => visualAnchors.clear())

test('public operation methods choose the moving equipment, not always the source jar', () => {
  for (const route of routes) {
    const op = operation(route)
    const moving = route.method === 'scoop' ? 'spatula' : route.sourceId
    assert.equal(getTransferMovingEquipmentId(op), moving)
    for (const id of Object.keys(positions)) {
      assert.equal(pose(op, id) !== null, id === moving, `${route.method}: ${id}`)
    }
  }
  assert.equal(getTransferEquipmentPose(null, 'water', positions, rotations), null)
})

test('all mechanisms start and finish at the exact pivot home without moving domain positions', () => {
  const original = structuredClone(positions)
  for (const route of routes) {
    const op = operation(route)
    assert.deepEqual(pose(op), HOME)
    assert.deepEqual(pose({ ...op, elapsedMs: op.durationMs }), HOME)
    assert.deepEqual(pose({ ...op, elapsedMs: op.durationMs + 100 }), HOME)
  }
  assert.deepEqual(positions, original)
})

test('optional home offset changes only rest/travel, not the stationary working pose', () => {
  for (const route of routes) {
    const op = operation(route)
    for (const offset of [
      Object.freeze({ x: 0.17, y: 0.208, z: -0.11 }),
      Object.freeze({ x: -0.23, y: 2, z: 0.31 }),
    ]) {
      const sample = (elapsedMs) =>
        pose({ ...op, elapsedMs }, undefined, positions, rotations, offset)
      const expectedHome = { ...HOME, x: offset.x, y: PIVOT_HEIGHT + offset.y, z: offset.z }
      assert.deepEqual(sample(0), expectedHome)
      assert.deepEqual(sample(op.durationMs), expectedHome)
      assert.deepEqual(sample(op.durationMs + 100), expectedHome)
      const lifted = sample(op.approachMs * 0.1)
      close(lifted.x, offset.x)
      close(lifted.z, offset.z)
      assert.ok(lifted.y > expectedHome.y)
      for (const progress of [TRANSFER_LIFT_END, 0.5, TRANSFER_TRAVEL_END]) {
        const travelling = sample(op.approachMs * progress)
        assert.ok(travelling.y >= expectedHome.y + TRANSFER_TRAVEL_CLEARANCE - 1e-8)
        assert.ok(travelling.y >= PIVOT_HEIGHT + 1.115 + TRANSFER_TRAVEL_CLEARANCE - 1e-8)
        close(travelling.rotationX, 0)
        close(travelling.rotationZ, 0)
        closePose(sample(op.approachMs + op.flowMs + op.returnMs * (1 - progress)), travelling)
      }
      for (const elapsedMs of [600, 1500, 2399.999]) {
        assert.deepEqual(sample(elapsedMs), pose({ ...op, elapsedMs }))
      }
    }
    for (const elapsedMs of [0, 60, 300, 550, 1200, 2550, 2900, 3000]) {
      const current = { ...op, elapsedMs }
      assert.deepEqual(
        pose(current, undefined, positions, rotations, { x: 0, y: 0, z: 0 }),
        pose(current),
      )
    }
  }
})

test('offset-home cancellation retraces the current approach and preserves an existing return', () => {
  const offset = Object.freeze({ x: 0.17, y: 0.208, z: -0.11 })
  const expectedHome = { ...HOME, x: offset.x, y: PIVOT_HEIGHT + offset.y, z: offset.z }
  for (const route of routes) {
    const sample = (op) => pose(op, undefined, positions, rotations, offset)
    for (const elapsedMs of [0, 40, 120, 132, 260, 500, 590, 600, 1500, 2399, 2400, 2550, 2999]) {
      const op = operation({ ...route, elapsedMs })
      const before = sample(op)
      const cancelled = cancelTransferOperation(op)
      closePose(sample(cancelled), before)
      const initialTravel = Math.hypot(before.x - offset.x, before.z - offset.z)
      for (let time = elapsedMs; time < cancelled.durationMs; time += 10) {
        const returning = sample({ ...cancelled, elapsedMs: time })
        assert.ok(Object.values(returning).every(Number.isFinite))
        assert.ok(
          Math.hypot(returning.x - offset.x, returning.z - offset.z) <= initialTravel + 1e-8,
        )
        if (elapsedMs < op.approachMs * TRANSFER_LIFT_END) {
          close(returning.x, offset.x)
          close(returning.z, offset.z)
        }
        if (elapsedMs >= op.approachMs + op.flowMs) {
          closePose(returning, sample({ ...op, elapsedMs: time }))
        }
      }
      assert.deepEqual(sample({ ...cancelled, elapsedMs: cancelled.durationMs }), expectedHome)
    }
  }
})

test('invalid home offsets cannot yield nonfinite poses', () => {
  for (const key of ['x', 'y', 'z']) {
    for (const value of [NaN, Infinity, -Infinity]) {
      const offset = { x: 0, y: 0.208, z: 0, [key]: value }
      assert.equal(pose(operation(), undefined, positions, rotations, offset), null)
      assert.equal(
        pose(operation({ elapsedMs: 1500 }), undefined, positions, rotations, offset),
        null,
      )
    }
  }
})

test('pour and reverse-beaker flow hold the true low-side source lip over the target opening', () => {
  for (const route of routes.filter((item) => item.method === 'pour')) {
    const op = operation({ ...route, elapsedMs: 600 })
    const working = pose(op)
    assert.deepEqual(pose({ ...op, elapsedMs: 1500 }), working)
    assert.deepEqual(pose({ ...op, elapsedMs: 2399.999 }), working)
    pivotFor(op.sourceId, working)
    const outlet = readOutletWorld(op.sourceId, positions[op.targetId], new Vector3())
    close(outlet.x, positions[op.targetId].x)
    close(outlet.z, positions[op.targetId].z)
    assert.ok(outlet.y >= 0.78 + RECEIVER_RIM_HEIGHTS[op.targetId] + POUR_CLEARANCE - 1e-8)
  }
})

test('scoop moves the actual spoon bowl into the jar and deposit tips the spoon edge over the boat', () => {
  const scoop = operation({ ...routes[3], elapsedMs: 1200 })
  const scoopPose = pose(scoop)
  assert.equal(pose(scoop, 'sodium-chloride'), null)
  pivotFor('spatula', scoopPose)
  const bowl = readSpatulaSpoonWorld(new Vector3())
  close(bowl.x, positions['sodium-chloride'].x)
  close(bowl.z, positions['sodium-chloride'].z)
  close(bowl.y, 0.78 + SALT_JAR_RIM_HEIGHT - 0.045)
  assert.deepEqual(pose({ ...scoop, elapsedMs: 601 }), scoopPose)
  assert.deepEqual(pose({ ...scoop, elapsedMs: 2399 }), scoopPose)

  const deposit = operation({ ...routes[4], elapsedMs: 1200 })
  const depositPose = pose(deposit)
  pivotFor('spatula', depositPose)
  const edge = readOutletWorld('spatula', positions['weighing-boat'], new Vector3())
  close(edge.x, positions['weighing-boat'].x)
  close(edge.z, positions['weighing-boat'].z)
  close(edge.y, 0.78 + 0.13 + POUR_CLEARANCE)
  assert.notEqual(scoopPose.rotationZ, depositPose.rotationZ)
})

test('travel is lifted, upright, and reversible even for distant non-proximity selections', () => {
  for (const route of routes) {
    const op = operation(route)
    const lifted = pose({ ...op, elapsedMs: op.approachMs * 0.1 })
    close(lifted.x, 0)
    close(lifted.z, 0)
    assert.ok(lifted.y > PIVOT_HEIGHT)
    for (const progress of [TRANSFER_LIFT_END, 0.5, TRANSFER_TRAVEL_END]) {
      const value = pose({ ...op, elapsedMs: op.approachMs * progress })
      assert.ok(value.y - PIVOT_HEIGHT >= 1.115 + TRANSFER_TRAVEL_CLEARANCE - 1e-8)
      close(value.rotationX, 0)
      close(value.rotationZ, 0)
      const returning = pose({
        ...op,
        elapsedMs: op.approachMs + op.flowMs + op.returnMs * (1 - progress),
      })
      closePose(returning, value)
    }
  }
})

test('cancellation during approach and flow has no pose jump and returns from its actual location', () => {
  for (const route of routes) {
    for (const elapsedMs of [0, 40, 120, 132, 260, 500, 590, 600, 1500, 2399]) {
      const op = operation({ ...route, elapsedMs })
      const before = pose(op)
      const cancelled = cancelTransferOperation(op)
      closePose(pose(cancelled), before)
      assert.equal(cancelled.durationMs - cancelled.elapsedMs, op.returnMs)
      const initialTravel = Math.hypot(before.x, before.z)
      for (let time = 0; time <= op.returnMs; time += 10) {
        const value = pose({ ...cancelled, elapsedMs: elapsedMs + time })
        assert.ok(Object.values(value).every(Number.isFinite))
        assert.ok(Math.hypot(value.x, value.z) <= initialTravel + 1e-8)
        if (elapsedMs < op.approachMs * TRANSFER_LIFT_END) {
          close(value.x, 0)
          close(value.z, 0)
        }
      }
      assert.deepEqual(pose({ ...cancelled, elapsedMs: cancelled.durationMs }), HOME)
    }
  }
})

test('cancellation during normal return preserves that path and its remaining time exactly', () => {
  for (const route of routes) {
    for (const elapsedMs of [2400, 2401, 2550, 2750, 2999]) {
      const op = operation({ ...route, elapsedMs })
      const cancelled = cancelTransferOperation(op)
      assert.equal(cancelled.durationMs, op.durationMs)
      for (let time = elapsedMs; time <= op.durationMs; time += 10) {
        closePose(pose({ ...cancelled, elapsedMs: time }), pose({ ...op, elapsedMs: time }))
      }
      assert.deepEqual(pose({ ...cancelled, elapsedMs: cancelled.durationMs }), HOME)
    }
  }
})

test('route stages and cancellation endpoints are continuous', () => {
  for (const route of routes) {
    const op = operation(route)
    for (const time of [0, 132, 468, 600, 2400, 2532, 2868, 3000]) {
      const before = pose({ ...op, elapsedMs: Math.max(0, time - 1e-5) })
      const after = pose({ ...op, elapsedMs: time + 1e-5 })
      for (const key of Object.keys(HOME)) assert.ok(Math.abs(after[key] - before[key]) < 1e-5)
    }
  }
})

test('all methods are covariant under world yaw and independent of operation labels', () => {
  const turn = 1.1
  const rotated = Object.fromEntries(
    Object.entries(positions).map(([id, p]) => [
      id,
      {
        x: Math.cos(turn) * p.x + Math.sin(turn) * p.z,
        z: -Math.sin(turn) * p.x + Math.cos(turn) * p.z,
      },
    ]),
  )
  const rotatedYaw = Object.fromEntries(
    Object.entries(rotations).map(([id, yaw]) => [id, yaw + turn]),
  )
  for (const route of routes) {
    for (const elapsedMs of [60, 300, 550, 1200, 2550, 2900]) {
      const op = operation({ ...route, elapsedMs })
      closePose(pose(op), pose(op, undefined, rotated, rotatedYaw))
      assert.deepEqual(pose({ ...op, operationId: 'replacement' }), pose(op))
    }
  }
})

test('flow is strictly operation-timed and never occurs during approach, return or cancellation', () => {
  const op = operation()
  for (const elapsedMs of [0, 599.999, 2400, 2900, 3000]) {
    assert.equal(getTransferFlowProgress({ ...op, elapsedMs }), null)
  }
  close(getTransferFlowProgress({ ...op, elapsedMs: 600 }), 0)
  close(getTransferFlowProgress({ ...op, elapsedMs: 1500 }), 0.5)
  assert.equal(getTransferFlowProgress(cancelTransferOperation({ ...op, elapsedMs: 1500 })), null)
})

test('invalid data cannot produce nonfinite transforms or invent fallback placements', () => {
  for (const key of ['elapsedMs', 'durationMs', 'approachMs', 'flowMs', 'returnMs']) {
    for (const value of [NaN, Infinity, -1]) {
      const op = operation({ [key]: value })
      assert.equal(pose(op), null)
      assert.equal(getTransferFlowProgress(op), null)
    }
  }
  for (const source of [undefined, { x: NaN, z: 0 }, { x: 0, z: Infinity }]) {
    assert.equal(pose(operation(), 'water', { ...positions, water: source }), null)
  }
  for (const route of routes) {
    const op = operation({ ...route, elapsedMs: 900 })
    const zeroYaw = pose(op, undefined, positions, {})
    assert.ok(Object.values(zeroYaw).every(Number.isFinite))
    assert.deepEqual(
      pose(op, undefined, positions, { [getTransferMovingEquipmentId(op)]: NaN }),
      zeroYaw,
    )
  }
  assert.equal(pose(operation({ sourceId: 'unknown' })), null)
  assert.equal(pose(operation({ method: 'deposit' })), null)
})

test('spoon model anchors use the registered transformed model point, not the shaft or root', () => {
  const op = operation({ ...routes[3], elapsedMs: 900 })
  const pivot = pivotFor('spatula', pose(op))
  const expected = new Vector3(...SPATULA_SPOON_CENTER)
  expected.y -= PIVOT_HEIGHT
  pivot.updateWorldMatrix(true, false)
  expected.applyMatrix4(pivot.matrixWorld)
  const out = new Vector3()
  assert.equal(readSpatulaSpoonWorld(out), out)
  close(out.distanceTo(expected), 0)
  visualAnchors.clear()
  assert.equal(readEquipmentPointWorld('spatula', 0, 0, 0, out), null)
  close(out.distanceTo(expected), 0)
})

// Compile only this JSX-free controller module in memory: Node's strip-types
// loader intentionally rejects .tsx. Inject browser/store ports, not a GPU/NLE.
let controllerLoad = 0
async function controllerHarness(storeOverride) {
  const descriptors = Object.fromEntries(
    ['window', 'document', 'performance'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  )
  const browser = new EventTarget()
  const document = Object.assign(new EventTarget(), { hidden: false })
  let now = 0
  let nextHandle = 0
  let cleanup
  const pending = new Map()
  const listeners = new Set()
  const advances = []
  const finished = []
  let state
  const setTransfer = (transfer) => {
    const old = state
    state = { ...state, transfer }
    for (const listener of listeners) listener(state, old)
  }
  state = {
    transfer: null,
    advanceTransfer: (delta, id) => {
      advances.push({ delta, id })
      if (state.transfer?.operationId !== id) return
      const next = advanceTransferOperation(state.transfer, delta)
      if (next.elapsedMs === next.durationMs) {
        finished.push(next)
        setTransfer(null)
      } else setTransfer(next)
    },
    cancelTransfer: (id) => {
      if (state.transfer?.operationId === id) setTransfer(cancelTransferOperation(state.transfer))
    },
  }
  browser.requestAnimationFrame = (callback) => {
    pending.set(++nextHandle, callback)
    return nextHandle
  }
  browser.cancelAnimationFrame = (handle) => pending.delete(handle)
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document })
  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: { now: () => now },
  })
  globalThis.__transferControllerTest = {
    useEffect: (setup) => {
      cleanup = setup()
    },
    store: storeOverride ?? {
      getState: () => state,
      subscribe: (callback) => {
        listeners.add(callback)
        return () => listeners.delete(callback)
      },
    },
  }
  const source = (
    await readFile(
      new URL('../src/features/simulations/three/MaterialTransferController.tsx', import.meta.url),
      'utf8',
    )
  )
    .replace(
      /import \{ useEffect \} from 'react'/,
      'const useEffect = globalThis.__transferControllerTest.useEffect',
    )
    .replace(
      /import \{ useSaltSimulationStore \} from '\.\.\/state\/useSaltSimulationStore.ts'/,
      'const useSaltSimulationStore = globalThis.__transferControllerTest.store',
    )
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
  }).outputText
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(`${compiled}\n// mount ${++controllerLoad}`).toString('base64')}`
  )
  module.MaterialTransferController()
  delete globalThis.__transferControllerTest
  return {
    browser,
    document,
    pending,
    advances,
    finished,
    setTransfer,
    state: () => (storeOverride ? storeOverride.getState() : state),
    tick(time) {
      now = time
      const callbacks = [...pending.values()]
      pending.clear()
      callbacks.forEach((callback) => callback(now))
    },
    dispose() {
      cleanup?.()
      cleanup = undefined
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
      }
    },
  }
}

test('controller is idle without operations, advances without GPU frames, caps delta and guards stale callbacks', async () => {
  const h = await controllerHarness()
  try {
    assert.equal(h.pending.size, 0)
    h.setTransfer(operation())
    assert.equal(h.pending.size, 1)
    h.tick(16)
    assert.equal(h.advances.length, 0)
    h.tick(40)
    assert.equal(h.advances[0].delta, 40)
    h.tick(1040)
    assert.equal(h.advances[1].delta, 250)
    const stale = [...h.pending.values()][0]
    h.setTransfer(operation({ operationId: 'new-operation' }))
    const count = h.advances.length
    stale(2000)
    assert.equal(h.advances.length, count)
    assert.equal(h.pending.size, 1)
    h.tick(1080)
    assert.equal(h.advances.at(-1).id, 'new-operation')
    h.setTransfer(null)
    assert.equal(h.pending.size, 0)
  } finally {
    h.dispose()
  }
})

test('Escape and blur cancel into an animated return without delivering more material', async () => {
  for (const type of ['keydown', 'blur']) {
    const h = await controllerHarness()
    try {
      const op = advanceTransferOperation(operation(), 1500)
      h.setTransfer(op)
      const event = new Event(type)
      if (type === 'keydown') Object.defineProperty(event, 'key', { value: 'Escape' })
      h.browser.dispatchEvent(event)
      assert.equal(h.state().transfer.cancelled, true)
      assert.equal(h.state().transfer.transferred, op.transferred)
      h.tick(200)
      h.tick(400)
      h.tick(600)
      assert.equal(h.state().transfer, null)
      assert.equal(h.finished[0].transferred, op.transferred)
      assert.equal(h.pending.size, 0)
    } finally {
      h.dispose()
    }
  }
})

test('controller and real authority retain canonical delivered volume when hidden or unmounted', async () => {
  for (const mode of ['hidden', 'unmount']) {
    authorityStore.getState().reset()
    labStore.getState().resetEquipment()
    labStore.setState({ placedIds: [...saltExperimentDefinition.availableInventory] })
    assert.equal(acknowledgeLabSafety(), true)
    const h = await controllerHarness(authorityStore)
    try {
      assert.equal(
        authorityStore.getState().beginTransfer({
          requestId: `controller-real-${mode}`,
          sourceId: 'water',
          targetId: 'graduated-cylinder',
          materialId: 'water',
          amount: 12.3,
          unit: 'mL',
        }).ok,
        true,
      )
      for (let time = 200; time <= 1400; time += 200) h.tick(time)
      const delivered = authorityStore.getState().experiment.waterMl['graduated-cylinder']
      assert.ok(delivered > 0 && delivered < 12.3)
      if (mode === 'hidden') {
        h.document.hidden = true
        h.document.dispatchEvent(new Event('visibilitychange'))
      } else h.dispose()
      const state = authorityStore.getState()
      assert.equal(state.transfer, null)
      assert.equal(state.experiment.waterMl['graduated-cylinder'], delivered)
      assert.deepEqual(state.workflow.chemistryCheckpoint, state.experiment)
      assert.equal(state.events.at(-1).type, 'MATERIAL_TRANSFER_INTERRUPTED')
      assert.equal(h.pending.size, 0)
    } finally {
      h.dispose()
      authorityStore.getState().reset()
      labStore.getState().resetEquipment()
    }
  }
})

test('hidden-document and unmount cleanup finalize the cancelled return without a suspended-loop lock', async () => {
  for (const mode of ['hidden', 'unmount']) {
    const h = await controllerHarness()
    try {
      const op = advanceTransferOperation(operation(), 1500)
      h.setTransfer(op)
      if (mode === 'hidden') {
        h.document.hidden = true
        h.document.dispatchEvent(new Event('visibilitychange'))
      } else h.dispose()
      assert.equal(h.state().transfer, null)
      assert.equal(h.finished[0].cancelled, true)
      assert.equal(h.finished[0].transferred, op.transferred)
      assert.ok(
        h.advances.every(
          (call) => call.delta > 0 && call.delta <= 250 && call.id === op.operationId,
        ),
      )
      assert.equal(h.pending.size, 0)
    } finally {
      h.dispose()
    }
  }
})
