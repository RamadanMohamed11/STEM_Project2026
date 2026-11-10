import { Canvas } from '@react-three/fiber'
import { SceneLabels } from './SceneLabels'
import type { RootState } from '@react-three/fiber'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { LaboratoryCamera } from './LaboratoryCamera'
import { LaboratoryEnvironment } from './LaboratoryEnvironment'
import { LaboratoryLighting } from './LaboratoryLighting'
import { SceneInteractionManager } from './SceneInteractionManager'
import { WasteBinMarker } from './WasteBinMarker'
import { AdaptiveRenderQuality } from './AdaptiveRenderQuality'
import { BenchPourEffects } from './BenchPourEffects'
import { BenchHeatingEffects } from './BenchHeatingEffects'
import { benchEffectAnchor } from './benchEffectAnchors'
import { ReactionEffectsLayer } from './effects/reaction/ReactionEffects'
import { PlacementController } from './PlacementController'
import { ScenePerformance } from './ScenePerformance'
import { SimulationSceneEffects } from './SimulationSceneEffects'
import { ParticleViewRenderer } from './ParticleViewRenderer'
import { LaboratoryPhysics } from './LaboratoryPhysics'
import { EquipmentAffordanceHints } from './EquipmentAffordanceHints'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'

const RENDERER_OPTIONS = {
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
} as const

export default function LaboratoryScene() {
  const placementValid = useLabSceneStore((state) => state.placement?.valid ?? null)
  const dragging = useLabSceneStore((state) => state.draggingId !== null)
  const hovering = useLabSceneStore((state) => state.hoveredId !== null)
  const tiltHandleHovered = useLabSceneStore((state) => state.tiltHandleHoveredId !== null)
  const visible = usePageVisibility()
  const [contextLost, setContextLost] = useState(false)
  const [renderKey, setRenderKey] = useState(0)
  const clearContextListeners = useRef<(() => void) | null>(null)

  const onCreated = useCallback(({ gl }: RootState) => {
    gl.setClearColor('#eaf0f2')
    // Context loss does not always throw. Keep an accessible recovery control
    // while WebGL waits to restore instead of showing a permanently blank bench.
    clearContextListeners.current?.()
    const canvas = gl.domElement
    const onLost = (event: Event) => {
      event.preventDefault()
      setContextLost(true)
    }
    const onRestored = () => setContextLost(false)
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    clearContextListeners.current = () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
    }
  }, [])

  useEffect(() => () => clearContextListeners.current?.(), [])

  const retryRenderer = () => {
    clearContextListeners.current?.()
    clearContextListeners.current = null
    setContextLost(false)
    setRenderKey((key) => key + 1)
  }

  return (
    <SceneLabels>
      <Canvas
        key={renderKey}
        shadows="percentage"
        frameloop={visible ? 'always' : 'never'}
        style={{
          touchAction: 'none',
          cursor:
            placementValid !== null
              ? placementValid
                ? 'copy'
                : 'not-allowed'
              : dragging
                ? 'grabbing'
                : tiltHandleHovered
                  ? 'ns-resize'
                  : hovering
                    ? 'grab'
                    : 'auto',
        }}
        dpr={[1, 1.5]}
        gl={RENDERER_OPTIONS}
        fallback={
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ink">
            3D graphics are unavailable in this browser. The inventory and guide remain accessible
            below.
          </div>
        }
        onPointerMissed={(event) => {
          const scene = useLabSceneStore.getState()
          if (
            event.type === 'click' &&
            event.button === 0 &&
            !scene.pressedId &&
            !scene.draggingId &&
            !scene.placement &&
            !useSaltSimulationStore.getState().transfer
          )
            scene.clearSelection()
        }}
        onCreated={onCreated}
      >
        <Suspense fallback={null}>
          <AdaptiveRenderQuality />
          {import.meta.env.DEV && <ScenePerformance />}
          <LaboratoryCamera />
          <LaboratoryLighting />
          <LaboratoryEnvironment />
          <LaboratoryPhysics paused={!visible}>
            <SceneInteractionManager />
          </LaboratoryPhysics>
          <PlacementController />
          <WasteBinMarker />
          <BenchPourEffects />
          <BenchHeatingEffects />
          <ReactionEffectsLayer resolve={benchEffectAnchor} />
          <EquipmentAffordanceHints />
          <SimulationSceneEffects />
          <ParticleViewRenderer />
        </Suspense>
      </Canvas>
      {contextLost && (
        <div
          role="alert"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#eaf0f2] px-6 text-center"
        >
          <p className="text-sm font-semibold text-navy">
            The 3D graphics context was interrupted.
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-ink/75">
            The browser may restore it automatically. Your laboratory controls and recorded
            measurements are still available.
          </p>
          <button
            type="button"
            onClick={retryRenderer}
            className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white"
          >
            Retry 3D view
          </button>
        </div>
      )}
    </SceneLabels>
  )
}
