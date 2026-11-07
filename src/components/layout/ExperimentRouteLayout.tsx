import { Link, Outlet, useParams, useSearchParams } from 'react-router'
import { routePaths } from '@/app/paths'
import { demoCatalog } from '@/features/experiments/data/mockExperiments'
import { findExperimentById } from '@/features/experiments/lib/catalogSelectors'
import { JourneyPlaceholder } from './JourneyPlaceholder'
import { sampleCurriculum } from '@/features/curriculum/data/sampleCurriculum'
import { resolveResultsReturn } from '@/features/experiments/lib/catalogUrlState'

/** Resolve real catalog IDs for details, quizzes and results, including direct links. */
export function ExperimentRouteLayout() {
  const { experimentId } = useParams<'experimentId'>()
  const [params] = useSearchParams()
  const experiment = experimentId
    ? findExperimentById(demoCatalog.experiments, experimentId)
    : undefined

  if (!experiment) {
    return (
      <JourneyPlaceholder
        title="Experiment Not Found"
        status="Not found"
        description="This experiment is not in the current library."
        heading="Choose an experiment from the library"
        message="Check the available experiments and try again."
        actions={[{ label: 'Explore Experiments', to: routePaths.experiments }]}
      />
    )
  }

  const returnPath = resolveResultsReturn(params.get('returnTo'), experiment.id, {
    ...demoCatalog,
    curriculum: sampleCurriculum,
  })
  return (
    <>
      {returnPath && (
        <nav aria-label="Search navigation" className="mb-5">
          <Link
            to={returnPath}
            className="inline-flex min-h-11 items-center rounded px-1 text-sm font-semibold text-teal-dark hover:underline focus-visible:outline-teal"
          >
            Back to Search Results
          </Link>
        </nav>
      )}
      <Outlet context={experiment} />
    </>
  )
}
