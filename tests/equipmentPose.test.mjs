import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { Euler, Group, Vector3 } from 'three'
import {
  getLiquidSurfaceHeight,
  getPourPose,
  MAX_POUR_TILT,
  PIVOT_HEIGHT,
  POUR_ASSIST_ANGLE,
  POUR_CLEARANCE,
  POUR_SOURCE_DIMENSIONS,
  RECEIVER_RIM_HEIGHTS,
} from '../src/features/simulations/three/equipmentPose.ts'
import {
  readOutletWorld,
  registerVisualAnchor,
  unregisterVisualAnchor,
  visualAnchors,
} from '../src/features/simulations/three/equipmentVisualAnchors.ts'

const SOURCES = ['water', 'graduated-cylinder', 'weighing-boat']
const RECEIVERS = ['graduated-cylinder', 'beaker']
const EPSILON = 1e-9

function close(actual, expected, message = '') {
  assert.ok(Math.abs(actual - expected) < EPSILON, `${message}: ${actual} != ${expected}`)
}

function closePoint(actual, expected) {
  actual.forEach((value, index) => close(value, expected[index], `axis ${index}`))
}

function rotate(point, yaw) {
  return {
    x: Math.cos(yaw) * point.x + Math.sin(yaw) * point.z,
    z: -Math.sin(yaw) * point.x + Math.cos(yaw) * point.z,
  }
}

function worldOutlet(source, pose, yaw) {
  const point = rotate({ x: pose.outlet[0], z: pose.outlet[2] }, yaw)
  return [source.x + point.x, pose.outlet[1], source.z + point.z]
}

function makePivot(source, pose, yaw) {
  const root = new Group()
  root.position.set(source.x, 0.78, source.z)
  root.rotation.y = yaw
  const pivot = new Group()
  pivot.position.set(pose.x, pose.y, pose.z)
  pivot.rotation.set(pose.rotationX, 0, pose.rotationZ, 'XYZ')
  root.add(pivot)
  return pivot
}

afterEach(() => visualAnchors.clear())

test('registered dimensions match model openings and the fixed visual pivot', () => {
  assert.equal(PIVOT_HEIGHT, 0.42)
  assert.equal(POUR_CLEARANCE, 0.12)
  assert.deepEqual(POUR_SOURCE_DIMENSIONS.water, { rim: 0.9, radius: 0.15 })
  assert.deepEqual(POUR_SOURCE_DIMENSIONS['graduated-cylinder'], { rim: 1.115, radius: 0.13 })
  assert.deepEqual(POUR_SOURCE_DIMENSIONS['weighing-boat'], { rim: 0.13, radius: 0.2 })
  assert.equal(RECEIVER_RIM_HEIGHTS['graduated-cylinder'], 1.115)
  assert.equal(RECEIVER_RIM_HEIGHTS.beaker, 0.755)
})

test('upright pose has no translation or lift and does not mutate domain positions', () => {
  const source = Object.freeze({ x: -0.7, z: 0.3 })
  const target = Object.freeze({ x: 0.5, z: -0.2 })
  for (const id of SOURCES) {
    const pose = getPourPose(id, source, 'beaker', target, 0, 1.2)
    closePoint([pose.x, pose.y, pose.z], [0, PIVOT_HEIGHT, 0])
    close(pose.rotationX, 0)
    close(pose.rotationZ, 0)
    close(pose.outlet[1], POUR_SOURCE_DIMENSIONS[id].rim)
  }
  assert.deepEqual(source, { x: -0.7, z: 0.3 })
  assert.deepEqual(target, { x: 0.5, z: -0.2 })
})

test('sufficient tilt puts the actual low-side lip over the receiver with clearance', () => {
  const source = { x: -0.65, z: 0.22 }
  for (const id of SOURCES) {
    for (const receiver of RECEIVERS) {
      for (const yaw of [0, 0.71, Math.PI / 2, -2.4]) {
        for (let direction = 0; direction < 8; direction += 1) {
          const phi = (direction * Math.PI) / 4
          const target = { x: source.x + Math.cos(phi) * 1.1, z: source.z + Math.sin(phi) * 1.1 }
          for (const angle of [POUR_ASSIST_ANGLE, 0.75, 1.2, MAX_POUR_TILT]) {
            const pose = getPourPose(id, source, receiver, target, angle, yaw)
            const world = worldOutlet(source, pose, yaw)
            close(world[0], target.x)
            close(world[2], target.z)
            assert.ok(world[1] >= RECEIVER_RIM_HEIGHTS[receiver] + POUR_CLEARANCE - EPSILON)

            const pivot = makePivot(source, pose, yaw)
            registerVisualAnchor(id, pivot)
            const actual = readOutletWorld(id, target, new Vector3())
            assert.ok(actual)
            closePoint(actual.toArray(), [world[0], world[1] + 0.78, world[2]])
          }
        }
      }
    }
  }
})

