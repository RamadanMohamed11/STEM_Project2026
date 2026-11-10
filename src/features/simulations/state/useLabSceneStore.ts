import { create } from 'zustand'
import {
  INITIAL_PLACED_IDS,
  findSuggestedPosition,
  makeInitialPositions,
  placementMessage,
  validatePlacement,
} from '../three/movement.ts'
import {
  equipmentRegistry,
  isExtraInstance,
  isKnownEquipment,
  nextInstanceId,
  resolveEquipment,
  type Point2D,
} from '../three/sceneConfig.ts'
import type { SpatialRelationship } from '../engine/spatialInteractions.ts'
import { snappedChildren, snappedPartners } from '../three/benchLayout.ts'
import { useBenchLiquidsStore } from './useBenchLiquidsStore.ts'
import { subscribeBenchHistory, type PracticeLiquidSnapshot } from './benchHistoryEvents.ts'
import { isBenchLiquidContainer } from '../lib/benchLiquids.ts'
import { vesselOver } from '../lib/benchHeating.ts'

export interface PlacementPreview {
  id: string
  position: Point2D | null
  valid: boolean
  message: string
}

/** Layout only; practice-container payloads are small, separate history patches. */
export interface BenchSnapshot {
  placedIds: readonly string[]
  positions: Record<string, Point2D>
  rotations: Record<string, number>
  relationships: Readonly<Record<string, SpatialRelationship>>
}

export interface BenchHistoryEntry {
  label: string
  snapshot: BenchSnapshot
  liquids?: PracticeLiquidSnapshot
  /** A pour must not overwrite later, unrecorded evaporation or chemistry. */
  expectedLiquids?: PracticeLiquidSnapshot
  blockedReason?: string
}

export const MAX_BENCH_HISTORY = 20

interface LabSceneState {
  selectedId: string | null
  /** Ordered, unique pair; selection order never determines transfer direction. */
  selectedIds: readonly string[]
  pressedId: string | null
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
  /** L3 undo/redo stacks of bench layouts (most recent last). */
  past: readonly BenchHistoryEntry[]
  future: readonly BenchHistoryEntry[]
  /** Layout captured when a drag starts; committed to history if the drag moves anything. */
  dragStart: BenchSnapshot | null
  select: (id: string | null) => void
  toggleSelection: (id: string, additive?: boolean) => void
  clearSelection: () => void
  beginPress: (id: string) => void
  endPress: () => void
  setHovered: (id: string | null) => void
  setTiltHandleHovered: (id: string | null) => void
  beginPlacement: (id: string) => void
  updatePlacement: (position: Point2D) => void
  confirmPlacement: () => boolean
  cancelPlacement: () => void
  removeFromBench: (id: string) => void
  beginDrag: (id: string) => void
  finishDrag: () => void
  /** `overlapAllowed`: extra ids a drag may pass over (L4 snap holders). */
  move: (id: string, requested: Point2D, overlapAllowed?: ReadonlySet<string>) => void
  rotate: (id: string, direction: 1 | -1) => void
  setRelationship: (relationship: SpatialRelationship) => void
  clearFeedback: () => void
  resetEquipment: () => void
  resetCamera: () => void
  /** Places the next free copy of a type at a suggested free spot (keyboard friendly). */
  addToBench: (typeId: string) => string | null
  /** Drag released over the waste bin: extra copies are deleted, originals return to inventory. */
  dropInWasteBin: (id: string) => void
  undo: () => boolean
  redo: () => boolean
  /** Returns the bench to its starting layout (undoable). Chemistry is not changed. */
  resetBench: () => void
  /** Locks an item to a holder's snap point (part of the drag that placed it). */
  snapTo: (id: string, holderId: string, position: Point2D) => void
  /** L4: a drag released over a holder without snapping settles back here (same history entry). */
  settleDrag: (id: string, position: Point2D) => void
}

