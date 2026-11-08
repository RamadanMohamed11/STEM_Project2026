/**
 * L6: active reaction effects, fed only by engine events. Any engine runner (bench liquids,
 * experiments, the dev demo) calls `ingest(events, definition)`; the scene's effect layer
 * calls `tick(dt)` once per frame and renders what is active.
 */
import { create } from 'zustand'
import type { ChemistryDefinition, LabEvent } from '../engine/core/index.ts'
import {
  advanceEffects,
  emptyEffects,
  ingestEffectEvents,
  type EffectsState,
} from '../lib/reactionEffects.ts'

interface ReactionEffectsStore extends EffectsState {
  ingest: (events: readonly LabEvent[], definition?: ChemistryDefinition) => void
  tick: (dtS: number) => void
  clear: (containerId?: string) => void
}

export const useReactionEffectsStore = create<ReactionEffectsStore>()((set, get) => ({
  ...emptyEffects(),
  ingest: (events, definition) => {
    const state = get()
    const next = ingestEffectEvents(state, events, definition)
    if (next !== state) set({ effects: next.effects })
  },
  tick: (dtS) => {
    const state = get()
    if (!Object.keys(state.effects).length) {
      set({ timeS: state.timeS + Math.max(0, Math.min(0.25, dtS || 0)) })
      return
    }
    set(advanceEffects(state, dtS))
  },
  clear: (containerId) =>
    set((state) =>
      containerId
        ? {
            effects: Object.fromEntries(
              Object.entries(state.effects).filter(([, e]) => e.containerId !== containerId),
            ),
          }
        : { effects: {} },
    ),
}))
