import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Mesh, Plane, Raycaster, Vector2, Vector3, type Group, type Material } from 'three'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { EquipmentModel } from './models'
import { shouldUpdatePlacementHint } from './placementHintMotion'
import { BENCH_TOP, equipmentRegistry } from './sceneConfig'

const tabletopPlane = new Plane(new Vector3(0, 1, 0), -BENCH_TOP)
const EQUIPMENT_DRAG_TYPE = 'application/x-stem-lab-equipment'

/** Every preview descendant is excluded from picking. Ghost uses its own
 * newly-mounted model materials so the real equipment is never made transparent.
 * Model contents are memoized as its parent moves under the pointer. */
const GhostEquipmentModel = memo(function GhostEquipmentModel({
  visual,
}: {
  visual: (typeof equipmentRegistry)[number]['visual']
}) {
  const model = useRef<Group>(null)
  useLayoutEffect(() => {
    const root = model.current
    if (!root) return
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return
      object.raycast = () => undefined
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) {
        // These procedural preview materials are local to the mounted ghost.
        // Keep the surface color and shape readable, without opaque occlusion.
        const ghostMaterial = material as Material
        ghostMaterial.transparent = true
        ghostMaterial.opacity *= 0.38
        ghostMaterial.depthWrite = false
        ghostMaterial.needsUpdate = true
      }
      object.castShadow = false
      object.receiveShadow = false
    })
  }, [visual])

  return (
    <group ref={model}>
      <EquipmentModel visual={visual} selected={false} />
    </group>
  )
})

/**
 * A camera ray intersects the *physical bench plane*, never a pixel-to-world mapping.
 * Listen at canvas capture phase to avoid equipment geometry intercepting placement,
 * even when the camera moves below the top of the tallest vessel.
 */
