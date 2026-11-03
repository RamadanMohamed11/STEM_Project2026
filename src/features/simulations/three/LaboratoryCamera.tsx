import { useCallback, useEffect, useMemo, useRef } from 'react'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { DEFAULT_CAMERA_TARGET, LAB_CAMERA_FOV, cameraPositionForAspect } from './sceneConfig'

export function LaboratoryCamera() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const cameraResetKey = useLabSceneStore((state) => state.cameraResetKey)
  const dragging = useLabSceneStore((state) => state.draggingId !== null)
  const placing = useLabSceneStore((state) => state.placement !== null)
  const size = useThree((state) => state.size)
  const aspect = size.height > 0 ? size.width / size.height : 16 / 9
  const defaultPosition = useMemo(() => cameraPositionForAspect(aspect), [aspect])
  const framedDistance = Math.hypot(
    defaultPosition[0] - DEFAULT_CAMERA_TARGET[0],
    defaultPosition[1] - DEFAULT_CAMERA_TARGET[1],
    defaultPosition[2] - DEFAULT_CAMERA_TARGET[2],
  )

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    controls.object.position.set(...defaultPosition)
    controls.target.set(...DEFAULT_CAMERA_TARGET)
    controls.update()
    controls.saveState()
  }, [cameraResetKey, defaultPosition])

  const constrainTarget = useCallback(() => {
    const controls = controlsRef.current
    if (!controls) return
    const { target, object: camera } = controls
    const x = Math.max(-2.1, Math.min(2.1, target.x))
    const y = Math.max(0.64, Math.min(1.75, target.y))
    const z = Math.max(-1.15, Math.min(1.25, target.z))
    const deltaX = x - target.x
    const deltaY = y - target.y
    const deltaZ = z - target.z
    if (deltaX === 0 && deltaY === 0 && deltaZ === 0) return

    // Preserve camera-to-target offset when panning reaches a bench boundary.
    // OrbitControls will update on its next frame; invoking update() here
    // recursively fires onChange and can cause camera jitter.
    target.set(x, y, z)
    camera.position.x += deltaX
    camera.position.y += deltaY
    camera.position.z += deltaZ
  }, [])

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={defaultPosition}
        fov={LAB_CAMERA_FOV}
        near={0.075}
        far={65}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[...DEFAULT_CAMERA_TARGET]}
        enabled={!dragging && !placing}
        enableDamping
        dampingFactor={0.095}
        enablePan
        enableZoom
        minDistance={2.95}
        maxDistance={Math.max(12.5, framedDistance * 1.7)}
        minPolarAngle={0.34}
        maxPolarAngle={1.36}
        minAzimuthAngle={-1.5}
        maxAzimuthAngle={1.5}
        onChange={constrainTarget}
      />
    </>
  )
}
