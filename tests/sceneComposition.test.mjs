import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BENCH_DEPTH,
  BENCH_TOP,
  BENCH_WIDTH,
  CAMERA_TARGET,
  CAMERA_DESKTOP_POSITION,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  EQUIPMENT_LIMITS,
  LAB_CAMERA_FOV,
  cameraPositionForAspect,
  equipmentRegistry,
} from '../src/features/simulations/three/sceneConfig.ts'
import {
  validatePlacement,
  makeInitialPositions,
} from '../src/features/simulations/three/movement.ts'

function distance(position) {
  return Math.hypot(
    position[0] - CAMERA_TARGET[0],
    position[1] - CAMERA_TARGET[1],
    position[2] - CAMERA_TARGET[2],
  )
}

test('Task C: default camera is a closer manipulable three-quarter view with safe clipping angles', () => {
  assert.ok(LAB_CAMERA_FOV >= 38 && LAB_CAMERA_FOV <= 48)
  assert.ok(BENCH_TOP > 0.7 && BENCH_TOP < 0.9)
  assert.deepEqual(DEFAULT_CAMERA_POSITION, CAMERA_DESKTOP_POSITION)
  assert.deepEqual(DEFAULT_CAMERA_TARGET, CAMERA_TARGET)
  assert.ok(distance(DEFAULT_CAMERA_POSITION) > 5 && distance(DEFAULT_CAMERA_POSITION) < 7.25)
  assert.ok(DEFAULT_CAMERA_POSITION[2] > 4.7)
  assert.ok(DEFAULT_CAMERA_POSITION[1] > BENCH_TOP + 2.2)
})

test('Task C: responsive framing pulls back as viewport narrows, remaining finite and aligned', () => {
  const desktop = cameraPositionForAspect(16 / 9)
  const square = cameraPositionForAspect(1)
  const portrait = cameraPositionForAspect(0.65)
  assert.ok(distance(square) > distance(desktop))
  assert.ok(distance(portrait) > distance(square))
  assert.ok(distance(portrait) < 20)
  for (const aspect of [16 / 9, 4 / 3, 1, 0.65, 0, -1, NaN, Infinity]) {
    const position = cameraPositionForAspect(aspect)
    assert.ok(position.every(Number.isFinite))
    assert.ok(position[2] > CAMERA_TARGET[2])
  }
})

test('Task C: physical apparatus and all intended bench slots remain separated', () => {
  assert.equal(equipmentRegistry.length, 8)
  assert.ok(EQUIPMENT_LIMITS.minX > -BENCH_WIDTH / 2)
  assert.ok(EQUIPMENT_LIMITS.maxX < BENCH_WIDTH / 2)
  assert.ok(EQUIPMENT_LIMITS.minZ > -BENCH_DEPTH / 2)
  assert.ok(EQUIPMENT_LIMITS.maxZ < BENCH_DEPTH / 2)
  const positions = makeInitialPositions()
  for (const entry of equipmentRegistry) {
    assert.ok(entry.footprintRadius >= 0.17 && entry.footprintRadius <= 0.5)
    assert.equal(
      validatePlacement(
        entry.id,
        entry.defaultPosition,
        positions,
        equipmentRegistry.map((part) => part.id),
      ).valid,
      true,
      entry.id + ' default footprint',
    )
    for (const other of equipmentRegistry) {
      if (entry.id === other.id) continue
      const separation = Math.hypot(
        entry.defaultPosition.x - other.defaultPosition.x,
        entry.defaultPosition.z - other.defaultPosition.z,
      )
      assert.ok(
        separation >= entry.footprintRadius + other.footprintRadius + 0.055 - 1e-9,
        entry.id + ' and ' + other.id + ' would overlap',
      )
    }
  }
})
