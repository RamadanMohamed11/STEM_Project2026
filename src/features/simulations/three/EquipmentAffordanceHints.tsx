import { Html } from '@react-three/drei'
import { AdditiveBlending } from 'three'
import { saltExperimentDefinition } from '@/features/simulations/data/saltExperimentDefinition'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { resolveAffordanceHint } from './affordanceHintLogic'
import { preferredPlacementHintActor } from './placementHintActor'
import { BENCH_TOP, equipmentRegistry } from './sceneConfig'

const APPARATUS_HEIGHT: Record<string, number> = {
  beaker: 0.78,
  'graduated-cylinder': 1.13,
  water: 0.98,
  'sodium-chloride': 0.83,
  'digital-balance': 0.24,
  'stirring-rod': 0.93,
  spatula: 0.4,
  'weighing-boat': 0.19,
}

const neutralHints: Record<string, string> = {
  beaker: 'Receive water and salt · click to inspect at the end',
  water: 'Water source · measure 100 mL',
  'graduated-cylinder': 'Measure and transfer 100 mL',
  'sodium-chloride': 'Bring the spatula tip into the jar opening',
  'stirring-rod': 'Left-drag the rod into the beaker · trace circles',
  spatula: 'Left-drag into NaCl · release over weighing boat',
  'weighing-boat': 'Weigh 5 g · add to the beaker',
  'digital-balance': 'Place the loaded boat onto the pan · net mass',
}

const tiltInstructions: Record<string, string> = {
  water: 'Cylinder is the receiver',
  'graduated-cylinder': 'Beaker is the receiver',
  'weighing-boat': 'Beaker is the receiver',
}

/** Decorative only: highlighting never participates in picking or physics. */
export function EquipmentAffordanceHints() {
  const hoveredId = useLabSceneStore((state) => state.hoveredId)
  const selectedId = useLabSceneStore((state) => state.selectedId)
  const draggingId = useLabSceneStore((state) => state.draggingId)
  const placementActive = useLabSceneStore((state) => state.placement !== null)
  const placedIds = useLabSceneStore((state) => state.placedIds)
  const positions = useLabSceneStore((state) => state.positions)

  const stepIndex = useSaltSimulationStore((state) => state.workflow.stepIndex)
  const completed = useSaltSimulationStore((state) => state.workflow.completed)
  const recordedWaterMl = useSaltSimulationStore((state) => state.workflow.measurements.waterMl)
  const recordedSaltG = useSaltSimulationStore((state) => state.workflow.measurements.saltG)
  const waterMl = useSaltSimulationStore((state) => state.experiment.waterMl)
  const saltStockG = useSaltSimulationStore((state) => state.experiment.saltStockG)
  const saltOnSpatulaG = useSaltSimulationStore((state) => state.experiment.saltOnSpatulaG)
  const saltOnBoatG = useSaltSimulationStore((state) => state.experiment.saltOnBoatG)
  const saltInBeakerG = useSaltSimulationStore((state) => state.experiment.saltInBeakerG)
  const dissolvedSaltG = useSaltSimulationStore((state) => state.experiment.dissolvedSaltG)

  const hintContext = {
    stepId: saltExperimentDefinition.steps[stepIndex]?.id ?? null,
    completed,
    placedIds,
    positions,
    waterMl,
    saltStockG,
    saltOnSpatulaG,
    saltOnBoatG,
    saltInBeakerG,
    dissolvedSaltG,
    recordedWaterMl,
    recordedSaltG,
  }
  // A physically held actor wins. When idle, retain the correct *selected*
  // actor even if hovering over an unrelated receiver/tool in transit; only
  // fall back to hovered when the selected actor has no legal target.
  const selectionHint =
    !placementActive && selectedId
      ? resolveAffordanceHint({ ...hintContext, actorId: selectedId })
      : null
  const hoverHint =
    !placementActive && hoveredId && !selectionHint
      ? resolveAffordanceHint({ ...hintContext, actorId: hoveredId })
      : null
  const actorId = placementActive
    ? null
    : preferredPlacementHintActor(
        draggingId,
        selectedId,
        hoveredId,
        Boolean(selectionHint),
        Boolean(hoverHint),
      )
  const actor = equipmentRegistry.find((item) => item.id === actorId)
  const actorPosition = actor && (positions[actor.id] ?? actor.defaultPosition)
  const hint =
    !placementActive && draggingId
      ? resolveAffordanceHint({ ...hintContext, actorId: draggingId })
      : (selectionHint ?? hoverHint)
  const target = hint && equipmentRegistry.find((item) => item.id === hint.targetId)
  const actionInstruction =
    hint?.gesture === 'tilt' && actorId
      ? (tiltInstructions[actorId] ?? hint.instruction)
      : hint?.instruction
  const label =
    (hint ? `${hint.near ? 'Aligned · ' : 'Move closer · '}${actionInstruction}` : null) ??
    (completed && actorId === 'beaker'
      ? 'Experiment complete · inspect your solution'
      : (actorId && neutralHints[actorId]) || 'Select a lab instrument')

  return (
    <group>
      {hint && target && (
        <group
          position={[hint.targetPosition.x, BENCH_TOP + 0.015, hint.targetPosition.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {/* The active contact is a bright teal band, while an approachable
              but distant receiver has only a muted amber outline. */}
          <mesh raycast={() => undefined} renderOrder={6}>
            <ringGeometry
              args={[target.footprintRadius + 0.076, target.footprintRadius + 0.102, 48]}
            />
            <meshBasicMaterial
              color={hint.near ? '#24e2c9' : '#edaa48'}
              transparent
              opacity={hint.near ? 0.9 : 0.18}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {hint.near && (
            <mesh raycast={() => undefined} renderOrder={5}>
              <ringGeometry
                args={[target.footprintRadius + 0.035, target.footprintRadius + 0.152, 48]}
              />
              <meshBasicMaterial
                color="#12a99b"
                transparent
                opacity={0.21}
                blending={AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>
      )}
      {actor && actorPosition && placedIds.includes(actor.id) && (
        <Html
          position={[
            actorPosition.x,
            BENCH_TOP + (APPARATUS_HEIGHT[actor.id] ?? 0.8) + 0.35,
            actorPosition.z,
          ]}
          center
          style={{
            width: '176px',
            minWidth: '176px',
            maxWidth: '176px',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="box-border w-[176px] rounded-lg border border-[#c7e9e7] bg-[#062731]/95 px-2.5 py-1.5 text-center text-[11px] leading-4 text-white shadow-xl">
            <div className="font-bold">{actor.label}</div>
            <div className="text-[10px] text-[#9de4dc]">{label}</div>
          </div>
        </Html>
      )}
    </group>
  )
}
