import { findSpatialAffordance, type SpatialAffordance } from '../engine/spatialInteractions.ts'
import { equipmentRegistry, type Point2D } from './sceneConfig.ts'

/** Match the actual gesture target's footprint-based, world-space contact gap. */
const CONTACT_GAP_METRES = 0.22

export interface AffordanceHintContext {
  actorId: string | null
  stepId: string | null
  completed: boolean
  placedIds: readonly string[]
  positions: Readonly<Record<string, Point2D>>
  waterMl: Readonly<{ water: number; 'graduated-cylinder': number; beaker: number }>
  saltStockG: number
  saltOnSpatulaG: number
  saltOnBoatG: number
  saltInBeakerG: number
  dissolvedSaltG: number
  recordedWaterMl: number | null
  recordedSaltG: number | null
}

export interface AffordanceHintTarget {
  targetId: string
  actorPosition: Point2D
  targetPosition: Point2D
  near: boolean
  gesture: SpatialAffordance['gesture']
  /** Instruction for the actor; readiness is determined separately by distance. */
  instruction: string
}

/** Read the actual chemical inventory and current validated step before suggesting a receiver. */
function expectedReceiver(context: AffordanceHintContext): {
  id: string
  gesture: SpatialAffordance['gesture']
  instruction: string
} | null {
  const {
    actorId,
    stepId,
    waterMl,
    saltStockG,
    saltOnSpatulaG,
    saltOnBoatG,
    saltInBeakerG,
    dissolvedSaltG,
    recordedWaterMl,
    recordedSaltG,
  } = context

  if (
    stepId === 'measure-water' &&
    actorId === 'water' &&
    waterMl.water > 0 &&
    waterMl['graduated-cylinder'] < 100 &&
    waterMl.beaker === 0
  )
    return {
      id: 'graduated-cylinder',
      gesture: 'tilt',
      instruction: 'Move near the cylinder, then right-drag to pour.',
    }

  if (
    stepId === 'transfer-water' &&
    actorId === 'graduated-cylinder' &&
    waterMl['graduated-cylinder'] > 0 &&
    waterMl.beaker < 100 &&
    recordedWaterMl === 100
  )
    return {
      id: 'beaker',
      gesture: 'tilt',
      instruction: 'Move near the beaker, then right-drag to transfer.',
    }

  if (stepId === 'measure-salt' && actorId === 'spatula') {
    if (saltOnSpatulaG === 0 && saltOnBoatG === 0 && saltStockG >= 5)
      return {
        id: 'sodium-chloride',
        gesture: 'scoop',
        instruction: 'Dip the spatula into the NaCl jar and move to scoop.',
      }
    if (saltOnSpatulaG === 5 && saltOnBoatG === 0)
      return {
        id: 'weighing-boat',
        gesture: 'release',
        instruction: 'Move near the weighing boat, then release the salt.',
      }
  }

  if (
    stepId === 'measure-salt' &&
    actorId === 'weighing-boat' &&
    saltOnBoatG === 5 &&
    saltOnSpatulaG === 0 &&
    recordedSaltG === null
  )
    return {
      id: 'digital-balance',
      gesture: 'release',
      instruction: 'Move the loaded boat to the balance pan and release.',
    }

  if (
    stepId === 'add-salt' &&
    actorId === 'weighing-boat' &&
    saltOnBoatG === 5 &&
    recordedSaltG === 5 &&
    waterMl.beaker === 100
  )
    return {
      id: 'beaker',
      gesture: 'tilt',
      instruction: 'Move near the beaker, then right-drag to add the salt.',
    }

  if (
    stepId === 'stir' &&
    actorId === 'stirring-rod' &&
    saltInBeakerG === 5 &&
    dissolvedSaltG < saltInBeakerG &&
    waterMl.beaker === 100
  )
    return {
      id: 'beaker',
      gesture: 'stir',
      instruction: 'Put the rod in the beaker and trace circles.',
    }

  return null
}

/**
 * Pure, rendering-independent hint selector. An incompatible actor, absent
 * receiver, completed workflow or invalid physical quantity cannot light up
 * another tool. Only the same XZ proximity used by gestures yields teal.
 */
export function resolveAffordanceHint(context: AffordanceHintContext): AffordanceHintTarget | null {
  if (context.completed || !context.actorId || !context.placedIds.includes(context.actorId))
    return null

  const candidate = expectedReceiver(context)
  if (!candidate || !context.placedIds.includes(candidate.id)) return null
  if (!findSpatialAffordance(context.actorId, candidate.id, candidate.gesture)) return null

  const actor = equipmentRegistry.find((item) => item.id === context.actorId)
  const target = equipmentRegistry.find((item) => item.id === candidate.id)
  if (!actor || !target) return null

  const actorPosition = context.positions[actor.id] ?? actor.defaultPosition
  const targetPosition = context.positions[target.id] ?? target.defaultPosition
  const maxDistance = actor.footprintRadius + target.footprintRadius + CONTACT_GAP_METRES
  const distanceSquared =
    (actorPosition.x - targetPosition.x) ** 2 + (actorPosition.z - targetPosition.z) ** 2

  return {
    targetId: target.id,
    actorPosition,
    targetPosition,
    gesture: candidate.gesture,
    instruction: candidate.instruction,
    near: distanceSquared <= maxDistance ** 2,
  }
}
