import { RoundedBox } from '@react-three/drei'
import {
  BoxGeometry,
  DataTexture,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  RGBAFormat,
} from 'three'
import { BENCH_DEPTH, BENCH_TOP, BENCH_WIDTH } from './sceneConfig'

/** Shared unit geometry/materials: no allocations per workbench element or frame. */
const BOX = new BoxGeometry(1, 1, 1)
// Fixed, local microtexture: slight epoxy stipple, not visible dirt or random frame noise.
const grain = new Uint8Array(64 * 64 * 4)
for (let index = 0; index < 64 * 64; index += 1) {
  const value = 112 + ((Math.imul(index + 1, 1664525) ^ Math.imul(index + 7, 1013904223)) >>> 27)
  grain.set([value, value, value, 255], index * 4)
}
const stipple = new DataTexture(grain, 64, 64, RGBAFormat)
stipple.wrapS = stipple.wrapT = RepeatWrapping
stipple.repeat.set(16, 8)
stipple.needsUpdate = true

const MATERIALS = {
  worktop: new MeshStandardMaterial({
    color: '#52665f',
    roughness: 0.67,
    metalness: 0,
    bumpMap: stipple,
    bumpScale: 0.0003,
  }),
  edge: new MeshStandardMaterial({
    color: '#acb7ad',
    roughness: 0.38,
    metalness: 0.65,
  }),
  frame: new MeshStandardMaterial({
    color: '#58665f',
    roughness: 0.56,
    metalness: 0.34,
  }),
  underframe: new MeshStandardMaterial({
    color: '#7c8a7e',
    roughness: 0.57,
    metalness: 0.22,
  }),
  feet: new MeshStandardMaterial({
    color: '#343e38',
    roughness: 0.92,
    metalness: 0.02,
  }),
  zones: [
    new MeshBasicMaterial({
      color: '#879da5',
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
    new MeshBasicMaterial({
      color: '#5eaaa5',
      transparent: true,
      opacity: 0.29,
      depthWrite: false,
    }),
    new MeshBasicMaterial({
      color: '#bea37c',
      transparent: true,
      opacity: 0.29,
      depthWrite: false,
    }),
  ],
} as const

const LEG_X = BENCH_WIDTH / 2 - 0.22
const LEG_Z = BENCH_DEPTH / 2 - 0.22
const LEGS = [
  [-LEG_X, -LEG_Z],
  [-LEG_X, LEG_Z],
  [LEG_X, -LEG_Z],
  [LEG_X, LEG_Z],
] as const
const BENCH_THICKNESS = 0.14

/** Decorative geometry must not intercept pointer rays or become a physics collider. */
const ignoreRaycast = () => {}

export function LaboratoryWorkbench() {
  return (
    <group dispose={null}>
      {/* BENCH_TOP remains the exact physical contact plane: upper face Y = 0.78. */}
      <RoundedBox
        args={[BENCH_WIDTH, BENCH_THICKNESS, BENCH_DEPTH]}
        radius={0.025}
        smoothness={4}
        material={MATERIALS.worktop}
        position={[0, BENCH_TOP - BENCH_THICKNESS / 2, 0]}
        castShadow
        receiveShadow
        raycast={ignoreRaycast}
      />

      {/* Restrained satin edging reinforces the tabletop below the contact surface. */}
      {[-1, 1].map((side) => (
        <mesh
          key={`long-edge-${side}`}
          geometry={BOX}
          material={MATERIALS.edge}
          position={[0, BENCH_TOP - 0.082, side * (BENCH_DEPTH / 2 + 0.009)]}
          scale={[BENCH_WIDTH + 0.025, 0.055, 0.023]}
          castShadow
          raycast={ignoreRaycast}
        />
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={`short-edge-${side}`}
          geometry={BOX}
          material={MATERIALS.edge}
          position={[side * (BENCH_WIDTH / 2 + 0.009), BENCH_TOP - 0.082, 0]}
          scale={[0.023, 0.055, BENCH_DEPTH + 0.027]}
          raycast={ignoreRaycast}
        />
      ))}

      {/* Recessed powder-coated steel apron and continuous underside support. */}
      <mesh
        geometry={BOX}
        material={MATERIALS.underframe}
        position={[0, 0.603, 0]}
        scale={[BENCH_WIDTH - 0.32, 0.085, BENCH_DEPTH - 0.31]}
        receiveShadow
        castShadow
        raycast={ignoreRaycast}
      />
      {[-1, 1].map((side) => (
        <mesh
          key={`side-brace-${side}`}
          geometry={BOX}
          material={MATERIALS.frame}
          position={[side * LEG_X, 0.553, 0]}
          scale={[0.085, 0.095, BENCH_DEPTH - 0.32]}
          castShadow
          raycast={ignoreRaycast}
        />
      ))}

      {/* Four actual silhouettes and floor feet; not generic free-floating slab. */}
      {LEGS.map(([x, z]) => (
        <group key={`leg-${x}-${z}`}>
          <mesh
            geometry={BOX}
            material={MATERIALS.frame}
            position={[x, 0.3, z]}
            scale={[0.115, 0.62, 0.115]}
            receiveShadow
            castShadow
            raycast={ignoreRaycast}
          />
          <mesh
            geometry={BOX}
            material={MATERIALS.feet}
            position={[x, -0.03, z]}
            scale={[0.145, 0.04, 0.145]}
            receiveShadow
            raycast={ignoreRaycast}
          />
        </group>
      ))}
      <mesh
        geometry={BOX}
        material={MATERIALS.frame}
        position={[0, 0.152, -LEG_Z]}
        scale={[BENCH_WIDTH - 0.44, 0.077, 0.093]}
        castShadow
        raycast={ignoreRaycast}
      />

      {/* Three muted 2D zone indicators at the far edge, not raised obstacles:
          LEFT scale, CENTER liquids, RIGHT solids. Labels stay in UI. */}
      {[-2.05, 0, 2.05].map((x, index) => (
        <mesh
          key={`zone-${index}`}
          geometry={BOX}
          material={MATERIALS.zones[index]}
          position={[x, BENCH_TOP + 0.00035, -BENCH_DEPTH / 2 + 0.085]}
          scale={[1.28, 0.0007, 0.034]}
          raycast={ignoreRaycast}
          renderOrder={1}
        />
      ))}
    </group>
  )
}
