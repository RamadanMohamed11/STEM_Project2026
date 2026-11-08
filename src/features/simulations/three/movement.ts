import { WASTE_BIN } from './benchLayout.ts'
import { resolveEquipment, EQUIPMENT_LIMITS, equipmentRegistry, type Point2D } from './sceneConfig.ts'

export const INITIAL_PLACED_IDS = ['beaker', 'digital-balance'] as const
export type PlacementProblem = 'unknown-item' | 'out-of-bounds' | 'occupied'
export type PlacementCheck = { valid: true } | { valid: false; reason: PlacementProblem }

/** Footprint checks deliberately use real bench X/Z metres, never pixel positions. */
export function validatePlacement(
  id: string,
  proposed: Point2D,
  positions: Record<string, Point2D>,
  placedIds: readonly string[],
  /** L3: ids allowed to overlap (snapped holder/children). */
  overlapAllowed?: ReadonlySet<string>,
): PlacementCheck {
  const item = resolveEquipment(id)
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

  // L3: keep the waste-bin corner clear so it can always be reached.
  if (Math.hypot(proposed.x - WASTE_BIN.x, proposed.z - WASTE_BIN.z) < radius + WASTE_BIN.radius)
    return { valid: false, reason: 'occupied' }

  for (const otherId of placedIds) {
    if (otherId === id || overlapAllowed?.has(otherId)) continue
    const other = resolveEquipment(otherId)
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
  const item = resolveEquipment(id)
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
        resolveEquipment(id)?.defaultPosition ?? { x: 0, z: 0 })
}

/**
 * Sweep the entire pointer segment, not just its endpoint. Kinematic Rapier bodies
 * cannot stop one another, and sparse pointer events must not tunnel through tools.
 * Short bounded steps also let a blocked grab slide along a surface instead of sticking.
 */
export function constrainDragMovement(
  id: string,
  from: Point2D,
  requested: Point2D,
  positions: Record<string, Point2D>,
  placedIds: readonly string[],
  overlapAllowed?: ReadonlySet<string>,
): Point2D {
  const item = resolveEquipment(id)
  if (!item || !Number.isFinite(requested.x) || !Number.isFinite(requested.z)) return from
  const radius = item.footprintRadius
  const target = {
    x: Math.max(
      EQUIPMENT_LIMITS.minX + radius,
      Math.min(EQUIPMENT_LIMITS.maxX - radius, requested.x),
    ),
    z: Math.max(
      EQUIPMENT_LIMITS.minZ + radius,
      Math.min(EQUIPMENT_LIMITS.maxZ - radius, requested.z),
    ),
  }
  const dx = target.x - from.x
  const dz = target.z - from.z
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.025))
  let current = from
  const valid = (point: Point2D) =>
    validatePlacement(id, point, positions, placedIds, overlapAllowed).valid
  for (let index = 0; index < steps; index++) {
    const next = { x: current.x + dx / steps, z: current.z + dz / steps }
    if (valid(next)) current = next
    else {
      const alongX = { x: next.x, z: current.z }
      const alongZ = { x: current.x, z: next.z }
      // Advance the larger component first for deterministic, natural boundary sliding.
      const candidates = Math.abs(dx) >= Math.abs(dz) ? [alongX, alongZ] : [alongZ, alongX]
      const slide = candidates.find(valid)
      if (slide) current = slide
      else break
    }
  }
  return current
}

export function makeInitialPositions(): Record<string, Point2D> {
  return Object.fromEntries(equipmentRegistry.map((part) => [part.id, { ...part.defaultPosition }]))
}