export function PlacementController() {
  const { gl, camera } = useThree()
  const placement = useLabSceneStore((state) => state.placement)
  const updatePlacement = useLabSceneStore((state) => state.updatePlacement)
  const confirmPlacement = useLabSceneStore((state) => state.confirmPlacement)
  const cancelPlacement = useLabSceneStore((state) => state.cancelPlacement)
  const placementId = placement?.id

  useEffect(() => {
    if (!placementId) return
    const canvas = gl.domElement
    const raycaster = new Raycaster()
    const coordinates = new Vector2()
    const intersection = new Vector3()
    let lastProjected: { x: number; z: number } | null = null

    const project = (event: Pick<PointerEvent, 'clientX' | 'clientY'>) => {
      const bounds = canvas.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return false
      coordinates.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(coordinates, camera)
      if (!raycaster.ray.intersectPlane(tabletopPlane, intersection)) return false
      const projected = { x: intersection.x, z: intersection.z }
      const current = useLabSceneStore.getState().placement
      if (current?.id !== placementId) return false
      if (
        shouldUpdatePlacementHint(lastProjected, projected) &&
        shouldUpdatePlacementHint(current.position, projected)
      ) {
        lastProjected = projected
        updatePlacement(projected)
      }
      return true
    }

    const onPointerMove = (event: PointerEvent) => {
      project(event)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !project(event)) return
      if (useLabSceneStore.getState().placement?.valid) confirmPlacement()
      // Prevent orbit and tool picks only while the user explicitly places an
      // inventory item. Invalid clicks leave the red ghost and hint in place.
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      cancelPlacement()
    }

    canvas.addEventListener('pointermove', onPointerMove, true)
    canvas.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove, true)
      canvas.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [placementId, gl, camera, updatePlacement, confirmPlacement, cancelPlacement])

  useEffect(() => {
    const canvas = gl.domElement
    const raycaster = new Raycaster()
    const coordinates = new Vector2()
    const intersection = new Vector3()
    let nativeDragId: string | null = null
    let dropReceived = false

    const acceptedDrag = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes(EQUIPMENT_DRAG_TYPE)

    const projectDrag = (event: DragEvent) => {
      const bounds = canvas.getBoundingClientRect()
      if (bounds.width <= 0 || bounds.height <= 0) return null
      coordinates.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(coordinates, camera)
      if (!raycaster.ray.intersectPlane(tabletopPlane, intersection)) return null
      return { x: intersection.x, z: intersection.z }
    }

    const onDragStart = (event: DragEvent) => {
      if (!acceptedDrag(event)) return
      // Drag payload can be read at dragstart and drop, but *not* reliably in
      // dragover. Read it once after inventory's onDragStart populates it.
      const id = event.dataTransfer?.getData(EQUIPMENT_DRAG_TYPE)
      const scene = useLabSceneStore.getState()
      if (
        !id ||
        !equipmentRegistry.some((item) => item.id === id) ||
        scene.placedIds.includes(id) ||
        scene.draggingId ||
        scene.pressedId ||
        useSaltSimulationStore.getState().effect ||
        useSaltSimulationStore.getState().transfer
      )
        return
      nativeDragId = id
      dropReceived = false
      if (scene.placement?.id !== id) {
        if (scene.placement) scene.cancelPlacement()
        useLabSceneStore.getState().beginPlacement(id)
      }
    }

    const onDragOver = (event: DragEvent) => {
      if (!acceptedDrag(event)) return
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
      const scene = useLabSceneStore.getState()
      if (!nativeDragId || scene.placement?.id !== nativeDragId) return
      const point = projectDrag(event)
      if (point && shouldUpdatePlacementHint(scene.placement.position, point))
        scene.updatePlacement(point)
    }

    const onDrop = (event: DragEvent) => {
      if (!acceptedDrag(event)) return
      event.preventDefault()
      event.stopPropagation()
      dropReceived = true
      const id = event.dataTransfer?.getData(EQUIPMENT_DRAG_TYPE)
      const scene = useLabSceneStore.getState()
      if (
        !id ||
        !equipmentRegistry.some((item) => item.id === id) ||
        scene.placedIds.includes(id) ||
        scene.draggingId ||
        scene.pressedId ||
        useSaltSimulationStore.getState().effect ||
        useSaltSimulationStore.getState().transfer
      )
        return

      // A native HTML drag does not fire an R3F pointerdown. Create the same
      // inventory placement preview, then validate against the authoritative
      // table bounds/footprints before committing.
      if (scene.placement?.id !== id) {
        if (scene.placement) scene.cancelPlacement()
        useLabSceneStore.getState().beginPlacement(id)
      }
      const active = useLabSceneStore.getState()
      if (active.placement?.id !== id) return
      const at = projectDrag(event)
      if (!at) return
      if (shouldUpdatePlacementHint(active.placement.position, at)) active.updatePlacement(at)
      const preview = useLabSceneStore.getState().placement
      if (preview?.valid) useLabSceneStore.getState().confirmPlacement()
    }

    const onDragEnd = () => {
      const scene = useLabSceneStore.getState()
      // Releasing outside the bench cancels a pending native inventory drag.
      // A *rejected* drop on the bench deliberately retains its red ghost so
      // the learner can move it to a clear space and try again.
      if (nativeDragId && !dropReceived && scene.placement?.id === nativeDragId)
        scene.cancelPlacement()
      nativeDragId = null
      dropReceived = false
    }

    document.addEventListener('dragstart', onDragStart)
    document.addEventListener('dragend', onDragEnd)
    canvas.addEventListener('dragover', onDragOver)
    canvas.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragstart', onDragStart)
      document.removeEventListener('dragend', onDragEnd)
      canvas.removeEventListener('dragover', onDragOver)
      canvas.removeEventListener('drop', onDrop)
    }
  }, [gl, camera])

  if (!placement) return null
  const entry = equipmentRegistry.find((item) => item.id === placement.id)
  if (!entry) return null
  if (!placement.position)
    return (
      <Html
        position={[0, BENCH_TOP + 0.9, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          role="status"
          className="w-60 rounded-lg border border-amber-400/70 bg-[#092631]/95 px-3 py-2 text-center text-xs text-amber-100 shadow-xl"
        >
          {placement.message}
        </div>
      </Html>
    )

  return (
    <group position={[placement.position.x, BENCH_TOP + 0.013, placement.position.z]}>
      <GhostEquipmentModel visual={entry.visual} />
      <mesh raycast={() => undefined} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[entry.footprintRadius + 0.035, entry.footprintRadius + 0.085, 64]} />
        <meshBasicMaterial
          color={placement.valid ? '#12b8a6' : '#e25b4e'}
          transparent
          opacity={placement.valid ? 0.92 : 0.96}
          depthWrite={false}
        />
      </mesh>
      <mesh raycast={() => undefined} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <circleGeometry args={[entry.footprintRadius + 0.03, 64]} />
        <meshBasicMaterial
          color={placement.valid ? '#12b8a6' : '#e25b4e'}
          transparent
          opacity={0.11}
          depthWrite={false}
        />
      </mesh>
      <Html
        position={[
          0,
          (entry.id === 'graduated-cylinder'
            ? 1.13
            : entry.id === 'water'
              ? 0.98
              : entry.id === 'stirring-rod'
                ? 1.13
                : 0.95) + 0.14,
          0,
        ]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          role="status"
          className={`w-48 rounded-lg border px-2.5 py-1.5 text-center text-[11px] leading-4 shadow-xl ${
            placement.valid
              ? 'border-[#5ae0c8] bg-[#073b40]/95 text-[#c8fff3]'
              : 'border-[#f5a276] bg-[#42231d]/95 text-[#ffe6dc]'
          }`}
        >
          <strong className="block text-xs">{entry.label}</strong>
          {placement.valid ? 'Clear space · click to place' : placement.message}
        </div>
      </Html>
    </group>
  )
}
