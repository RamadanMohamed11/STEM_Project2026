import { useOutletContext } from 'react-router'
import { getExperimentPaths, routePaths } from '@/app/paths'
import { JourneyPlaceholder } from '@/components/layout/JourneyPlaceholder'
import type { Experiment } from '@/types/experiment'

export function ExperimentDetailsPage() {
  const experiment = useOutletContext<Experiment>()
  const paths = getExperimentPaths(experiment.id)
  const available = experiment.status === 'demo'

  return (
    <JourneyPlaceholder
      title={experiment.title}
      pageTitle={`${experiment.title} — Details`}
      eyebrow="Experiments / Experiment details"
      description={experiment.shortDescription}
      heading="More experiment details are coming soon"
      message={
        available
          ? 'You can start the existing 3D experiment now. After the lab, return here to find the quiz. Quiz questions will be added later.'
          : 'This experiment is planned. Its guide, 3D lab, and quiz are not available yet.'
      }
      actions={[
        ...(available
          ? [
              { label: 'Start Experiment', to: paths.laboratory },
              { label: 'View Quiz', to: paths.quiz, variant: 'secondary' as const },
            ]
          : []),
        { label: 'Back to Experiments', to: routePaths.experiments, variant: 'secondary' },
      ]}
    />
  )
}
