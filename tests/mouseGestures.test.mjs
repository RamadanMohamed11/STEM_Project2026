import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isTiltHandleEligible,
  tiltAngleFromVerticalDrag,
  tiltHandleAnchor,
  TILT_ANGLE_MAX,
  TILT_ANGLE_MIN,
  TILT_RADIANS_PER_PIXEL,
} from '../src/features/simulations/three/mouseGestureLogic.ts'

test('only vessels with meaningful tilting operations expose a mouse handle', () => {
  for (const id of ['water', 'graduated-cylinder', 'weighing-boat']) {
    assert.equal(isTiltHandleEligible(id), true, id)
  }
  for (const id of [
    'beaker',
    'digital-balance',
    'spatula',
    'stirring-rod',
    'sodium-chloride',
    '',
  ]) {
    assert.equal(isTiltHandleEligible(id), false, id)
  }
})

test('handle anchors are outside the physical footprint, near the vessel shoulder', () => {
  for (const [id, radius] of [
    ['water', 0.34],
    ['graduated-cylinder', 0.25],
    ['weighing-boat', 0.25],
  ]) {
    const anchor = tiltHandleAnchor(id, radius)
    assert.ok(anchor)
    assert.ok(Math.hypot(anchor.x, anchor.z) > radius + 0.1)
    assert.ok(anchor.y > 0.25 && anchor.y < 1)
    assert.ok(anchor.z > 0)
  }
})

test('non-tiltable equipment never gets a position/pick sphere', () => {
  assert.equal(tiltHandleAnchor('beaker', 0.46), null)
  assert.equal(tiltHandleAnchor('spatula', 0.33), null)
})

test('water and taller cylinder get distinct realistic handle heights', () => {
  const water = tiltHandleAnchor('water', 0.34)
  const cylinder = tiltHandleAnchor('graduated-cylinder', 0.25)
  const boat = tiltHandleAnchor('weighing-boat', 0.25)
  assert.ok(cylinder.y > water.y)
  assert.ok(water.y > boat.y)
})

test('tilt is zero on click without downward movement and on upward hand motion', () => {
  assert.equal(tiltAngleFromVerticalDrag(205, 205), 0)
  assert.equal(tiltAngleFromVerticalDrag(205, 170), 0)
})

test('mouse drag distance maps linearly to angle until reaching maximum tilt', () => {
  assert.ok(Math.abs(tiltAngleFromVerticalDrag(100, 130) - 30 * TILT_RADIANS_PER_PIXEL) < 1e-9)
  assert.ok(Math.abs(tiltAngleFromVerticalDrag(600, 630) - 30 * TILT_RADIANS_PER_PIXEL) < 1e-9)
  assert.equal(tiltAngleFromVerticalDrag(100, 500), TILT_ANGLE_MAX)
})

test('one deliberate 41px downstroke reaches the real physics pour threshold', () => {
  assert.ok(tiltAngleFromVerticalDrag(120, 160) < TILT_ANGLE_MIN)
  assert.ok(tiltAngleFromVerticalDrag(120, 161) >= TILT_ANGLE_MIN)
})

test('moving upward straightens an already tilted vessel without a sticky threshold', () => {
  const startedAt = 100
  assert.equal(tiltAngleFromVerticalDrag(startedAt, 200), TILT_ANGLE_MAX)
  assert.ok(tiltAngleFromVerticalDrag(startedAt, 120) < TILT_ANGLE_MIN)
  assert.equal(tiltAngleFromVerticalDrag(startedAt, 98), 0)
})

test('invalid coordinates never generate an actionable physical tilt', () => {
  assert.equal(tiltAngleFromVerticalDrag(NaN, 150), 0)
  assert.equal(tiltAngleFromVerticalDrag(100, Infinity), 0)
  assert.equal(tiltAngleFromVerticalDrag(-Infinity, 100), 0)
})

test('nonsensical model radius cannot place a handle at infinity', () => {
  const anchor = tiltHandleAnchor('water', NaN)
  assert.ok(Number.isFinite(anchor.x))
  assert.ok(Number.isFinite(anchor.y))
  assert.ok(Number.isFinite(anchor.z))
})
