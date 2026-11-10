/** L10: which container the particle view is showing (null = closed). */
import { create } from 'zustand'

interface ParticleViewState {
  containerId: string | null
  /** Presentation-only 2D output; never persisted with the laboratory session. */
  surface: HTMLCanvasElement | null
  setSurface: (surface: HTMLCanvasElement | null) => void
  open: (containerId: string) => void
  close: () => void
}

export const useParticleViewStore = create<ParticleViewState>()((set) => ({
  containerId: null,
  surface: null,
  setSurface: (surface) => set({ surface }),
  open: (containerId) => set({ containerId }),
  close: () => set({ containerId: null }),
}))
