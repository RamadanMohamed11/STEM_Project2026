import { CheckCircle2, Circle, Clock, FlaskConical, Scale } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router'
import { getExperimentPaths } from '@/app/paths'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { StatusPill } from '@/components/ui/StatusPill'
import { ExperimentResults } from '@/features/simulations/components/ExperimentResults'
import { SafetyNotice } from '@/features/simulations/components/SafetyNotice'
import { getContextualSafetyState } from '@/features/simulations/lib/contextualSafety'
import { getExperimentResultsSummary } from '@/features/simulations/lib/resultsSummary'
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

  const summary = getExperimentResultsSummary({
    experiment,
    definition: session.simulation?.definition,
    workflow: session.simulation ? session.state.workflow : undefined,
    chemistry: session.simulation ? session.state.experiment : undefined,
    placedIds: session.placedIds,
    sessionPhase: session.phase,
  })

  const safetyState = getContextualSafetyState({
    experiment,
    definition: session.simulation?.definition,
    workflow:
      session.simulation && session.phase !== 'incompatible' ? session.state.workflow : undefined,
    validation:
      session.simulation && session.phase !== 'incompatible' ? session.state.validation : null,
    feedback:
      session.simulation && session.phase !== 'incompatible' ? session.state.feedback : null,
    placedIds: session.placedIds,
  })

  const statusTone =
    summary.availability === 'completed'
      ? 'ready'
      : summary.availability === 'in-progress'
        ? 'info'
        : 'warning'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Experiments', to: '/experiments' },
          { label: experiment.title, to: paths.details },
          { label: 'Results' },
        ]}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusPill tone={statusTone}>{summary.statusLabel}</StatusPill>
            {session.simulation && summary.totalSteps > 0 && (
              <span className="text-xs font-semibold text-slate">
                {summary.validatedSteps} of {summary.totalSteps} steps validated (
                {summary.progressPercent}%)
              </span>
            )}
          </div>
          <h1 className="text-3xl font-semibold text-navy">Experiment Results</h1>
          <p className="text-base font-medium text-slate">{experiment.title}</p>
        </div>
      </header>

      {session.simulation && session.completed ? (
        <ExperimentResults
          definition={session.simulation.definition}
          experiment={session.state.experiment}
          workflow={session.state.workflow}
          experimentTitle={experiment.title}
          onRestart={() => {
            restartExperimentSession()
            navigate(paths.laboratory)
          }}
        />
      ) : (
        <section
          aria-labelledby="results-status-heading"
          className="space-y-5 rounded-xl border border-line bg-white p-6 shadow-card"
        >
          <div className="space-y-2">
            <h2 id="results-status-heading" className="text-xl font-semibold text-navy">
              {!session.simulation
                ? 'Results Unavailable'
                : session.started
                  ? 'No Experiment Results Yet — Experiment In Progress'
                  : 'No Experiment Results Yet'}
            </h2>
            <p className="text-sm leading-relaxed text-slate">
              {!session.simulation
                ? 'This experiment does not have an available 3D lab.'
                : session.phase === 'incompatible'
                  ? 'The current session belongs to a different experiment or version. Open the lab to restart this experiment.'
                  : session.started
                    ? 'Complete the remaining steps in the 3D lab to unlock your final verified results and scientific conclusions. Opening this page does not complete any steps.'
                    : 'Complete the experiment in the 3D lab to see your verified results. Opening this page does not complete any steps.'}
            </p>
            {session.started && session.simulation && (
              <p className="inline-flex items-center gap-2 rounded-lg bg-teal-soft/60 px-3 py-1.5 text-sm font-semibold text-teal-dark">
                <Clock size={16} aria-hidden="true" />
                {session.validatedSteps} of {session.simulation.definition.steps.length} steps
                validated.
                {summary.currentStepTitle ? ` Current step: ${summary.currentStepTitle}.` : ''}
              </p>
            )}
          </div>

          {session.simulation && session.phase !== 'incompatible' && (
            <div className="space-y-5 border-t border-line pt-5">
              {/* Available Measurements (In-Progress or Not-Started Preview) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
                    <Scale size={17} className="text-teal" aria-hidden="true" />
                    {session.started
                      ? 'Available Measurements So Far'
                      : 'Measurements to Record in the 3D Lab'}
                  </h3>
                  <span className="text-xs text-slate">
                    {session.started
                      ? 'Live values from your active session (experiment not yet complete)'
                      : 'No measurements recorded yet'}
                  </span>
                </div>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {summary.measurements.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-line bg-canvas/60 p-3.5"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-dark">
                        {item.shortLabel}
                      </span>
                      <dt className="mt-1 text-xs text-ink/75">{item.label}</dt>
                      <dd className="mt-2 text-lg font-semibold tabular-nums text-navy">
                        {item.value}
                      </dd>
                      <p className="mt-1 text-[11px] leading-snug text-slate">{item.sourceNote}</p>
                    </div>
                  ))}
                </dl>
              </div>

              {/* In-Progress Student Actions & Current Observation State */}
              {session.started && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-line bg-canvas/40 p-4">
                    <h3 className="text-sm font-semibold text-navy">
                      Procedural Progress & Student Actions
                    </h3>
                    <p className="mt-1 text-xs text-slate">
                      Steps are validated in sequence inside the 3D laboratory.
                    </p>
                    <ol className="mt-3 space-y-2 text-xs">
                      {summary.studentActions.map((action) => (
                        <li
                          key={action.id}
                          className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                            action.completed
                              ? 'border-teal/30 bg-teal-soft/35 text-navy'
                              : action.active
                                ? 'border-amber-300 bg-amber-50/70 text-navy'
                                : 'border-line bg-white text-slate'
                          }`}
                        >
                          {action.completed ? (
                            <CheckCircle2
                              size={15}
                              className="mt-0.5 shrink-0 text-teal-dark"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              size={15}
                              className="mt-0.5 shrink-0 text-slate"
                              aria-hidden="true"
                            />
                          )}
                          <div>
                            <span className="font-semibold">
                              Step {action.stepNumber}: {action.title}
                              {action.active ? ' (Current Step)' : ''}
                            </span>
                            <p className="mt-0.5 text-ink/75">{action.summary}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-line bg-white p-4">
                    <div className="space-y-2.5">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                        <FlaskConical size={16} className="text-teal" aria-hidden="true" /> Current
                        Simulated State
                      </h3>
                      <p className="text-sm font-medium text-navy">
                        {summary.simulatedObservations.headline}
                      </p>
                      <p className="text-xs leading-relaxed text-ink/80">
                        {summary.simulatedObservations.summary}
                      </p>
                      <ul className="space-y-1 pt-1 text-xs text-ink/75">
                        {summary.simulatedObservations.details.map((detail) => (
                          <li key={detail}>• {detail}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="mt-4 rounded-lg bg-canvas px-3 py-2 text-xs leading-relaxed text-slate">
                      Final scientific conclusions are locked until all {summary.totalSteps} steps
                      and the clear-solution observation are verified in the 3D laboratory.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <SafetyNotice
        safety={experiment.safety}
        contextualNotice={safetyState.primaryNotice}
        safetyRules={
          session.simulation && session.phase !== 'incompatible'
            ? safetyState.safetyRules
            : undefined
        }
        title={
          session.completed
            ? 'Post-experiment safety & handling summary'
            : session.started
              ? 'Contextual safety guidance for current step'
              : 'Safety considerations'
        }
      />

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
