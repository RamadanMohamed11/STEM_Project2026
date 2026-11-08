/**
 * Semantic spatial affordances. Rendering code supplies equipment IDs and a
 * genuinely detected spatial target; only this registry decides what a touch,
 * insertion, balance placement or deliberate tilt means.
 *
 * These are teaching affordances, not a continuous fluid or rigid-body solver.
 */
export type ApparatusId =
  | 'water'
  | 'graduated-cylinder'
  | 'beaker'
  | 'sodium-chloride'
  | 'stirring-rod'
  | 'digital-balance'
  | 'spatula'
  | 'weighing-boat'

export type SpatialRelationKind =
  | 'liquid-receiver'
  | 'solid-receiver'
  | 'insertion'
  | 'balance-contact'
  | 'scoop'
  | 'solid-deposit'
  /** L3: locked to a holder's snap point (tripod, clamp stand…); moves with the holder. */
  | 'snapped'

export interface SpatialRelationship {
  actorId: string
  targetId: string
  kind: SpatialRelationKind
}

export interface SpatialAffordance {
  actor: ApparatusId
  target: ApparatusId
  relation: SpatialRelationKind
  gesture: 'tilt' | 'stir' | 'release' | 'scoop'
  instruction: string
}

export const SPATIAL_AFFORDANCES: readonly SpatialAffordance[] = [
  {
    actor: 'water',
    target: 'graduated-cylinder',
    relation: 'liquid-receiver',
    gesture: 'tilt',
    instruction: 'Hold the water vessel near the cylinder, then Shift-drag to tilt and pour.',
  },
  {
    actor: 'graduated-cylinder',
    target: 'beaker',
    relation: 'liquid-receiver',
    gesture: 'tilt',
    instruction: 'Position the cylinder beside the beaker, then Shift-drag to tilt it.',
  },
  {
    actor: 'weighing-boat',
    target: 'beaker',
    relation: 'solid-receiver',
    gesture: 'tilt',
    instruction: 'After weighing the 5 g portion, tilt the weighing boat over the beaker.',
  },
  {
    actor: 'weighing-boat',
    target: 'digital-balance',
    relation: 'balance-contact',
    gesture: 'release',
    instruction: 'Bring the loaded weighing boat to the balance for a model-derived mass.',
  },
  {
    actor: 'spatula',
    target: 'sodium-chloride',
    relation: 'scoop',
    gesture: 'scoop',
    instruction:
      'Dip the spatula tip into the NaCl jar, then move to collect a modelled 5 g portion.',
  },
  {
    actor: 'spatula',
    target: 'weighing-boat',
    relation: 'solid-deposit',
    gesture: 'release',
    instruction: 'Bring the loaded spatula near the weighing boat and release its solids.',
  },
  {
    actor: 'stirring-rod',
    target: 'beaker',
    relation: 'insertion',
    gesture: 'stir',
    instruction: 'Hold the rod tip inside the beaker and move it in repeated stirring strokes.',
  },
] as const

export function findSpatialAffordance(
  actor: string,
  target: string | null,
  gesture: SpatialAffordance['gesture'],
): SpatialAffordance | null {
  if (!target) return null
  return (
    SPATIAL_AFFORDANCES.find(
      (rule) => rule.actor === actor && rule.target === target && rule.gesture === gesture,
    ) ?? null
  )
}

/** A cached contact must match its entire tuple and still reference placed apparatus.
 * This validates semantic contact, not coordinates or renderer pointer history. */
export function hasValidSpatialRelationship(
  relationships: Readonly<Record<string, SpatialRelationship>>,
  placedIds: readonly string[],
  actorId: string,
  targetId: string,
  kind: SpatialRelationKind,
): boolean {
  const contact = relationships[actorId]
  return (
    placedIds.includes(actorId) &&
    placedIds.includes(targetId) &&
    contact?.actorId === actorId &&
    contact.targetId === targetId &&
    contact.kind === kind &&
    SPATIAL_AFFORDANCES.some(
      (rule) => rule.actor === actorId && rule.target === targetId && rule.relation === kind,
    )
  )
}

/** Physical rules are independent from React components and mesh naming. */
export function isSpatialTarget(actor: string, target: string): boolean {
  return SPATIAL_AFFORDANCES.some((rule) => rule.actor === actor && rule.target === target)
}
