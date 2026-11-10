/**
 * L6 dev-only demo: every reaction effect, each produced by a real engine reaction
 * (`simulateTick` → effect events → reaction-effects store → effect layer).
 */
import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { create } from 'zustand'
import {
  readColor,
  readTemperatureC,
  readVolumeMl,
  simulateTick,
  type LabState,
  type TickConditions,
} from '../engine/core/index.ts'
import {
  EFFECTS_DEMO_CONDITIONS,
  EFFECTS_DEMO_DEFINITION,
  EFFECTS_DEMO_VESSELS,
} from '../data/effectsDemoDefinition'
import { useReactionEffectsStore } from '../state/useReactionEffectsStore'
import { LibraryModel } from '../three/models/library/LibraryModel'
import { vesselEffectAnchor } from '../three/effects/reaction/effectAnchors'
import { ReactionEffectsLayer } from '../three/effects/reaction/ReactionEffects'
import { SceneLabel, SceneLabels } from '../three/SceneLabels'

const definition = EFFECTS_DEMO_DEFINITION
const SPACING = 1.1
const PER_ROW = 4
/** Two rows of four so every vessel fits a laptop-width viewport. */
const positionOf = (index: number): [number, number, number] => [
  ((index % PER_ROW) - (PER_ROW - 1) / 2) * SPACING,
  0,
  Math.floor(index / PER_ROW) * 1.3 - 0.65,
]
const vesselIndex = new Map(EFFECTS_DEMO_VESSELS.map((vessel, i) => [vessel.id, i]))
const modelOf = new Map(EFFECTS_DEMO_VESSELS.map((vessel) => [vessel.id, vessel.modelId]))

const emptyLab = (): LabState => ({
  timeS: 0,
  containers: Object.fromEntries(
    definition.containers.map((c) => [c.id, { contents: {}, temperatureC: 22 }]),
  ),
})

interface DemoState {
  lab: LabState
  running: readonly string[]
  observations: Readonly<Record<string, string>>
  run: (id: string) => void
  runAll: () => void
  reset: () => void
  step: (dtS: number) => void
}

const useDemoStore = create<DemoState>()((set, get) => ({
  lab: emptyLab(),
  running: [],
  observations: {},
  run: (id) => {
    const container = definition.containers.find((c) => c.id === id)
    if (!container) return
    const contents: Record<string, number> = {}
    for (const entry of container.initialContents ?? []) contents[entry.substanceId] = entry.amount
    const state = get()
    useReactionEffectsStore.getState().clear(id)
    set({
      lab: {
        ...state.lab,
        containers: { ...state.lab.containers, [id]: { contents, temperatureC: 22 } },
      },
      running: [...state.running.filter((r) => r !== id), id],
      observations: { ...state.observations, [id]: '' },
    })
  },
  runAll: () => EFFECTS_DEMO_VESSELS.forEach((vessel) => get().run(vessel.id)),
  reset: () => {
    useReactionEffectsStore.getState().clear()
    set({ lab: emptyLab(), running: [], observations: {} })
  },
  step: (dtS) => {
    const state = get()
    if (!state.running.length) return
    const conditions: TickConditions = {
      stirring: EFFECTS_DEMO_CONDITIONS.stirring?.filter((id) => state.running.includes(id)),
      heatingCPerSecond: Object.fromEntries(
        Object.entries(EFFECTS_DEMO_CONDITIONS.heatingCPerSecond ?? {}).filter(([id]) =>
          state.running.includes(id),
        ),
      ),
    }
    const result = simulateTick(definition, state.lab, Math.min(0.1, dtS), conditions)
    if (!result.ok) return
    let observations = state.observations
    for (const event of result.events)
      if (event.type === 'reacted' && !observations[event.containerId])
        observations = { ...observations, [event.containerId]: event.observation }
    set({ lab: result.state, observations })
    useReactionEffectsStore.getState().ingest(result.events, definition)
  },
}))

function resolveDemoAnchor(containerId: string) {
  const index = vesselIndex.get(containerId)
  const modelId = modelOf.get(containerId)
  if (index === undefined || !modelId) return null
  const { lab } = useDemoStore.getState()
  return vesselEffectAnchor(modelId, positionOf(index), readVolumeMl(definition, lab, containerId))
}

function EngineRunner() {
  useFrame((_, dt) => useDemoStore.getState().step(dt))
  return null
}

