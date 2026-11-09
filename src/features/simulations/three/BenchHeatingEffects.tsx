import { useMemo, useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type Group,
  type PointLight,
  type ShaderMaterial,
} from 'three'
import { burnerUnder, heatSourceOf, HOT_TOUCH_C } from '../lib/benchHeating'
import { receiverRimHeight } from '../lib/benchLiquids'
import {
  benchTemperatureC,
  benchVolumeMl,
  useBenchLiquidsStore,
} from '../state/useBenchLiquidsStore'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { snapElevation } from './benchLayout'
import { FLAME_FRAGMENT, FLAME_VERTEX } from './effects/reaction/flameShader'
import { usePrefersReducedMotion } from './effects/reaction/usePrefersReducedMotion'
import { BENCH_TOP } from './sceneConfig'

/** Flame of one lit burner, standing on its barrel / wick, flickering. */
function BurnerFlame({ id }: { id: string }) {
  const source = heatSourceOf(id)
  const group = useRef<Group>(null)
  const material = useRef<ShaderMaterial>(null)
  const light = useRef<PointLight>(null)
  const camera = useThree((state) => state.camera)
  const reduced = usePrefersReducedMotion()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color(source?.flameColor ?? '#ff9a2e') },
      uIntensity: { value: 0.95 },
    }),
    [source],
  )
  useFrame(({ clock }) => {
    const root = group.current
    const at = useLabSceneStore.getState().positions[id]
    if (!root || !at || !source) return
    root.position.set(at.x, BENCH_TOP + source.flameBaseY, at.z)
    root.rotation.y = Math.atan2(camera.position.x - at.x, camera.position.z - at.z)
    const live = material.current?.uniforms
    if (live) live.uTime.value = clock.elapsedTime * (reduced ? 0.4 : 1)
    if (light.current)
      light.current.intensity = 1.6 + (reduced ? 0 : 0.3 * Math.sin(clock.elapsedTime * 15))
  })
  if (!source) return null
  return (
    <group ref={group} name={`burner-flame-${id}`}>
      <mesh
        position={[0, source.flameHeight / 2, 0]}
        scale={[source.flameHeight * 0.45, source.flameHeight, 1]}
        raycast={() => undefined}
        renderOrder={8}
      >
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
      <pointLight
        ref={light}
        color={source.flameColor}
        position={[0, source.flameHeight * 0.5, 0]}
        distance={1.4}
        decay={2}
        intensity={1.6}
      />
    </group>
  )
}

/** "72 °C · boiling" above a vessel that is warm, heated or boiling. */
function TemperatureTag({ id }: { id: string }) {
  const temperature = useBenchLiquidsStore((state) => {
    const value = benchTemperatureC(state, id)
    return value === null ? null : Math.round(value)
  })
  const lit = useBenchLiquidsStore((state) => state.lit)
  const burner = useLabSceneStore((state) => burnerUnder(id, state.relationships))
  const heated = !!burner && lit.includes(burner)
  const hasLiquid = useBenchLiquidsStore((state) => benchVolumeMl(state, id) > 1e-6)
  const position = useLabSceneStore((state) => state.positions[id])
  const lift = useLabSceneStore((state) => snapElevation(id, state.relationships))
  if (temperature === null || !position || (temperature < 30 && !heated)) return null
  const boiling = heated && temperature >= 100 && hasLiquid
  const hot = temperature >= HOT_TOUCH_C
  return (
    <Html
      center
      position={[position.x, BENCH_TOP + lift + (receiverRimHeight(id) ?? 0.4) + 0.28, position.z]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
      zIndexRange={[19, 0]}
    >
      <div
        className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums shadow ${
          hot
            ? 'border-orange-300/70 bg-[#5a2a10]/90 text-orange-50'
            : 'border-white/25 bg-[#082a37]/85 text-white'
        }`}
      >
        {temperature} °C{boiling ? ' · boiling' : heated ? ' · heating' : ''}
      </div>
    </Html>
  )
}

/** L7 visuals: lit burner flames and temperature tags. Boiling bubbles/steam come from L6 effects. */
export function BenchHeatingEffects() {
  const lit = useBenchLiquidsStore((state) => state.lit)
  const ids = useBenchLiquidsStore((state) => state.ids)
  return (
    <>
      {lit.map((id) => (
        <BurnerFlame key={id} id={id} />
      ))}
      {ids.map((id) => (
        <TemperatureTag key={id} id={id} />
      ))}
    </>
  )
}
