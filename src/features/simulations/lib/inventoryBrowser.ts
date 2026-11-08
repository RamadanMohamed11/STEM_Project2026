/**
 * L2 inventory browser model (pure): categories, search, A–Z index and availability.
 * Combines the experiment's renderable inventory (items with a 3D model) with the shared
 * equipment catalogue (T42) and substance formulas from the core engine definition (L1).
 */
import {
  equipmentCatalog,
  getEquipmentCatalogItem,
  type EquipmentCategory,
} from '../../experiments/data/equipmentCatalog.ts'
import type { CoreExperimentDefinition } from '../engine/core/index.ts'
import type { EquipmentVisual, InventoryItem } from '../../../types/laboratory.ts'

export type InventoryCategoryFilter = 'all' | EquipmentCategory

export const INVENTORY_CATEGORIES: readonly {
  id: EquipmentCategory
  label: string
  shortLabel: string
}[] = [
  { id: 'reaction-vessel', label: 'Reaction vessels', shortLabel: 'Vessels' },
  { id: 'assistive-device', label: 'Assistive devices', shortLabel: 'Tools' },
  { id: 'measuring', label: 'Measuring', shortLabel: 'Measure' },
  { id: 'heating', label: 'Heating', shortLabel: 'Heating' },
  { id: 'solid-chemical', label: 'Solid chemicals', shortLabel: 'Solids' },
  { id: 'liquid-chemical', label: 'Liquid chemicals', shortLabel: 'Liquids' },
  { id: 'gas-chemical', label: 'Gas chemicals', shortLabel: 'Gases' },
]

export type InventoryMode = 'guided' | 'free'

export type InventoryAvailability =
  | { status: 'available' }
  | { status: 'not-in-experiment'; reason: string }
  | { status: 'no-3d-model'; reason: string }

export interface InventoryEntry {
  id: string
  name: string
  category: EquipmentCategory
  /** Chemical formula for substances (from the engine definition), otherwise undefined. */
  formula?: string
  description: string
  /** Present only when the item can be rendered and placed in the 3D lab. */
  visual?: EquipmentVisual
  /** Part of this experiment's inventory (shown first, enabled in guided mode). */
  inExperiment: boolean
  availability: InventoryAvailability
  /** Lowercased searchable text: names, aliases, ids, formula (with plain digits). */
  searchText: string
}

const SUBSCRIPTS: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  '⁺': '+',
  '⁻': '-',
}

/** Lowercase, plain digits for sub/superscripts, collapsed spaces. "H₂O" → "h2o". */
export function normalizeSearch(text: string) {
  return text
    .replace(/[₀-₉⁺⁻]/g, (char) => SUBSCRIPTS[char] ?? char)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const FALLBACK_CATEGORY: Readonly<Record<InventoryItem['category'], EquipmentCategory>> = {
  equipment: 'assistive-device',
  materials: 'solid-chemical',
}

function formulaFor(core: CoreExperimentDefinition | undefined, id: string) {
  return core?.chemistry.substances.find((substance) => substance.id === id)?.formula
}

/**
 * Builds the browsable list. Experiment items come first (with their 3D visual); in `free` mode
 * or when `includeCatalog` is set, the rest of the catalogue is appended. Only experiment items
 * have 3D models today, so catalogue-only items are listed but not placeable.
 */
export function buildInventoryEntries(options: {
  experimentItems: readonly InventoryItem[]
  core?: CoreExperimentDefinition
  mode?: InventoryMode
  includeCatalog?: boolean
}): InventoryEntry[] {
  const mode = options.mode ?? 'guided'
  const entries: InventoryEntry[] = []
  const seen = new Set<string>()

  for (const item of options.experimentItems) {
    const catalog = getEquipmentCatalogItem(item.id)
    const formula = formulaFor(options.core, item.id)
    seen.add(item.id)
    if (catalog) seen.add(catalog.id)
    entries.push({
      id: item.id,
      name: item.title,
      category: catalog?.category ?? FALLBACK_CATEGORY[item.category],
      formula,
      description: item.description,
      visual: item.visual,
      inExperiment: true,
      availability: { status: 'available' },
      searchText: normalizeSearch(
        [item.title, item.id, formula ?? '', catalog?.name ?? '', ...(catalog?.aliases ?? [])].join(
          ' ',
        ),
      ),
    })
  }

  if (mode === 'free' || options.includeCatalog) {
    for (const catalog of equipmentCatalog) {
      if (seen.has(catalog.id)) continue
      seen.add(catalog.id)
      entries.push({
        id: catalog.id,
        name: catalog.name,
        category: catalog.category,
        formula: formulaFor(options.core, catalog.id),
        description: catalog.use,
        inExperiment: false,
        availability:
          mode === 'guided'
            ? { status: 'not-in-experiment', reason: 'Not used in this experiment' }
            : { status: 'no-3d-model', reason: '3D model coming soon' },
        searchText: normalizeSearch(
          [catalog.name, catalog.id, ...(catalog.aliases ?? [])].join(' '),
        ),
      })
    }
  }
  return entries
}

export function firstLetter(entry: Pick<InventoryEntry, 'name'>) {
  const letter = entry.name.trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(letter) ? letter : '#'
}

export interface InventoryFilter {
  category: InventoryCategoryFilter
  query: string
  letter: string | null
}

/** Category, search and letter filters combine (AND). Order is preserved. */
export function filterInventory(entries: readonly InventoryEntry[], filter: InventoryFilter) {
  const terms = normalizeSearch(filter.query).split(' ').filter(Boolean)
  return entries.filter(
    (entry) =>
      (filter.category === 'all' || entry.category === filter.category) &&
      (filter.letter === null || firstLetter(entry) === filter.letter) &&
      terms.every((term) => entry.searchText.includes(term)),
  )
}

/** Count per category for the current search/letter (so the rail shows what a click would give). */
export function countByCategory(
  entries: readonly InventoryEntry[],
  filter: Omit<InventoryFilter, 'category'>,
) {
  const visible = filterInventory(entries, { ...filter, category: 'all' })
  const counts: Record<InventoryCategoryFilter, number> = {
    all: visible.length,
    'reaction-vessel': 0,
    'assistive-device': 0,
    measuring: 0,
    heating: 0,
    'solid-chemical': 0,
    'liquid-chemical': 0,
    'gas-chemical': 0,
  }
  for (const entry of visible) counts[entry.category] += 1
  return counts
}

/** Letters that have at least one entry for the current category and search. */
export function availableLetters(
  entries: readonly InventoryEntry[],
  filter: Omit<InventoryFilter, 'letter'>,
) {
  return new Set(filterInventory(entries, { ...filter, letter: null }).map(firstLetter))
}

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
