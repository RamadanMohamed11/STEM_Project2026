/**
 * L6 reaction visual effects. One component per engine effect kind, all driven by the
 * reaction-effects store (fed only by engine events) and positioned by an anchor resolver.
 * Per-frame work happens in useFrame on persistent instanced meshes — no React state writes.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useShallow } from 'zustand/react/shallow'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  NormalBlending,
  Object3D,
  type Blending,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
  type PerspectiveCamera,
  type PointLight,
  type ShaderMaterial,
} from 'three'
import type { EffectKind } from '../../../engine/core/index.ts'
import {
  EXPLOSION_S,
  PARTICLE_BUDGET,
  effectMotion,
  particleCount,
  type ActiveEffect,
  type EffectMotion,
} from '../../../lib/reactionEffects'
import { useReactionEffectsStore } from '../../../state/useReactionEffectsStore'
import type { EffectAnchor, EffectAnchorResolver } from './effectAnchors'
import { FLAME_FRAGMENT, FLAME_VERTEX } from './flameShader'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const TAU = Math.PI * 2
const dummy = new Object3D()
/** Scratch output reused by every particle placement (frames run one at a time). */
const particle: Particle = { x: 0, y: 0, z: 0, size: 0, alpha: 1 }

/** Deterministic pseudo-random 0–1 per particle and channel (stable across frames). */
const seed = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const readEffect = (key: string): ActiveEffect | undefined =>
  useReactionEffectsStore.getState().effects[key]

// ---------------------------------------------------------------------------
// Generic instanced particle field
// ---------------------------------------------------------------------------

interface Particle {
  x: number
  y: number
  z: number
  size: number
  /** 0–1 per-particle opacity (soft particles only). */
  alpha: number
}

interface PlaceContext {
  /** Seconds (store clock) since the effect started. */
  age: number
  /** Animation clock (s). */
  t: number
  anchor: EffectAnchor
  effect: ActiveEffect
}

type Place = (i: number, ctx: PlaceContext, out: Particle) => void

