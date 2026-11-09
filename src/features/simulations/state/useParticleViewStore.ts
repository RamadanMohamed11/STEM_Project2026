/** L10: which container the particle view is showing (null = closed). */
import { create } from 'zustand'

interface ParticleViewState {
  containerId: string | null
  open: (containerId: string) => void
  close: () => void
}

export const useParticleViewStore = create<ParticleViewState>()((set) => ({
  containerId: null,
  open: (containerId) => set({ containerId }),
  close: () => set({ containerId: null }),
}))
