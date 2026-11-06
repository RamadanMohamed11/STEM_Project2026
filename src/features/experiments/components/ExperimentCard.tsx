import { ArrowUpRight, Clock3, FlaskConical, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router'
import { getExperimentPaths } from '@/app/paths'
import { StatusPill } from '@/components/ui/StatusPill'
import { ExperimentIllustration } from '@/features/experiments/components/ExperimentIllustration'
import {
  experimentDifficultyLabels,
  experimentStatusLabels,
  safetyLevelLabels,
} from '@/features/experiments/data/catalogDisplay'
import { getLabPath } from '@/features/experiments/lib/catalogSelectors'
import type { Experiment, ExperimentCategory } from '@/types/experiment'

interface ExperimentCardProps {
  experiment: Experiment
  category?: ExperimentCategory
  index: number
}

export function ExperimentCard({ experiment, category, index }: ExperimentCardProps) {
  const available = experiment.status === 'demo'

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition-colors hover:border-line-strong">
      <div className="relative h-43 overflow-hidden border-b border-line bg-[#eaf2f1] sm:h-46">
        <ExperimentIllustration illustration={experiment.illustration} />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <span className="rounded-md border border-white/70 bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.09em] text-navy">
            {category?.label ?? 'Science'}
          </span>
          <span className="rounded-md border border-white/70 bg-white/90 px-2.5 py-1 font-mono text-[11px] text-ink/75">
            EX {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <span className="absolute bottom-3 end-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink/55">
          Concept illustration
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusPill tone={available ? 'ready' : 'warning'}>
            {experimentStatusLabels[experiment.status]}
          </StatusPill>
          <span className="text-xs text-ink/65">Illustrative content</span>
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-navy">{experiment.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-[1.75] text-ink/75">
          {experiment.shortDescription}
        </p>

        <dl className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-ink/80">
          <div className="flex items-center gap-1.5">
            <FlaskConical size={15} className="shrink-0 text-teal" aria-hidden="true" />
            <dt className="sr-only">Difficulty</dt>
            <dd>{experimentDifficultyLabels[experiment.difficulty]}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock3 size={15} className="shrink-0 text-teal" aria-hidden="true" />
            <dt className="sr-only">Estimated duration</dt>
            <dd>~{experiment.estimatedDurationMinutes} min</dd>
          </div>
          {experiment.safety && (
            <div className="flex items-center gap-1.5" title={experiment.safety.note}>
              <ShieldAlert size={15} className="shrink-0 text-warning-dark" aria-hidden="true" />
              <dt className="sr-only">Safety considerations</dt>
              <dd>{safetyLevelLabels[experiment.safety.level]}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 border-t border-line pt-4">
          <Link
            to={getExperimentPaths(experiment.id).details}
            className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-dark transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2"
          >
            View Details <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          {available ? (
            <Link
              to={getLabPath(experiment)}
              className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-dark hover:shadow focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2 active:scale-[0.99]"
            >
              Open 3D laboratory
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ) : (
            <p className="flex min-h-11 items-center gap-2 rounded-lg bg-surface-muted px-4 py-3 text-sm font-medium text-ink/75">
              <Clock3 size={17} aria-hidden="true" />
              Lab workspace not available yet
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
