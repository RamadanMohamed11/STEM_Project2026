import { RotateCcw, Search } from 'lucide-react'
import {
  getAvailableGrades,
  getTermsForGrade,
  getUnitsForTerm,
  getLessonsForUnit,
} from '@/features/curriculum/lib/curriculumSelectors'
import { resolveAcademicFilters } from '@/features/curriculum/lib/curriculumDiscovery'
import type {
  CatalogFilters as CatalogFilterValues,
  CatalogData,
} from '@/features/experiments/lib/catalogSelectors'

interface CatalogFiltersProps {
  data: CatalogData
  filters: CatalogFilterValues
  onChange: (next: CatalogFilterValues) => void
  onClear: () => void
  hasFilters: boolean
}

const selectClass =
  'mt-2 min-h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 text-sm text-navy transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink/65'

export function CatalogFilters({
  data,
  filters,
  onChange,
  onClear,
  hasFilters,
}: CatalogFiltersProps) {
  const context = resolveAcademicFilters(data.curriculum, filters)
  const academic = [
    {
      key: 'gradeId' as const,
      label: 'Grade',
      all: 'All Grades',
      options: getAvailableGrades(data.curriculum),
      visible: Boolean(data.curriculum),
    },
    {
      key: 'termId' as const,
      label: 'Term',
      all: 'All Terms',
      options: getTermsForGrade(data.curriculum, context.grade?.id),
      visible: Boolean(context.grade),
    },
    {
      key: 'unitId' as const,
      label: 'Unit',
      all: 'All Units',
      options: getUnitsForTerm(data.curriculum, context.term?.id),
      visible: Boolean(context.term),
    },
    {
      key: 'lessonId' as const,
      label: 'Lesson',
      all: 'All Lessons',
      options: getLessonsForUnit(data.curriculum, context.unit?.id),
      visible: Boolean(context.unit),
    },
  ]
  return (
    <section
      aria-label="Find experiments"
      className="rounded-xl border border-line bg-white px-4 py-5 shadow-card sm:px-6 sm:py-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-navy">Find an experiment</h2>
          <p className="mt-1 text-xs text-ink/75">
            Search by keyword or filter by category and availability.
          </p>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-teal-dark transition-colors hover:bg-teal-soft focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2"
          >
            <RotateCcw size={15} aria-hidden="true" /> Clear Filters
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="experiment-search" className="text-xs font-semibold text-ink/85">
            Search experiments
          </label>
          <div className="relative mt-2">
            <Search
              size={17}
              className="pointer-events-none absolute start-3.5 top-3.5 text-ink/65"
              aria-hidden="true"
            />
            <input
              id="experiment-search"
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder="Try salt, volume, pH…"
              autoComplete="off"
              className="min-h-11 w-full rounded-lg border border-line-strong bg-white ps-10 pe-3.5 text-sm text-navy placeholder:text-ink/55 transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal"
            />
          </div>
        </div>

        <div>
          <label htmlFor="experiment-category" className="text-xs font-semibold text-ink/85">
            Category
          </label>
          <select
            id="experiment-category"
            className={selectClass}
            value={filters.categoryId}
            onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
          >
            <option value="all">All categories</option>
            {filters.categoryId !== 'all' &&
              !data.categories.some((item) => item.id === filters.categoryId) && (
                <option value={filters.categoryId}>Invalid category</option>
              )}
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="experiment-status" className="text-xs font-semibold text-ink/85">
            Availability
          </label>
          <select
            id="experiment-status"
            className={selectClass}
            value={filters.status}
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value as CatalogFilterValues['status'] })
            }
          >
            <option value="all">All statuses</option>
            {!['all', 'demo', 'planned'].includes(filters.status) && (
              <option value={filters.status}>Invalid availability</option>
            )}
            <option value="demo">Available demo</option>
            <option value="planned">Planned examples</option>
          </select>
        </div>

        {data.semesters.length > 0 && (
          <div>
            <label htmlFor="experiment-semester" className="text-xs font-semibold text-ink/85">
              Semester
            </label>
            <select
              id="experiment-semester"
              className={selectClass}
              value={filters.semesterId}
              onChange={(event) => onChange({ ...filters, semesterId: event.target.value })}
            >
              <option value="all">All semesters</option>
              {[...data.semesters]
                .sort((a, b) => a.order - b.order)
                .map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.title}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>
      {data.curriculum && (
        <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {academic
            .filter((field) => field.visible)
            .map((field, index) => (
              <div key={field.key}>
                <label
                  htmlFor={`experiment-${field.key}`}
                  className="text-xs font-semibold text-ink/85"
                >
                  {field.label}
                </label>
                <select
                  id={`experiment-${field.key}`}
                  className={selectClass}
                  value={filters[field.key]}
                  onChange={(event) => {
                    const next = { ...filters, [field.key]: event.target.value }
                    for (const child of academic.slice(index + 1)) next[child.key] = 'all'
                    onChange(next)
                  }}
                >
                  <option value="all">{field.all}</option>
                  {filters[field.key] !== 'all' &&
                    !field.options.some((item) => item.id === filters[field.key]) && (
                      <option value={filters[field.key]}>Invalid selection</option>
                    )}
                  {field.options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            ))}
        </div>
      )}
    </section>
  )
}
