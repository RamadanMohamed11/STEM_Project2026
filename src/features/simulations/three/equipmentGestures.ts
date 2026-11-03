import { findSpatialAffordance } from '../engine/spatialInteractions.ts'
import { equipmentRegistry, type Point2D } from './sceneConfig.ts'

/** The 22 cm interaction gap is in world metres, in addition to the footprints. */
const NEAR_CONTACT_GAP = 0.22

/**
 * Choose the closest semantically valid target from the *placed* registry.
 * Never inspect mesh names or screen-space pixels to determine a lab action.
 */
export function findGestureTarget(
  actorId: string,
  gesture: 'release' | 'tilt' | 'scoop' | 'stir',
  position: Point2D,
  placedIds: readonly string[],
  positions: Record<string, Point2D>,
): string | null {
  const actor = equipmentRegistry.find((item) => item.id === actorId)
  if (!actor || !placedIds.includes(actorId)) return null
  // The direct-from-stock shortcuts are no longer chemically valid:
  // salt has to be scooped onto the spatula and weighed in the boat.
  if (actorId === 'sodium-chloride') return null

  let closest: string | null = null
  let closestDistanceSquared = Infinity
  for (const target of equipmentRegistry) {
    if (
      target.id === actorId ||
      !placedIds.includes(target.id) ||
      !findSpatialAffordance(actorId, target.id, gesture)
    )
      continue
    const at = positions[target.id] ?? target.defaultPosition
    const dx = position.x - at.x
    const dz = position.z - at.z
    const distanceSquared = dx * dx + dz * dz
    const limit = actor.footprintRadius + target.footprintRadius + NEAR_CONTACT_GAP
    if (distanceSquared <= limit * limit && distanceSquared < closestDistanceSquared) {
      closest = target.id
      closestDistanceSquared = distanceSquared
    }
  }
  return closest
}

/** A stir requires the cursor's projected rod tip to enter the beaker opening. */
export function overVesselOpening(
  vesselId: 'beaker' | 'sodium-chloride',
  point: Point2D,
  placedIds: readonly string[],
  positions: Record<string, Point2D>,
): boolean {
  if (!placedIds.includes(vesselId)) return false
  const center =
    positions[vesselId] ?? equipmentRegistry.find((item) => item.id === vesselId)?.defaultPosition
  if (!center) return false
  const dx = point.x - center.x
  const dz = point.z - center.z
  const mouthRadius = vesselId === 'beaker' ? 0.22 : 0.18
  return dx * dx + dz * dz <= mouthRadius * mouthRadius
}

export function overBeakerOpening(
  point: Point2D,
  placedIds: readonly string[],
  positions: Record<string, Point2D>,
): boolean {
  return overVesselOpening('beaker', point, placedIds, positions)
}
