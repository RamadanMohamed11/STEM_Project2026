import { Outlet, useParams } from 'react-router'
import { routePaths } from '@/app/paths'
import { demoCatalog } from '@/features/experiments/data/mockExperiments'
import { findExperimentById } from '@/features/experiments/lib/catalogSelectors'
import { JourneyPlaceholder } from './JourneyPlaceholder'

/** Resolve real catalog IDs for details, quizzes and results, including direct links. */
export function ExperimentRouteLayout() {
  const { experimentId } = useParams<'experimentId'>()
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

  return <Outlet context={experiment} />
}