const SOFT_VERTEX = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`
const SOFT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.15, 1.0, d)) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

interface ParticleFieldProps {
  effectKey: string
  kind: EffectKind
  resolve: EffectAnchorResolver
  motion: EffectMotion
  place: Place
  /** 'soft' = camera-facing soft discs (smoke, gas, glow); 'sphere' = lit grains/bubbles. */
  shape: 'soft' | 'sphere'
  blending?: 'additive' | 'normal'
  /** Overall opacity at full intensity. */
  opacity: number
  /** Use the full budget regardless of intensity (one-shot bursts). */
  fullBudget?: boolean
  color?: string
}

function ParticleField({
  effectKey,
  kind,
  resolve,
  motion,
  place,
  shape,
  blending = 'normal',
  opacity,
  fullBudget,
  color,
}: ParticleFieldProps) {
  const budget = Math.max(1, PARTICLE_BUDGET[kind])
  const mesh = useRef<InstancedMesh>(null)
  const shader = useRef<ShaderMaterial>(null)
  const basic = useRef<MeshBasicMaterial>(null)
  const camera = useThree((state) => state.camera)
  const alphas = useMemo(() => new InstancedBufferAttribute(new Float32Array(budget), 1), [budget])
  const uniforms = useMemo(
    () => ({ uColor: { value: new Color('#ffffff') }, uOpacity: { value: 1 } }),
    [],
  )
  const blend: Blending = blending === 'additive' ? AdditiveBlending : NormalBlending

  useFrame(({ clock }) => {
    const instanced = mesh.current
    if (!instanced) return
    const effect = readEffect(effectKey)
    const anchor = effect && resolve(effect.containerId)
    if (!effect || !anchor) {
      instanced.visible = false
      return
    }
    const n = fullBudget
      ? Math.round(budget * motion.particles)
      : particleCount(kind, effect.intensity, motion)
    instanced.visible = n > 0
    instanced.count = n
    const age = useReactionEffectsStore.getState().timeS - effect.startedS
    const ctx: PlaceContext = { age, t: clock.elapsedTime, anchor, effect }
    const out = particle
    const alphaAttr = instanced.geometry.getAttribute('aAlpha') as
      InstancedBufferAttribute | undefined
    for (let i = 0; i < n; i++) {
      out.alpha = 1
      place(i, ctx, out)
      dummy.position.set(out.x, out.y, out.z)
      if (shape === 'soft') dummy.quaternion.copy(camera.quaternion)
      else dummy.quaternion.identity()
      dummy.scale.setScalar(Math.max(0, out.size))
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
      alphaAttr?.setX(i, Math.max(0, Math.min(1, out.alpha)))
    }
    instanced.instanceMatrix.needsUpdate = true
    if (alphaAttr) alphaAttr.needsUpdate = true
    const strength = fullBudget ? 1 : Math.min(1, 0.3 + effect.intensity)
    const tint = color ?? effect.color
    if (shader.current) {
      shader.current.uniforms.uColor.value.set(tint)
      shader.current.uniforms.uOpacity.value = opacity * strength
    }
    if (basic.current) {
      basic.current.color.set(tint)
      basic.current.opacity = opacity * strength
    }
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, budget]}
      frustumCulled={false}
      raycast={() => undefined}
      renderOrder={7}
      visible={false}
    >
      {shape === 'soft' ? (
        <planeGeometry args={[1, 1]}>
          <primitive object={alphas} attach="attributes-aAlpha" />
        </planeGeometry>
      ) : (
        <sphereGeometry args={[1, 8, 6]} />
      )}
      {shape === 'soft' ? (
        <shaderMaterial
          ref={shader}
          vertexShader={SOFT_VERTEX}
          fragmentShader={SOFT_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={blend}
        />
      ) : (
        <meshBasicMaterial ref={basic} transparent depthWrite={false} blending={blend} />
      )}
    </instancedMesh>
  )
}

interface EffectViewProps {
  effectKey: string
  resolve: EffectAnchorResolver
  motion: EffectMotion
}

const liquidDepth = (a: EffectAnchor) => Math.max(0, a.surfaceY - a.base[1])

// ---------------------------------------------------------------------------
// colorChange — streaks of the new colour swirl down through the liquid
// (the liquid body itself eases to the new colour in ProfiledVesselContents).
// ---------------------------------------------------------------------------

const placeColorSwirl: Place = (i, { t, anchor }, out) => {
  const depth = liquidDepth(anchor)
  const phase = (t * 0.35 + seed(i, 2)) % 1
  const angle = t * 1.4 + seed(i, 1) * TAU + phase * 3
  const r = anchor.innerRadius * (0.15 + 0.7 * seed(i, 3)) * (1 - phase * 0.3)
  out.x = anchor.base[0] + Math.cos(angle) * r
  out.z = anchor.base[2] + Math.sin(angle) * r
  out.y = anchor.surfaceY - phase * depth * 0.95
  out.size = depth > 0.005 ? anchor.innerRadius * (0.16 + 0.1 * seed(i, 4)) : 0
  out.alpha = Math.sin(Math.PI * phase)
}

function ColorChangeEffect(props: EffectViewProps) {
  return (
    <ParticleField
      {...props}
      kind="colorChange"
      shape="soft"
      opacity={0.7}
      place={placeColorSwirl}
    />
  )
}

// ---------------------------------------------------------------------------
// precipitate — grains drift down and build a settled layer on the floor
// ---------------------------------------------------------------------------

const placePrecipitate: Place = (i, { t, anchor }, out) => {
  const depth = liquidDepth(anchor)
  const speed = 0.12 + 0.1 * seed(i, 1)
  const phase = (t * speed + seed(i, 2)) % 1
  const fall = Math.pow(phase, 1.3)
  const angle = seed(i, 3) * TAU + Math.sin(t * 0.8 + i) * 0.2
  const r = anchor.innerRadius * Math.sqrt(seed(i, 4)) * 0.9
  out.x = anchor.base[0] + Math.cos(angle) * r
  out.z = anchor.base[2] + Math.sin(angle) * r
  out.y = anchor.surfaceY - 0.01 - fall * Math.max(0, depth - 0.012)
  out.size = depth > 0.005 ? anchor.innerRadius * (0.025 + 0.025 * seed(i, 5)) : 0
}

function PrecipitateEffect(props: EffectViewProps) {
  const layer = useRef<Mesh>(null)
  const material = useRef<MeshBasicMaterial>(null)
  const settled = useRef({ amount: 0, startedS: -1 })

  useFrame((_, dt) => {
    const mesh = layer.current
    const effect = readEffect(props.effectKey)
    const anchor = effect && props.resolve(effect.containerId)
    if (!mesh || !effect || !anchor) {
      if (mesh) mesh.visible = false
      return
    }
    if (settled.current.startedS !== effect.startedS)
      settled.current = { amount: 0, startedS: effect.startedS }
    settled.current.amount = Math.min(1, settled.current.amount + effect.target * dt * 0.12)
    const height = Math.max(0.002, anchor.innerRadius * 0.18 * settled.current.amount)
    mesh.visible = settled.current.amount > 0.01
    mesh.position.set(anchor.base[0], anchor.base[1] + height / 2, anchor.base[2])
    mesh.scale.set(anchor.innerRadius * 0.98, height, anchor.innerRadius * 0.98)
    if (material.current) {
      material.current.color.set(effect.color)
      material.current.opacity = 0.9 * Math.min(1, effect.intensity * 3) * settled.current.amount
    }
  })

  return (
    <>
      <ParticleField
        {...props}
        kind="precipitate"
        shape="sphere"
        opacity={0.95}
        place={placePrecipitate}
      />
      <mesh ref={layer} visible={false} raycast={() => undefined} renderOrder={5}>
        <cylinderGeometry args={[1, 1, 1, 28]} />
        <meshBasicMaterial ref={material} transparent depthWrite={false} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// gas — bubbles rise through the liquid; gas escapes from the mouth
// ---------------------------------------------------------------------------

const placeBubble: Place = (i, { t, anchor }, out) => {
  const depth = liquidDepth(anchor)
  const phase = (t * (0.7 + 0.6 * seed(i, 1)) + seed(i, 2)) % 1
  const angle = seed(i, 3) * TAU
  const r = anchor.innerRadius * Math.sqrt(seed(i, 4)) * 0.85
  const wobble = Math.sin(t * 7 + i) * anchor.innerRadius * 0.05
  out.x = anchor.base[0] + Math.cos(angle) * r + wobble
  out.z = anchor.base[2] + Math.sin(angle) * r
  out.y = anchor.base[1] + 0.006 + phase * Math.max(0, depth - 0.008)
  out.size =
    depth > 0.008 ? anchor.innerRadius * (0.03 + 0.03 * seed(i, 5)) * (0.6 + 0.5 * phase) : 0
}

const placeEscape: Place = (i, { t, anchor }, out) => {
  const phase = (t * 0.45 + seed(i, 2)) % 1
  const angle = seed(i, 3) * TAU + phase
  const spread = anchor.mouthRadius * (0.3 + phase * 1.4)
  out.x = anchor.mouth[0] + Math.cos(angle) * spread * seed(i, 4)
  out.z = anchor.mouth[2] + Math.sin(angle) * spread * seed(i, 4)
  out.y = anchor.mouth[1] + phase * anchor.mouthRadius * 5
  out.size = anchor.mouthRadius * (0.9 + phase * 2.2)
  out.alpha = Math.sin(Math.PI * phase) * 0.8
}

function GasEffect(props: EffectViewProps) {
  return (
    <>
      <ParticleField
        {...props}
        kind="gas"
        shape="sphere"
        opacity={0.55}
        color="#e8f1fa"
        place={placeBubble}
      />
      <ParticleField {...props} kind="smoke" shape="soft" opacity={0.18} place={placeEscape} />
    </>
  )
}

// ---------------------------------------------------------------------------
// flame — shader flame at the mouth with a flickering light
// ---------------------------------------------------------------------------

function FlameEffect({ effectKey, resolve, motion }: EffectViewProps) {
  const group = useRef<Group>(null)
  const material = useRef<ShaderMaterial>(null)
  const light = useRef<PointLight>(null)
  const camera = useThree((state) => state.camera)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color('#ff9a2e') },
      uIntensity: { value: 0 },
    }),
    [],
  )
  useFrame(({ clock }) => {
    const root = group.current
    const effect = readEffect(effectKey)
    const anchor = effect && resolve(effect.containerId)
    if (!root || !effect || !anchor) {
      if (root) root.visible = false
      return
    }
    const k = Math.min(1, effect.intensity)
    root.visible = k > 0.01
    const height = anchor.mouthRadius * (1.6 + 2.6 * k)
    const width = anchor.mouthRadius * 1.5
    root.position.set(anchor.mouth[0], anchor.mouth[1] - anchor.mouthRadius * 0.15, anchor.mouth[2])
    // Cylindrical billboard: face the camera around the vertical axis only.
    root.rotation.y = Math.atan2(
      camera.position.x - root.position.x,
      camera.position.z - root.position.z,
    )
    root.scale.set(width, height, 1)
    const live = material.current?.uniforms
    if (live) {
      live.uTime.value = clock.elapsedTime * (motion.shake ? 1 : 0.45)
      live.uColor.value.set(effect.color)
      live.uIntensity.value = 0.35 + 0.65 * k
    }
    if (light.current) {
      light.current.color.set(effect.color)
      light.current.intensity =
        (0.8 + 0.25 * Math.sin(clock.elapsedTime * 17)) * k * motion.flash * 2
    }
  })
  return (
    <group ref={group} visible={false}>
      <mesh position={[0, 0.5, 0]} raycast={() => undefined} renderOrder={8}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={material}
          vertexShader={FLAME_VERTEX}
          fragmentShader={FLAME_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
      <pointLight ref={light} position={[0, 0.4, 0]} distance={1.6} decay={2} intensity={0} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// smoke — soft grey puffs rise from the mouth and spread
// ---------------------------------------------------------------------------

const placeSmoke: Place = (i, { t, anchor }, out) => {
  const phase = (t * 0.2 * (0.8 + 0.4 * seed(i, 1)) + seed(i, 2)) % 1
  const drift = Math.sin(phase * 3 + i) * anchor.mouthRadius * (0.4 + phase * 2.4)
  const angle = seed(i, 3) * TAU
  out.x = anchor.mouth[0] + Math.cos(angle) * drift
  out.z = anchor.mouth[2] + Math.sin(angle) * drift
  // Smoke first fills the vessel, then pours out of the mouth.
  out.y =
    anchor.base[1] +
    (anchor.mouth[1] - anchor.base[1]) * Math.min(1, phase * 2.5) +
    Math.max(0, phase - 0.4) * anchor.mouthRadius * 9
  out.size = anchor.mouthRadius * (1 + phase * 3.2)
  out.alpha = Math.min(1, phase * 6) * (1 - phase)
}

function SmokeEffect(props: EffectViewProps) {
  return <ParticleField {...props} kind="smoke" shape="soft" opacity={0.42} place={placeSmoke} />
}

// ---------------------------------------------------------------------------
// heat — a warm glow under the liquid and shimmering air above the mouth
// ---------------------------------------------------------------------------

/** A warm glow around the vessel floor (one large soft disc, gently pulsing). */
const placeHeatGlow: Place = (i, { t, anchor }, out) => {
  out.x = anchor.base[0]
  out.y = anchor.base[1] + 0.02
  out.z = anchor.base[2]
  out.size = i === 0 ? anchor.innerRadius * (2.6 + 0.15 * Math.sin(t * 2.2)) : 0
  out.alpha = 0.8
}

/** Faint, wavering air above the mouth (heat shimmer). */
const placeHeatShimmer: Place = (i, { t, anchor }, out) => {
  const phase = (t * 0.5 + seed(i, 2)) % 1
  out.x = anchor.mouth[0] + Math.sin(t * 4 + i * 1.7) * anchor.mouthRadius * 0.5
  out.z = anchor.mouth[2] + Math.cos(t * 3 + i) * anchor.mouthRadius * 0.4
  out.y = anchor.mouth[1] + phase * anchor.mouthRadius * 3.5
  out.size = anchor.mouthRadius * (1 + phase * 0.8)
  out.alpha = Math.sin(Math.PI * phase)
}

function HeatEffect(props: EffectViewProps) {
  return (
    <>
      <ParticleField
        {...props}
        kind="heat"
        shape="soft"
        blending="additive"
        opacity={0.45}
        place={placeHeatGlow}
      />
      <ParticleField
        {...props}
        kind="heat"
        shape="soft"
        opacity={0.1}
        color="#e8f1fa"
        place={placeHeatShimmer}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// explosion — flash, flying sparks and an optional short camera shake
// ---------------------------------------------------------------------------

const placeSpark: Place = (i, { age, anchor }, out) => {
  const a = Math.min(age, EXPLOSION_S)
  if (i === 0) {
    // The flash itself.
    out.x = anchor.mouth[0]
    out.y = anchor.mouth[1] + anchor.mouthRadius
    out.z = anchor.mouth[2]
    out.size = anchor.mouthRadius * (4 + 30 * Math.min(1, a / 0.12)) * Math.max(0, 1 - a / 0.45)
    out.alpha = Math.max(0, 1 - a / 0.45)
    return
  }
  const theta = seed(i, 1) * TAU
  const phi = Math.acos(1 - seed(i, 2) * 1.2)
  const speed = 0.6 + 1.2 * seed(i, 3)
  const dx = Math.sin(phi) * Math.cos(theta)
  const dz = Math.sin(phi) * Math.sin(theta)
  const dy = Math.cos(phi)
  out.x = anchor.mouth[0] + dx * speed * a
  out.z = anchor.mouth[2] + dz * speed * a
  out.y = anchor.mouth[1] + dy * speed * a - 1.6 * a * a
  out.size = anchor.mouthRadius * (0.5 + 0.6 * seed(i, 4)) * Math.max(0, 1 - a / EXPLOSION_S)
  out.alpha = Math.pow(Math.max(0, 1 - a / (EXPLOSION_S * 0.8)), 1.5)
}

function ExplosionEffect({ effectKey, resolve, motion }: EffectViewProps) {
  const light = useRef<PointLight>(null)
  const { camera, size } = useThree()
  const shaking = useRef(false)

  useFrame(() => {
    const effect = readEffect(effectKey)
    const anchor = effect && resolve(effect.containerId)
    const age = effect ? useReactionEffectsStore.getState().timeS - effect.startedS : Infinity
    if (light.current) {
      light.current.visible = !!anchor && age < 0.5
      if (anchor) {
        light.current.position.set(anchor.mouth[0], anchor.mouth[1] + 0.1, anchor.mouth[2])
        light.current.intensity = 12 * motion.flash * Math.max(0, 1 - age / 0.5)
      }
    }
    // Camera shake shifts the projection only (never fights the orbit controls).
    const cam = camera as PerspectiveCamera
    if (motion.shake && anchor && age < 0.35 && cam.setViewOffset) {
      const k = (1 - age / 0.35) * 7
      cam.setViewOffset(
        size.width,
        size.height,
        Math.sin(age * 90) * k,
        Math.cos(age * 77) * k,
        size.width,
        size.height,
      )
      shaking.current = true
    } else if (shaking.current) {
      cam.clearViewOffset()
      shaking.current = false
    }
  })
  useEffect(
    () => () => {
      if (shaking.current) (camera as PerspectiveCamera).clearViewOffset?.()
    },
    [camera],
  )

  return (
    <>
      <ParticleField
        effectKey={effectKey}
        resolve={resolve}
        motion={motion}
        kind="explosion"
        shape="soft"
        blending="additive"
        opacity={1}
        fullBudget
        place={placeSpark}
      />
      <pointLight
        ref={light}
        color="#ffd27a"
        distance={3}
        decay={2}
        intensity={0}
        visible={false}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// dissolve — coloured streams curl up from the dissolving solid
// ---------------------------------------------------------------------------

const placeDissolve: Place = (i, { t, anchor }, out) => {
  const depth = liquidDepth(anchor)
  const phase = (t * 0.3 + seed(i, 2)) % 1
  const angle = seed(i, 1) * TAU + t * 0.9 + phase * 2.5
  const r = anchor.innerRadius * (0.2 + 0.55 * seed(i, 3)) * (0.5 + phase)
  out.x = anchor.base[0] + Math.cos(angle) * Math.min(r, anchor.innerRadius * 0.9)
  out.z = anchor.base[2] + Math.sin(angle) * Math.min(r, anchor.innerRadius * 0.9)
  out.y = anchor.base[1] + 0.008 + phase * depth * 0.8
  out.size = depth > 0.005 ? anchor.innerRadius * (0.18 + 0.2 * phase) : 0
  out.alpha = Math.sin(Math.PI * phase) * 0.7
}

function DissolveEffect(props: EffectViewProps) {
  return (
    <ParticleField {...props} kind="dissolve" shape="soft" opacity={0.5} place={placeDissolve} />
  )
}

// ---------------------------------------------------------------------------
// Layer
// ---------------------------------------------------------------------------

const EFFECT_COMPONENTS: Readonly<Record<EffectKind, (props: EffectViewProps) => React.ReactNode>> =
  {
    colorChange: ColorChangeEffect,
    precipitate: PrecipitateEffect,
    gas: GasEffect,
    flame: FlameEffect,
    smoke: SmokeEffect,
    heat: HeatEffect,
    explosion: ExplosionEffect,
    dissolve: DissolveEffect,
  }

interface ReactionEffectsLayerProps {
  /** Maps a container id to where its effects are drawn (null hides them). */
  resolve: EffectAnchorResolver
  /** Override for the OS "reduce motion" setting (e.g. a demo toggle). */
  reducedMotion?: boolean
}

/**
 * Renders every active reaction effect and advances the effects clock. Mount once per scene.
 * Effects come only from engine events passed to `useReactionEffectsStore.ingest`.
 */
export function ReactionEffectsLayer({ resolve, reducedMotion }: ReactionEffectsLayerProps) {
  const active = useReactionEffectsStore(
    useShallow((state) =>
      Object.values(state.effects).map((effect) => `${effect.key}|${effect.kind}`),
    ),
  )
  const prefersReduced = usePrefersReducedMotion()
  const motion = useMemo(
    () => effectMotion(reducedMotion ?? prefersReduced),
    [reducedMotion, prefersReduced],
  )
  useFrame((_, dt) => useReactionEffectsStore.getState().tick(dt))

  return (
    <group name="reaction-effects">
      {active.map((entry) => {
        const [key, kind] = entry.split('|') as [string, EffectKind]
        const View = EFFECT_COMPONENTS[kind]
        return <View key={key} effectKey={key} resolve={resolve} motion={motion} />
      })}
    </group>
  )
}
