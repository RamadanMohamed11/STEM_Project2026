/**
 * L3 bench layout rules (pure): snap points and the waste bin.
 * Snap rules are data: when an item is released close enough to a compatible holder it locks to
 * the holder's snap point, may overlap the holder's footprint, and moves with the holder.
 */
import { BENCH_TOP, EQUIPMENT_LIMITS, instanceTypeId, type Point2D } from './sceneConfig.ts'
import type { SpatialRelationship } from '../engine/spatialInteractions.ts'

export interface SnapRule {
  id: string
  /** Equipment type that holds (e.g. 'tripod'). */
  holderType: string
  /** Equipment types that can snap to it. */
  itemTypes: readonly string[]
  /** Snap point relative to the holder, in metres (rotated with the holder). */
  offset: Point2D
  /** Release distance from the snap point that captures the item (metres). */
  captureRadius: number
  label: string
}

/**
 * Holder types arrive with the L4 models (tripod, clamp stand, burner). Until then these rules are
 * inert because no holder of these types can be on the bench.
 */
export const SNAP_RULES: readonly SnapRule[] = [
  {
    id: 'tripod-holds-vessel',
    holderType: 'tripod',
    itemTypes: [
      'beaker',
      'beaker-100',
      'erlenmeyer-flask',
      'evaporating-dish',
      'round-bottom-flask',
    ],
    offset: { x: 0, z: 0 },
    captureRadius: 0.3,
    label: 'on the tripod',
  },
  {
    id: 'burner-under-tripod',
    holderType: 'tripod',
    itemTypes: ['bunsen-burner', 'spirit-lamp'],
    offset: { x: 0, z: 0 },
    captureRadius: 0.3,
    label: 'under the tripod',
  },
  {
    id: 'clamp-holds-glassware',
    holderType: 'clamp-stand',
    itemTypes: [
      'erlenmeyer-flask',
      'round-bottom-flask',
      'test-tube',
      'burette',
      'graduated-cylinder',
    ],
    offset: { x: 0.32, z: 0 },
    captureRadius: 0.3,
    label: 'in the clamp',
  },
]

export interface SnapMatch {
  rule: SnapRule
  holderId: string
  position: Point2D
}

function rotate(offset: Point2D, angle: number): Point2D {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return { x: offset.x * cos + offset.z * sin, z: -offset.x * sin + offset.z * cos }
}

/** Nearest compatible free snap point within its capture radius, or null. */
export function findSnapTarget(
  id: string,
  released: Point2D,
  state: {
    placedIds: readonly string[]
    positions: Record<string, Point2D>
    rotations: Record<string, number>
    relationships: Readonly<Record<string, SpatialRelationship>>
  },
  rules: readonly SnapRule[] = SNAP_RULES,
): SnapMatch | null {
  const type = instanceTypeId(id)
  let best: SnapMatch | null = null
  let bestDistance = Infinity
  for (const holderId of state.placedIds) {
    if (holderId === id) continue
    const holderType = instanceTypeId(holderId)
    const at = state.positions[holderId]
    if (!at) continue
    for (const rule of rules) {
      if (rule.holderType !== holderType || !rule.itemTypes.includes(type)) continue
      const occupied = Object.values(state.relationships).some(
        (relation) =>
          relation.kind === 'snapped' &&
          relation.targetId === holderId &&
          relation.actorId !== id &&
          rules.some(
            (other) =>
              other.id === rule.id && other.itemTypes.includes(instanceTypeId(relation.actorId)),
          ),
      )
      if (occupied) continue
      const offset = rotate(rule.offset, state.rotations[holderId] ?? 0)
      const position = { x: at.x + offset.x, z: at.z + offset.z }
      const distance = Math.hypot(released.x - position.x, released.z - position.z)
      if (distance <= rule.captureRadius && distance < bestDistance) {
        best = { rule, holderId, position }
        bestDistance = distance
      }
    }
  }
  return best
}

/** Ids that may overlap `id` because one is snapped to the other. */
export function snappedPartners(
  id: string,
  relationships: Readonly<Record<string, SpatialRelationship>>,
) {
  const partners = new Set<string>()
  for (const relation of Object.values(relationships)) {
    if (relation.kind !== 'snapped') continue
    if (relation.actorId === id) partners.add(relation.targetId)
    if (relation.targetId === id) partners.add(relation.actorId)
  }
  return partners
}

/** Ids snapped onto a holder (they move with it). */
export function snappedChildren(
  holderId: string,
  relationships: Readonly<Record<string, SpatialRelationship>>,
) {
  return Object.values(relationships)
    .filter((relation) => relation.kind === 'snapped' && relation.targetId === holderId)
    .map((relation) => relation.actorId)
}

/**
 * Waste bin: a marked corner of the bench. Releasing a dragged item with the pointer inside
 * removes it (extra copies are deleted; experiment originals return to the inventory).
 */
export const WASTE_BIN = {
  x: EQUIPMENT_LIMITS.maxX - 0.3,
  z: EQUIPMENT_LIMITS.maxZ - 0.22,
  radius: 0.3,
  y: BENCH_TOP + 0.002,
} as const

export function isOverWasteBin(point: Point2D | null | undefined) {
  return !!point && Math.hypot(point.x - WASTE_BIN.x, point.z - WASTE_BIN.z) <= WASTE_BIN.radius
}
