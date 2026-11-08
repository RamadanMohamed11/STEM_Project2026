/**
 * L5 practice liquids on the bench, run by the L1 engine (`pourLiquid`, readers).
 * Pouring is driven by tilt: the requested tilt eases in, flow depends on the tilt and on how
 * full the source is, and an overflow spills (reported, then the pour stops). The experiment's
 * own chemistry-linked items are not part of this store.
 */
import { create } from 'zustand'
import {
  AMOUNT_EPSILON,
  pourLiquid,
  readColor,
  readPh,
  readVolumeMl,
  type ChemistryDefinition,
  type ContainerState,
  type LabState,
} from '../engine/core/index.ts'
import {
  benchContainerType,
  buildBenchDefinition,
  canPourFrom,
  DROP_ML,
  flowRateMlPerS,
  formatMl,
  isBenchLiquidContainer,
  steadyPourAngle,
} from '../lib/benchLiquids.ts'
import { instanceTypeId, resolveEquipment } from '../three/sceneConfig.ts'

export interface BenchPour {
  sourceId: string
  targetId: string
  /** Tilt the student asked for (radians). */
  requestedAngle: number
  /** Displayed tilt, easing towards the request. */
  angle: number
  /** mL still to deliver for a keyboard "Pour N mL"; null for free tilting. */
  remainingMl: number | null
  /** Current flow (mL/s), for the stream width. */
  rateMlPerS: number
}

export interface BenchReadout {
  sourceId: string
  targetId: string
  pouredMl: number
  totalMl: number
  ph: number | null
  /** Store clock (s) until which the readout stays visible after pouring stops. */
  visibleUntilS: number
}

export interface SpillNotice {
  containerId: string
  spilledMl: number
  message: string
  seq: number
}

interface BenchLiquidsState {
  ids: readonly string[]
  definition: ChemistryDefinition
  lab: LabState
  pour: BenchPour | null
  readout: BenchReadout | null
  spill: SpillNotice | null
  /** Increments for every drop (drives the falling-drop animation). */
  drop: { targetId: string; seq: number } | null
  /** Total liquid lost to overflows (for conservation checks). */
  spilledTotalMl: number
  message: string | null
  clockS: number

  sync: (placedIds: readonly string[]) => void
  /** Tilt the source over the target (0 straightens it). */
  setTilt: (sourceId: string, targetId: string, angle: number) => boolean
  /** Keyboard alternative: pour exactly `ml` (unless the source runs out or it overflows). */
  pourAmount: (sourceId: string, targetId: string, ml: number) => boolean
  straighten: () => void
  tick: (dtMs: number) => void
  fillDropper: (sourceId: string, dropperId: string) => boolean
  addDrop: (dropperId: string, targetId: string) => boolean
  reset: () => void
}

const READOUT_HOLD_S = 4
const EASE_PER_S = 7

const emptyState = () => ({
  ids: [] as readonly string[],
  definition: buildBenchDefinition([]),
  lab: { containers: {}, timeS: 0 } as LabState,
  pour: null,
  readout: null,
  spill: null,
  drop: null,
  spilledTotalMl: 0,
  message: null,
  clockS: 0,
})

const labelOf = (id: string) => resolveEquipment(id)?.label ?? id

function capacityOf(id: string) {
  return benchContainerType(instanceTypeId(id))?.capacityMl ?? 0
}

export function benchVolumeMl(state: Pick<BenchLiquidsState, 'definition' | 'lab'>, id: string) {
  return state.lab.containers[id] ? readVolumeMl(state.definition, state.lab, id) : 0
}

export function benchColor(state: Pick<BenchLiquidsState, 'definition' | 'lab'>, id: string) {
  return state.lab.containers[id] ? readColor(state.definition, state.lab, id) : null
}

export function benchPh(state: Pick<BenchLiquidsState, 'definition' | 'lab'>, id: string) {
  return state.lab.containers[id] ? readPh(state.definition, state.lab, id) : null
}

function nextReadout(
  state: BenchLiquidsState,
  lab: LabState,
  sourceId: string,
  targetId: string,
  addedMl: number,
): BenchReadout {
  const same = state.readout?.sourceId === sourceId && state.readout.targetId === targetId
  const view = { definition: state.definition, lab }
  return {
    sourceId,
    targetId,
    pouredMl: (same ? state.readout!.pouredMl : 0) + addedMl,
    totalMl: benchVolumeMl(view, targetId),
    ph: benchPh(view, targetId),
    visibleUntilS: state.clockS + READOUT_HOLD_S,
  }
}