const initialRotations = () => Object.fromEntries(equipmentRegistry.map((item) => [item.id, 0]))
const initialState = () => ({
  selectedId: null,
  selectedIds: [] as readonly string[],
  pressedId: null,
  hoveredId: null,
  tiltHandleHoveredId: null,
  draggingId: null,
  placedIds: [...INITIAL_PLACED_IDS] as readonly string[],
  positions: makeInitialPositions(),
  rotations: initialRotations(),
  placement: null,
  relationships: {},
  feedback: null,
  past: [] as readonly BenchHistoryEntry[],
  future: [] as readonly BenchHistoryEntry[],
  dragStart: null as BenchSnapshot | null,
})

function snapshotOf(state: BenchSnapshot): BenchSnapshot {
  return {
    placedIds: [...state.placedIds],
    positions: Object.fromEntries(
      Object.entries(state.positions).map(([id, point]) => [id, { ...point }]),
    ),
    rotations: { ...state.rotations },
    relationships: { ...state.relationships },
  }
}

/** History update for a committed bench action; clears the redo stack. */
function record(state: LabSceneState, label: string, vesselIds: readonly string[] = []) {
  const liquids = useBenchLiquidsStore.getState().captureHistory(vesselIds)
  return {
    past: [
      ...state.past,
      {
        label,
        snapshot: snapshotOf(state),
        ...(Object.keys(liquids.containers).length ? { liquids } : {}),
      },
    ].slice(-MAX_BENCH_HISTORY),
    future: [] as readonly BenchHistoryEntry[],
  }
}

/** On moving `id`, drop its own contacts but keep items snapped onto it (they move along). */
function keepRelationOnMove(id: string, actor: string, relation: SpatialRelationship) {
  if (actor === id) return false
  return relation.targetId !== id || relation.kind === 'snapped'
}

const labelOf = (id: string) => resolveEquipment(id)?.label ?? 'Equipment'

function samePlacement(a: BenchSnapshot, b: BenchSnapshot) {
  return (
    a.placedIds.length === b.placedIds.length &&
    a.placedIds.every((id) => b.placedIds.includes(id)) &&
    a.placedIds.every(
      (id) =>
        a.positions[id]?.x === b.positions[id]?.x &&
        a.positions[id]?.z === b.positions[id]?.z &&
        (a.rotations[id] ?? 0) === (b.rotations[id] ?? 0),
    )
  )
}

function changedItems(before: BenchSnapshot, after: BenchSnapshot) {
  return [...new Set([...before.placedIds, ...after.placedIds])].filter(
    (id) =>
      before.placedIds.includes(id) !== after.placedIds.includes(id) ||
      before.positions[id]?.x !== after.positions[id]?.x ||
      before.positions[id]?.z !== after.positions[id]?.z ||
      (before.rotations[id] ?? 0) !== (after.rotations[id] ?? 0) ||
      JSON.stringify(before.relationships[id]) !== JSON.stringify(after.relationships[id]),
  )
}

function blockedHot(ids: readonly string[], state: BenchSnapshot) {
  return ids.some((id) => useBenchLiquidsStore.getState().checkHotTouch(id, state.relationships))
}

function sameContents(a: PracticeLiquidSnapshot, b: PracticeLiquidSnapshot) {
  return (
    Object.keys(a.containers).every((id) => {
      const left = a.containers[id],
        right = b.containers[id]
      if (!left || !right) return left === right
      return [...new Set([...Object.keys(left.contents), ...Object.keys(right.contents)])].every(
        (substance) =>
          Math.abs((left.contents[substance] ?? 0) - (right.contents[substance] ?? 0)) < 1e-9,
      )
    }) &&
    (a.spilledTotalMl === undefined || a.spilledTotalMl === b.spilledTotalMl)
  )
}

