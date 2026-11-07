import { useOutletContext } from 'react-router'
import { getExperimentPaths } from '@/app/paths'
import { JourneyPlaceholder } from '@/components/layout/JourneyPlaceholder'
import { getExperimentAssessmentSummary } from '@/features/assessments/lib/assessmentSelectors'
import type { Experiment } from '@/types/experiment'

export function ExperimentQuizPage() {
  const experiment = useOutletContext<Experiment>()
  const paths = getExperimentPaths(experiment.id)
  const summary = getExperimentAssessmentSummary(experiment.id)

  const message = summary.hasAssessment
    ? `A draft set of ${summary.questionCount} demonstration review questions (${summary.title}, v${summary.version}) has been prepared for this experiment. Interactive quiz answering is coming soon, so there are no questions to submit or scores to record yet.`
    : 'There are no questions to answer yet. When the quiz is ready, you will be able to check what you learned in the lab.'

  return (
    <JourneyPlaceholder
      title="Experiment Quiz"
      pageTitle={`${experiment.title} — Quiz`}
      eyebrow="Experiments / Quiz"
      description={experiment.title}
      heading="Quiz questions are coming soon"
      message={message}
      actions={[
        { label: 'Back to Experiment', to: paths.details },
        { label: 'View Quiz Results', to: paths.results, variant: 'secondary' },
      ]}
    />
  )
}