function RenderStats({ report }: { report: (text: string) => void }) {
  const gl = useThree((state) => state.gl)
  const last = useRef(0)
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.5) return
    last.current = clock.elapsedTime
    const effects = Object.keys(useReactionEffectsStore.getState().effects).length
    report(
      `draw calls ${gl.info.render.calls} · triangles ${gl.info.render.triangles} · active effects ${effects}`,
    )
  })
  return null
}

function DemoVessel({ index }: { index: number }) {
  const vessel = EFFECTS_DEMO_VESSELS[index]
  // Rounded selector: the vessel re-renders only when the shown volume changes.
  const volume = useDemoStore(
    (state) => Math.round(readVolumeMl(definition, state.lab, vessel.id) * 10) / 10,
  )
  const color = useDemoStore((state) => readColor(definition, state.lab, vessel.id))
  return (
    <group position={positionOf(index)}>
      <LibraryModel
        id={vessel.modelId}
        selected={false}
        volumeMl={volume}
        liquidColor={color ?? undefined}
      />
      <SceneLabel center position={[0, 0.9, 0]}>
        <div className="whitespace-nowrap rounded bg-navy/90 px-2 py-1 text-[10px] text-white">
          {vessel.title} · {volume.toFixed(1)} mL
        </div>
      </SceneLabel>
    </group>
  )
}

/** Plain DOM readouts (front row first, matching the scene left to right). */
function DemoReadout({ index }: { index: number }) {
  const vessel = EFFECTS_DEMO_VESSELS[index]
  const volume = useDemoStore(
    (state) => Math.round(readVolumeMl(definition, state.lab, vessel.id) * 10) / 10,
  )
  const temperature = useDemoStore((state) => Math.round(readTemperatureC(state.lab, vessel.id)))
  const observation = useDemoStore((state) => state.observations[vessel.id])
  return (
    <li className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
      <p className="font-semibold">
        {vessel.title} <span className="font-normal text-white/50">({vessel.modelId})</span>
      </p>
      <p className="tabular-nums text-white/70">
        {volume.toFixed(1)} mL · {temperature} °C
      </p>
      <p className="min-h-[1.2em] text-[#9ff0e1]">{observation}</p>
    </li>
  )
}

export function ReactionEffectsDemo() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const stats = useRef<HTMLSpanElement>(null)
  const { run, runAll, reset } = useDemoStore.getState()
  useEffect(() => () => useDemoStore.getState().reset(), [])

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[520px] flex-col bg-[#0b2230] text-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 text-xs">
        <h1 className="mr-2 text-sm font-semibold">Reaction effects (dev demo · L6)</h1>
        <button
          type="button"
          onClick={runAll}
          className="rounded-lg bg-[#13a593] px-3 py-1.5 font-semibold hover:bg-[#119384]"
        >
          Run all
        </button>
        {EFFECTS_DEMO_VESSELS.map((vessel) => (
          <button
            key={vessel.id}
            type="button"
            onClick={() => run(vessel.id)}
            className="rounded-lg border border-white/20 px-2.5 py-1.5 hover:bg-white/10"
          >
            {vessel.title}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/20 px-2.5 py-1.5 hover:bg-white/10"
        >
          Reset
        </button>
        <label className="ml-2 flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
          />
          Reduced motion
        </label>
        <span ref={stats} className="ml-auto tabular-nums text-white/60" />
      </div>
      <div className="relative flex-1">
        <SceneLabels>
          <Canvas camera={{ position: [0, 2.3, 5.4], fov: 40 }} dpr={[1, 1.5]}>
            <color attach="background" args={['#10303f']} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 5, 4]} intensity={1.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
              <planeGeometry args={[7, 4.5]} />
              <meshStandardMaterial color="#2a4552" roughness={0.9} />
            </mesh>
            <Suspense fallback={null}>
              {EFFECTS_DEMO_VESSELS.map((vessel, index) => (
                <DemoVessel key={vessel.id} index={index} />
              ))}
            </Suspense>
            <EngineRunner />
            <ReactionEffectsLayer resolve={resolveDemoAnchor} reducedMotion={reducedMotion} />
            <RenderStats
              report={(text) => {
                if (stats.current) stats.current.textContent = text
              }}
            />
            <OrbitControls target={[0, 0.35, 0]} />
            <Stats />
          </Canvas>
        </SceneLabels>
      </div>
      <ol className="grid grid-cols-2 gap-1.5 border-t border-white/10 p-2 text-[11px] leading-tight sm:grid-cols-4">
        {/* Back row (Colour change … Flame), then front row (Smoke … Dissolving). */}
        {EFFECTS_DEMO_VESSELS.map((vessel, index) => (
          <DemoReadout key={vessel.id} index={index} />
        ))}
      </ol>
    </div>
  )
}
