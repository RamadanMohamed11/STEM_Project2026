import { useId, useMemo, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  Cloud,
  Droplets,
  Flame,
  FlaskConical,
  Gauge,
  Hexagon,
  Info,
  LayoutGrid,
  Search,
  Wrench,
  X,
} from 'lucide-react'
import { LaboratoryEquipmentPreview } from './LaboratoryEquipmentPreview'
import { getEquipmentCatalogItem } from '@/features/experiments/data/equipmentCatalog'
import { instancesOnBench, resolveEquipment } from '../three/sceneConfig'
import {
  ALPHABET,
  INVENTORY_CATEGORIES,
  availableLetters,
  buildInventoryEntries,
  countByCategory,
  filterInventory,
  type InventoryCategoryFilter,
  type InventoryEntry,
  type InventoryMode,
} from '../lib/inventoryBrowser'
import type { CoreExperimentDefinition } from '../engine/core'
import type { InventoryItem } from '@/types/laboratory'

const CATEGORY_ICONS: Record<InventoryCategoryFilter, ReactNode> = {
  all: <LayoutGrid size={18} aria-hidden="true" />,
  'reaction-vessel': <FlaskConical size={18} aria-hidden="true" />,
  'assistive-device': <Wrench size={18} aria-hidden="true" />,
  measuring: <Gauge size={18} aria-hidden="true" />,
  heating: <Flame size={18} aria-hidden="true" />,
  'solid-chemical': <Hexagon size={18} aria-hidden="true" />,
  'liquid-chemical': <Droplets size={18} aria-hidden="true" />,
  'gas-chemical': <Cloud size={18} aria-hidden="true" />,
}

export const EQUIPMENT_DRAG_TYPE = 'application/x-stem-lab-equipment'

export interface LabInventoryPanelProps {
  open: boolean
  items: readonly InventoryItem[]
  core?: CoreExperimentDefinition
  mode?: InventoryMode
  placedIds: readonly string[]
  selectedId: string | null
  placingId: string | null
  disabled: boolean
  onItemClick: (id: string) => void
  /** L3: place the next free copy at a suggested spot (keyboard-friendly, no pointer needed). */
  onAddToBench?: (typeId: string) => void
  onCollapse: () => void
}

/**
 * L2 categorised inventory: category rail, search (name or formula), A–Z index, item cards with
 * drag-to-bench and click-to-place, and catalogue notes. A bottom sheet on small screens.
 */
