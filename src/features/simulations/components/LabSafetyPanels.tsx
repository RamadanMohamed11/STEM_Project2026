import { useEffect } from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, Glasses, ShieldAlert, X } from 'lucide-react'
import { getHazard } from '@/features/safety/data/hazards'
import { useLabReadinessStore } from '@/features/safety/state/useLabReadinessStore'
import { useLabSafetyStore, type LabMistake, type LabMode } from '../state/useLabSafetyStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import { resolveEquipment } from '../three/sceneConfig'

/** Guided ⇄ Free mode switch for the lab header. */
export function LabModeToggle({ touch = false }: { touch?: boolean } = {}) {
  const mode = useLabSafetyStore((state) => state.mode)
  const options: { id: LabMode; label: string; hint: string }[] = [
    { id: 'guided', label: 'Guided', hint: 'Follow the experiment steps; each action is checked.' },
    {
      id: 'free',
      label: 'Free',
      hint: 'No steps: explore all equipment. Safety rules still apply.',
    },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Lab mode"
      className={`flex rounded-lg bg-white/10 p-0.5 text-[11px] font-semibold ${touch ? 'w-full' : ''}`}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={mode === option.id}
          title={option.hint}
          onClick={() => useLabSafetyStore.getState().setMode(option.id)}
          className={`rounded-md ${touch ? 'min-h-11 min-w-[88px] flex-1 px-3 text-xs' : 'px-2 py-1'} ${mode === option.id ? 'bg-[#31c7b3] text-[#062431]' : 'text-white/75 hover:bg-white/10'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Acknowledging a paused workflow is separate from modifying its scientific evidence. */
export function GuidedWorkflowNotice({ onReset }: { onReset: () => void }) {
  const mode = useLabSafetyStore((state) => state.mode)
  const issue = useSaltSimulationStore((state) => state.guidedResumeIssue)
  if (mode === 'free')
    return (
      <p
        role="status"
        className="shrink-0 border-b border-white/10 bg-[#071d29] px-3 py-1 text-[11px] text-white/80 sm:px-5"
      >
        Free mode: guided steps are paused.
      </p>
    )
  if (!issue) return null
  return (
    <section
      role="status"
      aria-label="Guided experiment paused"
      className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-amber-300/30 bg-[#4a3410] px-3 py-2 text-xs text-amber-50 sm:px-5"
    >
      <p className="min-w-0 flex-1 basis-56">{issue}</p>
      <button
        type="button"
        onClick={onReset}
        className="min-h-11 rounded-lg border border-amber-200/50 px-3 font-semibold hover:bg-white/10"
      >
        Reset experiment
      </button>
    </section>
  )
}

/** Goggles worn (from the Safety page, or put on here). */
export function GogglesToggle({ touch = false }: { touch?: boolean } = {}) {
  const goggles = useLabReadinessStore((state) => state.goggles)
  return (
    <button
      type="button"
      aria-pressed={goggles}
      onClick={() => useLabReadinessStore.getState().setGoggles(!goggles)}
      title={
        goggles ? 'Safety goggles on' : 'Safety goggles off — put them on before handling chemicals'
      }
      className={`flex items-center gap-1 rounded-lg text-[11px] font-semibold ${touch ? 'min-h-11 w-full px-3 text-xs' : 'px-2 py-1'} ${goggles ? 'bg-[#31c7b3]/20 text-[#9ff0e1]' : 'bg-amber-400/20 text-amber-200'}`}
    >
      <Glasses size={14} aria-hidden="true" /> {goggles ? 'Goggles on' : 'No goggles'}
    </button>
  )
}

/** L9 safety alert: hazard (T41 text), what went wrong, the right practice, precautions. */
export function SafetyAlertToast() {
  const alert = useLabSafetyStore((state) => state.alert)
  const seq = alert?.seq
  useEffect(() => {
    if (seq === undefined) return
    const timer = window.setTimeout(() => useLabSafetyStore.getState().dismissAlert(), 10000)
    return () => window.clearTimeout(timer)
  }, [seq])
  if (!alert) return null
  const { mistake } = alert
  const hazard = mistake.hazard ? getHazard(mistake.hazard) : undefined
  const danger = mistake.severity === 'danger'
  return (
    <div
      role="alert"
      className={`pointer-events-auto absolute left-1/2 top-28 z-30 w-[min(92%,400px)] -translate-x-1/2 rounded-xl border p-3 text-xs shadow-2xl ${
        danger
          ? 'border-red-300/70 bg-[#5b1a1d]/95 text-red-50'
          : 'border-amber-300/60 bg-[#4a3410]/95 text-amber-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          {danger ? (
            <AlertOctagon size={15} aria-hidden="true" />
          ) : (
            <ShieldAlert size={15} aria-hidden="true" />
          )}
          {mistake.title}
        </p>
        <button
          type="button"
          aria-label="Dismiss safety alert"
          onClick={() => useLabSafetyStore.getState().dismissAlert()}
          className="-mr-1 -mt-1 flex size-8 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      {hazard && (
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
          Hazard: {hazard.label}
          {mistake.targetId &&
            ` · ${resolveEquipment(mistake.targetId)?.label ?? mistake.targetId}`}
        </p>
      )}
      <p className="mt-1.5 leading-relaxed">{mistake.explanation}</p>
      {hazard && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 opacity-85">
          {hazard.precautions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {alert.needsGoggles && (
        <button
          type="button"
          onClick={() => {
            useLabReadinessStore.getState().setGoggles(true)
            useLabSafetyStore.getState().dismissAlert()
          }}
          className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 font-semibold hover:bg-white/25"
        >
          <Glasses size={13} aria-hidden="true" /> Put on safety goggles
        </button>
      )}
      <p className="mt-1.5 text-[10px] opacity-60">Recorded in your mistakes summary.</p>
    </div>
  )
}

