import { findSpatialAffordance } from '../engine/spatialInteractions.ts'
import { useLabSceneStore } from './useLabSceneStore.ts'
import { useSaltSimulationStore } from './useSaltSimulationStore.ts'
import { useLabSafetyStore } from './useLabSafetyStore.ts'

/** Trusted renderer-detected intent: proximity and circular-path evidence are
 * not present in this legacy payload and must be validated by its producer. */
export interface PhysicalInteraction {
  actorId: string
  targetId: string | null
  gesture: 'release' | 'tilt' | 'stir' | 'scoop'
  magnitude?: number
  /** Optional active stirring slice; omitted callers retain the legacy action. */
  elapsedMs?: number
}

/** Backward-compatible legacy API for older tests; no longer advances progress.
 * Live execution advances exclusively through typed physical semantic events. */
export function advanceValidatedWorkflow(): void {
  // Intentionally empty: observing a finished animation or calling this
  // historical method must never create scientific completion evidence.
}

/** Explicit safety acknowledgement is evidence; the pre-placed beaker must also
 * be observed in the authoritative scene, never fabricated by a Next button. */
export function acknowledgeLabSafety(): boolean {
  const success = useSaltSimulationStore.getState().emit({ type: 'SAFETY_ACKNOWLEDGED' })
  if (success && useLabSceneStore.getState().placedIds.includes('beaker'))
    useSaltSimulationStore.getState().emit({
      type: 'EQUIPMENT_PLACEMENT_VALIDATED',
      equipmentId: 'beaker',
    })
  return success
}

/**
 * Called while a source vessel is physically HELD and tilted. No button,
 * replay or precomputed 100mL animation can commit water. Each elapsed
 * time slice is converted into an integer quantity and atomically validated.
 */
export function updatePhysicalPour({
  actorId,
  targetId,
  angle,
  deltaMs,
}: {
  actorId: string
  targetId: string | null
  angle: number
  deltaMs: number
}): boolean {
  const active = findSpatialAffordance(actorId, targetId, 'tilt')?.relation === 'liquid-receiver'
  if (!active || !targetId || angle < 0.45 || !Number.isFinite(angle)) {
    useSaltSimulationStore.getState().stopStream()
    return false
  }
  if (
    (actorId !== 'water' && actorId !== 'graduated-cylinder') ||
    (targetId !== 'beaker' && targetId !== 'graduated-cylinder')
  )
    return false
  return useSaltSimulationStore.getState().streamTick(actorId, targetId, angle, deltaMs)
}

/** Idempotent; the UI/gesture engine calls after releasing, moving away or cancellation. */
export function stopPhysicalPour(): void {
  useSaltSimulationStore.getState().stopStream()
}

/**
 * An actual click/tap on the completed solution initiates the final review.
 * The reducer checks the full recorded state and can refuse it when premature.
 */
export function inspectFinalSolution(actorId: string): boolean {
  const scene = useLabSceneStore.getState()
  if (
    actorId !== 'beaker' ||
    !scene.placedIds.includes(actorId) ||
    scene.draggingId ||
    scene.placement
  )
    return false
  const session = useSaltSimulationStore.getState()
  if (session.workflow.completed || session.workflow.stepIndex !== 8) return false
  return session.emit({ type: 'REVIEW_INSPECTED' })
}

/** One physical gesture: scoop, deposit, weigh, transfer solids or stir. */
export function handlePhysicalInteraction({
  actorId,
  targetId,
  gesture,
  magnitude = 1,
  elapsedMs,
}: PhysicalInteraction): boolean {
  const affordance = findSpatialAffordance(actorId, targetId, gesture)
  if (!affordance || !Number.isFinite(magnitude) || magnitude < 0.65 || magnitude > 1) return false
  if (elapsedMs !== undefined && gesture !== 'stir') return false
  const simulation = useSaltSimulationStore.getState()
  const guided = useLabSafetyStore.getState().mode === 'guided'
  const scene = useLabSceneStore.getState()
  const heldStir =
    affordance.relation === 'insertion' && elapsedMs !== undefined && scene.draggingId === actorId
  if (
    simulation.effect ||
    simulation.livePour ||
    (scene.draggingId && !heldStir) ||
    scene.placement ||
    !scene.placedIds.includes(actorId) ||
    !scene.placedIds.includes(affordance.target)
  )
    return false

  if (affordance.relation === 'scoop') {
    return simulation.execute({
      kind: 'scoop-salt',
      tool: 'spatula',
      source: 'sodium-chloride',
      massG: 5,
    })
  }
  if (affordance.relation === 'solid-deposit') {
    return simulation.execute({
      kind: 'deposit-salt',
      tool: 'spatula',
      target: 'weighing-boat',
      massG: simulation.experiment.saltOnSpatulaG,
    })
  }
  if (affordance.relation === 'balance-contact') {
    if (guided && (simulation.workflow.stepIndex !== 4 || simulation.experiment.saltOnBoatG !== 5))
      return false
    const previousRelationships = scene.relationships
    scene.setRelationship({
      actorId,
      targetId: affordance.target,
      kind: affordance.relation,
    })
    // A physical reading/contact is allowed in Free mode, but is not a guided measurement.
    if (!guided) return true
    const recorded = simulation.emit({
      type: 'MASS_MEASUREMENT_RECORDED',
      sourceId: actorId,
      targetId: affordance.target,
      substance: 'NaCl',
      quantity: { value: simulation.experiment.saltOnBoatG, unit: 'g' },
    })
    if (!recorded) useLabSceneStore.setState({ relationships: previousRelationships })
    return recorded
  }
  if (affordance.relation === 'insertion') {
    const stirred = simulation.execute({
      kind: 'stir',
      tool: 'stirring-rod',
      target: 'beaker',
      ...(elapsedMs === undefined ? {} : { elapsedMs }),
    })
    if (stirred)
      useLabSceneStore.getState().setRelationship({
        actorId,
        targetId: affordance.target,
        kind: affordance.relation,
      })
    return stirred
  }
  if (affordance.relation === 'solid-receiver') {
    const measured = guided
      ? simulation.workflow.measurements.saltG
      : simulation.experiment.saltOnBoatG
    if (measured === null || simulation.experiment.saltOnBoatG !== measured) return false
    return simulation.execute({
      kind: 'add-substance',
      source: 'weighing-boat',
      target: 'beaker',
      massG: measured,
    })
  }
  // Liquid transfer is continuous and cannot be invoked via a release event.
  return false
}
