import { BufferGeometry, Float32BufferAttribute } from 'three'

interface TrayRing {
  halfWidth: number
  halfDepth: number
  cornerRadius: number
  y: number
}

/** A closed thin-wall dish, following the underside, rolled lip and inner floor. */
export function roundedTrayGeometry(rings: readonly TrayRing[], cornerSegments = 6) {
  const vertices: number[] = []
  const indices: number[] = []
  const ringSize = (cornerSegments + 1) * 4
  for (const ring of rings) {
    for (let corner = 0; corner < 4; corner += 1) {
      const angle = (corner * Math.PI) / 2
      const centerX = (corner === 0 || corner === 3 ? 1 : -1) * (ring.halfWidth - ring.cornerRadius)
      const centerZ = (corner < 2 ? 1 : -1) * (ring.halfDepth - ring.cornerRadius)
      for (let step = 0; step <= cornerSegments; step += 1) {
        const theta = angle + (step / cornerSegments) * (Math.PI / 2)
        vertices.push(
          centerX + Math.cos(theta) * ring.cornerRadius,
          ring.y,
          centerZ + Math.sin(theta) * ring.cornerRadius,
        )
      }
    }
  }
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let point = 0; point < ringSize; point += 1) {
      const a = ring * ringSize + point
      const b = ring * ringSize + ((point + 1) % ringSize)
      const c = a + ringSize
      const d = b + ringSize
      indices.push(a, c, b, b, c, d)
    }
  }
  const bottomCenter = vertices.length / 3
  vertices.push(0, rings[0].y, 0)
  const insideCenter = vertices.length / 3
  vertices.push(0, rings[rings.length - 1].y, 0)
  for (let point = 0; point < ringSize; point += 1) {
    const next = (point + 1) % ringSize
    indices.push(bottomCenter, point, next)
    const lastRing = (rings.length - 1) * ringSize
    indices.push(insideCenter, lastRing + next, lastRing + point)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
