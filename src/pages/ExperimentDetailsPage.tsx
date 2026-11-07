import { Link, useOutletContext } from 'react-router'
import { getCurriculumLessonPath, routePaths } from '@/app/paths'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { sampleCurriculum } from '@/features/curriculum/data/sampleCurriculum'
import { ExperimentOverview } from '@/features/experiments/components/ExperimentOverview'
import { ExperimentLearningSections } from '@/features/experiments/components/ExperimentLearningSections'
import { ExperimentToolsSection } from '@/features/experiments/components/ExperimentToolsSection'
import { ExperimentMaterialsSection } from '@/features/experiments/components/ExperimentMaterialsSection'
import { ExperimentLearningStageViewer } from '@/features/experiments/components/ExperimentLearningStageViewer'
import { demoCatalog } from '@/features/experiments/data/mockExperiments'
import { getExperimentToolsAndMaterials } from '@/features/experiments/data/experimentToolsAndMaterials'
import { getExperimentLearningStages } from '@/features/experiments/data/experimentLearningStages'
import { getReviewedExperimentLessons } from '@/features/experiments/lib/experimentDetailsSelectors'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Experiment } from '@/types/experiment'

export function ExperimentDetailsPage() {
  const experiment = useOutletContext<Experiment>()
  usePageTitle(`${experiment.title} — Details`)
  const lessons = getReviewedExperimentLessons(sampleCurriculum, experiment.id)
  const toolsAndMaterials = getExperimentToolsAndMaterials(experiment.id)
  const learningStages = getExperimentLearningStages(experiment.id)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', to: routePaths.home },
          { label: 'Experiments', to: routePaths.experiments },
          { label: experiment.title },
        ]}
      />
      <ExperimentOverview
        experiment={experiment}
        category={demoCatalog.categories.find((item) => item.id === experiment.categoryId)}
      />
      <ExperimentLearningSections content={experiment.learning} />
      <ExperimentToolsSection tools={toolsAndMaterials?.tools} />
      <ExperimentMaterialsSection
        materials={toolsAndMaterials?.materials}
        measurementDisclaimer={toolsAndMaterials?.measurementDisclaimer}
      />
      <ExperimentLearningStageViewer key={experiment.id} data={learningStages} />
      {lessons.length > 0 && (
        <section
          aria-labelledby="experiment-lessons-title"
          className="space-y-4 border-t border-line pt-7"
        >
          <h2 id="experiment-lessons-title" className="text-xl font-semibold text-navy">
            Related Lessons
          </h2>
          <ul className="space-y-2">
            {lessons.map(({ grade, term, unit, lesson }) => (
              <li key={lesson.id}>
                <Link
                  to={getCurriculumLessonPath(lesson.id)}
                  className="inline-flex min-h-11 items-center rounded px-1 text-sm font-semibold text-teal-dark hover:underline focus-visible:outline-teal"
                >
                  {grade.title} / {term.title} / {unit.title} / {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
