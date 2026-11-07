import { ButtonLink } from '@/components/ui/ButtonLink'
import { getCurriculumPath, routePaths } from '@/app/paths'
import { ExperimentCard } from '@/features/experiments/components/ExperimentCard'
import { mockCategories } from '@/features/experiments/data/mockExperiments'
import { demoCatalog } from '@/features/experiments/data/mockExperiments'
import { CatalogFilters } from '@/features/experiments/components/CatalogFilters'
import { CatalogEmptyState } from '@/features/experiments/components/CatalogEmptyState'
import { useCatalogSearch } from '@/features/experiments/lib/useCatalogSearch'
import { catalogResultsPath } from '@/features/experiments/lib/catalogUrlState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { curriculumBreadcrumbs } from '../lib/curriculumBreadcrumbs'
import { getCurriculumLessonContext } from '../lib/curriculumBrowser'
import { getExperimentsForLesson } from '../lib/curriculumSelectors'
import type { CurriculumData } from '@/types/curriculum'

export function LessonExperiments({
  data,
  lessonId,
}: {
  data: CurriculumData
  lessonId: string | undefined
}) {
  const context = getCurriculumLessonContext(data, lessonId)
  const experiments = getExperimentsForLesson(data, lessonId)
  const catalog = { ...demoCatalog, experiments }
  const { filters, invalid, results, hasFilters, onChange, onClear, resultsPath } =
    useCatalogSearch(catalog)
  if (!context)
    return (
      <section className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold text-navy">Lesson Not Found</h1>
        <p className="text-slate">Choose a lesson from Your Lessons.</p>
        <ButtonLink to={routePaths.curriculum}>Back to Your Lessons</ButtonLink>
      </section>
    )

  const plannedOnly =
    experiments.length > 0 && experiments.every((item) => item.status === 'planned')
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <Breadcrumbs items={curriculumBreadcrumbs(context, 'Experiments')} />
      <header className="space-y-3">
        <p className="text-sm font-semibold text-teal-dark">Your Lessons / Experiments</p>
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          {context.lesson.title}
        </h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate">
          <div>
            <dt className="font-semibold text-navy">Grade</dt>
            <dd>{context.grade.title}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy">Term</dt>
            <dd>{context.term.title}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy">Unit</dt>
            <dd>{context.unit.title}</dd>
          </div>
        </dl>
        {context.lesson.description && (
          <p className="text-sm leading-relaxed text-slate">{context.lesson.description}</p>
        )}
      </header>
      <p className="rounded-xl border border-line bg-teal-soft p-4 text-sm leading-relaxed text-ink">
        <strong>Demonstration data.</strong> These lesson links are examples, not the official
        Egyptian chemistry curriculum. The salt-dissolution demo is a separate, unassigned activity.
      </p>
      {experiments.length > 0 && (
        <CatalogFilters
          data={catalog}
          filters={filters}
          onChange={onChange}
          onClear={onClear}
          hasFilters={hasFilters}
        />
      )}
      {invalid && (
        <p role="alert" className="text-sm text-danger">
          These filters do not match an available selection. Clear Filters and try again.
        </p>
      )}
      <section aria-labelledby="lesson-experiments-title" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lesson-experiments-title" className="text-xl font-semibold text-navy">
            Experiments in This Lesson
          </h2>
          <p className="text-sm text-slate">
            {experiments.length} {experiments.length === 1 ? 'experiment' : 'experiments'} assigned
          </p>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate">
          {results.length} {results.length === 1 ? 'experiment' : 'experiments'} found
        </p>
        {plannedOnly && (
          <p className="text-sm text-slate">
            Coming Soon. You can view these experiments, but their 3D labs are not available yet.
          </p>
        )}
        {results.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((experiment) => (
              <li key={experiment.id} className="min-w-0">
                <ExperimentCard
                  experiment={experiment}
                  category={mockCategories.find((item) => item.id === experiment.categoryId)}
                  index={data.experiments.findIndex((item) => item.id === experiment.id)}
                  returnTo={resultsPath}
                />
              </li>
            ))}
          </ul>
        ) : experiments.length || invalid ? (
          <CatalogEmptyState onReset={onClear} />
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-navy">No Experiments Available</h3>
            <p className="mt-2 text-sm text-slate">
              No experiments have been assigned to this lesson yet. Return to your lessons to choose
              another one.
            </p>
          </div>
        )}
      </section>
      <nav
        aria-label="Lesson navigation"
        className="flex flex-wrap gap-3 border-t border-line pt-5"
      >
        <ButtonLink
          to={`${getCurriculumPath(context.grade.id, context.term.id)}&${new URLSearchParams({ unit: context.unit.id })}`}
          variant="secondary"
        >
          Back to Your Lessons
        </ButtonLink>
        <ButtonLink
          to={catalogResultsPath(routePaths.experiments, {
            ...filters,
            gradeId: context.grade.id,
            termId: context.term.id,
            unitId: context.unit.id,
            lessonId: context.lesson.id,
          })}
          variant="secondary"
        >
          Browse Experiments
        </ButtonLink>
      </nav>
    </div>
  )
}
