import { BoxGeometry, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry } from 'three'
import { LaboratoryWorkbench } from './LaboratoryWorkbench'

const BOX = new BoxGeometry(1, 1, 1)
const PLANE = new PlaneGeometry(1, 1)
const ROOM = {
  floor: new MeshStandardMaterial({ color: '#cde1f2', roughness: 0.9, metalness: 0 }),
  backWall: new MeshStandardMaterial({ color: '#e8f1fa', roughness: 0.94, metalness: 0 }),
  sideWall: new MeshStandardMaterial({ color: '#cde1f2', roughness: 0.94, metalness: 0 }),
  dado: new MeshStandardMaterial({ color: '#a8c5e0', roughness: 0.8, metalness: 0 }),
  trim: new MeshStandardMaterial({ color: '#6b8cae', roughness: 0.65, metalness: 0.08 }),
  frame: new MeshStandardMaterial({ color: '#3d5a80', roughness: 0.4, metalness: 0.48 }),
  board: new MeshStandardMaterial({ color: '#e8f1fa', roughness: 0.64, metalness: 0 }),
  safetyCard: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.88, metalness: 0 }),
  safetyAccent: new MeshBasicMaterial({ color: '#1b3a6b' }),
  safetyRule: new MeshBasicMaterial({ color: '#6b8cae' }),
} as const

// Room panels are environmental geometry, never targets for lab selection,
// hit-testing, drag placement, or the virtual worktop's physical plane.
const ignoreRaycast = () => {}

export function LaboratoryEnvironment() {
  return (
    <group dispose={null}>
      <color attach="background" args={['#e8f1fa']} />

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

      {/* Washable lower wall and recessed skirting establish scale without foreground props. */}
      <mesh
        geometry={BOX}
        material={ROOM.dado}
        position={[0, 0.48, -4.49]}
        scale={[18, 1.04, 0.025]}
        raycast={ignoreRaycast}
      />
      <mesh
        geometry={BOX}
        material={ROOM.trim}
        position={[0, 0.02, -4.465]}
        scale={[18, 0.14, 0.035]}
        raycast={ignoreRaycast}
      />
      <mesh
        geometry={BOX}
        material={ROOM.dado}
        position={[-7.14, 0.48, -0.7]}
        scale={[0.025, 1.04, 16]}
        raycast={ignoreRaycast}
      />
      <mesh
        geometry={BOX}
        material={ROOM.trim}
        position={[-7.115, 0.02, -0.7]}
        scale={[0.035, 0.14, 16]}
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