function restoreEntry(state: LabSceneState, entry: BenchHistoryEntry, undo: boolean) {
  const bench = useBenchLiquidsStore.getState()
  if (bench.pour) return false
  const affected = [
    ...new Set([
      ...changedItems(state, entry.snapshot),
      ...Object.keys(entry.liquids?.containers ?? {}),
    ]),
  ]
  if (blockedHot(affected, state)) return false
  if (entry.blockedReason) {
    useLabSceneStore.setState({ feedback: entry.blockedReason })
    return false
  }
  const currentLiquids = entry.liquids
    ? bench.captureHistory(
        Object.keys(entry.liquids.containers),
        entry.liquids.spilledTotalMl !== undefined,
      )
    : undefined
  if (
    entry.expectedLiquids &&
    currentLiquids &&
    !sameContents(entry.expectedLiquids, currentLiquids)
  ) {
    useLabSceneStore.setState({
      feedback:
        'The liquid changed after this action. Undo cannot restore it without changing the amount of material.',
    })
    return false
  }
  const inverse: BenchHistoryEntry = {
    label: entry.label,
    snapshot: snapshotOf(state),
    ...(currentLiquids ? { liquids: currentLiquids } : {}),
    ...(entry.expectedLiquids ? { expectedLiquids: entry.liquids } : {}),
  }
  // Never automatically relight a burner. A changed/removed heated vessel makes
  // the existing flame unsafe even when the burner itself has not moved.
  for (const burner of bench.lit) {
    const previous = vesselOver(burner, state.relationships, bench.ids)
    const next = vesselOver(
      burner,
      entry.snapshot.relationships,
      entry.snapshot.placedIds.filter(isBenchLiquidContainer),
    )
    if (!entry.snapshot.placedIds.includes(burner) || next !== previous)
      useBenchLiquidsStore.getState().setLit(burner, false, state.relationships)
  }
  // Restore removed stock containers directly to their saved contents, never
  // briefly refilling from defaults before the history patch is applied.
  if (entry.liquids)
    useBenchLiquidsStore.getState().restoreHistory(entry.liquids, entry.snapshot.placedIds)
  useLabSceneStore.setState({
    ...snapshotOf(entry.snapshot),
    ...(undo
      ? {
          past: state.past.slice(0, -1),
          future: [...state.future, inverse].slice(-MAX_BENCH_HISTORY),
        }
      : {
          future: state.future.slice(0, -1),
          past: [...state.past, inverse].slice(-MAX_BENCH_HISTORY),
        }),
    selectedId: null,
    selectedIds: [],
    hoveredId: null,
    feedback: `${undo ? 'Undid' : 'Redid'}: ${entry.label}.`,
  })
  return true
}

/** Removes an id from the bench; extra copies are forgotten entirely. */
function withoutItem(state: LabSceneState, id: string) {
  const extra = isExtraInstance(id)
  const positions = { ...state.positions }
  const rotations = { ...state.rotations }
  if (extra) {
    delete positions[id]
    delete rotations[id]
  }
  return {
    placedIds: state.placedIds.filter((item) => item !== id),
    positions,
    rotations,
    selectedId: state.selectedIds.filter((selected) => selected !== id).at(-1) ?? null,
    selectedIds: state.selectedIds.filter((selected) => selected !== id),
    pressedId: state.pressedId === id ? null : state.pressedId,
    hoveredId: state.hoveredId === id ? null : state.hoveredId,
    relationships: Object.fromEntries(
      Object.entries(state.relationships).filter(
        ([actor, relation]) => actor !== id && relation.targetId !== id,
      ),
    ),
  }
}

