import { useNavigate, useOutletContext } from 'react-router'
import { getExperimentPaths } from '@/app/paths'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ExperimentResults } from '@/features/simulations/components/ExperimentResults'
import { restartExperimentSession } from '@/features/simulations/state/sessionActions'
import { sessionLifetimeMessage } from '@/features/simulations/state/simulationSession'
import { useSimulationSession } from '@/features/simulations/state/useSimulationSession'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Experiment } from '@/types/experiment'

export function ExperimentResultsPage() {
  const experiment = useOutletContext<Experiment>()
  const session = useSimulationSession(experiment)
  const navigate = useNavigate()
  const paths = getExperimentPaths(experiment.id)
  usePageTitle(`${experiment.title} — Experiment Results`)
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-navy">Experiment Results</h1>
        <p className="text-slate">{experiment.title}</p>
      </header>
      {session.simulation && session.completed ? (
        <ExperimentResults
          definition={session.simulation.definition}
          experiment={session.state.experiment}
          workflow={session.state.workflow}
          onRestart={() => {
            restartExperimentSession()
            navigate(paths.laboratory)
          }}
        />
      ) : (
        <section className="space-y-3 rounded-xl border border-line bg-white p-6">
          <h2 className="text-xl font-semibold text-navy">
            {session.simulation ? 'No Experiment Results Yet' : 'Results Unavailable'}
          </h2>
          <p className="text-sm leading-relaxed text-slate">
            {!session.simulation
              ? 'This experiment does not have an available 3D lab.'
              : session.phase === 'incompatible'
                ? 'The current session belongs to a different experiment or version. Open the lab to restart this experiment.'
                : 'Complete the experiment in the 3D lab to see your verified results. Opening this page does not complete any steps.'}
          </p>
          {session.started && (
            <p className="text-sm text-slate">
              {session.validatedSteps} of {session.simulation?.definition.steps.length} steps
              validated.
            </p>
          )}
        </section>
      )}
      <nav aria-label="Experiment results navigation" className="flex flex-wrap gap-3">
        <ButtonLink to={paths.details} variant="secondary">
          Back to Details
        </ButtonLink>
        {session.simulation && (
          <ButtonLink to={paths.laboratory}>
            {session.completed
              ? 'View Laboratory'
              : session.started
                ? 'Continue Experiment'
                : 'Open Laboratory'}
          </ButtonLink>
        )}
        {session.completed && (
          <ButtonLink to={paths.quiz} variant="secondary">
            Quiz Preview
          </ButtonLink>
        )}
      </nav>
      {session.completed && (
        <p className="text-sm text-slate">
          Quiz questions are coming soon. Experiment results and quiz results are separate.
        </p>
      )}
      <p className="text-sm text-slate">{sessionLifetimeMessage}</p>
    </div>
  )
}
