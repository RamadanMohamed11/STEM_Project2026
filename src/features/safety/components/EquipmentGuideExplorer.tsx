import { useMemo, useState } from 'react'
import { Filter, RotateCcw, Search, Sparkles } from 'lucide-react'
import { equipmentCategories, equipmentGuideList } from '../data/equipmentGuideData'
import type { EquipmentCategory } from '../types/equipmentGuide'
import { EquipmentCard } from './EquipmentCard'
import { EquipmentDetailView } from './EquipmentDetailView'

export function EquipmentGuideExplorer() {
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Filtered equipment list based on category and search query
  const filteredList = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase()
    return equipmentGuideList.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      if (!matchesCategory) return false

      if (!trimmed) return true

      return (
        item.name.toLowerCase().includes(trimmed) ||
        item.shortPurpose.toLowerCase().includes(trimmed) ||
        item.description.toLowerCase().includes(trimmed) ||
        item.materialType.toLowerCase().includes(trimmed) ||
        item.intendedUse.some((use) => use.toLowerCase().includes(trimmed)) ||
        item.safetyNotes.some((note) => note.toLowerCase().includes(trimmed)) ||
        item.commonMistakes.some((m) => m.toLowerCase().includes(trimmed))
      )
    })
  }, [activeCategory, searchQuery])

  // Selected item reference
  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return equipmentGuideList.find((item) => item.id === selectedId) ?? null
  }, [selectedId])

  // Navigation within filtered list
  const selectedIndexInFiltered = useMemo(() => {
    if (!selectedId) return -1
    return filteredList.findIndex((item) => item.id === selectedId)
  }, [selectedId, filteredList])

  const hasPrev = selectedIndexInFiltered > 0
  const hasNext = selectedIndexInFiltered >= 0 && selectedIndexInFiltered < filteredList.length - 1

  function handleSelectPrev() {
    if (hasPrev) {
      setSelectedId(filteredList[selectedIndexInFiltered - 1].id)
    }
  }

  function handleSelectNext() {
    if (hasNext) {
      setSelectedId(filteredList[selectedIndexInFiltered + 1].id)
    }
  }

  function handleResetFilters() {
    setActiveCategory('all')
    setSearchQuery('')
  }

  return (
    <div className="space-y-6">
      {/* Search and Category Filter Toolbar */}
      <div className="rounded-xl border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="equipment-search" className="sr-only">
              Search equipment
            </label>
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate"
              aria-hidden="true"
            />
            <input
              id="equipment-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, purpose, or safety terms..."
              className="min-h-11 w-full rounded-lg border border-line-strong bg-white pl-10 pr-4 text-sm text-ink placeholder:text-slate focus-visible:outline-teal"
            />
          </div>

          {/* Result Count */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate">
            <span className="flex size-6 items-center justify-center rounded-full bg-teal-soft text-teal-dark">
              {filteredList.length}
            </span>
            <span>{filteredList.length === 1 ? 'tool available' : 'tools available'}</span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/70 pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-navy">
            <Filter size={13} className="text-teal" aria-hidden="true" />
            <span>Category:</span>
          </span>
          {equipmentCategories.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex min-h-9 items-center rounded-full px-3 font-semibold transition-all select-none ${
                  isActive
                    ? 'border border-teal bg-teal text-white shadow-sm'
                    : 'border border-line bg-canvas text-navy hover:border-line-strong hover:bg-white'
                } focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Item Detail View */}
      {selectedItem && (
        <section aria-label="Selected equipment details" className="scroll-mt-24">
          <EquipmentDetailView
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onSelectPrev={hasPrev ? handleSelectPrev : undefined}
            onSelectNext={hasNext ? handleSelectNext : undefined}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        </section>
      )}

      {/* Empty State when no tools match */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-white p-8 text-center sm:p-12">
          <span className="flex size-14 items-center justify-center rounded-full bg-canvas text-slate">
            <Search size={26} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-base font-bold text-navy sm:text-lg">No equipment found</h3>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate sm:text-sm">
            We couldn&apos;t find any laboratory tools matching &ldquo;{searchQuery}&rdquo;. Try
            searching for general terms like &ldquo;beaker&rdquo;, &ldquo;measure&rdquo;, or
            &ldquo;stir&rdquo;.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal px-4 text-xs font-semibold text-white transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-teal sm:text-sm"
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span>Reset filters</span>
          </button>
        </div>
      ) : (
        /* Equipment Cards Grid */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredList.map((item) => (
            <EquipmentCard
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={(selected) => {
                // Toggle if already selected, otherwise select
                setSelectedId((prev) => (prev === selected.id ? null : selected.id))
              }}
            />
          ))}
        </div>
      )}

      {/* Educational Safety Banner */}
      <div className="rounded-xl border border-line bg-canvas p-4 text-xs leading-relaxed text-ink/75 sm:p-5 sm:text-sm">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
          <p>
            <strong className="text-navy">Standard Science Rule:</strong> In your school laboratory,
            never use glassware that is chipped, cracked, or badly scratched. Always report damaged
            equipment to your teacher immediately for safe disposal.
          </p>
        </div>
      </div>
    </div>
  )
}
