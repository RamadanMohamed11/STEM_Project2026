import { ArrowLeft, Clock3, SearchX } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { useStudentExperimentCatalog } from '@/features/experiments/state/useStudentExperimentCatalog'
import { ExperimentHazardGate } from '@/features/safety/components/ExperimentHazardGate'
import { findExperimentById } from '@/features/experiments/lib/catalogSelectors'
import { LaboratoryLayout } from '@/features/simulations/components/LaboratoryLayout'
import { getExperimentPaths } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { previewExperimentId } from '@/features/simulations/lib/simulationRegistry'
import { useSimulationSession } from '@/features/simulations/state/useSimulationSession'
import { restartExperimentSession } from '@/features/simulations/state/sessionActions'
import { usePageTitle } from '@/hooks/usePageTitle'

export function VirtualLabPage() {
  const { experimentId } = useParams<'experimentId'>()
  const { catalog } = useStudentExperimentCatalog()
  // Retain the old preview URL, but serve the actual 3D demo in both entry points.
  const isIntroduction = experimentId === 'preview'
  const experiment = isIntroduction
    ? findExperimentById(catalog.experiments, previewExperimentId)
    : experimentId
      ? findExperimentById(catalog.experiments, experimentId)
      : undefined
  const session = useSimulationSession(experiment)
  usePageTitle(experiment?.title ?? 'Experiment Not Found')

  const returnLink = (
    <Link
      to="/experiments"
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-dark hover:underline"
    >
      <ArrowLeft size={17} aria-hidden="true" /> Back to catalog
    </Link>
  )

  if (!experiment) {
    return (
      <div>
        <PageHeader
          eyebrow="Explore / Experiments / Unavailable"
          title="Experiment not found"
          description="This experiment identifier isn't in the current demonstration catalog. Check the available examples and try again."
          action={returnLink}
        />
        <div className="rounded-xl border border-line bg-white px-6 py-12 text-center shadow-card">
          <SearchX size={32} className="mx-auto text-teal" aria-hidden="true" />
          <p className="mt-4 text-sm text-ink/75">
            No laboratory workspace exists for this identifier.
          </p>
          <div className="mt-5">{returnLink}</div>
        </div>
      </div>
    )
  }

  if (experiment?.status === 'planned') {
    return (
      <div>
        <PageHeader
          eyebrow="Explore / Experiments / Planned example"
          title={experiment.title}
          description={experiment.shortDescription}
          action={returnLink}
        />
        <div className="rounded-xl border border-line bg-white px-6 py-10 shadow-card sm:px-9">
          <StatusPill tone="warning">COMING LATER</StatusPill>
          <div className="mt-5 flex items-start gap-4">
            <Clock3 size={26} className="shrink-0 text-warning-dark" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-navy">This lab is not available yet</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/75">
                This is an illustrative catalog entry. A workspace will only be added when its
                educational content and implementation have been reviewed.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (experiment && session.simulation && session.phase === 'incompatible')
    return (
      <div className="h-full overflow-y-auto bg-canvas p-6 text-ink">
        <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-white p-6">
          <h1 className="text-2xl font-semibold text-navy">Restart This Experiment</h1>
          <p>
            This session does not match this experiment or its current version. Restart to begin
            this version. This clears the previous session.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={restartExperimentSession}>Restart Experiment</Button>
            <ButtonLink to={getExperimentPaths(experiment.id).details} variant="secondary">
              Back to Details
            </ButtonLink>
          </div>
        </section>
      </div>
    )
  if (experiment && session.simulation) {
    return (
      <ExperimentHazardGate key={experiment.id} experiment={experiment}>
        <LaboratoryLayout
          key={experiment.id}
          experiment={experiment}
          simulation={session.simulation}
        />
      </ExperimentHazardGate>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Explore / Experiments / Workspace unavailable"
        title={experiment.title}
        description="A three-dimensional workspace has not yet been prepared for this experiment."
        action={returnLink}
      />
      <div className="rounded-xl border border-line bg-white p-8 text-sm text-ink/75">
        This demonstration is not available in 3D yet. Return to the catalog for supported
        experiments.
      </div>
    </div>
  )
}
