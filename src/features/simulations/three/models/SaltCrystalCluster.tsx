import { useLayoutEffect, useRef } from 'react'
import { Color, InstancedMesh, Object3D } from 'three'

export interface SaltCrystal {
  x: number
  y: number
  z: number
  size: number
  rotation: number
}

interface SaltCrystalClusterProps {
  crystals: readonly SaltCrystal[]
  count: number
}

/** Shared cubic NaCl markers: one draw call even for a full 5 g demonstration portion. */
export function SaltCrystalCluster({ crystals, count }: SaltCrystalClusterProps) {
  const mesh = useRef<InstancedMesh>(null)
  const clampedCount = Math.min(crystals.length, Math.max(0, count))

  useLayoutEffect(() => {
    if (!mesh.current) return
    const transform = new Object3D()
    const light = new Color('#faf9f1')
    const shadow = new Color('#dce1d6')
    for (let index = 0; index < clampedCount; index += 1) {
      const grain = crystals[index]
      transform.position.set(grain.x, grain.y, grain.z)
      transform.rotation.set(0.14, grain.rotation, index % 2 === 0 ? 0.16 : -0.14)
      transform.scale.setScalar(grain.size)
      transform.updateMatrix()
      mesh.current.setMatrixAt(index, transform.matrix)
      mesh.current.setColorAt(index, index % 4 === 0 ? shadow : light)
    }
    mesh.current.count = clampedCount
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [clampedCount, crystals])

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, crystals.length]}
      visible={clampedCount > 0}
      castShadow
      raycast={() => undefined}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#faf9f2" roughness={0.7} metalness={0} />
    </instancedMesh>
  )
}
