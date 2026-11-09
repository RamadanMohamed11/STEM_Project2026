import { useMemo, useRef } from 'react'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { Canvas, useFrame } from '@react-three/fiber'
import { Atom, X } from 'lucide-react'
import { Object3D, type InstancedMesh, type MeshBasicMaterial } from 'three'
import { latticeSlots, type ParticleScene, type SpeciesView } from '../lib/particleModel'
import { useParticleScene } from '../state/useParticleScene'
import { useParticleViewStore } from '../state/useParticleViewStore'
import { usePrefersReducedMotion } from '../three/effects/reaction/usePrefersReducedMotion'
import { resolveEquipment } from '../three/sceneConfig'

const BASE_RADIUS = 0.034
/** Liquid surface in the view (−1 … 1); gas particles rise above it. */
const SURFACE_Y = 0.62
const dummy = new Object3D()

/** Deterministic 0–1 noise so initial layouts are stable (no Math.random during render). */
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453
  return x - Math.floor(x)
}

interface ParticleState {
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
}

function makeState(count: number, seed: number): ParticleState {
  const state = {
    x: new Float32Array(count),
    y: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
  }
  for (let i = 0; i < count; i++) {
    state.x[i] = (hash(i, seed) * 2 - 1) * 0.92
    state.y[i] = -0.9 + hash(i, seed + 1) * (SURFACE_Y + 0.85)
    state.vx[i] = (hash(i, seed + 2) - 0.5) * 0.4
    state.vy[i] = (hash(i, seed + 3) - 0.5) * 0.4
  }
  return state
}

function SpeciesParticles({
  view,
  slots,
  speed,
  seed,
  reduced,
}: {
  view: SpeciesView
  slots: readonly [number, number][]
  speed: number
  seed: number
  reduced: boolean
}) {
  const total = view.bound + view.free + view.gas
  const mesh = useRef<InstancedMesh>(null)
  const material = useRef<MeshBasicMaterial>(null)
  // Mutable per-particle state lives in a ref (rebuilt when the particle count changes).
  const stateRef = useRef<{ key: string; state: ParticleState } | null>(null)
  const size = BASE_RADIUS * view.radius

  useFrame(({ clock }, delta) => {
    const instanced = mesh.current
    if (!instanced) return
    const dt = Math.min(0.05, delta)
    const pace = speed * (reduced ? 0.3 : 1)
    const t = clock.elapsedTime
    const stateKey = `${total}:${seed}`
    if (stateRef.current?.key !== stateKey)
      stateRef.current = { key: stateKey, state: makeState(Math.max(1, total), seed) }
    const { x, y, vx, vy } = stateRef.current.state
    for (let i = 0; i < total; i++) {
      if (i < view.bound) {
        // In the lattice: ease to the slot and vibrate (more when hotter).
        const [sx, sy] = slots[i] ?? [0, -0.9]
        const wobble = 0.008 * pace
        const tx = sx + Math.sin(t * 9 * pace + i * 1.7) * wobble
        const ty = sy + Math.cos(t * 8 * pace + i * 2.3) * wobble
        const k = 1 - Math.exp(-3 * dt)
        x[i] += (tx - x[i]) * k
        y[i] += (ty - y[i]) * k
        vx[i] = 0
        vy[i] = 0
      } else {
        const gas = i >= view.bound + view.free
        // Random kicks (Brownian-like), damping and a speed limit that grow with temperature.
        vx[i] += (Math.random() - 0.5) * 3.2 * pace * dt
        vy[i] += (Math.random() - 0.5) * 3.2 * pace * dt + (gas ? 0.9 * pace * dt : 0)
        const limit = (gas ? 0.9 : 0.45) * pace
        const v = Math.hypot(vx[i], vy[i])
        if (v > limit) {
          vx[i] *= limit / v
          vy[i] *= limit / v
        }
        x[i] += vx[i] * dt
        y[i] += vy[i] * dt
        if (x[i] < -0.95 || x[i] > 0.95) {
          vx[i] = -vx[i]
          x[i] = Math.max(-0.95, Math.min(0.95, x[i]))
        }
        if (gas) {
          if (y[i] > 1.05) {
            // Escaped: a new gas particle leaves the surface.
            y[i] = SURFACE_Y
            x[i] = (Math.random() * 2 - 1) * 0.9
          }
        } else if (y[i] < -0.95 || y[i] > SURFACE_Y - 0.02) {
          vy[i] = -vy[i]
          y[i] = Math.max(-0.95, Math.min(SURFACE_Y - 0.02, y[i]))
        }
      }
      dummy.position.set(x[i], y[i], view.role === 'solvent' ? -0.1 : 0)
      dummy.scale.setScalar(size)
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
    }
    instanced.count = total
    instanced.instanceMatrix.needsUpdate = true
    if (material.current) material.current.opacity = view.role === 'solvent' ? 0.5 : 1
  })

  if (total === 0) return null
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, Math.max(1, total)]}
      frustumCulled={false}
    >
      <circleGeometry args={[1, 18]} />
      <meshBasicMaterial ref={material} color={view.color} transparent depthWrite={false} />
    </instancedMesh>
  )
}

