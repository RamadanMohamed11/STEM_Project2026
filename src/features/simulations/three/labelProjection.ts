import type { Camera, Vector3 } from 'three'

/** Mutates caller-owned scratch space only; no React updates in the frame loop. */
export function projectSceneLabel(
  point: Vector3,
  camera: Camera,
  width: number,
  height: number,
  range: readonly [number, number],
) {
  const distance = point.distanceTo(camera.position)
  point.project(camera)
  const clipping = camera as Camera & { near: number; far: number }
  return {
    x: ((point.x + 1) * width) / 2,
    y: ((1 - point.y) * height) / 2,
    visible: point.z >= -1 && point.z <= 1,
    zIndex: Math.round(
      range[0] +
        (range[1] - range[0]) *
          Math.min(1, Math.max(0, (distance - clipping.near) / (clipping.far - clipping.near))),
    ),
  }
}
