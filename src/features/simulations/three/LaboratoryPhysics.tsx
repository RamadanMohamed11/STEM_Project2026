import { useRef, useState, type ReactNode } from 'react'
import {
  CuboidCollider,
  CylinderCollider,
  Physics,
  RigidBody,
  useRapier,
  useBeforePhysicsStep,
  type RapierRigidBody,
} from '@react-three/rapier'
import { BENCH_DEPTH, BENCH_TOP, BENCH_WIDTH, type Point2D } from './sceneConfig'
import { useLabSceneStore } from '../state/useLabSceneStore'

const TABLETOP_HALF_THICKNESS = 0.07
const TABLETOP_CENTER_Y = BENCH_TOP - TABLETOP_HALF_THICKNESS

// Conservative vertical envelopes. Horizontal overlap checks remain in movement.ts.
const BODY_HEIGHT_BY_ID: Record<string, number> = {
  beaker: 0.78,
  'graduated-cylinder': 1.13,
  'stirring-rod': 1.1,
  'digital-balance': 0.24,
  water: 0.98,
  'sodium-chloride': 0.83,
  spatula: 0.31,
  'weighing-boat': 0.18,
}

function WorkbenchCollider() {
  const { rapier } = useRapier()

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[0, TABLETOP_CENTER_Y, 0]}
      userData={{ kind: 'laboratory-workbench' }}
    >
      <CuboidCollider
        args={[BENCH_WIDTH / 2, TABLETOP_HALF_THICKNESS, BENCH_DEPTH / 2]}
        activeCollisionTypes={rapier.ActiveCollisionTypes.ALL}
      />
    </RigidBody>
  )
}

/**
 * Add Rapier contact geometry to the Three.js lab scene.
 * The existing visual workbench is rendered by LaboratoryEnvironment.
 */
export function LaboratoryPhysics({ children }: { children: ReactNode }) {
  return (
    <Physics gravity={[0, 0, 0]} timeStep={1 / 60}>
      <WorkbenchCollider />
      {children}
    </Physics>
  )
}

interface EquipmentPhysicsColliderProps {
  id: string
  position: Point2D
  footprintRadius: number
  children: ReactNode
}

/**
 * Rapier mirrors the authoritative 2D state and never overwrites it.
 * Children should be equipment geometry with their base at local y=0.
 * Do not also position an ancestor group at the bench coordinates.
 */
export function EquipmentPhysicsCollider({
  id,
  position,
  footprintRadius,
  children,
}: EquipmentPhysicsColliderProps) {
  const body = useRef<RapierRigidBody>(null)
  // Keep the initial transform stable; subsequent positions use Rapier's
  // kinematic target instead of rewriting a world transform during render.
  const [initialPosition] = useState(() => ({ x: position.x, z: position.z }))
  const { rapier } = useRapier()
  const height = BODY_HEIGHT_BY_ID[id] ?? 0.7
  const halfHeight = height / 2

  useBeforePhysicsStep(() => {
    // Read current authority, not a possibly batched pointer-render snapshot.
    // In particular, cancellation must override an already queued kinematic target.
    const target = useLabSceneStore.getState().positions[id] ?? position
    body.current?.setNextKinematicTranslation({ x: target.x, y: BENCH_TOP, z: target.z })
  })

  return (
    <>
      <RigidBody
        key={id}
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[initialPosition.x, BENCH_TOP, initialPosition.z]}
        enabledRotations={[false, false, false]}
        userData={{ equipmentId: id }}
      >
        {id === 'digital-balance' ? (
          <CuboidCollider
            args={[0.36, halfHeight, 0.255]}
            position={[0, halfHeight, 0]}
            friction={0.8}
            restitution={0}
            activeCollisionTypes={rapier.ActiveCollisionTypes.ALL}
          />
        ) : (
          <CylinderCollider
            args={[halfHeight, Math.max(0.025, footprintRadius)]}
            position={[0, halfHeight, 0]}
            friction={0.8}
            restitution={0}
            activeCollisionTypes={rapier.ActiveCollisionTypes.ALL}
          />
        )}
      </RigidBody>
      {/* Rapier may interpolate a stale kinematic transform after a cancelled grab.
        Visual placement has one authority; physics mirrors it, never owns it. */}
      <group position={[position.x, BENCH_TOP, position.z]}>{children}</group>
    </>
  )
}
