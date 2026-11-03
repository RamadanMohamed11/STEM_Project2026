import { EQUIPMENT_LIMITS, equipmentRegistry, type Point2D } from './sceneConfig.ts'

export const INITIAL_PLACED_IDS = ['beaker', 'digital-balance'] as const
export type PlacementProblem = 'unknown-item' | 'out-of-bounds' | 'occupied'
export type PlacementCheck = { valid: true } | { valid: false; reason: PlacementProblem }

/** Footprint checks deliberately use real bench X/Z metres, never pixel positions. */
export function validatePlacement(
  id: string,
  proposed: Point2D,
  positions: Record<string, Point2D>,
  placedIds: readonly string[],
): PlacementCheck {
  const item = equipmentRegistry.find((part) => part.id === id)
  if (!item) return { valid: false, reason: 'unknown-item' }

  const radius = item.footprintRadius
  if (
    !Number.isFinite(proposed.x) ||
    !Number.isFinite(proposed.z) ||
    proposed.x - radius < EQUIPMENT_LIMITS.minX ||
    proposed.x + radius > EQUIPMENT_LIMITS.maxX ||
    proposed.z - radius < EQUIPMENT_LIMITS.minZ ||
    proposed.z + radius > EQUIPMENT_LIMITS.maxZ
  )
    return { valid: false, reason: 'out-of-bounds' }

  for (const otherId of placedIds) {
    if (otherId === id) continue
    const other = equipmentRegistry.find((part) => part.id === otherId)
    const position = positions[otherId]
    if (!other || !position) continue
    const dx = proposed.x - position.x
    const dz = proposed.z - position.z
    const separation = radius + other.footprintRadius + 0.055
    if (dx * dx + dz * dz < separation * separation) {
      return { valid: false, reason: 'occupied' }
    }
  }
  return { valid: true }
}

export function placementMessage(reason: PlacementProblem): string {
  switch (reason) {
    case 'unknown-item':
      return 'This inventory item is not registered for 3D placement.'
    case 'out-of-bounds':
      return 'Outside the workbench. Move the preview back onto the table.'
    case 'occupied':
      return 'That space is occupied. Choose a clear position.'
  }
}

/** Search deterministic tabletop slots; also supports placement without pointer input. */
export function findSuggestedPosition(
  id: string,
  positions: Record<string, Point2D>,
  placedIds: readonly string[],
): Point2D | null {
  const item = equipmentRegistry.find((part) => part.id === id)
  if (!item) return null
  const candidates: Point2D[] = [item.defaultPosition]
  for (const z of [-0.9, 0, 0.85]) {
    for (let x = -2.45; x <= 2.5; x += 0.35) candidates.push({ x: Number(x.toFixed(2)), z })
  }
  return (
    candidates.find((point) => validatePlacement(id, point, positions, placedIds).valid) ?? null
  )
}

/** Backward-compatible safe-move helper for existing callers/tests. */
export function placeEquipment(
  id: string,
  requested: Point2D,
  positions: Record<string, Point2D>,
): Point2D {
  return validatePlacement(id, requested, positions, Object.keys(positions)).valid
    ? requested
    : (positions[id] ??
        equipmentRegistry.find((part) => part.id === id)?.defaultPosition ?? { x: 0, z: 0 })
}

export function makeInitialPositions(): Record<string, Point2D> {
  return Object.fromEntries(equipmentRegistry.map((part) => [part.id, { ...part.defaultPosition }]))
}
