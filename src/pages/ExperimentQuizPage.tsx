import { useOutletContext } from 'react-router'
import { getExperimentPaths } from '@/app/paths'
import { JourneyPlaceholder } from '@/components/layout/JourneyPlaceholder'
import type { Experiment } from '@/types/experiment'

export function ExperimentQuizPage() {
  const experiment = useOutletContext<Experiment>()
  const paths = getExperimentPaths(experiment.id)

  return (
    <JourneyPlaceholder
      title="Experiment Quiz"
      pageTitle={`${experiment.title} — Quiz`}
      eyebrow="Experiments / Quiz"
      description={experiment.title}
      heading="Quiz questions are coming soon"
      message="There are no questions to answer yet. When the quiz is ready, you will be able to check what you learned in the lab."
      actions={[
        { label: 'Back to Experiment', to: paths.details },
        { label: 'View Quiz Results', to: paths.results, variant: 'secondary' },
      ]}
    />
  )
}
