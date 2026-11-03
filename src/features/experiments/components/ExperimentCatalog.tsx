import { useMemo, useState } from 'react'
import { ArrowUpRight, CheckCircle2, Info } from 'lucide-react'
import { Link } from 'react-router'
import { CatalogEmptyState } from '@/features/experiments/components/CatalogEmptyState'
import { CatalogFilters } from '@/features/experiments/components/CatalogFilters'
import { ExperimentCard } from '@/features/experiments/components/ExperimentCard'
import { demoCatalog } from '@/features/experiments/data/mockExperiments'
import {
  filterExperiments,
  initialCatalogFilters,
} from '@/features/experiments/lib/catalogSelectors'

export function ExperimentCatalog() {
  const [filters, setFilters] = useState(initialCatalogFilters)
  const results = useMemo(() => filterExperiments(demoCatalog, filters), [filters])
  const categories = useMemo(
    () => new Map(demoCatalog.categories.map((category) => [category.id, category])),
    [],
  )
  const availableCount = demoCatalog.experiments.filter((item) => item.status === 'demo').length
  const plannedCount = demoCatalog.experiments.length - availableCount
  const hasFilters =
    filters.search !== '' ||
    filters.categoryId !== 'all' ||
    filters.status !== 'all' ||
    filters.semesterId !== 'all'
  const resetFilters = () => setFilters({ ...initialCatalogFilters })

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-line bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/80">
          <span>
            <strong className="text-lg font-semibold text-navy">
              {demoCatalog.experiments.length}
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
        data={demoCatalog}
        filters={filters}
        onChange={setFilters}
        onClear={resetFilters}
        hasFilters={hasFilters}
      />

      <section aria-label="Experiment results">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy">Browse experiments</h2>
          <p aria-live="polite" aria-atomic="true" className="text-sm text-ink/75">
            {results.length} {results.length === 1 ? 'experiment' : 'experiments'} found
          </p>
        </div>

        {results.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((experiment) => (
              <li key={experiment.id} className="min-w-0">
                <ExperimentCard
                  experiment={experiment}
                  category={categories.get(experiment.categoryId)}
                  index={demoCatalog.experiments.findIndex((item) => item.id === experiment.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <CatalogEmptyState onReset={resetFilters} />
        )}
      </section>

      <aside className="flex gap-3 rounded-lg border border-line bg-surface-muted/70 px-5 py-4 text-sm text-ink/75">
        <Info size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-navy">Prototype examples:</strong> these are not
          official course experiments. The available demo supports 3D inspection and equipment
          positioning; chemical processes and experimental results are not simulated yet.
        </p>
      </aside>
    </div>
  )
}
