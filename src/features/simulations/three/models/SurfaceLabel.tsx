import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

interface SurfaceLabelProps {
  lines: readonly string[]
  width: number
  height: number
  color?: string
  background?: string
  /** An open cylindrical patch instead of a flat decal. */
  radius?: number
}

/** Local system-font printing: no HTML overlay, font fetch or external texture. */
export function SurfaceLabel({
  lines,
  width,
  height,
  color = '#304f50',
  background,
  radius,
}: SurfaceLabelProps) {
  const text = lines.join('\n')
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = Math.max(64, Math.round((768 * height) / width))
    const context = canvas.getContext('2d')!
    if (background) {
      context.fillStyle = background
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    const rows = text.split('\n')
    const rowHeight = canvas.height / (rows.length + 0.5)
    context.fillStyle = color
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    for (const [index, row] of rows.entries()) {
      const size = rowHeight * (index === 0 ? 0.68 : 0.46)
      context.font = `${index === 0 ? 600 : 400} ${size}px Arial, sans-serif`
      context.fillText(row, canvas.width / 2, rowHeight * (index + 0.75), canvas.width * 0.9)
    }
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    result.anisotropy = 4
    return result
  }, [text, width, height, color, background])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh renderOrder={7} raycast={() => undefined}>
      {radius ? (
        <cylinderGeometry
          args={[radius, radius, height, 40, 1, true, -width / radius / 2, width / radius]}
        />
      ) : (
        <planeGeometry args={[width, height]} />
      )}
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.08}
        depthWrite={false}
        roughness={0.74}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  )
}
