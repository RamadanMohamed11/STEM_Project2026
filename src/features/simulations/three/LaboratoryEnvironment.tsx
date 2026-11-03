import { BoxGeometry, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from 'three'
import { LaboratoryWorkbench } from './LaboratoryWorkbench'

const BOX = new BoxGeometry(1, 1, 1)
const PLANE = new PlaneGeometry(1, 1)
const ROOM = {
  floor: new MeshStandardMaterial({ color: '#d7e2e2', roughness: 0.94, metalness: 0 }),
  backWall: new MeshStandardMaterial({ color: '#e4edef', roughness: 0.98, metalness: 0 }),
  sideWall: new MeshStandardMaterial({ color: '#dfebed', roughness: 0.96, metalness: 0 }),
  trim: new MeshStandardMaterial({ color: '#b7cbd0', roughness: 0.75, metalness: 0.06 }),
  frame: new MeshStandardMaterial({ color: '#b6c9ce', roughness: 0.68, metalness: 0.12 }),
  board: new MeshStandardMaterial({ color: '#e9f1f1', roughness: 0.91, metalness: 0 }),
  safetyCard: new MeshStandardMaterial({ color: '#f6f9f7', roughness: 0.88, metalness: 0 }),
  safetyAccent: new MeshBasicMaterial({ color: '#6aaba5' }),
  safetyRule: new MeshBasicMaterial({ color: '#b4c7c8' }),
} as const

// Room panels are environmental geometry, never targets for lab selection,
// hit-testing, drag placement, or the virtual worktop's physical plane.
const ignoreRaycast = () => {}

export function LaboratoryEnvironment() {
  return (
    <group dispose={null}>
      <color attach="background" args={['#e9f0f1']} />

      {/* Matte floor grounds the frame and receives the table's soft shadows. */}
      <mesh
        geometry={PLANE}
        material={ROOM.floor}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.051, 0]}
        scale={[24, 24, 1]}
        receiveShadow
        raycast={ignoreRaycast}
      />

      {/* Wide, distant rear and left walls: behind every reachable orbit angle,
          with no props in front of the table or obstructing the equipment. */}
      <mesh
        geometry={BOX}
        material={ROOM.backWall}
        position={[0, 2.65, -4.55]}
        scale={[18, 8, 0.08]}
        raycast={ignoreRaycast}
      />
      <mesh
        geometry={BOX}
        material={ROOM.sideWall}
        position={[-7.2, 2.65, -0.7]}
        scale={[0.08, 8, 16]}
        raycast={ignoreRaycast}
      />

      {/* Upper-room architectural seam and one low-contrast teaching panel. */}
      <mesh
        geometry={BOX}
        material={ROOM.trim}
        position={[0, 3.48, -4.47]}
        scale={[8.3, 0.028, 0.036]}
        raycast={ignoreRaycast}
      />
      <mesh
        geometry={BOX}
        material={ROOM.frame}
        position={[0, 2.54, -4.45]}
        scale={[7.2, 1.38, 0.055]}
        raycast={ignoreRaycast}
      />
      <mesh
        geometry={BOX}
        material={ROOM.board}
        position={[0, 2.54, -4.407]}
        scale={[7.12, 1.3, 0.025]}
        raycast={ignoreRaycast}
      />

      {/* A quiet safety checklist motif, intentionally without fake lab labels
          or glyphs. Scientific instructions remain in the accessible guide. */}
      <mesh
        geometry={BOX}
        material={ROOM.safetyCard}
        position={[-2.77, 2.53, -4.374]}
        scale={[1.1, 0.82, 0.015]}
        raycast={ignoreRaycast}
      />
      <mesh
        geometry={BOX}
        material={ROOM.safetyAccent}
        position={[-2.77, 2.79, -4.362]}
        scale={[0.81, 0.033, 0.009]}
        raycast={ignoreRaycast}
      />
      {[2.61, 2.49, 2.37].map((y) => (
        <group key={y}>
          <mesh
            geometry={BOX}
            material={ROOM.safetyAccent}
            position={[-3.12, y, -4.36]}
            scale={[0.037, 0.037, 0.008]}
            raycast={ignoreRaycast}
          />
          <mesh
            geometry={BOX}
            material={ROOM.safetyRule}
            position={[-2.72, y, -4.36]}
            scale={[0.65, 0.018, 0.008]}
            raycast={ignoreRaycast}
          />
        </group>
      ))}

      <LaboratoryWorkbench />
    </group>
  )
}
