import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveAffordanceHint } from '../src/features/simulations/three/affordanceHintLogic.ts'

const completeBench = [
  'beaker',
  'digital-balance',
  'graduated-cylinder',
  'water',
  'sodium-chloride',
  'stirring-rod',
  'spatula',
  'weighing-boat',
]

function context(overrides = {}) {
  return {
    actorId: 'water',
    stepId: 'measure-water',
    completed: false,
    placedIds: completeBench,
    positions: {
      water: { x: -1.5, z: 0 },
      'graduated-cylinder': { x: 0, z: 0 },
      beaker: { x: 1.5, z: 0 },
      spatula: { x: 1.6, z: 0 },
      'sodium-chloride': { x: 2.5, z: 0 },
      'weighing-boat': { x: -1.4, z: 0.6 },
      'digital-balance': { x: -2.4, z: 0.6 },
      'stirring-rod': { x: 0.8, z: -0.8 },
    },
    waterMl: { water: 400, 'graduated-cylinder': 0, beaker: 0 },
    saltStockG: 100,
    saltOnSpatulaG: 0,
    saltOnBoatG: 0,
    saltInBeakerG: 0,
    dissolvedSaltG: 0,
    recordedWaterMl: null,
    recordedSaltG: null,
    ...overrides,
  }
}

test('green is restricted to matching physical target within the real XZ contact threshold', () => {
  const far = context()
  const farHint = resolveAffordanceHint(far)
  assert.equal(farHint?.targetId, 'graduated-cylinder')
  assert.equal(farHint?.gesture, 'tilt')
  assert.equal(farHint?.near, false, 'Distant valid receiver must be amber')

  const near = context({
    positions: { ...far.positions, water: { x: -0.69, z: 0 } },
  })
  const nearHint = resolveAffordanceHint(near)
  assert.equal(nearHint?.near, true)
  assert.deepEqual(nearHint?.targetPosition, near.positions['graduated-cylinder'])

  const outside = context({
    positions: { ...far.positions, water: { x: -0.811, z: 0 } },
  })
  assert.equal(resolveAffordanceHint(outside)?.near, false)

  assert.deepEqual(far.positions.water, { x: -1.5, z: 0 }, 'Hint evaluation never moves tools')
})

test('wrong actors, steps, missing equipment and completed workflows produce no target', () => {
  assert.equal(resolveAffordanceHint(context({ actorId: 'beaker' })), null)
  assert.equal(resolveAffordanceHint(context({ actorId: 'sodium-chloride' })), null)
  assert.equal(resolveAffordanceHint(context({ stepId: 'transfer-water' })), null)
  assert.equal(resolveAffordanceHint(context({ completed: true })), null)
  assert.equal(
    resolveAffordanceHint(
      context({ placedIds: completeBench.filter((id) => id !== 'graduated-cylinder') }),
    ),
    null,
  )
  assert.equal(
    resolveAffordanceHint(context({ placedIds: completeBench.filter((id) => id !== 'water') })),
    null,
  )
  assert.equal(resolveAffordanceHint(context({ actorId: null })), null)
  assert.equal(
    resolveAffordanceHint(
      context({ waterMl: { water: 400, 'graduated-cylinder': 100, beaker: 0 } }),
    ),
    null,
    'A full graduated cylinder is not a valid receiver',
  )
})

test('water recipient changes only after measured volume and validated workflow step', () => {
  const filled = {
    water: 300,
    'graduated-cylinder': 100,
    beaker: 0,
  }
  assert.equal(
    resolveAffordanceHint(
      context({
        actorId: 'graduated-cylinder',
        stepId: 'transfer-water',
        waterMl: filled,
        recordedWaterMl: null,
      }),
    ),
    null,
  )
  const transfer = resolveAffordanceHint(
    context({
      actorId: 'graduated-cylinder',
      stepId: 'transfer-water',
      waterMl: filled,
      recordedWaterMl: 100,
    }),
  )
  assert.equal(transfer?.targetId, 'beaker')
  assert.equal(transfer?.gesture, 'tilt')
  assert.equal(
    resolveAffordanceHint(
      context({
        actorId: 'graduated-cylinder',
        stepId: 'transfer-water',
        waterMl: { ...filled, 'graduated-cylinder': 0, beaker: 100 },
        recordedWaterMl: 100,
      }),
    ),
    null,
  )
})

test('spatula, loaded boat, balance and salt beaker targets track actual solid state', () => {
  const stage = {
    stepId: 'measure-salt',
    waterMl: { water: 300, 'graduated-cylinder': 0, beaker: 100 },
  }
  const source = resolveAffordanceHint(context({ ...stage, actorId: 'spatula' }))
  assert.equal(source?.targetId, 'sodium-chloride')
  assert.equal(source?.gesture, 'scoop')

  const deposit = resolveAffordanceHint(
    context({ ...stage, actorId: 'spatula', saltOnSpatulaG: 5, saltStockG: 95 }),
  )
  assert.equal(deposit?.targetId, 'weighing-boat')
  assert.equal(deposit?.gesture, 'release')
  assert.equal(
    resolveAffordanceHint(context({ ...stage, actorId: 'spatula', saltOnSpatulaG: 3 })),
    null,
  )

  const weighed = { ...stage, saltStockG: 95, saltOnBoatG: 5 }
  const balance = resolveAffordanceHint(context({ ...weighed, actorId: 'weighing-boat' }))
  assert.equal(balance?.targetId, 'digital-balance')
  assert.equal(balance?.gesture, 'release')
  assert.equal(
    resolveAffordanceHint(context({ ...weighed, actorId: 'weighing-boat', recordedSaltG: 5 })),
    null,
  )

  const measured = { ...weighed, stepId: 'add-salt', recordedSaltG: 5 }
  assert.equal(
    resolveAffordanceHint(context({ ...measured, actorId: 'weighing-boat' }))?.targetId,
    'beaker',
  )
  assert.equal(
    resolveAffordanceHint(
      context({
        ...measured,
        actorId: 'weighing-boat',
        waterMl: { water: 300, 'graduated-cylinder': 0, beaker: 0 },
      }),
    ),
    null,
  )
  assert.equal(
    resolveAffordanceHint(context({ ...measured, actorId: 'sodium-chloride' })),
    null,
    'Direct-from-stock shortcut is chemically invalid',
  )
})

test('stir ring appears only while a genuinely undissolved 5 g portion remains', () => {
  const state = {
    actorId: 'stirring-rod',
    stepId: 'stir',
    waterMl: { water: 300, 'graduated-cylinder': 0, beaker: 100 },
    saltInBeakerG: 5,
  }
  assert.equal(resolveAffordanceHint(context({ ...state }))?.targetId, 'beaker')
  assert.equal(resolveAffordanceHint(context({ ...state, dissolvedSaltG: 4 }))?.gesture, 'stir')
  assert.equal(resolveAffordanceHint(context({ ...state, dissolvedSaltG: 5 })), null)
  assert.equal(resolveAffordanceHint(context({ ...state, actorId: 'spatula' })), null)
})
