import { useOutletContext } from 'react-router'
import { getExperimentPaths, routePaths } from '@/app/paths'
import { JourneyPlaceholder } from '@/components/layout/JourneyPlaceholder'
import type { Experiment } from '@/types/experiment'

export function QuizResultsPage() {
  const experiment = useOutletContext<Experiment>()
  const paths = getExperimentPaths(experiment.id)

  return (
    <JourneyPlaceholder
      title="Quiz Results"
      pageTitle={`${experiment.title} — Quiz Results`}
      eyebrow="Experiments / Quiz results"
      description={experiment.title}
      heading="No quiz results yet"
      message="Quizzes are not available yet, so there is no score to show. Your quiz results will appear here when this feature is ready."
      actions={[
        { label: 'Back to Quiz', to: paths.quiz },
        { label: 'Explore Experiments', to: routePaths.experiments, variant: 'secondary' },
      ]}
    />
  )
}
