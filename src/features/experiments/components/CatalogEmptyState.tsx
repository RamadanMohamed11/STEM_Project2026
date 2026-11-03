import { SearchX } from 'lucide-react'

export function CatalogEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-white px-6 py-13 text-center sm:py-16">
      <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-teal-soft text-teal">
        <SearchX size={27} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-navy">No matching experiments</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/75">
        Try a different search or clear the filters to see all demonstration examples.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong px-5 text-sm font-semibold text-navy hover:bg-surface-muted"
      >
        Show all experiments
      </button>
    </div>
  )
}
