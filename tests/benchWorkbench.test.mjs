import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  equipmentRegistry,
  instanceTypeId,
  instancesOnBench,
  isExtraInstance,
  nextInstanceId,
  resolveEquipment,
} from '../src/features/simulations/three/sceneConfig.ts'
import {
  SNAP_RULES,
  WASTE_BIN,
  findSnapTarget,
  isOverWasteBin,
  snappedChildren,
  snappedPartners,
} from '../src/features/simulations/three/benchLayout.ts'
import {
  findSuggestedPosition,
  validatePlacement,
} from '../src/features/simulations/three/movement.ts'
import {
  MAX_BENCH_HISTORY,
  useLabSceneStore,
} from '../src/features/simulations/state/useLabSceneStore.ts'

const scene = () => useLabSceneStore.getState()
const fresh = () => scene().resetEquipment()

test('instance ids resolve to their type with limits; extras get numbered labels', () => {
  assert.equal(resolveEquipment('beaker').label, 'Beaker')
  const second = resolveEquipment('beaker~2')
  assert.equal(second.id, 'beaker~2')
  assert.equal(second.label, 'Beaker 2')
  assert.equal(second.visual, 'beaker')
  assert.equal(second.footprintRadius, resolveEquipment('beaker').footprintRadius)
  for (const bad of [
    'beaker~1',
    'beaker~4',
    'beaker~x',
    'beaker~',
    'nope~2',
    'water~2',
    'beaker~2~2',
  ])
    assert.equal(resolveEquipment(bad), undefined, bad)
  assert.equal(instanceTypeId('beaker~3'), 'beaker')
  assert.equal(isExtraInstance('beaker'), false)
  assert.equal(isExtraInstance('beaker~3'), true)
  assert.equal(nextInstanceId('beaker', []), 'beaker')
  assert.equal(nextInstanceId('beaker', ['beaker']), 'beaker~2')
  assert.equal(nextInstanceId('beaker', ['beaker', 'beaker~3']), 'beaker~2')
  assert.equal(nextInstanceId('beaker', ['beaker', 'beaker~2', 'beaker~3']), null)
  assert.equal(nextInstanceId('water', ['water']), null)
  assert.equal(nextInstanceId('beaker~2', []), null)
  assert.equal(instancesOnBench('beaker', ['beaker', 'beaker~2', 'water']), 2)
})

test('add to bench places the next copy at a free valid spot; copies are removed completely', () => {
  fresh()
  assert.deepEqual(scene().placedIds, ['beaker', 'digital-balance'])
  const id = scene().addToBench('beaker')
  assert.equal(id, 'beaker~2')
  const s = scene()
  assert.ok(s.placedIds.includes('beaker~2'))
  assert.deepEqual(s.selectedIds, ['beaker~2'])
  const others = s.placedIds.filter((other) => other !== id)
  assert.equal(validatePlacement(id, s.positions[id], s.positions, others).valid, true)
  assert.match(s.feedback, /Beaker 2 placed/)

  scene().addToBench('beaker')
  assert.equal(scene().addToBench('beaker'), null)
  assert.match(scene().feedback, /No more beaker copies/)

  scene().removeFromBench('beaker~2')
  assert.equal(scene().placedIds.includes('beaker~2'), false)
  assert.equal(scene().positions['beaker~2'], undefined, 'extra copy forgotten')
  scene().removeFromBench('beaker')
  assert.ok(scene().positions.beaker, 'original keeps its slot for re-placement')
  assert.match(scene().feedback, /returned to inventory/)
})

test('at least 15 items fit on the bench, all non-overlapping', () => {
  fresh()
  for (const entry of equipmentRegistry)
    for (let n = 0; n < (entry.maxInstances ?? 1); n++) scene().addToBench(entry.id)
  const { placedIds, positions } = scene()
  assert.ok(placedIds.length >= 15, `only ${placedIds.length} fit`)
  for (const id of placedIds)
    assert.equal(
      validatePlacement(id, positions[id], positions, placedIds).valid,
      true,
      `${id} overlaps or is off the bench`,
    )
})

