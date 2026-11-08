/**
 * L3 bench layout rules (pure): snap points and the waste bin.
 * Snap rules are data: when an item is released close enough to a compatible holder it locks to
 * the holder's snap point, may overlap the holder's footprint, and moves with the holder.
 */
import {
  BENCH_TOP,
  EQUIPMENT_LIMITS,
  instanceTypeId,
  isExtraInstance,
  type Point2D,
} from './sceneConfig.ts'
import type { SpatialRelationship } from '../engine/spatialInteractions.ts'
import {
  CLAMP_JAW_Y,
  CLAMP_REACH,
  GAUZE_THICKNESS,
  TRIPOD_TOP,
  LIBRARY_MODEL_IDS,
  getLibraryModel,
} from './models/library/modelSpecs.ts'

/** L8: pan height and centre of the practice balance (same housing as the salt balance). */
export const BALANCE_PAN_Y = 0.208
const BALANCE_PAN_Z = -0.047
/** Vessels that stand on a stand or tap, not on a balance pan. */
const NOT_ON_BALANCE = new Set([
  'burette',
  'separating-funnel',
  'spirit-lamp',
  'trough',
  'water-bath',
])
const BALANCE_ITEMS = [
  'beaker',
  'graduated-cylinder',
  ...LIBRARY_MODEL_IDS.filter((id) => getLibraryModel(id)?.vessel && !NOT_ON_BALANCE.has(id)),
]

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
  /** L4: height the snapped item is raised to (metres above the bench). Default 0. */
  elevation?: number
  /** Per item type override of `elevation`. */
  elevationByType?: Readonly<Record<string, number>>
  /** L8: only practice copies (`type~2`) of the holder hold items (the salt balance does not). */
  extraHolderOnly?: boolean
}

/** Lift for vessels on the tripod (ring top + gauze), from the L4 model dimensions. */
const ON_TRIPOD = TRIPOD_TOP + 0.018 + GAUZE_THICKNESS

/**
 * Snap rules use the L4 library models (tripod, wire gauze, clamp stand, burette stand, rack).
 * `elevation` raises the snapped item to the holder's support (per item type when given).
 */
export const SNAP_RULES: readonly SnapRule[] = [
  {
    id: 'tripod-holds-vessel',
    holderType: 'tripod',
    itemTypes: [
      'beaker',
      'beaker-100',
      'erlenmeyer-flask',
      'erlenmeyer-flask-100',
      'evaporating-dish',
      'round-bottom-flask',
    ],
    offset: { x: 0, z: 0 },
    captureRadius: 0.3,
    label: 'on the tripod',
    elevation: ON_TRIPOD,
  },
  {
    id: 'gauze-on-tripod',
    holderType: 'tripod',
    itemTypes: ['wire-gauze'],
    offset: { x: 0, z: 0 },
    captureRadius: 0.3,
    label: 'on the tripod',
    elevation: TRIPOD_TOP + 0.018,
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
      'erlenmeyer-flask-100',
      'round-bottom-flask',
      'test-tube',
      'hard-glass-tube',
      'graduated-cylinder',
    ],
    offset: { x: CLAMP_REACH, z: 0 },
    captureRadius: 0.3,
    label: 'in the clamp',
    // Jaws grip the neck: raise each item so its neck meets the jaws.
    elevationByType: {
      'erlenmeyer-flask': CLAMP_JAW_Y - 0.75,
      'erlenmeyer-flask-100': CLAMP_JAW_Y - 0.57,
      'round-bottom-flask': CLAMP_JAW_Y - 0.82,
      'test-tube': CLAMP_JAW_Y - 0.7,
      'hard-glass-tube': CLAMP_JAW_Y - 0.8,
      'graduated-cylinder': CLAMP_JAW_Y - 0.9,
    },
  },
  {
    id: 'flask-under-burette',
    holderType: 'burette',
    itemTypes: ['erlenmeyer-flask', 'erlenmeyer-flask-100', 'beaker-100'],
    offset: { x: 0, z: 0 },
    captureRadius: 0.3,
    label: 'under the burette',
    elevation: 0.035,
  },
  {
    id: 'rack-holds-test-tube',
    holderType: 'test-tube-rack',
    itemTypes: ['test-tube'],
    offset: { x: -0.3, z: 0 },
    captureRadius: 0.25,
    label: 'in the rack',
    elevation: 0.025,
  },
  {
    id: 'balance-holds-vessel',
    holderType: 'digital-balance',
    itemTypes: BALANCE_ITEMS,
    offset: { x: 0, z: BALANCE_PAN_Z },
    captureRadius: 0.3,
    label: 'on the balance pan',
    elevation: BALANCE_PAN_Y,
    extraHolderOnly: true,
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
      if (rule.extraHolderOnly && !isExtraInstance(holderId)) continue
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

/** Height an item is raised to by the snap rule it is held by (0 when not snapped). */
export function snapElevation(
  id: string,
  relationships: Readonly<Record<string, SpatialRelationship>>,
  rules: readonly SnapRule[] = SNAP_RULES,
) {
  const relation = relationships[id]
  if (!relation || relation.kind !== 'snapped' || relation.actorId !== id) return 0
  const type = instanceTypeId(id)
  const holderType = instanceTypeId(relation.targetId)
  const rule = rules.find(
    (candidate) => candidate.holderType === holderType && candidate.itemTypes.includes(type),
  )
  return rule?.elevationByType?.[type] ?? rule?.elevation ?? 0
}

/**
 * Holders on the bench that `id` could snap to. While dragging, the item may pass over their
 * footprint so it can reach the snap point; a release that does not snap is rejected.
 */
export function snapHolderCandidates(
  id: string,
  placedIds: readonly string[],
  rules: readonly SnapRule[] = SNAP_RULES,
) {
  const type = instanceTypeId(id)
  const holders = new Set<string>()
  for (const holderId of placedIds) {
    if (holderId === id) continue
    const holderType = instanceTypeId(holderId)
    if (
      rules.some(
        (rule) =>
          rule.holderType === holderType &&
          rule.itemTypes.includes(type) &&
          (!rule.extraHolderOnly || isExtraInstance(holderId)),
      )
    )
      holders.add(holderId)
  }
  return holders
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
