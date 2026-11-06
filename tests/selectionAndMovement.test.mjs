import assert from 'node:assert/strict'
import test from 'node:test'
import { useLabSceneStore as scene } from '../src/features/simulations/state/useLabSceneStore.ts'
import {
  constrainDragMovement,
  validatePlacement,
} from '../src/features/simulations/three/movement.ts'
import { exceedsGrabThreshold } from '../src/features/simulations/three/selectionLogic.ts'
import {
  initialCircularGesture,
  traceCircularGesture,
  isCircularStir,
} from '../src/features/simulations/three/gestureMath.ts'

function setup() {
  scene.getState().resetEquipment()
  scene.getState().beginPlacement('graduated-cylinder')
  assert.equal(scene.getState().confirmPlacement(), true)
  scene.getState().clearSelection()
}

test('ordinary sequential clicks form an unordered pair and deselect individually', () => {
  setup()
  scene.getState().toggleSelection('beaker')
  scene.getState().toggleSelection('graduated-cylinder')
  assert.deepEqual(scene.getState().selectedIds, ['beaker', 'graduated-cylinder'])
  scene.getState().toggleSelection('beaker')
  assert.deepEqual(scene.getState().selectedIds, ['graduated-cylinder'])
  assert.equal(scene.getState().selectedId, 'graduated-cylinder')
  scene.getState().toggleSelection('graduated-cylinder')
  assert.deepEqual(scene.getState().selectedIds, [])
  assert.equal(scene.getState().selectedId, null)
})

test('exactly two unique placed objects; Ctrl/Command can replace the second object', () => {
  setup()
  scene.getState().toggleSelection('beaker')
  scene.getState().toggleSelection('graduated-cylinder', true)
  scene.getState().toggleSelection('digital-balance', true)
  assert.deepEqual(scene.getState().selectedIds, ['beaker', 'digital-balance'])
  scene.getState().toggleSelection('graduated-cylinder')
  assert.deepEqual(scene.getState().selectedIds, ['graduated-cylinder'])
  scene.getState().toggleSelection('unregistered')
  assert.deepEqual(scene.getState().selectedIds, ['graduated-cylinder'])
})

test('press does not drag or select, and a genuine grab cannot select a different object', () => {
  setup()
  scene.getState().toggleSelection('beaker')
  scene.getState().beginPress('digital-balance')
  assert.equal(scene.getState().pressedId, 'digital-balance')
  assert.equal(scene.getState().draggingId, null)
  assert.deepEqual(scene.getState().selectedIds, ['beaker'])
  scene.getState().toggleSelection('graduated-cylinder')
  assert.deepEqual(scene.getState().selectedIds, ['beaker'])
  scene.getState().beginDrag('digital-balance')
  assert.deepEqual(scene.getState().selectedIds, ['beaker'])
  scene.getState().endPress()
  scene.getState().finishDrag()
  scene.getState().toggleSelection('graduated-cylinder')
  assert.equal(scene.getState().selectedIds.length, 2)
})

test('removing equipment and reset synchronize both selection representations', () => {
  setup()
  scene.getState().toggleSelection('beaker')
  scene.getState().toggleSelection('graduated-cylinder')
  scene.getState().removeFromBench('beaker')
  assert.deepEqual(scene.getState().selectedIds, ['graduated-cylinder'])
  scene.getState().resetEquipment()
  assert.deepEqual(scene.getState().selectedIds, [])
  assert.equal(scene.getState().pressedId, null)
})

test('CSS-pixel click threshold tolerates hand jitter, independent of device pixel ratio', () => {
  assert.equal(exceedsGrabThreshold(100, 100, 103, 104), false)
  assert.equal(exceedsGrabThreshold(100, 100, 106, 100), true)
  assert.equal(exceedsGrabThreshold(NaN, 100, 106, 100), false)
})

test('swept collision stops sparse mouse samples from tunneling through apparatus', () => {
  const positions = { water: { x: -1, z: 0 }, beaker: { x: 0, z: 0 } }
  const result = constrainDragMovement('water', positions.water, { x: 1.5, z: 0 }, positions, [
    'water',
    'beaker',
  ])
  assert.ok(result.x < -0.8)
  assert.equal(validatePlacement('water', result, positions, ['water', 'beaker']).valid, true)
  assert.deepEqual(
    constrainDragMovement('water', positions.water, { x: NaN, z: 0 }, positions, [
      'water',
      'beaker',
    ]),
    positions.water,
  )
})

test('drag constraints slide along boundaries and always remain within the worktop', () => {
  const positions = { water: { x: -1, z: 0 } }
  const result = constrainDragMovement('water', positions.water, { x: 30, z: -20 }, positions, [
    'water',
  ])
  assert.equal(validatePlacement('water', result, positions, ['water']).valid, true)
  assert.ok(result.x <= 2.51 && result.z >= -0.96)
})

test('genuine slow-device circle survives 800 ms event gaps without credit for stalls', () => {
  let trace = initialCircularGesture()
  const center = { x: 0, z: 0 }
  for (let i = 0; i <= 24; i++) {
    const angle = (i * Math.PI * 2) / 24
    trace = traceCircularGesture(
      trace,
      { x: 0.15 * Math.cos(angle), z: 0.15 * Math.sin(angle) },
      center,
      i * 800,
    )
  }
  assert.equal(isCircularStir(trace, 24 * 800), true)
  assert.ok(trace.activeMs < 3000, 'long callback stalls are not counted as active stirring')
  assert.equal(isCircularStir(trace, 24 * 800 + 1600), false)
})

test('a stationary held rod and reversal after a valid circle cannot keep dissolving material', () => {
  let trace = initialCircularGesture()
  for (let i = 0; i <= 24; i++) {
    const angle = (i * Math.PI * 2) / 24
    trace = traceCircularGesture(
      trace,
      { x: 0.15 * Math.cos(angle), z: 0.15 * Math.sin(angle) },
      { x: 0, z: 0 },
      i * 35,
    )
  }
  const previous = trace.activeMs
  trace = traceCircularGesture(trace, { x: 0.15, z: 0 }, { x: 0, z: 0 }, 1000)
  assert.equal(trace.activeMs, previous)
  trace = traceCircularGesture(
    trace,
    { x: 0.15 * Math.cos(-0.25), z: 0.15 * Math.sin(-0.25) },
    { x: 0, z: 0 },
    1035,
  )
  assert.equal(isCircularStir(trace, 1035), false)
})
