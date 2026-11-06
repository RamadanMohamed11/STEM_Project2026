import { RotateCcw, Search } from 'lucide-react'
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
            <RotateCcw size={15} aria-hidden="true" /> Reset filters
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1.7fr)_repeat(3,minmax(130px,1fr))]">
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
            <option value="demo">Available demo</option>
            <option value="planned">Planned examples</option>
          </select>
        </div>

        <div>
          <label htmlFor="experiment-semester" className="text-xs font-semibold text-ink/85">
            Semester
          </label>
          <select
            id="experiment-semester"
            className={selectClass}
            value={filters.semesterId}
            disabled={data.semesters.length === 0}
            aria-describedby={data.semesters.length === 0 ? 'semester-note' : undefined}
            onChange={(event) => onChange({ ...filters, semesterId: event.target.value })}
          >
            <option value="all">
              {data.semesters.length === 0 ? 'Not assigned yet' : 'All semesters'}
            </option>
            {[...data.semesters]
              .sort((a, b) => a.order - b.order)
              .map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.title}
                </option>
              ))}
          </select>
        </div>
      </div>
      {data.semesters.length === 0 && (
        <p id="semester-note" className="mt-3 text-xs leading-relaxed text-ink/65">
          Semester filtering will become available when the academic curriculum is added.
        </p>
      )}
    </section>
  )
}