function ParticleCanvasContent({ scene, reduced }: { scene: ParticleScene; reduced: boolean }) {
  const solutes = useMemo(() => scene.species.filter((s) => s.role === 'solute'), [scene])
  const slotsBySpecies = useMemo(() => {
    const slots = latticeSlots(solutes.map((s) => s.bound))
    return new Map(solutes.map((s, i) => [s.key, slots[i]]))
  }, [solutes])
  const hasLiquid =
    scene.species.some((s) => s.role === 'solvent' && s.free > 0) || solutes.some((s) => s.free > 0)
  return (
    <>
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshBasicMaterial color="#0d2733" />
      </mesh>
      {hasLiquid && (
        <mesh position={[0, (SURFACE_Y - 1.05) / 2, -0.4]}>
          <planeGeometry args={[2.1, SURFACE_Y + 1.05]} />
          <meshBasicMaterial color="#123c4f" />
        </mesh>
      )}
      {scene.species.map((view, index) => (
        <SpeciesParticles
          key={view.key}
          view={view}
          slots={slotsBySpecies.get(view.key) ?? []}
          speed={scene.speed}
          seed={index * 7 + 1}
          reduced={reduced}
        />
      ))}
    </>
  )
}

/** L10: zoomed particle view of the selected container, driven by the engine state. */
export function ParticleViewPanel() {
  const visible = usePageVisibility()
  const containerId = useParticleViewStore((state) => state.containerId)
  const scene = useParticleScene(containerId)
  const reduced = usePrefersReducedMotion()
  if (!containerId) return null
  const label = resolveEquipment(containerId)?.label ?? containerId
  return (
    <section
      aria-label={`Particle view of ${label}`}
      className="pointer-events-auto absolute bottom-16 right-3 z-20 max-h-[calc(100%-5rem)] w-[min(92vw,300px)] overflow-y-auto overscroll-contain rounded-2xl border border-white/20 bg-[#071d29]/95 p-3 text-white shadow-2xl backdrop-blur-xl"
    >
      <header className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#69dec8]">
          <Atom size={13} aria-hidden="true" /> Particle view · {label}
        </h2>
        <button
          type="button"
          aria-label="Close particle view"
          onClick={() => useParticleViewStore.getState().close()}
          className="flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </header>
      {!scene ? (
        <p className="text-xs text-white/65">This item holds no chemicals to show.</p>
      ) : (
        <>
          <div
            className="aspect-square w-full overflow-hidden rounded-xl border border-white/15"
            aria-hidden="true"
          >
            <Canvas frameloop={visible ? 'always' : 'never'} orthographic camera={{ position: [0, 0, 5], zoom: 130 }} dpr={[1, 1.5]}>
              <ParticleCanvasContent scene={scene} reduced={reduced} />
            </Canvas>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="mt-2 text-[11px] leading-relaxed text-white/80"
          >
            {scene.description}
          </p>
          <ul className="mt-2 space-y-1 text-[11px]" aria-label="Particle legend">
            {scene.species.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block size-3 shrink-0 rounded-full"
                  style={{ background: s.color, opacity: s.role === 'solvent' ? 0.6 : 1 }}
                />
                <span className="font-semibold">{s.formula}</span>
                <span className="truncate text-white/60">{s.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-white/60">
                  {s.role === 'solvent'
                    ? 'sample'
                    : [
                        s.bound && `${s.bound} in solid`,
                        s.free && `${s.free} free`,
                        s.gas && `${s.gas} gas`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] leading-relaxed text-white/45">
            Not to scale: the solvent is a small sample; dissolved particles keep their ratio. Speed
            follows the temperature ({Math.round(scene.temperatureC)} °C).
          </p>
        </>
      )}
    </section>
  )
}