test('undo/redo covers place, move, rotate, remove and reset; new actions clear redo', () => {
  fresh()
  const start = scene().positions.beaker
  scene().addToBench('graduated-cylinder')
  scene().move('beaker', { x: start.x, z: start.z - 0.4 })
  scene().rotate('beaker', 1)
  scene().removeFromBench('graduated-cylinder')
  assert.deepEqual(
    scene().past.map((entry) => entry.label),
    ['Place Graduated cylinder', 'Move Beaker', 'Rotate Beaker', 'Remove Graduated cylinder'],
  )
  assert.equal(scene().undo(), true)
  assert.ok(scene().placedIds.includes('graduated-cylinder'))
  assert.equal(scene().undo(), true)
  assert.equal(scene().rotations.beaker, 0)
  assert.equal(scene().undo(), true)
  assert.deepEqual(scene().positions.beaker, start)
  assert.match(scene().feedback, /Undid: Move Beaker/)
  assert.equal(scene().redo(), true)
  assert.equal(scene().positions.beaker.z, start.z - 0.4)
  assert.equal(scene().future.length, 2)
  scene().rotate('beaker', -1)
  assert.equal(scene().future.length, 0, 'a new action clears redo')

  scene().resetBench()
  assert.deepEqual(scene().placedIds, ['beaker', 'digital-balance'])
  assert.equal(scene().undo(), true)
  assert.ok(scene().placedIds.includes('graduated-cylinder'))

  scene().resetEquipment()
  assert.equal(scene().past.length, 0, 'restarting the experiment clears history')
  assert.equal(scene().undo(), false)
  assert.equal(scene().redo(), false)
})

test('history keeps only the last 20 actions and is blocked during placement', () => {
  fresh()
  for (let i = 0; i < 25; i++) scene().rotate('beaker', 1)
  assert.equal(scene().past.length, MAX_BENCH_HISTORY)
  scene().beginPlacement('spatula')
  assert.equal(scene().undo(), false)
  scene().cancelPlacement()
  assert.equal(scene().undo(), true)
})

test('a drag is one history entry; a click without movement adds none', () => {
  fresh()
  const start = scene().positions.beaker
  scene().beginDrag('beaker')
  for (let i = 1; i <= 5; i++) scene().move('beaker', { x: start.x, z: start.z - i * 0.05 })
  scene().finishDrag()
  assert.deepEqual(
    scene().past.map((entry) => entry.label),
    ['Move Beaker'],
  )
  scene().beginDrag('beaker')
  scene().finishDrag()
  assert.equal(scene().past.length, 1)
  scene().undo()
  assert.deepEqual(scene().positions.beaker, start)
})

test('waste bin: corner kept clear, drop removes, one undo restores the drag start', () => {
  assert.equal(isOverWasteBin({ x: WASTE_BIN.x, z: WASTE_BIN.z }), true)
  assert.equal(isOverWasteBin({ x: 0, z: 0 }), false)
  assert.equal(isOverWasteBin(null), false)
  assert.equal(
    validatePlacement('spatula', { x: WASTE_BIN.x, z: WASTE_BIN.z }, {}, []).valid,
    false,
  )
  for (const entry of equipmentRegistry) {
    const at = findSuggestedPosition(entry.id, {}, [])
    assert.ok(
      Math.hypot(at.x - WASTE_BIN.x, at.z - WASTE_BIN.z) >=
        entry.footprintRadius + WASTE_BIN.radius,
    )
  }

  fresh()
  scene().addToBench('beaker')
  const start = { ...scene().positions['beaker~2'] }
  scene().beginDrag('beaker~2')
  scene().move('beaker~2', { x: start.x + 0.05, z: start.z })
  scene().dropInWasteBin('beaker~2')
  assert.equal(scene().placedIds.includes('beaker~2'), false)
  assert.equal(scene().draggingId, null)
  assert.match(scene().feedback, /waste bin/)
  scene().undo()
  assert.deepEqual(scene().positions['beaker~2'], start)

  scene().dropInWasteBin('beaker')
  assert.match(scene().feedback, /returned to the inventory/)
})

