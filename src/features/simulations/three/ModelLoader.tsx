import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import { clone as cloneSkinnedScene } from 'three/addons/utils/SkeletonUtils.js'

interface ModelLoaderProps {
  url: string
  scale?: number
}

function LoadedModel({ url, scale }: Required<ModelLoaderProps>) {
  const gltf = useGLTF(url)
  // GLTF loader caches the source. Clone once per loaded asset so independent
  // scene instances do not share transforms or skeletal rig references.
  // Mesh geometry and materials remain shared with the cached GLTF.
  const instance = useMemo(() => cloneSkinnedScene(gltf.scene), [gltf.scene])
  return <primitive object={instance} scale={scale} dispose={null} />
}

class ModelLoadBoundary extends Component<
  { url: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.warn(`Optional laboratory 3D asset could not be loaded: ${this.props.url}`, error)
  }

  render() {
    // The procedural lab scene stays functional if an optional GLB fails.
    // A key on the boundary lets a changed URL try loading again.
    return this.state.failed ? null : this.props.children
  }
}

/** Optional future GLB assets. Current apparatus is generated locally. */
export function ModelLoader({ url, scale = 1 }: ModelLoaderProps) {
  return (
    <ModelLoadBoundary key={url} url={url}>
      <Suspense fallback={null}>
        <LoadedModel url={url} scale={scale} />
      </Suspense>
    </ModelLoadBoundary>
  )
}
