import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

interface VesselMarkingsProps {
  capacityMl: number
  stepMl: number
  labelEveryMl: number
  bottomY: number
  maxHeight: number
  radiusBottom: number
  radiusTop: number
  textHeight?: number
}

/** Printed arcs follow the outside wall; scale heights share the fill's calibration. */
export function VesselMarkings({
  capacityMl,
  stepMl,
  labelEveryMl,
  bottomY,
  maxHeight,
  radiusBottom,
  radiusTop,
  textHeight = 0.032,
}: VesselMarkingsProps) {
  const padding = 0.024
  const printedHeight = maxHeight + padding * 2
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 1536
    const context = canvas.getContext('2d')!
    const pixelsPerUnit = canvas.height / printedHeight
    const physicalWidth = ((radiusBottom + radiusTop) / 2) * 1.9
    context.strokeStyle = '#0d1b2a'
    context.fillStyle = '#0d1b2a'
    context.lineWidth = Math.max(2, pixelsPerUnit * 0.0022)
    context.font = `500 ${pixelsPerUnit * textHeight}px Arial, sans-serif`
    context.textAlign = 'left'
    context.textBaseline = 'middle'
    // Account for the different horizontal/vertical texel densities on the patch.
    const fontStretch = canvas.width / physicalWidth / pixelsPerUnit
    for (let volume = stepMl; volume <= capacityMl; volume += stepMl) {
      const labelled = volume % labelEveryMl === 0
      const y = (padding + maxHeight * (1 - volume / capacityMl)) * pixelsPerUnit
      context.beginPath()
      context.moveTo(canvas.width * 0.12, y)
      context.lineTo(canvas.width * (labelled ? 0.46 : 0.31), y)
      context.stroke()
      if (labelled) {
        context.save()
        context.translate(canvas.width * 0.52, y)
        context.scale(fontStretch, 1)
        context.fillText(String(volume), 0, 0)
        context.restore()
      }
    }
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    result.anisotropy = 4
    return result
  }, [
    capacityMl,
    stepMl,
    labelEveryMl,
    maxHeight,
    radiusBottom,
    radiusTop,
    textHeight,
    printedHeight,
  ])
  useEffect(() => () => texture.dispose(), [texture])
  const slope = (radiusTop - radiusBottom) / maxHeight

  return (
    <mesh position={[0, bottomY + maxHeight / 2, 0]} rotation={[0, 0.28, 0]} renderOrder={7}>
      <cylinderGeometry
        args={[
          radiusTop + padding * slope + 0.001,
          radiusBottom - padding * slope + 0.001,
          printedHeight,
          48,
          1,
          true,
          -0.95,
          1.9,
        ]}
      />
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.1}
        depthWrite={false}
        roughness={0.68}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  )
}