export function LabInventoryPanel({
  open,
  items,
  core,
  mode = 'guided',
  placedIds,
  selectedId,
  placingId,
  disabled,
  onItemClick,
  onAddToBench,
  onCollapse,
}: LabInventoryPanelProps) {
  const [category, setCategory] = useState<InventoryCategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState<string | null>(null)
  const [showCatalog, setShowCatalog] = useState(false)
  const [noteId, setNoteId] = useState<string | null>(null)
  const prefix = useId()

  const entries = useMemo(
    () =>
      buildInventoryEntries({ experimentItems: items, core, mode, includeCatalog: showCatalog }),
    [items, core, mode, showCatalog],
  )
  const visible = filterInventory(entries, { category, query, letter })
  const counts = countByCategory(entries, { query, letter })
  const letters = availableLetters(entries, { category, query })
  const note = noteId ? getEquipmentCatalogItem(noteId) : undefined
  const hasFilters = category !== 'all' || query.trim() !== '' || letter !== null

  const rail = [
    { id: 'all' as const, label: 'All items', shortLabel: 'All' },
    ...INVENTORY_CATEGORIES,
  ]

  return (
    <aside
      aria-label="Lab inventory"
      hidden={!open}
      className="absolute inset-x-3 bottom-3 z-20 flex max-h-[62dvh] flex-col overflow-hidden rounded-2xl border border-white/25 bg-white/97 text-[#0d1b2a] shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:left-4 sm:top-4 sm:max-h-none sm:w-[min(400px,calc(100vw-32px))]"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-[#cde1f2] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1b3a6b]">
            Tools & materials
          </p>
          <h2 className="text-sm font-bold">Lab inventory</h2>
        </div>
        <button
          type="button"
          aria-label="Collapse inventory"
          title="Collapse inventory"
          onClick={onCollapse}
          className="rounded-lg p-2 text-[#3d5a80] hover:bg-[#e8f1fa] focus-visible:outline-2 focus-visible:outline-[#1b3a6b]"
        >
          <ChevronLeft size={17} className="max-sm:-rotate-90" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        {/* Category rail: vertical on desktop, horizontal chips on phones. */}
        <nav
          aria-label="Inventory categories"
          className="shrink-0 border-b border-[#cde1f2] bg-[#e8f1fa] sm:w-[74px] sm:border-b-0 sm:border-r"
        >
          <ul className="flex gap-1 overflow-x-auto p-1.5 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto">
            {rail.map((entry) => {
              const active = category === entry.id
              const count = counts[entry.id]
              return (
                <li key={entry.id} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    aria-label={`${entry.label} (${count})`}
                    onClick={() => {
                      setCategory(entry.id)
                      setLetter(null)
                    }}
                    className={`flex min-h-11 w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold leading-tight focus-visible:outline-2 focus-visible:outline-[#1b3a6b] sm:flex-col sm:gap-0.5 sm:px-1 sm:text-center ${
                      active
                        ? 'bg-[#1b3a6b] text-white shadow-sm'
                        : count === 0
                          ? 'text-[#6b8cae] hover:bg-[#e8f1fa]'
                          : 'text-[#3d5a80] hover:bg-[#e8f1fa]'
                    }`}
                  >
                    {CATEGORY_ICONS[entry.id]}
                    <span className="whitespace-nowrap">{entry.shortLabel}</span>
                    <span
                      aria-hidden="true"
                      className={`tabular-nums ${active ? 'text-white/80' : 'text-[#6b8cae]'}`}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 space-y-2 px-2.5 pt-2.5">
            <label htmlFor={`${prefix}-search`} className="sr-only">
              Search equipment and chemicals by name or formula
            </label>
            <div className="relative">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b8cae]"
              />
              <input
                id={`${prefix}-search`}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setLetter(null)
                }}
                onKeyDown={(event) => event.key === 'Escape' && event.stopPropagation()}
                placeholder="Search name or formula (e.g. NaCl)"
                autoComplete="off"
                className="min-h-10 w-full rounded-lg border border-[#cde1f2] bg-white py-2 pl-8 pr-8 text-xs text-[#0d1b2a] placeholder:text-[#6b8cae] focus-visible:border-[#1b3a6b] focus-visible:outline-2 focus-visible:outline-[#1b3a6b]"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#6b8cae] hover:bg-[#e8f1fa]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div
              role="group"
              aria-label="Filter by first letter"
              className="flex gap-0.5 overflow-x-auto pb-1"
            >
              {ALPHABET.map((char) => {
                const has = letters.has(char)
                const active = letter === char
                return (
                  <button
                    key={char}
                    type="button"
                    disabled={!has && !active}
                    aria-pressed={active}
                    aria-label={`Items starting with ${char}`}
                    onClick={() => setLetter(active ? null : char)}
                    className={`flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold focus-visible:outline-2 focus-visible:outline-[#1b3a6b] ${
                      active
                        ? 'bg-[#1b3a6b] text-white'
                        : has
                          ? 'text-[#3d5a80] hover:bg-[#e8f1fa]'
                          : 'text-[#6b8cae]'
                    }`}
                  >
                    {char}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-[#3d5a80]">
              <p role="status" aria-live="polite">
                {visible.length} {visible.length === 1 ? 'item' : 'items'}
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('all')
                      setQuery('')
                      setLetter(null)
                    }}
                    className="ml-2 font-semibold text-[#1b3a6b] underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                )}
              </p>
              {mode === 'guided' && (
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={showCatalog}
                    onChange={(event) => setShowCatalog(event.target.checked)}
                    className="size-3.5 accent-[#1b3a6b]"
                  />
                  Show all lab equipment
                </label>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2.5">
            {visible.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-[#3d5a80]">
                No equipment or chemicals match these filters.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-1.5 pt-1">
                {visible.map((entry) => (
                  <InventoryCard
                    key={entry.id}
                    entry={entry}
                    placed={placedIds.includes(entry.id)}
                    copies={instancesOnBench(entry.id, placedIds)}
                    maxCopies={resolveEquipment(entry.id)?.maxInstances ?? 1}
                    onAdd={onAddToBench}
                    selected={selectedId === entry.id}
                    placing={placingId === entry.id}
                    disabled={disabled}
                    noteOpen={noteId === entry.id}
                    onClick={onItemClick}
                    onNote={(id) => setNoteId(noteId === id ? null : id)}
                  />
                ))}
              </ul>
            )}
          </div>

          {note && (
            <section
              aria-label={`${note.name} note`}
              className="max-h-[40%] shrink-0 overflow-y-auto border-t border-[#cde1f2] bg-[#e8f1fa] px-3 py-2.5 text-[11px] leading-relaxed"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1b3a6b]">
                    {INVENTORY_CATEGORIES.find((c) => c.id === note.category)?.label}
                  </p>
                  <h3 className="text-xs font-bold">{note.name}</h3>
                </div>
                <button
                  type="button"
                  aria-label="Close note"
                  onClick={() => setNoteId(null)}
                  className="rounded p-1 text-[#3d5a80] hover:bg-[#e8f1fa]"
                >
                  <X size={14} />
                </button>
              </div>
              <dl className="mt-1.5 space-y-1.5">
                <div>
                  <dt className="font-semibold">Use</dt>
                  <dd className="text-[#3d5a80]">{note.use}</dd>
                </div>
                <div>
                  <dt className="font-semibold">How to handle it</dt>
                  <dd className="text-[#3d5a80]">{note.handling}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#995312]">Safety</dt>
                  <dd className="text-[#3d5a80]">{note.safetyNote}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>
    </aside>
  )
}

function InventoryCard({
  entry,
  placed,
  selected,
  placing,
  disabled,
  noteOpen,
  onClick,
  onNote,
  copies,
  maxCopies,
  onAdd,
}: {
  entry: InventoryEntry
  copies: number
  maxCopies: number
  onAdd?: (typeId: string) => void
  placed: boolean
  selected: boolean
  placing: boolean
  disabled: boolean
  noteOpen: boolean
  onClick: (id: string) => void
  onNote: (id: string) => void
}) {
  const usable = entry.availability.status === 'available' && !!(entry.visual || entry.modelId)
  const practice = !entry.inExperiment && !!entry.modelId
  const hasNote = !!getEquipmentCatalogItem(entry.id)
  const canAdd = usable && copies < maxCopies
  const status = !usable
    ? entry.availability.status === 'available'
      ? '3D model coming soon'
      : entry.availability.reason
    : placed
      ? copies > 1
        ? `${copies} on workbench · grab to move`
        : 'On workbench · grab to move'
      : placing
        ? 'Click bench to place'
        : practice
          ? 'Practice item · drag to bench'
          : 'Drag to bench'

  return (
    <li className="relative flex flex-col">
      <button
        type="button"
        disabled={disabled || !usable}
        draggable={canAdd && !disabled}
        onDragStart={(event) => {
          if (!canAdd) {
            event.preventDefault()
            return
          }
          event.dataTransfer.setData(EQUIPMENT_DRAG_TYPE, entry.id)
          event.dataTransfer.setData('text/plain', entry.id)
          event.dataTransfer.effectAllowed = 'move'
        }}
        onClick={() => onClick(entry.id)}
        aria-pressed={usable ? selected : undefined}
        title={entry.description}
        className={`flex w-full flex-1 flex-col items-center gap-1 rounded-xl border px-1.5 pb-2 pt-2.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-[#1b3a6b] disabled:cursor-not-allowed ${
          !usable
            ? 'border-dashed border-[#cde1f2] bg-[#e8f1fa] opacity-70'
            : selected || placing
              ? 'border-[#1b3a6b] bg-[#e8f1fa]'
              : 'border-[#cde1f2] bg-white hover:border-[#a8c5e0] hover:bg-[#e8f1fa]'
        }`}
      >
        {entry.visual ? (
          <LaboratoryEquipmentPreview visual={entry.visual} className="size-12 shrink-0" />
        ) : (
          <span
            className="flex size-12 items-center justify-center text-[#6b8cae]"
            aria-hidden="true"
          >
            {CATEGORY_ICONS[entry.category]}
          </span>
        )}
        <span className="block w-full text-[11px] font-semibold leading-tight">{entry.name}</span>
        {entry.formula && (
          <span className="block text-[11px] font-medium text-[#1b3a6b]">{entry.formula}</span>
        )}
        <span
          className={`flex items-center gap-1 text-[9.5px] leading-tight ${placed ? 'text-[#1b3a6b]' : 'text-[#3d5a80]'}`}
        >
          {placed && <CheckCircle2 size={11} aria-hidden="true" />}
          {status}
        </span>
      </button>
      {onAdd && usable && (
        <button
          type="button"
          disabled={disabled || !canAdd}
          onClick={() => onAdd(entry.id)}
          aria-label={
            placed ? `Add another ${entry.name} to the bench` : `Add ${entry.name} to the bench`
          }
          title={canAdd ? 'Place at a free spot on the bench' : `Up to ${maxCopies} on the bench`}
          className="mt-1 flex min-h-8 w-full items-center justify-center rounded-lg border border-[#cde1f2] bg-white text-[10px] font-semibold text-[#1b3a6b] hover:bg-[#e8f1fa] focus-visible:outline-2 focus-visible:outline-[#1b3a6b] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {placed ? (canAdd ? '+ Add another' : `Max ${maxCopies}`) : '+ Add to bench'}
        </button>
      )}
      {hasNote && (
        <button
          type="button"
          aria-label={`Note for ${entry.name}`}
          aria-expanded={noteOpen}
          onClick={() => onNote(entry.id)}
          className={`absolute right-1 top-1 flex size-6 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-[#1b3a6b] ${
            noteOpen
              ? 'border-[#1b3a6b] bg-[#1b3a6b] text-white'
              : 'border-[#cde1f2] bg-white text-[#3d5a80] hover:border-[#1b3a6b]'
          }`}
        >
          <Info size={12} aria-hidden="true" />
        </button>
      )}
    </li>
  )
}