test('XYZ rotations aim the model axis exactly at diagonal receivers, not an approximation', () => {
  const source = { x: -0.7, z: 0.25 }
  const target = { x: 0.6, z: -0.8 }
  for (const yaw of [-2.7, 0, 0.6, 2.2]) {
    const angle = 0.75
    const pose = getPourPose('water', source, 'beaker', target, angle, yaw)
    const axis = new Vector3(0, 1, 0)
      .applyEuler(new Euler(pose.rotationX, 0, pose.rotationZ, 'XYZ'))
      .applyEuler(new Euler(0, yaw, 0))
    const length = Math.hypot(target.x - source.x, target.z - source.z)
    close(axis.x, (Math.sin(angle) * (target.x - source.x)) / length)
    close(axis.y, Math.cos(angle))
    close(axis.z, (Math.sin(angle) * (target.z - source.z)) / length)
  }
})

test('pose is yaw covariant when the whole tabletop arrangement is rotated', () => {
  const source = { x: -0.7, z: 0.3 }
  const target = { x: 0.6, z: -0.2 }
  const yaw = -0.6
  for (const id of SOURCES) {
    for (const angle of [0, 0.08, 0.3, POUR_ASSIST_ANGLE, 0.75]) {
      const original = getPourPose(id, source, 'beaker', target, angle, yaw)
      for (const turn of [-Math.PI, -0.7, 0.5, Math.PI / 2, 2 * Math.PI]) {
        const rotatedSource = rotate(source, turn)
        const rotatedTarget = rotate(target, turn)
        const rotated = getPourPose(id, rotatedSource, 'beaker', rotatedTarget, angle, yaw + turn)
        for (const key of ['x', 'y', 'z', 'rotationX', 'rotationZ'])
          close(rotated[key], original[key], key)
        closePoint(rotated.outlet, original.outlet)
        const originalWorld = worldOutlet(source, original, yaw)
        const rotatedWorld = worldOutlet(rotatedSource, rotated, yaw + turn)
        const expected = rotate({ x: originalWorld[0], z: originalWorld[2] }, turn)
        closePoint(rotatedWorld, [expected.x, originalWorld[1], expected.z])
      }
    }
  }
})

test('translation and lift blend continuously at zero tilt and full assist', () => {
  const source = { x: -1, z: 0.3 }
  const target = { x: 0.4, z: -0.6 }
  for (const id of SOURCES) {
    for (const receiver of RECEIVERS) {
      for (const angle of [0, POUR_ASSIST_ANGLE]) {
        const left = getPourPose(id, source, receiver, target, Math.max(0, angle - 1e-7), 0.9)
        const right = getPourPose(id, source, receiver, target, angle + 1e-7, 0.9)
        for (const key of ['x', 'y', 'z', 'rotationX', 'rotationZ']) {
          assert.ok(Math.abs(left[key] - right[key]) < 1e-5, `${id} ${receiver} ${key}`)
        }
      }
      const start = getPourPose(id, source, receiver, target, 1e-7)
      assert.ok(Math.hypot(start.x, start.z, start.y - PIVOT_HEIGHT) < 1e-10)
    }
  }
})

test('poses remain finite and bounded for control limits, coincident positions and invalid numbers', () => {
  for (const source of [
    { x: -2.85, z: 1.3 },
    { x: 0, z: 0 },
    { x: NaN, z: Infinity },
  ]) {
    for (const target of [{ x: 2.85, z: -1.3 }, source, { x: -Infinity, z: NaN }]) {
      for (const angle of [-100, -0.1, 0, 0.2, 0.45, 0.75, Math.PI / 2, 100, NaN, Infinity]) {
        for (const id of SOURCES) {
          const pose = getPourPose(id, source, 'graduated-cylinder', target, angle, NaN)
          const values = [pose.x, pose.y, pose.z, pose.rotationX, pose.rotationZ, ...pose.outlet]
          assert.ok(values.every(Number.isFinite))
          assert.ok(Math.abs(pose.x) < 8 && Math.abs(pose.z) < 8)
          assert.ok(pose.y >= PIVOT_HEIGHT && pose.y < 3)
          assert.ok(
            Math.abs(pose.rotationX) <= Math.PI / 2 && Math.abs(pose.rotationZ) <= Math.PI / 2,
          )
        }
      }
    }
  }
})

