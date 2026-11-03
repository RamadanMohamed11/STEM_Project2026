import assert from 'node:assert/strict'
import test from 'node:test'
import { preferredPlacementHintActor } from '../src/features/simulations/three/placementHintActor.ts'
import { shouldUpdatePlacementHint } from '../src/features/simulations/three/placementHintMotion.ts'

test('preview only writes when world-space pointer changes meaningfully', () => {
  const original = { x: 0.55, z: 0.08 }
  assert.equal(shouldUpdatePlacementHint(null, original), true)
  assert.equal(shouldUpdatePlacementHint(original, { ...original }), false)
  assert.equal(shouldUpdatePlacementHint(original, { x: 0.5505, z: 0.0802 }), false)
  assert.equal(shouldUpdatePlacementHint(original, { x: 0.552, z: 0.08 }), true)
  assert.equal(shouldUpdatePlacementHint(original, { x: 0.55, z: 0.075 }), true)
  assert.deepEqual(original, { x: 0.55, z: 0.08 })
})

test('nonfinite 3D ray intersections can never be written to placement state', () => {
  const point = { x: -1, z: 0.3 }
  assert.equal(shouldUpdatePlacementHint(point, { x: Number.NaN, z: 0.3 }), false)
  assert.equal(shouldUpdatePlacementHint(point, { x: Number.POSITIVE_INFINITY, z: 0.3 }), false)
  assert.equal(shouldUpdatePlacementHint(point, { x: -1, z: Number.NEGATIVE_INFINITY }), false)
})

test('held and selected actionable actors outrank wrong meshes under transient hover', () => {
  assert.equal(
    preferredPlacementHintActor('water', 'spatula', 'digital-balance', false, false),
    'water',
    'A held vessel always owns its tilt/receiver target',
  )
  assert.equal(
    preferredPlacementHintActor(null, 'spatula', 'digital-balance', true, false),
    'spatula',
    'Hovering an incompatible instrument must not steal a selected actor hint',
  )
  assert.equal(
    preferredPlacementHintActor(null, 'digital-balance', 'spatula', false, true),
    'spatula',
    'A valid hover may replace a selection that has no interaction target',
  )
  assert.equal(
    preferredPlacementHintActor(null, 'digital-balance', 'sodium-chloride', false, false),
    'digital-balance',
    'Selected instrument still retains first-use help when no target is available',
  )
  assert.equal(preferredPlacementHintActor(null, null, 'beaker', false, false), 'beaker')
  assert.equal(preferredPlacementHintActor(null, null, null, false, false), null)
})
