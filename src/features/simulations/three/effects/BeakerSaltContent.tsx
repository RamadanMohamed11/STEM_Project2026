import { useLayoutEffect, useRef } from 'react'
import { InstancedMesh, Object3D } from 'three'

const MAX_GRAINS = 36

/**
 * Schematic undissolved grains in a beaker. A gram is not represented by a
 * literal grain count; each cube is an illustrative marker for visible solid.
 * Dissolved NaCl ions are invisible and are not shown as separate molecules.
 */
export function BeakerSaltContent({ undissolvedG }: { undissolvedG: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const count = Number.isFinite(undissolvedG)
    ? Math.min(MAX_GRAINS, Math.max(0, Math.ceil(undissolvedG * 2)))
    : 0

  useLayoutEffect(() => {
    if (!mesh.current) return
    const grain = new Object3D()
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.3999632297
      const radius = Math.sqrt((index + 0.5) / MAX_GRAINS) * 0.19
      grain.position.set(
        Math.sin(angle) * radius,
        0.104 + (index % 3) * 0.013,
        Math.cos(angle) * radius,
      )
      grain.rotation.set(index * 0.2, angle, 0.12)
      grain.scale.setScalar(0.8 + (index % 3) * 0.2)
      grain.updateMatrix()
      mesh.current.setMatrixAt(index, grain.matrix)
    }
    mesh.current.count = count
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [count])

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, MAX_GRAINS]}
      count={count}
      visible={count > 0}
    >
      <boxGeometry args={[0.02, 0.02, 0.02]} />
      <meshStandardMaterial color="#ffffff" roughness={0.76} />
    </instancedMesh>
  )
}