test('unknown equipment stays neutral and unknown receivers do not auto-translate', () => {
  const source = { x: 0, z: 0 }
  const target = { x: 1, z: 0 }
  assert.deepEqual(getPourPose('unknown', source, 'beaker', target, 0.75), {
    x: 0,
    y: PIVOT_HEIGHT,
    z: 0,
    rotationX: 0,
    rotationZ: 0,
    outlet: [0, PIVOT_HEIGHT, 0],
  })
  const pose = getPourPose('water', source, 'unknown', target, 0.75)
  closePoint([pose.x, pose.y, pose.z], [0, PIVOT_HEIGHT, 0])
})

test('stream endpoints follow calibrated authoritative volume, including empty and full receivers', () => {
  for (const [id, capacity, floor, full] of [
    ['beaker', 250, 0.09, 0.74],
    ['graduated-cylinder', 100, 0.2, 1.074],
  ]) {
    close(getLiquidSurfaceHeight(id, 0), floor)
    close(getLiquidSurfaceHeight(id, capacity / 2), (floor + full) / 2)
    close(getLiquidSurfaceHeight(id, capacity), full)
    close(getLiquidSurfaceHeight(id, -100), floor)
    close(getLiquidSurfaceHeight(id, 10000), full)
    close(getLiquidSurfaceHeight(id, NaN), floor)
    assert.ok(getLiquidSurfaceHeight(id, capacity) < RECEIVER_RIM_HEIGHTS[id])
  }
})

test('anchor sampling tracks the actual interpolated transform, not a requested tilt', () => {
  const source = { x: -0.7, z: 0.4 }
  const target = { x: 0.3, z: -0.6 }
  const pose = getPourPose('water', source, 'beaker', target, 0.32, 1.3)
  const pivot = makePivot(source, pose, 1.3)
  registerVisualAnchor('water', pivot)
  const first = readOutletWorld('water', target, new Vector3())
  pivot.position.y += 0.17
  pivot.position.x += 0.08
  const second = readOutletWorld('water', target, new Vector3())
  close(second.y - first.y, 0.17)
  close(second.x - first.x, Math.cos(1.3) * 0.08)
  close(second.z - first.z, -Math.sin(1.3) * 0.08)

  // Independent rim sampling confirms the returned point really is the low side.
  const dimensions = POUR_SOURCE_DIMENSIONS.water
  for (let index = 0; index < 128; index += 1) {
    const angle = (index * Math.PI * 2) / 128
    const sample = new Vector3(
      Math.cos(angle) * dimensions.radius,
      dimensions.rim - PIVOT_HEIGHT,
      Math.sin(angle) * dimensions.radius,
    ).applyMatrix4(pivot.matrixWorld)
    assert.ok(second.y <= sample.y + EPSILON)
  }
})

test('upright anchors choose the target-facing rim and use caller-owned output vectors', () => {
  const pivot = makePivot(
    { x: 0, z: 0 },
    {
      x: 0,
      y: PIVOT_HEIGHT,
      z: 0,
      rotationX: 0,
      rotationZ: 0,
    },
    Math.PI / 2,
  )
  registerVisualAnchor('water', pivot)
  const out = new Vector3()
  assert.equal(readOutletWorld('water', { x: 1, z: 0 }, out), out)
  closePoint(out.toArray(), [0.15, 0.78 + 0.9, 0])
  const old = out.toArray()
  assert.equal(readOutletWorld('missing', { x: 1, z: 0 }, out), null)
  assert.deepEqual(out.toArray(), old)
})

test('anchor cleanup is safe across replacement, unmount, and repeated disposal', () => {
  const old = new Group()
  const replacement = new Group()
  const cleanupOld = registerVisualAnchor('water', old)
  const cleanupNew = registerVisualAnchor('water', replacement)
  cleanupOld()
  unregisterVisualAnchor('water', old)
  assert.equal(visualAnchors.get('water'), replacement)
  cleanupNew()
  cleanupNew()
  assert.equal(visualAnchors.has('water'), false)
})
