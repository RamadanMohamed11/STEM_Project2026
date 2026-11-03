import { useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, Object3D } from 'three'

/** Small local 3D segment glyphs are legible on the instruments without a remote font. */
type Segment = 'top' | 'middle' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

const segments: Record<string, readonly Segment[]> = {
  '0': ['top', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
  '1': ['topRight', 'bottomRight'],
  '2': ['top', 'middle', 'bottom', 'topRight', 'bottomLeft'],
  '3': ['top', 'middle', 'bottom', 'topRight', 'bottomRight'],
  '4': ['middle', 'topLeft', 'topRight', 'bottomRight'],
  '5': ['top', 'middle', 'bottom', 'topLeft', 'bottomRight'],
  '6': ['top', 'middle', 'bottom', 'topLeft', 'bottomLeft', 'bottomRight'],
  '7': ['top', 'topRight', 'bottomRight'],
  '8': ['top', 'middle', 'bottom', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
  '9': ['top', 'middle', 'bottom', 'topLeft', 'topRight', 'bottomRight'],
  '-': ['middle'],
  g: ['top', 'middle', 'bottom', 'topLeft', 'bottomRight', 'bottomLeft'],
}

interface SegmentLabelProps {
  value: string
  height?: number
  color?: string
  emissive?: string
  glow?: number
}

export function SegmentLabel({
  value,
  height = 0.044,
  color = '#315d70',
  emissive = '#000000',
  glow = 0,
}: SegmentLabelProps) {
  const width = height * 0.53
  const spacing = height * 0.19
  const total = value.length * (width + spacing) - spacing
  const thickness = height * 0.095
  const instance = useRef<InstancedMesh>(null)
  const strokes = useMemo(() => {
    const shapes: { x: number; y: number; width: number; height: number }[] = []
    for (const [index, character] of [...value].entries()) {
      const characterX = index * (width + spacing) - total / 2 + width / 2
      if (character === '.') {
        shapes.push({
          x: characterX,
          y: -height * 0.45,
          width: thickness * 1.4,
          height: thickness * 1.4,
        })
        continue
      }
      for (const segment of segments[character] ?? []) {
        const horizontal = segment === 'top' || segment === 'middle' || segment === 'bottom'
        const x = horizontal ? 0 : segment.endsWith('Left') ? -width / 2 : width / 2
        const y =
          segment === 'top'
            ? height / 2
            : segment === 'bottom'
              ? -height / 2
              : segment === 'middle'
                ? 0
                : segment.startsWith('top')
                  ? height / 4
                  : -height / 4
        shapes.push({
          x: characterX + x,
          y,
          width: horizontal ? width - thickness * 0.5 : thickness,
          height: horizontal ? thickness : height / 2 - thickness * 0.25,
        })
      }
    }
    return shapes
  }, [value, width, spacing, total, height, thickness])

  useLayoutEffect(() => {
    if (!instance.current) return
    const transform = new Object3D()
    for (const [index, stroke] of strokes.entries()) {
      transform.position.set(stroke.x, stroke.y, 0)
      transform.scale.set(stroke.width, stroke.height, 0.0015)
      transform.updateMatrix()
      instance.current.setMatrixAt(index, transform.matrix)
    }
    instance.current.count = strokes.length
    instance.current.instanceMatrix.needsUpdate = true
    instance.current.computeBoundingSphere()
  }, [strokes])

  return (
    <instancedMesh
      ref={instance}
      args={[undefined, undefined, strokes.length]}
      raycast={() => undefined}
      renderOrder={7}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={glow}
        roughness={0.41}
        transparent
        opacity={0.98}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
