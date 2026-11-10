import { saltExperimentDefinition as definition } from '../data/saltExperimentDefinition.ts'
import { saltCoreExperiment } from '../data/saltCoreDefinition.ts'
import { useLabSceneStore as scene } from './useLabSceneStore.ts'
import { useBenchLiquidsStore as bench } from './useBenchLiquidsStore.ts'
import { useLabSafetyStore as safety } from './useLabSafetyStore.ts'
import { useMeasurementLogStore as log, stopwatchSeconds } from './useMeasurementLogStore.ts'
import {
  useSaltSimulationStore as salt,
  reserveRestoredTransferIdentities,
} from './useSaltSimulationStore.ts'
import { useParticleViewStore } from './useParticleViewStore.ts'
import { useReactionEffectsStore } from './useReactionEffectsStore.ts'
import { subscribeLabSessionReset } from './labSessionEvents.ts'
import {
  LAB_SESSION_VERSION,
  decodeLabSession,
  labSessionKey,
  type LabSessionSnapshot,
} from '../lib/labSessionSnapshot.ts'

/** Capture once per flush, never JSON-stringify on an animation-frame subscription. */
export function captureLabSession(nowMs = Date.now()): LabSessionSnapshot {
  const s = scene.getState(),
    b = bench.getState(),
    g = salt.getState()
  const m = log.getState(),
    a = safety.getState()
  // An unfinished drag is presentation state; restore its last confirmed layout.
  const layout = s.dragStart ?? s
  const placed = layout.placedIds
  return {
    version: LAB_SESSION_VERSION,
    experimentId: g.activeExperimentId,
    definitionId: g.definitionId,
    definitionVersion: g.definitionVersion,
    coreVersion: saltCoreExperiment.version,
    scene: {
      placedIds: placed,
      positions: Object.fromEntries(placed.map((id) => [id, layout.positions[id]])),
      rotations: Object.fromEntries(placed.map((id) => [id, layout.rotations[id] ?? 0])),
      relationships: layout.relationships,
    },
    bench: { lab: b.lab, lit: b.lit, spilledTotalMl: b.spilledTotalMl },
    safety: { mode: a.mode, mistakes: a.mistakes },
    measurements: {
      startedAtMs: m.startedAtMs,
      rows: m.rows,
      tare: m.tare,
      elapsedS: stopwatchSeconds(m.stopwatch, nowMs),
    },
    salt: {
      experiment: g.experiment,
      workflow: g.workflow,
      events: g.events,
      pausedEquipmentIds: g.pausedEquipmentIds,
      guidedResumeIssue:
        g.guidedResumeIssue ||
        ((g.transfer && g.transferGuided) || (g.livePour && a.mode === 'guided')
          ? 'The transfer stopped before its guided result was recorded. Reset the experiment to follow the saved step.'
          : null),
    },
  }
}

/** Restore durable fields only; store action functions and the workflow engine stay authoritative. */
export function applyLabSession(snapshot: LabSessionSnapshot) {
  const g = snapshot.salt
  const durableSalt = {
    experiment: g.experiment,
    workflow: g.workflow,
    events: g.events,
    guidedResumeIssue: g.guidedResumeIssue,
    pausedEquipmentIds: g.pausedEquipmentIds,
  }
  scene.getState().resetEquipment()
  bench.getState().reset()
  salt.getState().reset()
  // Hydrate chemistry first, then mode: I1's mode subscriber must see matching state.
  salt.setState({
    ...durableSalt,
    activeExperimentId: snapshot.experimentId,
    definitionId: snapshot.definitionId,
    definitionVersion: snapshot.definitionVersion,
  })
  safety.setState({
    mode: snapshot.safety.mode,
    mistakes: snapshot.safety.mistakes,
    experimentId: snapshot.experimentId,
    alert: null,
  })
  // Mode subscription can clear paused equipment; restore the saved pause boundary afterwards.
  salt.setState(durableSalt)
  scene.setState((state) => ({
    placedIds: snapshot.scene.placedIds,
    relationships: snapshot.scene.relationships,
    positions: { ...state.positions, ...snapshot.scene.positions },
    rotations: { ...state.rotations, ...snapshot.scene.rotations },
  }))
  bench
    .getState()
    .restoreHistory(
      { containers: snapshot.bench.lab.containers, spilledTotalMl: snapshot.bench.spilledTotalMl },
      snapshot.scene.placedIds,
    )
  bench.setState({ lab: snapshot.bench.lab, lit: snapshot.bench.lit })
  log.setState({
    experimentId: snapshot.experimentId,
    startedAtMs: snapshot.measurements.startedAtMs,
    rows: snapshot.measurements.rows,
    tare: snapshot.measurements.tare,
    stopwatch: { running: false, sinceMs: null, accumulatedS: snapshot.measurements.elapsedS },
    open: false,
    autoRecord: null,
  })
  useParticleViewStore.getState().close()
  useReactionEffectsStore.getState().clear()
  reserveRestoredTransferIdentities(g.events)
}

type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
interface Options {
  storage: () => StoragePort | undefined
  now?: () => number
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  cancel?: (timer: ReturnType<typeof setTimeout>) => void
}