test('snap rules: capture radius, rotation, occupancy, overlap and moving with the holder', () => {
  const rules = [
    {
      id: 'balance-holds-beaker',
      holderType: 'digital-balance',
      itemTypes: ['beaker'],
      offset: { x: 0.2, z: 0 },
      captureRadius: 0.25,
      label: 'on the balance',
    },
  ]
  const base = {
    placedIds: ['digital-balance', 'beaker', 'beaker~2'],
    positions: {
      'digital-balance': { x: 0, z: 0 },
      beaker: { x: 1, z: 0 },
      'beaker~2': { x: 2, z: 0 },
    },
    rotations: { 'digital-balance': 0 },
    relationships: {},
  }
  const match = findSnapTarget('beaker', { x: 0.3, z: 0.1 }, base, rules)
  assert.equal(match.holderId, 'digital-balance')
  assert.deepEqual(match.position, { x: 0.2, z: 0 })
  assert.equal(findSnapTarget('beaker', { x: 0.8, z: 0 }, base, rules), null)
  assert.equal(findSnapTarget('spatula', { x: 0.2, z: 0 }, base, rules), null)
  const turned = findSnapTarget(
    'beaker',
    { x: 0, z: -0.2 },
    { ...base, rotations: { 'digital-balance': Math.PI / 2 } },
    rules,
  )
  assert.ok(Math.abs(turned.position.z + 0.2) < 1e-9 && Math.abs(turned.position.x) < 1e-9)
  const taken = {
    ...base,
    relationships: { beaker: { actorId: 'beaker', targetId: 'digital-balance', kind: 'snapped' } },
  }
  assert.equal(
    findSnapTarget('beaker~2', { x: 0.2, z: 0 }, taken, rules),
    null,
    'one item per snap point',
  )
  assert.deepEqual([...snappedPartners('beaker', taken.relationships)], ['digital-balance'])
  assert.deepEqual(snappedChildren('digital-balance', taken.relationships), ['beaker'])
  assert.ok(SNAP_RULES.length >= 3)

  fresh()
  const balance = scene().positions['digital-balance']
  scene().snapTo('beaker', 'digital-balance', { x: balance.x + 0.2, z: balance.z })
  assert.equal(scene().relationships.beaker.kind, 'snapped')
  scene().move('digital-balance', { x: balance.x, z: balance.z - 0.3 })
  assert.equal(scene().relationships.beaker?.kind, 'snapped', 'still snapped after holder moves')
  assert.ok(
    Math.abs(scene().positions.beaker.z - (balance.z - 0.3)) < 1e-9,
    'child moved with holder',
  )
  scene().beginDrag('beaker')
  assert.equal(scene().relationships.beaker, undefined, 'dragging the child unsnaps it')
  scene().finishDrag()
})

test('bench toolbar renders labelled controls, disabled with nothing to act on', async () => {
  fresh()
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { BenchToolbar } = await vite.ssrLoadModule(
      '/src/features/simulations/components/BenchToolbar.tsx',
    )
    const html = await renderToStaticMarkup(React.createElement(BenchToolbar))
    assert.match(html, /role="toolbar"[^>]*aria-label="Bench tools"/)
    for (const label of ['Undo', 'Redo', 'Rotate left', 'Rotate right', 'Remove selected item'])
      assert.match(html, new RegExp(`<button[^>]*disabled=""[^>]*aria-label="${label}"`), label)
    assert.match(html, /aria-label="Reset bench layout"/)
  } finally {
    await vite.close()
  }
})

test('adaptive render quality steps resolution down and up within device limits', async () => {
  const { DPR_LEVELS, MIN_DPR, maxDprFor, stepDpr } =
    await import('../src/features/simulations/three/renderQuality.ts')
  assert.equal(maxDprFor(1), 1)
  assert.equal(maxDprFor(2), 1.5)
  assert.equal(maxDprFor(1.3), 1.25)
  assert.equal(maxDprFor(0.5), 1)
  assert.equal(maxDprFor(Number.NaN), 1)
  assert.equal(stepDpr(1, -1, 1), 0.875)
  assert.equal(stepDpr(0.875, -1, 1), 0.75)
  assert.equal(stepDpr(MIN_DPR, -1, 1), MIN_DPR, 'never below the minimum')
  assert.equal(stepDpr(0.75, 1, 1), 0.875)
  assert.equal(stepDpr(1, 1, 1), 1, 'never above the device maximum')
  assert.equal(stepDpr(1.5, -1, 1.5), 1.25)
  assert.equal(stepDpr(0.9, -1, 1), 0.75, 'off-grid values snap to the next level')
  assert.ok(DPR_LEVELS.every((level, i) => i === 0 || level < DPR_LEVELS[i - 1]))
})
