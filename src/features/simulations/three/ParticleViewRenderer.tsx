import { useEffect, useRef, useState } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera, Scene } from 'three'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { useParticleViewStore } from '../state/useParticleViewStore'
import { useParticleScene } from '../state/useParticleScene'
import { createParticleRenderTarget } from '../lib/particleRenderTarget'
import { usePrefersReducedMotion } from './effects/reaction/usePrefersReducedMotion'
import { ParticleSceneContent } from './ParticleSceneContent'

function ParticleOutput({
  surface,
  scene,
  visible,
}: {
  surface: HTMLCanvasElement
  scene: Scene
  visible: boolean
}) {
  const gl = useThree((state) => state.gl)
  const [camera] = useState(() => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
    camera.position.z = 5
    camera.zoom = 130
    return camera
  })
  const output = useRef<ReturnType<typeof createParticleRenderTarget>>(null)
  const size = useRef({ width: 0, height: 0 })
  useEffect(() => {
    const update = () => {
      size.current = { width: surface.clientWidth, height: surface.clientHeight }
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(surface)
    const renderer = createParticleRenderTarget(gl, surface)
    output.current = renderer
    return () => {
      observer.disconnect()
      output.current = null
      renderer?.dispose()
    }
  }, [gl, surface])

  // Registered after particle animation callbacks. Priority 0 leaves the normal lab pass intact.
  useFrame(() => {
    output.current?.render(
      scene,
      camera,
      size.current.width,
      size.current.height,
      Math.min(1.5, Math.max(1, window.devicePixelRatio)),
      () => visible && !document.hidden,
    )
  })
  return null
}

/** Mounted once inside the existing Canvas; the portal owns no renderer or WebGL context. */
export function ParticleViewRenderer() {
  const containerId = useParticleViewStore((state) => state.containerId)
  const surface = useParticleViewStore((state) => state.surface)
  const model = useParticleScene(containerId)
  const visible = usePageVisibility()
  const reduced = usePrefersReducedMotion()
  const [scene] = useState(() => new Scene())
  if (!containerId || !surface || !model) return null
  return createPortal(
    <>
      <ParticleSceneContent scene={model} reduced={reduced} />
      <ParticleOutput surface={surface} scene={scene} visible={visible} />
    </>,
    scene,
    { events: { enabled: false } },
  )
}