/** One atomic envelope per experiment, following the readiness store's guarded storage pattern. */
export function createLabSessionPersistence(options: Options) {
  const now = options.now ?? Date.now
  const schedule = options.schedule ?? setTimeout
  const cancel = options.cancel ?? clearTimeout
  let activeId: string | null = null
  let suspended = false,
    dirty = false,
    restored = false
  let lastWrite = -Infinity
  let timer: ReturnType<typeof setTimeout> | undefined
  let unsubscribe: (() => void)[] = []
  const listeners = new Set<() => void>()
  const announce = () => {
    for (const listener of listeners) listener()
  }
  const stopTimer = () => {
    if (timer !== undefined) cancel(timer)
    timer = undefined
  }
  const remove = () => {
    try {
      if (activeId) options.storage()?.removeItem(labSessionKey(activeId))
    } catch {
      /* memory-only */
    }
  }
  const flush = () => {
    stopTimer()
    if (!activeId || suspended || !dirty) return
    const wait = 1000 - (now() - lastWrite)
    if (wait > 0) {
      timer = schedule(flush, wait)
      return
    }
    // Animation ticks can mark dirty many times; capture/stringify only here, at most 1 Hz.
    dirty = false
    try {
      const snapshot = captureLabSession(now())
      if (snapshot.experimentId !== activeId) return
      options.storage()?.setItem(labSessionKey(activeId), JSON.stringify(snapshot))
    } catch {
      /* Private mode / quota / unavailable storage must not interrupt the lab. */
    }
    lastWrite = now()
    if (log.getState().stopwatch.running) {
      dirty = true
      timer = schedule(flush, 1000)
    }
  }
  const changed = () => {
    if (suspended || !activeId) return
    dirty = true
    if (timer === undefined) timer = schedule(flush, Math.max(0, 1000 - (now() - lastWrite)))
  }
  const clear = () => {
    stopTimer()
    dirty = false
    restored = false
    remove()
    announce()
  }
  return {
    initialize(experimentId = definition.experimentId) {
      if (activeId === experimentId) return
      // Only the implemented adapter may hydrate these stores. No global salt fallback.
      if (experimentId !== definition.experimentId) return
      flush()
      for (const dispose of unsubscribe) dispose()
      unsubscribe = []
      activeId = experimentId
      suspended = true
      let snapshot: LabSessionSnapshot | null = null
      try {
        snapshot = decodeLabSession(
          options.storage()?.getItem(labSessionKey(experimentId)) ?? null,
          experimentId,
        )
      } catch {
        /* memory-only */
      }
      if (snapshot) {
        applyLabSession(snapshot)
        restored = true
      } else {
        remove()
        // A malformed/obsolete slot is never partially hydrated.
        salt.getState().reset()
        scene.getState().resetEquipment()
        bench.getState().reset()
        safety.setState({ experimentId, mode: 'guided', mistakes: [], alert: null })
        log.setState({
          experimentId,
          startedAtMs: null,
          rows: [],
          tare: {},
          stopwatch: { running: false, sinceMs: null, accumulatedS: 0 },
          open: false,
          autoRecord: null,
        })
      }
      suspended = false
      announce()
      unsubscribe = [
        scene.subscribe((s, p) => {
          if (
            s.placedIds !== p.placedIds ||
            s.positions !== p.positions ||
            s.rotations !== p.rotations ||
            s.relationships !== p.relationships
          )
            changed()
        }),
        bench.subscribe((s, p) => {
          if (s.lab !== p.lab || s.lit !== p.lit || s.spilledTotalMl !== p.spilledTotalMl) changed()
        }),
        salt.subscribe((s, p) => {
          if (
            s.experiment !== p.experiment ||
            s.workflow !== p.workflow ||
            s.events !== p.events ||
            s.guidedResumeIssue !== p.guidedResumeIssue ||
            s.pausedEquipmentIds !== p.pausedEquipmentIds
          )
            changed()
        }),
        safety.subscribe((s, p) => {
          if (s.mode !== p.mode || s.mistakes !== p.mistakes) changed()
        }),
        log.subscribe((s, p) => {
          if (
            s.rows !== p.rows ||
            s.tare !== p.tare ||
            s.stopwatch !== p.stopwatch ||
            s.startedAtMs !== p.startedAtMs
          )
            changed()
        }),
        subscribeLabSessionReset(clear),
      ]
    },
    flush,
    clear,
    reset(action: () => void) {
      suspended = true
      try {
        action()
      } finally {
        clear()
        suspended = false
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    wasRestored: () => restored,
    dismiss() {
      restored = false
      announce()
    },
    dispose() {
      stopTimer()
      for (const dispose of unsubscribe) dispose()
      unsubscribe = []
      activeId = null
    },
  }
}

export const labSessionPersistence = createLabSessionPersistence({
  storage: () => (typeof sessionStorage === 'undefined' ? undefined : sessionStorage),
})

// Lazy-loaded before the first session read, including direct details/results/lab links.
// No render-time mutation and no server/browser-global assumption in Node tests.
if (typeof window !== 'undefined') {
  labSessionPersistence.initialize()
  const flush = () => labSessionPersistence.flush()
  const onHidden = () => {
    if (document.hidden) flush()
  }
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', onHidden)
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      flush()
      labSessionPersistence.dispose()
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHidden)
    })
}
