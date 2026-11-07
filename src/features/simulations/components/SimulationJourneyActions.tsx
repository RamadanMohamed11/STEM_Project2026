import { getExperimentPaths, routePaths } from '@/app/paths'
import { ButtonLink } from '@/components/ui/ButtonLink'
import type { Experiment } from '@/types/experiment'
import { useSimulationSession } from '../state/useSimulationSession'
import { sessionLifetimeMessage } from '../state/simulationSession'

export function SimulationJourneyActions({ experiment }: { experiment: Experiment }) {
  const session = useSimulationSession(experiment)
  if (!session.simulation) return null
  const paths = getExperimentPaths(experiment.id)
  return (
    <div className="space-y-3">
      <nav aria-label="Simulation navigation" className="flex flex-wrap gap-3">
        <ButtonLink to={paths.laboratory}>
          {session.completed
            ? 'View Laboratory'
            : session.started
              ? 'Continue Experiment'
              : 'Start 3D Experiment'}
        </ButtonLink>
        {session.completed && (
          <ButtonLink to={paths.experimentResults} variant="secondary">
            View Results
          </ButtonLink>
        )}
        <ButtonLink to={routePaths.experiments} variant="secondary">
          Back to Experiments
        </ButtonLink>
      </nav>
      {session.phase === 'incompatible' ? (
        <p className="text-sm text-slate">
          This session uses a different experiment or version. Open the lab to restart this
          experiment.
        </p>
      ) : (
        <p className="text-sm text-slate">{sessionLifetimeMessage}</p>
      )}
      {session.started && (
        <p className="text-sm text-slate">
          {session.completed
            ? 'Experiment completed.'
            : `${session.validatedSteps} of ${session.simulation.definition.steps.length} steps validated.`}{' '}
          Quiz results are separate.
        </p>
      )}
    </div>
  )
}
