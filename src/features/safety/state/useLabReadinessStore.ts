/**
 * L9: protective equipment the student has put on (Safety page "Get Lab Ready", or in the lab).
 * Kept for the browser session so the lab's safety rules can check it.
 */
import { create } from 'zustand'

const KEY = 'stem-lab-readiness'

function load(): { goggles: boolean } {
  try {
    if (typeof sessionStorage === 'undefined') return { goggles: false }
    const raw = sessionStorage.getItem(KEY)
    return raw ? { goggles: !!JSON.parse(raw).goggles } : { goggles: false }
  } catch {
    return { goggles: false }
  }
}

interface LabReadinessState {
  goggles: boolean
  setGoggles: (on: boolean) => void
}

export const useLabReadinessStore = create<LabReadinessState>()((set) => ({
  ...load(),
  setGoggles: (goggles) => {
    try {
      if (typeof sessionStorage !== 'undefined')
        sessionStorage.setItem(KEY, JSON.stringify({ goggles }))
    } catch {
      // Storage may be blocked; the in-memory value still applies.
    }
    set({ goggles })
  },
}))