/** Records rejected guided-mode actions (the workflow's own explanation) as mistakes. */
export function GuidedMistakeRecorder() {
  useEffect(
    () =>
      useSaltSimulationStore.subscribe((state, previous) => {
        const validation = state.validation
        if (!validation || validation === previous.validation || validation.valid) return
        if (validation.code === 'interaction-busy' || validation.severity === 'info') return
        useLabSafetyStore.getState().recordStepMistake({
          code: validation.code,
          stepId: validation.stepId,
          message: validation.message,
        })
      }),
    [],
  )
  return null
}

function MistakeIcon({ mistake }: { mistake: LabMistake }) {
  if (mistake.severity === 'danger')
    return <AlertOctagon size={14} className="text-red-600" aria-hidden="true" />
  return <AlertTriangle size={14} className="text-amber-600" aria-hidden="true" />
}

/** Completion summary / results page: what went wrong and why (light theme). */
const noMistakes: LabMistake[] = []

export function MistakesSummary({ experimentId }: { experimentId?: string }) {
  const mistakes = useLabSafetyStore((state) =>
    !experimentId || state.experimentId === experimentId ? state.mistakes : noMistakes,
  )
  const safety = mistakes.filter((m) => m.kind === 'safety')
  const steps = mistakes.filter((m) => m.kind === 'step')
  return (
    <section
      aria-labelledby="mistakes-summary-title"
      className="rounded-xl border border-line bg-white p-4 shadow-card sm:p-5"
    >
      <h2 id="mistakes-summary-title" className="text-base font-semibold text-navy">
        Mistakes and safety alerts
      </h2>
      {!mistakes.length ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-teal-dark">
          <CheckCircle2 size={16} aria-hidden="true" /> No mistakes or safety alerts were recorded.
        </p>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {[
            ['Safety', safety],
            ['Procedure steps', steps],
          ].map(([title, list]) =>
            (list as LabMistake[]).length ? (
              <div key={title as string}>
                <h3 className="text-sm font-semibold text-navy">
                  {title as string} ({(list as LabMistake[]).length})
                </h3>
                <ul className="mt-2 space-y-2">
                  {(list as LabMistake[]).map((mistake) => (
                    <li
                      key={mistake.id}
                      className="rounded-lg border border-line bg-surface-muted/60 p-2.5 text-xs"
                    >
                      <p className="flex items-center gap-1.5 font-semibold text-navy">
                        <MistakeIcon mistake={mistake} /> {mistake.title}
                        {mistake.count > 1 && (
                          <span className="font-normal text-ink/60">× {mistake.count}</span>
                        )}
                      </p>
                      <p className="mt-1 leading-relaxed text-ink/80">{mistake.explanation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      )}
    </section>
  )
}
