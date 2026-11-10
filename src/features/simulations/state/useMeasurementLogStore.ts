/**
 * L8: recorded measurements, balance tare values and the stopwatch. I3 coordinates a guarded
 * sessionStorage snapshot with the other lab stores, including the results page's readings.
 * Times are wall-clock seconds since the log started (`nowMs` is passed in for testability).
 */
import { create } from 'zustand'
import { makeRow, roundTo, type MeasurementRow } from '../lib/measurementLog.ts'

export interface StopwatchState {
  running: boolean
  /** Wall-clock ms when the current run started. */
  sinceMs: number | null
  /** Seconds accumulated by earlier runs. */
  accumulatedS: number
}

export interface AutoRecord {
  targetId: string
  everyS: number
}

interface MeasurementLogState {
  experimentId: string | null
  startedAtMs: number | null
  rows: readonly MeasurementRow[]
  /** balance id → tare (g). */
  tare: Readonly<Record<string, number>>
  stopwatch: StopwatchState
  open: boolean
  autoRecord: AutoRecord | null

  /** Starts (or keeps) the log for an experiment; a different experiment starts a new log. */
  begin: (experimentId: string, nowMs: number) => void
  record: (entry: Omit<MeasurementRow, 'id' | 'timeS' | 'unit'>, nowMs: number) => MeasurementRow
  removeRow: (id: string) => void
  clear: () => void
  setTare: (balanceId: string, grossG: number) => void
  startStopwatch: (nowMs: number) => void
  stopStopwatch: (nowMs: number) => void
  resetStopwatch: () => void
  setOpen: (open: boolean) => void
  setAutoRecord: (auto: AutoRecord | null) => void
}

const idleStopwatch = (): StopwatchState => ({ running: false, sinceMs: null, accumulatedS: 0 })

/** Stopwatch reading (s) at `nowMs`. */
export function stopwatchSeconds(stopwatch: StopwatchState, nowMs: number) {
  const running =
    stopwatch.running && stopwatch.sinceMs !== null ? (nowMs - stopwatch.sinceMs) / 1000 : 0
  return Math.max(0, stopwatch.accumulatedS + running)
}

/** Seconds since the log started. */
export function logTimeS(state: Pick<MeasurementLogState, 'startedAtMs'>, nowMs: number) {
  return state.startedAtMs === null ? 0 : Math.max(0, (nowMs - state.startedAtMs) / 1000)
}

export const useMeasurementLogStore = create<MeasurementLogState>()((set, get) => ({
  experimentId: null,
  startedAtMs: null,
  rows: [],
  tare: {},
  stopwatch: idleStopwatch(),
  open: false,
  autoRecord: null,

  begin: (experimentId, nowMs) => {
    const state = get()
    if (state.experimentId === experimentId && state.startedAtMs !== null) return
    set({
      experimentId,
      startedAtMs: nowMs,
      rows: [],
      tare: {},
      stopwatch: idleStopwatch(),
      autoRecord: null,
    })
  },

  record: (entry, nowMs) => {
    const state = get()
    const startedAtMs = state.startedAtMs ?? nowMs
    const row = makeRow(state.rows, { ...entry, timeS: logTimeS({ startedAtMs }, nowMs) })
    set({ startedAtMs, rows: [...state.rows, row] })
    return row
  },

  removeRow: (id) => set((state) => ({ rows: state.rows.filter((row) => row.id !== id) })),

  clear: () =>
    set((state) => ({
      rows: [],
      tare: {},
      stopwatch: idleStopwatch(),
      autoRecord: null,
      startedAtMs: state.startedAtMs === null ? null : Date.now(),
    })),

  setTare: (balanceId, grossG) =>
    set((state) => ({ tare: { ...state.tare, [balanceId]: roundTo(grossG, 2) } })),

  startStopwatch: (nowMs) =>
    set((state) =>
      state.stopwatch.running
        ? state
        : { stopwatch: { ...state.stopwatch, running: true, sinceMs: nowMs } },
    ),

  stopStopwatch: (nowMs) =>
    set((state) =>
      state.stopwatch.running
        ? {
            stopwatch: {
              running: false,
              sinceMs: null,
              accumulatedS: stopwatchSeconds(state.stopwatch, nowMs),
            },
          }
        : state,
    ),

  resetStopwatch: () => set({ stopwatch: idleStopwatch() }),
  setOpen: (open) => set({ open }),
  setAutoRecord: (autoRecord) => set({ autoRecord }),
}))
