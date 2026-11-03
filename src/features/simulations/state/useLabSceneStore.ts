import { create } from 'zustand'
import {
  INITIAL_PLACED_IDS,
  findSuggestedPosition,
  makeInitialPositions,
  placementMessage,
  validatePlacement,
} from '../three/movement.ts'
import { equipmentRegistry, type Point2D } from '../three/sceneConfig.ts'
import type { SpatialRelationship } from '../engine/spatialInteractions.ts'

export interface PlacementPreview {
  id: string
  position: Point2D | null
  valid: boolean
  message: string
}

interface LabSceneState {
  selectedId: string | null
  hoveredId: string | null
  /** Which visible tilt grip is hovered (separate from generic body hover). */
  tiltHandleHoveredId: string | null
  draggingId: string | null
  placedIds: readonly string[]
  positions: Record<string, Point2D>
  rotations: Record<string, number>
  placement: PlacementPreview | null
  /** Last confirmed spatial contacts, separate from chemistry containment. */
  relationships: Readonly<Record<string, SpatialRelationship>>
  feedback: string | null
  cameraResetKey: number
  select: (id: string | null) => void
  setHovered: (id: string | null) => void
  setTiltHandleHovered: (id: string | null) => void
  beginPlacement: (id: string) => void
  updatePlacement: (position: Point2D) => void
  confirmPlacement: () => boolean
  cancelPlacement: () => void
  removeFromBench: (id: string) => void
  beginDrag: (id: string) => void
  finishDrag: () => void
  move: (id: string, requested: Point2D) => void
  rotate: (id: string, direction: 1 | -1) => void
  setRelationship: (relationship: SpatialRelationship) => void
  clearFeedback: () => void
  resetEquipment: () => void
  resetCamera: () => void
}

const initialRotations = () => Object.fromEntries(equipmentRegistry.map((item) => [item.id, 0]))
const initialState = () => ({
  selectedId: null,
  hoveredId: null,
  tiltHandleHoveredId: null,
  draggingId: null,
  placedIds: [...INITIAL_PLACED_IDS] as readonly string[],
  positions: makeInitialPositions(),
  rotations: initialRotations(),
  placement: null,
  relationships: {},
  feedback: null,
})

/** One instance per registered tool in T06; guide reading progress remains independent. */
export const useLabSceneStore = create<LabSceneState>((set, get) => ({
  ...initialState(),
  cameraResetKey: 0,
  select: (id) =>
    set((state) => ({
      selectedId: state.placement ? state.selectedId : state.selectedId === id ? null : id,
      feedback: null,
    })),
  setHovered: (id) => set({ hoveredId: id }),
  setTiltHandleHovered: (id) => set({ tiltHandleHoveredId: id }),
  beginPlacement: (id) =>
    set((state) => {
      if (!equipmentRegistry.some((item) => item.id === id) || state.placedIds.includes(id))
        return state
      const position = findSuggestedPosition(id, state.positions, state.placedIds)
      return {
        selectedId: id,
        draggingId: null,
        feedback: null,
        placement: {
          id,
          position,
          valid: position !== null,
          message: position
            ? 'Preview ready. Click the bench or confirm the suggested position.'
            : 'No free space remains on the workbench.',
        },
      }
    }),
  updatePlacement: (position) =>
    set((state) => {
      if (!state.placement) return state
      const result = validatePlacement(
        state.placement.id,
        position,
        state.positions,
        state.placedIds,
      )
      return {
        placement: {
          id: state.placement.id,
          position,
          valid: result.valid,
          message: result.valid
            ? 'Valid placement. Click to confirm.'
            : placementMessage(result.reason),
        },
      }
    }),
  confirmPlacement: () => {
    const state = get()
    const preview = state.placement
    if (!preview?.position || !preview.valid) return false
    const verified = validatePlacement(
      preview.id,
      preview.position,
      state.positions,
      state.placedIds,
    )
    if (!verified.valid) {
      set({ feedback: placementMessage(verified.reason) })
      return false
    }
    set({
      placedIds: [...state.placedIds, preview.id],
      positions: { ...state.positions, [preview.id]: { ...preview.position } },
      selectedId: preview.id,
      placement: null,
      feedback: `${equipmentRegistry.find((item) => item.id === preview.id)?.label ?? 'Equipment'} placed on the bench.`,
    })
    return true
  },
  cancelPlacement: () => set({ placement: null, feedback: 'Placement cancelled.' }),
  removeFromBench: (id) =>
    set((state) => {
      if (!state.placedIds.includes(id) || state.draggingId) return state
      return {
        placedIds: state.placedIds.filter((item) => item !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        relationships: Object.fromEntries(
          Object.entries(state.relationships).filter(
            ([actor, relation]) => actor !== id && relation.targetId !== id,
          ),
        ),
        feedback: 'Equipment returned to inventory.',
      }
    }),
  beginDrag: (id) =>
    set((state) =>
      state.placedIds.includes(id) && !state.placement
        ? {
            selectedId: id,
            draggingId: id,
            tiltHandleHoveredId: null,
            relationships: Object.fromEntries(
              Object.entries(state.relationships).filter(
                ([actor, relation]) => actor !== id && relation.targetId !== id,
              ),
            ),
            feedback: null,
          }
        : state,
    ),
  finishDrag: () => set({ draggingId: null }),
  move: (id, requested) =>
    set((state) => {
      if (!state.placedIds.includes(id) || state.placement) return state
      const check = validatePlacement(id, requested, state.positions, state.placedIds)
      if (!check.valid) return { feedback: placementMessage(check.reason) }
      return {
        positions: { ...state.positions, [id]: requested },
        relationships: Object.fromEntries(
          Object.entries(state.relationships).filter(
            ([actor, relation]) => actor !== id && relation.targetId !== id,
          ),
        ),
        feedback: null,
      }
    }),
  setRelationship: (relationship) =>
    set((state) =>
      state.placedIds.includes(relationship.actorId) &&
      state.placedIds.includes(relationship.targetId)
        ? {
            relationships: {
              ...state.relationships,
              [relationship.actorId]: relationship,
            },
          }
        : state,
    ),
  rotate: (id, direction) =>
    set((state) =>
      state.placedIds.includes(id) && !state.placement
        ? {
            rotations: {
              ...state.rotations,
              [id]: (state.rotations[id] ?? 0) + (direction * Math.PI) / 8,
            },
            feedback: null,
          }
        : state,
    ),
  clearFeedback: () => set({ feedback: null }),
  resetEquipment: () => set(initialState()),
  resetCamera: () => set((state) => ({ cameraResetKey: state.cameraResetKey + 1 })),
}))