/** One instance per registered tool in T06; guide reading progress remains independent. */
export const useLabSceneStore = create<LabSceneState>((set, get) => ({
  ...initialState(),
  cameraResetKey: 0,
  select: (id) =>
    set((state) => {
      if (state.placement || state.draggingId || state.pressedId) return state
      const selected = state.selectedId === id ? null : id
      return { selectedId: selected, selectedIds: selected ? [selected] : [], feedback: null }
    }),
  toggleSelection: (id, additive = false) =>
    set((state) => {
      if (state.placement || state.draggingId || state.pressedId || !state.placedIds.includes(id))
        return state
      const selectedIds = state.selectedIds.includes(id)
        ? state.selectedIds.filter((selected) => selected !== id)
        : state.selectedIds.length < 2
          ? [...state.selectedIds, id]
          : additive
            ? [state.selectedIds[0], id]
            : [id]
      return { selectedIds, selectedId: selectedIds.at(-1) ?? null, feedback: null }
    }),
  clearSelection: () => set({ selectedIds: [], selectedId: null }),
  beginPress: (id) =>
    set((state) =>
      state.placedIds.includes(id) && !state.placement && !state.pressedId && !state.draggingId
        ? { pressedId: id }
        : state,
    ),
  endPress: () => set({ pressedId: null }),
  setHovered: (id) => set({ hoveredId: id }),
  setTiltHandleHovered: (id) => set({ tiltHandleHoveredId: id }),
  beginPlacement: (id) =>
    set((state) => {
      if (!isKnownEquipment(id) || state.placedIds.includes(id)) return state
      const position = findSuggestedPosition(id, state.positions, state.placedIds)
      return {
        selectedId: id,
        selectedIds: [],
        pressedId: null,
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
      ...record(state, `Place ${labelOf(preview.id)}`, [preview.id]),
      placedIds: [...state.placedIds, preview.id],
      positions: { ...state.positions, [preview.id]: { ...preview.position } },
      rotations: { ...state.rotations, [preview.id]: state.rotations[preview.id] ?? 0 },
      selectedId: preview.id,
      selectedIds: [preview.id],
      placement: null,
      feedback: `${labelOf(preview.id)} placed on the bench.`,
    })
    return true
  },
  cancelPlacement: () => set({ placement: null, feedback: 'Placement cancelled.' }),
  removeFromBench: (id) =>
    set((state) => {
      if (!state.placedIds.includes(id) || state.draggingId) return state
      if (useBenchLiquidsStore.getState().pour || blockedHot([id], state)) return state
      return {
        ...record(state, `Remove ${labelOf(id)}`, [id]),
        ...withoutItem(state, id),
        feedback: isExtraInstance(id)
          ? `${labelOf(id)} removed from the bench.`
          : 'Equipment returned to inventory.',
      }
    }),
  beginDrag: (id) =>
    set((state) =>
      state.placedIds.includes(id) && !state.placement
        ? {
            draggingId: id,
            dragStart: snapshotOf(state),
            tiltHandleHoveredId: null,
            relationships: Object.fromEntries(
              Object.entries(state.relationships).filter(([actor, relation]) =>
                keepRelationOnMove(id, actor, relation),
              ),
            ),
            feedback: null,
          }
        : state,
    ),
  finishDrag: () =>
    set((state) => {
      const start = state.dragStart
      if (!state.draggingId) return { dragStart: null }
      const moved = start && !samePlacement(start, state)
      return {
        draggingId: null,
        dragStart: null,
        ...(moved
          ? {
              past: [
                ...state.past,
                { label: `Move ${labelOf(state.draggingId)}`, snapshot: start },
              ].slice(-MAX_BENCH_HISTORY),
              future: [],
            }
          : {}),
      }
    }),
  move: (id, requested, overlapAllowed) =>
    set((state) => {
      if (!state.placedIds.includes(id) || state.placement) return state
      const partners = snappedPartners(id, state.relationships)
      // Only a live drag of this item may pass over extra holders.
      if (overlapAllowed && state.draggingId === id)
        for (const other of overlapAllowed) partners.add(other)
      const check = validatePlacement(id, requested, state.positions, state.placedIds, partners)
      if (!check.valid) return { feedback: placementMessage(check.reason) }
      // L3: items snapped onto this holder move with it.
      const from = state.positions[id]
      const positions = { ...state.positions, [id]: requested }
      if (from)
        for (const child of snappedChildren(id, state.relationships)) {
          const at = state.positions[child]
          if (at)
            positions[child] = { x: at.x + requested.x - from.x, z: at.z + requested.z - from.z }
        }
      return {
        // Drag samples are committed once in finishDrag; keyboard/button moves are recorded here.
        ...(state.draggingId === id ? {} : record(state, `Move ${labelOf(id)}`)),
        positions,
        relationships: Object.fromEntries(
          Object.entries(state.relationships).filter(([actor, relation]) =>
            keepRelationOnMove(id, actor, relation),
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
            ...record(state, `Rotate ${labelOf(id)}`),
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
  addToBench: (typeId) => {
    const state = get()
    if (state.placement || state.draggingId || state.pressedId) return null
    const id = nextInstanceId(typeId, state.placedIds)
    if (!id) {
      set({ feedback: `No more ${labelOf(typeId).toLowerCase()} copies are available.` })
      return null
    }
    const position = findSuggestedPosition(id, state.positions, state.placedIds)
    if (!position) {
      set({ feedback: 'No free space remains on the workbench.' })
      return null
    }
    set({
      ...record(state, `Place ${labelOf(id)}`, [id]),
      placedIds: [...state.placedIds, id],
      positions: { ...state.positions, [id]: position },
      rotations: { ...state.rotations, [id]: state.rotations[id] ?? 0 },
      selectedId: id,
      selectedIds: [id],
      feedback: `${labelOf(id)} placed on the bench.`,
    })
    return id
  },
  dropInWasteBin: (id) =>
    set((state) => {
      if (!state.placedIds.includes(id)) return state
      if (useBenchLiquidsStore.getState().pour || blockedHot([id], state)) return state
      // One undo restores the item where the drag started.
      const before = state.dragStart ?? snapshotOf(state)
      return {
        ...withoutItem(state, id),
        draggingId: state.draggingId === id ? null : state.draggingId,
        dragStart: null,
        past: [
          ...state.past,
          {
            label: `Remove ${labelOf(id)}`,
            snapshot: before,
            liquids: useBenchLiquidsStore.getState().captureHistory([id]),
          },
        ].slice(-MAX_BENCH_HISTORY),
        future: [],
        feedback: isExtraInstance(id)
          ? `${labelOf(id)} put in the waste bin.`
          : `${labelOf(id)} returned to the inventory.`,
      }
    }),
  undo: () => {
    const state = get()
    const entry = state.past.at(-1)
    if (!entry || state.placement || state.draggingId || state.pressedId) return false
    return restoreEntry(state, entry, true)
  },
  redo: () => {
    const state = get()
    const entry = state.future.at(-1)
    if (!entry || state.placement || state.draggingId || state.pressedId) return false
    return restoreEntry(state, entry, false)
  },
  snapTo: (id, holderId, position) =>
    set((state) =>
      state.placedIds.includes(id) && state.placedIds.includes(holderId) && id !== holderId
        ? {
            positions: { ...state.positions, [id]: { ...position } },
            relationships: {
              ...state.relationships,
              [id]: { actorId: id, targetId: holderId, kind: 'snapped' },
            },
            feedback: `${labelOf(id)} snapped into place.`,
          }
        : state,
    ),
  settleDrag: (id, position) =>
    set((state) =>
      state.placedIds.includes(id)
        ? {
            positions: { ...state.positions, [id]: { ...position } },
            feedback: `${labelOf(id)} did not fit there and moved back.`,
          }
        : state,
    ),
  resetBench: () =>
    set((state) => {
      if (state.placement || state.draggingId || state.pressedId) return state
      const initial = initialState()
      if (useBenchLiquidsStore.getState().pour || blockedHot(changedItems(state, initial), state))
        return state
      return {
        ...record(
          state,
          'Reset bench',
          state.placedIds.filter((id) => !initial.placedIds.includes(id)),
        ),
        placedIds: initial.placedIds,
        positions: initial.positions,
        rotations: initial.rotations,
        relationships: {},
        selectedId: null,
        selectedIds: [],
        feedback: 'Bench reset to its starting layout.',
      }
    }),
}))

// Keep removal/restoration atomic from the caller's point of view, including Node
// actions without a mounted Canvas. The liquid controller only owns the clocks.
const unsubscribeLayout = useLabSceneStore.subscribe((state, previous) => {
  if (state.placedIds !== previous.placedIds) useBenchLiquidsStore.getState().sync(state.placedIds)
})
const unsubscribeHistory = subscribeBenchHistory((event) => {
  if (event.kind === 'reset') {
    useLabSceneStore.setState({ past: [], future: [] })
    return
  }
  useLabSceneStore.setState((state) => ({
    past: [
      ...state.past,
      {
        label: event.label,
        snapshot: snapshotOf(state),
        liquids: event.before,
        expectedLiquids: event.after,
        ...(event.blockedReason ? { blockedReason: event.blockedReason } : {}),
      },
    ].slice(-MAX_BENCH_HISTORY),
    future: [],
  }))
})
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    unsubscribeLayout()
    unsubscribeHistory()
  })
