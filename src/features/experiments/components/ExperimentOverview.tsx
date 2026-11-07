import { routePaths } from '@/app/paths'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { StatusPill } from '@/components/ui/StatusPill'
import { ExperimentIllustration } from './ExperimentIllustration'
import { experimentDifficultyLabels } from '../data/catalogDisplay'
import { resolveSimulation } from '@/features/simulations/lib/simulationRegistry'
import { SimulationJourneyActions } from '@/features/simulations/components/SimulationJourneyActions'
import type { Experiment, ExperimentCategory } from '@/types/experiment'

export function ExperimentOverview({
  experiment,
  category,
}: {
  experiment: Experiment
  category?: ExperimentCategory
}) {
  const laboratoryAvailable = Boolean(resolveSimulation(experiment))
  const status =
    experiment.status === 'planned'
      ? 'Coming Soon'
      : laboratoryAvailable
        ? 'Available Demo'
        : 'Lab Unavailable'
  return (
    <header className="space-y-6">
      <div className="max-w-3xl space-y-3">
        <StatusPill tone={laboratoryAvailable ? 'ready' : 'warning'}>{status}</StatusPill>
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          {experiment.title}
        </h1>
        <p className="text-base leading-relaxed text-slate">{experiment.shortDescription}</p>
      </div>
      <div className="grid items-center gap-6 rounded-xl border border-line bg-white p-5 sm:p-7 lg:grid-cols-2">
        <section aria-labelledby="experiment-information-title" className="space-y-5">
          <h2 id="experiment-information-title" className="text-lg font-semibold text-navy">
            Experiment Information
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
            <div>
              <dt className="text-slate">Category</dt>
              <dd className="mt-1 font-semibold text-navy">{category?.label ?? 'Science'}</dd>
            </div>
            <div>
              <dt className="text-slate">Difficulty</dt>
              <dd className="mt-1 font-semibold text-navy">
                {experimentDifficultyLabels[experiment.difficulty]}
              </dd>
            </div>
            <div>
              <dt className="text-slate">Estimated Duration</dt>
              <dd className="mt-1 font-semibold text-navy">
                About {experiment.estimatedDurationMinutes} minutes
              </dd>
            </div>
            <div>
              <dt className="text-slate">Availability</dt>
              <dd className="mt-1 font-semibold text-navy">{status}</dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-slate">
            The duration is a guide for this sample activity.
          </p>
        </section>
        <figure className="group min-w-0 overflow-hidden rounded-lg bg-teal-soft/60 p-3 transition-all duration-300 hover:shadow-md">
          <div className="h-44 sm:h-52 transition-transform duration-500 ease-out group-hover:scale-105">
            <ExperimentIllustration illustration={experiment.illustration} />
          </div>
          <figcaption className="pb-1 text-center text-xs text-slate">
            Concept illustration, not a measurement.
          </figcaption>
        </figure>
      </div>
      {!laboratoryAvailable && (
        <nav aria-label="Experiment actions" className="flex flex-wrap gap-3">
          <ButtonLink to={routePaths.experiments} variant="secondary">
            Back to Experiments
          </ButtonLink>
        </nav>
      )}
      <SimulationJourneyActions experiment={experiment} />
      {experiment.status === 'planned' && (
        <p className="text-sm leading-relaxed text-slate">
          This experiment is planned. Its 3D lab is not available yet.
        </p>
      )}
      {experiment.status === 'demo' && !laboratoryAvailable && (
        <p className="text-sm leading-relaxed text-slate">
          A 3D lab is not available for this experiment yet.
        </p>
      )}
    </header>
  )
}
