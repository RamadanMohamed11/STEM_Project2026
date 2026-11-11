import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'

interface ExperimentControlsProps {
  experimentTitle: string
  validatedSteps: number
  stepCount: number
  onRestart: () => void
}

export function ExperimentControls({
  experimentTitle,
  validatedSteps,
  stepCount,
  onRestart,
}: ExperimentControlsProps) {
  const percent = stepCount ? Math.round((validatedSteps / stepCount) * 100) : 0
  return (
    <section
      aria-label="Experiment execution controls"
      className="rounded-xl border border-line bg-white px-5 py-4 shadow-card sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal">
            Workspace / Demonstration
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-navy sm:text-2xl">
            {experimentTitle}
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-ink/70">
            Interactive 3D workbench · Validated experiment execution
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={onRestart}
            className="group/btn inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line-strong px-4 text-sm font-semibold text-navy shadow-xs transition-all duration-200 hover:bg-surface-muted hover:border-slate/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <RotateCcw size={16} aria-hidden="true" className="transition-transform duration-300 group-hover/btn:-rotate-90" /> Restart experiment
          </button>
          <Link
            to="/experiments"
            className="group/btn inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1b3a6b] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <ArrowLeft size={16} aria-hidden="true" className="transition-transform duration-200 group-hover/btn:-translate-x-0.5" /> All experiments
          </Link>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <span className="text-xs font-semibold text-navy">
          Validated steps {validatedSteps} / {stepCount}
        </span>
        <div className="min-w-[110px] flex-1">
          <progress
            value={validatedSteps}
            max={stepCount}
            aria-label={`Experiment completion: ${validatedSteps} of ${stepCount} validated steps`}
            className="lab-guide-progress block h-2 w-full overflow-hidden rounded-full bg-surface-muted"
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-teal-dark">
          {percent}% validated
        </span>
      </div>
    </section>
  )
}
