import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react'
import { Box } from 'lucide-react'
import { LaboratoryInteractionCoach } from './LaboratoryInteractionCoach'

const LaboratoryScene = lazy(() => import('@/features/simulations/three/LaboratoryScene'))

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unable to initialize 3D laboratory scene', error, info.componentStack)
  }

  render() {
    if (this.state.failed)
      return (
        <div
          role="alert"
          className="flex h-full flex-col items-center justify-center gap-3 bg-[#e6eef0] px-6 text-center"
        >
          <Box size={32} className="text-teal" aria-hidden="true" />
          <p className="font-semibold text-navy">The 3D renderer could not be started.</p>
          <p className="max-w-md text-sm text-ink/75">
            Enable WebGL or hardware acceleration in your browser. Your experiment data has not been
            lost.
          </p>
        </div>
      )
    return this.props.children
  }
}

/** A persistent viewport scene. Procedure and apparatus actions are performed inside it. */
export function LaboratoryCanvas() {
  return (
    <section
      aria-labelledby="3d-workspace-title"
      className="relative size-full min-h-0 min-w-0 overflow-hidden bg-[#dde9e9]"
    >
      <h2 id="3d-workspace-title" className="sr-only">
        Interactive 3D laboratory
      </h2>
      <div className="absolute inset-0">
        <SceneErrorBoundary>
          <Suspense
            fallback={
              <div
                role="status"
                className="flex size-full items-center justify-center bg-[#e6eef0] text-sm text-navy"
              >
                Preparing 3D laboratory…
              </div>
            }
          >
            <LaboratoryScene />
          </Suspense>
        </SceneErrorBoundary>
      </div>
      <LaboratoryInteractionCoach />
    </section>
  )
}