function validPair(state: BenchLiquidsState, sourceId: string, targetId: string) {
  return (
    sourceId !== targetId &&
    state.ids.includes(sourceId) &&
    state.ids.includes(targetId) &&
    canPourFrom(sourceId)
  )
}

export const useBenchLiquidsStore = create<BenchLiquidsState>()((set, get) => ({
  ...emptyState(),

  sync: (placedIds) => {
    const state = get()
    const ids = placedIds.filter(isBenchLiquidContainer)
    if (ids.length === state.ids.length && ids.every((id, i) => id === state.ids[i])) return
    const definition = buildBenchDefinition(ids)
    const containers: Record<string, ContainerState> = {}
    for (const container of definition.containers) {
      const existing = state.lab.containers[container.id]
      if (existing) containers[container.id] = existing
      else {
        // New on the bench (or back from the waste bin): starts with its initial contents only.
        const contents: Record<string, number> = {}
        for (const entry of container.initialContents ?? [])
          contents[entry.substanceId] = (contents[entry.substanceId] ?? 0) + entry.amount
        containers[container.id] = { contents, temperatureC: definition.ambientTemperatureC }
      }
    }
    const keep = (id: string | undefined) => !id || ids.includes(id)
    set({
      ids,
      definition,
      lab: { ...state.lab, containers },
      pour:
        state.pour && keep(state.pour.sourceId) && keep(state.pour.targetId) ? state.pour : null,
      readout: state.readout && keep(state.readout.targetId) ? state.readout : null,
    })
  },

  setTilt: (sourceId, targetId, angle) => {
    const state = get()
    if (!validPair(state, sourceId, targetId)) return false
    const requestedAngle = Math.max(0, Math.min(Math.PI / 2, Number.isFinite(angle) ? angle : 0))
    const current = state.pour
    if (current && (current.sourceId !== sourceId || current.targetId !== targetId)) {
      // Another pour is still tilted: it must be straightened first.
      if (current.angle > 0.02) return false
    }
    const same = current?.sourceId === sourceId && current.targetId === targetId
    set({
      pour: {
        sourceId,
        targetId,
        requestedAngle,
        angle: same ? current!.angle : 0,
        remainingMl: null,
        rateMlPerS: same ? current!.rateMlPerS : 0,
      },
      spill: same ? state.spill : null,
      // A new pour counts "poured" from zero.
      readout: same ? state.readout : null,
      message: null,
    })
    return true
  },

  pourAmount: (sourceId, targetId, ml) => {
    const state = get()
    if (!validPair(state, sourceId, targetId) || !(ml > 0)) return false
    const available = benchVolumeMl(state, sourceId)
    if (available <= AMOUNT_EPSILON) {
      set({ message: `${labelOf(sourceId)} is empty.` })
      return false
    }
    if (state.pour && state.pour.angle > 0.02 && state.pour.sourceId !== sourceId) return false
    const fill = available / capacityOf(sourceId)
    set({
      pour: {
        sourceId,
        targetId,
        requestedAngle: steadyPourAngle(fill),
        angle: state.pour?.sourceId === sourceId ? state.pour.angle : 0,
        remainingMl: ml,
        rateMlPerS: 0,
      },
      spill: null,
      readout: null,
      message: null,
    })
    return true
  },

  straighten: () =>
    set((state) =>
      state.pour ? { pour: { ...state.pour, requestedAngle: 0, remainingMl: null } } : state,
    ),

  tick: (dtMs) => {
    const state = get()
    const dt = Math.min(0.25, Math.max(0, Number.isFinite(dtMs) ? dtMs / 1000 : 0))
    if (dt <= 0) return
    const clockS = state.clockS + dt
    const pour = state.pour
    if (!pour) {
      if (state.readout && clockS > state.readout.visibleUntilS) set({ clockS, readout: null })
      else set({ clockS })
      return
    }
    const blend = 1 - Math.exp(-EASE_PER_S * dt)
    const sourceMl = benchVolumeMl(state, pour.sourceId)
    const type = benchContainerType(instanceTypeId(pour.sourceId))
    const fill = sourceMl / (type?.capacityMl || 1)
    // A keyboard pour tips further as the vessel empties, like a steady hand.
    const requestedAngle =
      pour.remainingMl !== null && pour.remainingMl > 0 && pour.requestedAngle > 0
        ? steadyPourAngle(fill)
        : pour.requestedAngle
    const angle = pour.angle + (requestedAngle - pour.angle) * blend
    if (requestedAngle === 0 && angle < 0.02) {
      set({ clockS, pour: null })
      return
    }
    const rate = flowRateMlPerS(angle, fill, type?.maxFlowMlPerS ?? 0)
    let amount = rate * dt
    if (pour.remainingMl !== null) amount = Math.min(amount, pour.remainingMl)
    if (amount <= AMOUNT_EPSILON) {
      const empty = sourceMl <= AMOUNT_EPSILON
      set({
        clockS,
        pour: {
          ...pour,
          requestedAngle,
          angle,
          rateMlPerS: 0,
          ...(empty ? { requestedAngle: 0, remainingMl: null } : {}),
        },
        ...(empty && pour.requestedAngle > 0
          ? { message: `${labelOf(pour.sourceId)} is empty.` }
          : {}),
      })
      return
    }
    const result = pourLiquid(state.definition, state.lab, pour.sourceId, pour.targetId, amount)
    const moved = result.pouredMl + result.spilledMl
    const remainingMl = pour.remainingMl === null ? null : Math.max(0, pour.remainingMl - moved)
    const done = remainingMl !== null && remainingMl <= 1e-9
    const spilled = result.spilledMl > AMOUNT_EPSILON
    const sourceLeft = benchVolumeMl(
      { definition: state.definition, lab: result.state },
      pour.sourceId,
    )
    const stop = done || spilled || sourceLeft <= AMOUNT_EPSILON
    set({
      clockS,
      lab: result.state,
      spilledTotalMl: state.spilledTotalMl + result.spilledMl,
      readout: nextReadout(state, result.state, pour.sourceId, pour.targetId, result.pouredMl),
      pour: {
        ...pour,
        angle,
        rateMlPerS: rate,
        requestedAngle,
        // A finished or overflowing pour delivers nothing more while it straightens.
        remainingMl: done || spilled ? 0 : stop ? null : remainingMl,
        ...(stop ? { requestedAngle: 0 } : {}),
      },
      ...(spilled
        ? {
            spill: {
              containerId: pour.targetId,
              spilledMl:
                result.spilledMl +
                (state.spill?.containerId === pour.targetId ? state.spill.spilledMl : 0),
              message: `${labelOf(pour.targetId)} overflowed — ${formatMl(result.spilledMl)} spilled on the bench. Pouring stopped.`,
              seq: (state.spill?.seq ?? 0) + 1,
            },
          }
        : {}),
    })
  },

  fillDropper: (sourceId, dropperId) => {
    const state = get()
    if (
      instanceTypeId(dropperId) !== 'dropper' ||
      sourceId === dropperId ||
      !state.ids.includes(sourceId) ||
      !state.ids.includes(dropperId)
    )
      return false
    const room = capacityOf(dropperId) - benchVolumeMl(state, dropperId)
    const available = benchVolumeMl(state, sourceId)
    const amount = Math.min(room, available)
    if (amount <= AMOUNT_EPSILON) {
      set({
        message:
          available <= AMOUNT_EPSILON ? `${labelOf(sourceId)} is empty.` : 'The dropper is full.',
      })
      return false
    }
    const result = pourLiquid(state.definition, state.lab, sourceId, dropperId, amount)
    set({ lab: result.state, message: `Dropper filled with ${formatMl(result.pouredMl)}.` })
    return true
  },

  addDrop: (dropperId, targetId) => {
    const state = get()
    if (
      instanceTypeId(dropperId) !== 'dropper' ||
      dropperId === targetId ||
      !state.ids.includes(dropperId) ||
      !state.ids.includes(targetId)
    )
      return false
    const inDropper = benchVolumeMl(state, dropperId)
    if (inDropper < DROP_ML - 1e-9) {
      set({ message: 'The dropper is empty — fill it from a vessel first.' })
      return false
    }
    const result = pourLiquid(state.definition, state.lab, dropperId, targetId, DROP_ML)
    const spilled = result.spilledMl > AMOUNT_EPSILON
    set({
      lab: result.state,
      spilledTotalMl: state.spilledTotalMl + result.spilledMl,
      drop: { targetId, seq: (state.drop?.seq ?? 0) + 1 },
      readout: nextReadout(state, result.state, dropperId, targetId, result.pouredMl),
      message: null,
      ...(spilled
        ? {
            spill: {
              containerId: targetId,
              spilledMl: result.spilledMl,
              message: `${labelOf(targetId)} is full — the drop spilled.`,
              seq: (state.spill?.seq ?? 0) + 1,
            },
          }
        : {}),
    })
    return true
  },

  reset: () => set(emptyState()),
}))
