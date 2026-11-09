import { useLabSceneStore } from '../state/useLabSceneStore.ts'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore.ts'
import { useBenchLiquidsStore } from '../state/useBenchLiquidsStore.ts'
import {
  findSnapTarget,
  SNAP_RULES,
  rotateSnapOffset,
  snappedChildren,
} from '../three/benchLayout.ts'
import { resolveEquipment, type Point2D } from '../three/sceneConfig.ts'
import { handlePhysicalInteraction } from '../state/directInteractions.ts'

export function benchControlsLocked() {
  const scene = useLabSceneStore.getState(),
    salt = useSaltSimulationStore.getState()
  return !!(
    scene.placement ||
    scene.pressedId ||
    scene.draggingId ||
    salt.transfer ||
    salt.effect ||
    salt.livePour ||
    useBenchLiquidsStore.getState().pour
  )
}
export function moveBenchItem(id: string, position: Point2D) {
  const scene = useLabSceneStore.getState()
  if (
    benchControlsLocked() ||
    !scene.placedIds.includes(id) ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.z)
  )
    return false
  if (useBenchLiquidsStore.getState().checkHotTouch(id, scene.relationships)) return false
  scene.beginDrag(id)
  scene.move(id, position)
  scene.finishDrag()
  const actual = useLabSceneStore.getState().positions[id]
  return actual.x === position.x && actual.z === position.z
}
export function attachBenchItem(id: string, holderId: string) {
  const scene = useLabSceneStore.getState()
  if (benchControlsLocked() || !scene.placedIds.includes(id) || !scene.placedIds.includes(holderId))
    return false
  if (
    useBenchLiquidsStore.getState().checkHotTouch(id, scene.relationships) ||
    useBenchLiquidsStore.getState().checkHotTouch(holderId, scene.relationships)
  )
    return false
  const target = scene.positions[holderId]
  const snap = SNAP_RULES.flatMap((rule) => {
    const offset = rotateSnapOffset(rule.offset, scene.rotations[holderId] ?? 0)
    const candidate = { x: target.x + offset.x, z: target.z + offset.z }
    const match = findSnapTarget(id, candidate, { ...scene, placedIds: [id, holderId] }, [rule])
    return match ? [match] : []
  })[0]
  const saltBalance = id === 'weighing-boat' && holderId === 'digital-balance'
  if ((!snap || snap.holderId !== holderId) && !saltBalance) return false
  const position = snap?.position ?? target
  scene.beginDrag(id)
  scene.move(id, position, new Set([holderId, ...snappedChildren(holderId, scene.relationships)]))
  const actual = useLabSceneStore.getState().positions[id]
  if (actual.x === position.x && actual.z === position.z && snap)
    scene.snapTo(id, holderId, position)
  scene.finishDrag()
  if (actual.x !== position.x || actual.z !== position.z) return false
  if (saltBalance)
    return handlePhysicalInteraction({ actorId: id, targetId: holderId, gesture: 'release' })
  return true
}
export function describeBench(ids: readonly string[], selected: readonly string[]) {
  const labels = (items: readonly string[]) =>
    items.map((id) => `${resolveEquipment(id)?.label ?? id} (${id})`).join(', ')
  return `${ids.length} items on the bench: ${labels(ids)}. Selected: ${selected.length ? labels(selected) : 'none'}.`
}
