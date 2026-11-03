import assert from 'node:assert/strict'
import test from 'node:test'
import { saltDissolutionWorkspace } from '../src/features/simulations/data/saltDissolutionWorkspace.ts'
import {
  INITIAL_PLACED_IDS,
  findSuggestedPosition,
  makeInitialPositions,
  placeEquipment,
  validatePlacement,
} from '../src/features/simulations/three/movement.ts'
import {
  EQUIPMENT_LIMITS,
  equipmentRegistry,
} from '../src/features/simulations/three/sceneConfig.ts'
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'

test('registry maps every existing inventory item to a unique 3D instance', () => {
  assert.deepEqual(
    new Set(equipmentRegistry.map((entry) => entry.id)),
    new Set(saltDissolutionWorkspace.inventory.map((item) => item.id)),
  )
  assert.equal(new Set(equipmentRegistry.map((entry) => entry.visual)).size, 8)
})

test('positions remain on table, preventing collisions with adjacent equipment', () => {
  const positions = makeInitialPositions()
  const moved = placeEquipment('beaker', { x: 9, z: 9 }, positions)
  assert.ok(moved.x <= EQUIPMENT_LIMITS.maxX)
  assert.ok(moved.z <= EQUIPMENT_LIMITS.maxZ)
  const blocked = placeEquipment('beaker', positions['digital-balance'], positions)
  assert.deepEqual(blocked, positions.beaker)
  assert.deepEqual(placeEquipment('unknown', { x: 0, z: 0 }, positions), { x: 0, z: 0 })
})

test('shared scene store supports selecting, moving, resetting, and camera resets', () => {
  const store = useLabSceneStore
  store.getState().resetEquipment()
  store.getState().select('beaker')
  assert.equal(store.getState().selectedId, 'beaker')
  store.getState().beginDrag('beaker')
  assert.equal(store.getState().draggingId, 'beaker')
  store.getState().move('beaker', { x: 0.8, z: -0.12 })
  assert.deepEqual(store.getState().positions.beaker, { x: 0.8, z: -0.12 })
  store.getState().finishDrag()
  assert.equal(store.getState().draggingId, null)
  const oldKey = store.getState().cameraResetKey
  store.getState().resetCamera()
  assert.equal(store.getState().cameraResetKey, oldKey + 1)
  store.getState().resetEquipment()
  assert.deepEqual(store.getState().positions, makeInitialPositions())
  assert.equal(store.getState().selectedId, null)
})

test('the bench starts with two instruments and can preview and confirm inventory placement', () => {
  const store = useLabSceneStore
  store.getState().resetEquipment()
  assert.deepEqual(store.getState().placedIds, [...INITIAL_PLACED_IDS])
  store.getState().beginPlacement('water')
  assert.equal(store.getState().selectedId, 'water')
  assert.equal(store.getState().placement?.id, 'water')
  assert.equal(store.getState().placement?.valid, true)
  assert.equal(store.getState().placedIds.includes('water'), false)
  const target = store.getState().positions.beaker
  store.getState().updatePlacement(target)
  assert.equal(store.getState().placement?.valid, false)
  assert.equal(store.getState().confirmPlacement(), false)
  assert.equal(store.getState().placedIds.includes('water'), false)
  store.getState().updatePlacement({ x: -1.15, z: -0.5 })
  assert.equal(store.getState().placement?.valid, true)
  assert.equal(store.getState().confirmPlacement(), true)
  assert.equal(store.getState().placement, null)
  assert.equal(store.getState().placedIds.includes('water'), true)
  assert.deepEqual(store.getState().positions.water, { x: -1.15, z: -0.5 })
})

test('cancellation, selection, hovering, rotation and returning work independently of physics', () => {
  const store = useLabSceneStore
  store.getState().resetEquipment()
  store.getState().beginPlacement('sodium-chloride')
  store.getState().cancelPlacement()
  assert.equal(store.getState().placement, null)
  assert.equal(store.getState().placedIds.includes('sodium-chloride'), false)
  store.getState().select('beaker')
  store.getState().setHovered('beaker')
  assert.equal(store.getState().hoveredId, 'beaker')
  store.getState().rotate('beaker', 1)
  assert.equal(store.getState().rotations.beaker, Math.PI / 8)
  store.getState().select('beaker')
  assert.equal(store.getState().selectedId, null)
  store.getState().removeFromBench('beaker')
  assert.equal(store.getState().placedIds.includes('beaker'), false)
  store.getState().move('beaker', { x: 0, z: 0 })
  assert.notDeepEqual(store.getState().positions.beaker, { x: 0, z: 0 })
  store.getState().resetEquipment()
})

test('TILT grip hover has its own cursor mode and clears during grab/restart', () => {
  const store = useLabSceneStore
  store.getState().resetEquipment()
  store.getState().setTiltHandleHovered('beaker')
  assert.equal(store.getState().tiltHandleHoveredId, 'beaker')
  store.getState().beginDrag('beaker')
  assert.equal(store.getState().tiltHandleHoveredId, null)
  store.getState().finishDrag()
  store.getState().setTiltHandleHovered('water')
  store.getState().resetEquipment()
  assert.equal(store.getState().tiltHandleHoveredId, null)
})

test('placement validates bench limits, existing apparatus and available suggested slots', () => {
  const positions = makeInitialPositions()
  const occupied = [...INITIAL_PLACED_IDS]
  assert.deepEqual(validatePlacement('water', { x: 20, z: 0 }, positions, occupied), {
    valid: false,
    reason: 'out-of-bounds',
  })
  assert.deepEqual(validatePlacement('water', positions.beaker, positions, occupied), {
    valid: false,
    reason: 'occupied',
  })
  const available = findSuggestedPosition('water', positions, occupied)
  assert.ok(available)
  assert.deepEqual(validatePlacement('water', available, positions, occupied), { valid: true })
})

test('all six demonstration items can be placed one at a time without collisions', () => {
  const store = useLabSceneStore
  store.getState().resetEquipment()
  for (const entry of equipmentRegistry) {
    if (store.getState().placedIds.includes(entry.id)) continue
    store.getState().beginPlacement(entry.id)
    assert.equal(store.getState().placement?.valid, true)
    assert.equal(store.getState().confirmPlacement(), true)
  }
  assert.equal(store.getState().placedIds.length, equipmentRegistry.length)
  for (const id of store.getState().placedIds) {
    assert.equal(
      validatePlacement(
        id,
        store.getState().positions[id],
        store.getState().positions,
        store.getState().placedIds,
      ).valid,
      true,
    )
  }
  store.getState().resetEquipment()
})
