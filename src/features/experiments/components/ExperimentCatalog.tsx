import { useMemo } from 'react'
import { ArrowUpRight, CheckCircle2, Info } from 'lucide-react'
import { Link } from 'react-router'
import { CatalogEmptyState } from '@/features/experiments/components/CatalogEmptyState'
import { CatalogFilters } from '@/features/experiments/components/CatalogFilters'
import { ExperimentCard } from '@/features/experiments/components/ExperimentCard'
import { sampleCurriculum } from '@/features/curriculum/data/sampleCurriculum'
import { useCatalogSearch } from '@/features/experiments/lib/useCatalogSearch'
import { resolveAcademicFilters } from '@/features/curriculum/lib/curriculumDiscovery'
import { curriculumBreadcrumbs } from '@/features/curriculum/lib/curriculumBreadcrumbs'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { getCurriculumPath } from '@/app/paths'
import {
  filterExperiments,
  initialCatalogFilters,
  type CatalogData,
} from '@/features/experiments/lib/catalogSelectors'
import { getUnitsForTerm, getLessonsForUnit } from '@/features/curriculum/lib/curriculumSelectors'
import { useStudentExperimentCatalog } from '@/features/experiments/state/useStudentExperimentCatalog'

export interface ExperimentCatalogProps {
  catalogData?: CatalogData
}

export function ExperimentCatalog({ catalogData }: ExperimentCatalogProps = {}) {
  const { catalog } = useStudentExperimentCatalog(catalogData)
  const activeCurriculum = catalog.curriculum ?? sampleCurriculum
  const { filters, invalid, results, hasFilters, onChange, onClear, resultsPath } =
    useCatalogSearch(catalog)
  const context = resolveAcademicFilters(activeCurriculum, filters)
  const assigned = filterExperiments(catalog, {
    ...initialCatalogFilters,
    gradeId: filters.gradeId,
    termId: filters.termId,
    unitId: filters.unitId,
    lessonId: filters.lessonId,
  })
  const emptyContext =
    !invalid && context.grade && assigned.length === 0
      ? context.term && !getUnitsForTerm(activeCurriculum, context.term.id).length
        ? 'No Units Available'
        : context.unit && !getLessonsForUnit(activeCurriculum, context.unit.id).length
          ? 'No Lessons Available'
          : 'No Experiments Assigned'
      : null
  const categories = useMemo(
    () => new Map(catalog.categories.map((category) => [category.id, category])),
    [catalog.categories],
  )
  const availableCount = catalog.experiments.filter((item) => item.status === 'demo').length
  const plannedCount = catalog.experiments.length - availableCount

  return (
    <div className="space-y-7">
      <Breadcrumbs items={curriculumBreadcrumbs(invalid ? {} : context, 'Experiments')} />
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-line bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/80">
          <span>
            <strong className="text-lg font-semibold text-navy">
              {catalog.experiments.length}
            </strong>{' '}
            sample experiments
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-teal" aria-hidden="true" />
            <strong className="text-navy">{availableCount}</strong> 3D lab
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
            <strong className="text-navy">{plannedCount}</strong> planned
          </span>
        </div>
        <Link
          to="/safety"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-teal-dark hover:underline"
        >
          Review lab safety <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <CatalogFilters
        data={catalog}
        filters={filters}
        onChange={onChange}
        onClear={onClear}
        hasFilters={hasFilters}
      />
      {invalid && (
        <p role="alert" className="text-sm text-danger">
          These filters do not match an available selection. Clear Filters or choose them again.
        </p>
      )}
      {!invalid && context.grade && (
        <p className="text-sm text-slate">
          Demonstration curriculum links only. The salt-dissolution demo has not been assigned to a
          lesson.
        </p>
      )}
      {!invalid && context.grade && context.term && (
        <Link
          className="inline-flex min-h-11 items-center rounded px-1 text-sm font-semibold text-teal-dark hover:underline focus-visible:outline-teal"
          to={`${getCurriculumPath(context.grade.id, context.term.id)}${context.unit ? `&${new URLSearchParams({ unit: context.unit.id })}` : ''}`}
        >
          Back to Lessons
        </Link>
      )}

      <section aria-label="Experiment results">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy">Browse experiments</h2>
          <p aria-live="polite" aria-atomic="true" className="text-sm text-ink/75">
            {results.length} {results.length === 1 ? 'experiment' : 'experiments'} found
          </p>
        </div>
        {emptyContext && (
          <p className="mb-5 text-sm text-slate">
            <strong>{emptyContext}.</strong> This curriculum selection has no assigned experiments
            yet. Choose another selection or return to your lessons.
          </p>
        )}
        {results.length > 0 && results.every((item) => item.status === 'planned') && (
          <p className="mb-5 text-sm text-slate">
            Coming Soon. These experiments are planned. Their 3D labs are not available yet.
          </p>
        )}

        {results.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((experiment) => (
              <li key={experiment.id} className="min-w-0">
                <ExperimentCard
                  experiment={experiment}
                  category={categories.get(experiment.categoryId)}
                  index={catalog.experiments.findIndex((item) => item.id === experiment.id)}
                  returnTo={hasFilters ? resultsPath : undefined}
                />
              </li>
            ))}
          </ul>
        ) : (
          <CatalogEmptyState onReset={onClear} />
        )}
      </section>

      <aside className="flex gap-3 rounded-xl border border-line bg-surface-muted/80 px-5 py-4 text-sm text-ink/80 shadow-sm">
        <Info size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-navy">Sample experiments:</strong> The 3D laboratory
          allows you to explore real equipment handles, chemical transfers, and live measurements.
          Additional planned activities will be added soon.
        </p>
      </aside>
    </div>
  )
}
