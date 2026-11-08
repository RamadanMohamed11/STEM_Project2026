import type { EquipmentVisual } from '@/types/laboratory'
import { LIBRARY_MODEL_IDS, LIBRARY_MODELS } from './models/library/modelSpecs.ts'

/** All world dimensions are metres; Y is up and the table surface is Y = 0.78. */
export const BENCH_TOP = 0.78
export const BENCH_WIDTH = 6.4
export const BENCH_DEPTH = 3.25
export const EQUIPMENT_LIMITS = { minX: -2.85, maxX: 2.85, minZ: -1.3, maxZ: 1.3 } as const

/**
 * Camera fit is a *view* transform only, never used by pointer projection,
 * world-space physics, or tabletop equipment positions. Keep margins wide
 * enough for the HUD while giving desktop students a much closer bench view.
 */
export const LAB_CAMERA_FOV = 42
export const CAMERA_TARGET = [0, 1.04, 0.04] as const
export const CAMERA_DESKTOP_POSITION = [2.65, 3.52, 5.12] as const
const DESKTOP_DISTANCE = Math.hypot(
  CAMERA_DESKTOP_POSITION[0] - CAMERA_TARGET[0],
  CAMERA_DESKTOP_POSITION[1] - CAMERA_TARGET[1],
  CAMERA_DESKTOP_POSITION[2] - CAMERA_TARGET[2],
)

export function cameraPositionForAspect(aspect: number): [number, number, number] {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9
  const halfFov = (LAB_CAMERA_FOV * Math.PI) / 360
  // 7.4 metres of horizontal content (6.4m workbench + camera/overlay margin).
  const requiredHorizontalDistance = 7.4 / (2 * Math.tan(halfFov) * safeAspect)
  const requiredVerticalDistance = 3.6 / (2 * Math.tan(halfFov))
  const distance = Math.max(DESKTOP_DISTANCE, requiredHorizontalDistance, requiredVerticalDistance)
  const scale = distance / DESKTOP_DISTANCE
  return [
    CAMERA_TARGET[0] + (CAMERA_DESKTOP_POSITION[0] - CAMERA_TARGET[0]) * scale,
    CAMERA_TARGET[1] + (CAMERA_DESKTOP_POSITION[1] - CAMERA_TARGET[1]) * scale,
    CAMERA_TARGET[2] + (CAMERA_DESKTOP_POSITION[2] - CAMERA_TARGET[2]) * scale,
  ]
}

export type Point2D = { x: number; z: number }

/** 'library' = an L4 procedural model rendered from its spec (see models/library). */
export type BenchVisual = EquipmentVisual | 'library'

export interface EquipmentRegistryEntry {
  id: string
  visual: BenchVisual
  label: string
  footprintRadius: number
  defaultPosition: Point2D
  /** L3: how many copies may be on the bench (canonical + extras). Default 1. */
  maxInstances?: number
  /** L4: library model id (visual 'library') and its collider height. */
  modelId?: string
  height?: number
}

export const equipmentRegistry: readonly EquipmentRegistryEntry[] = [
  {
    id: 'digital-balance',
    label: 'Digital balance',
    visual: 'digital-balance',
    footprintRadius: 0.48,
    defaultPosition: { x: -2.1, z: 0.18 },
    maxInstances: 1,
  },
  {
    id: 'water',
    label: 'Water container',
    visual: 'water',
    footprintRadius: 0.34,
    defaultPosition: { x: -1.18, z: -0.55 },
    maxInstances: 1,
  },
  {
    id: 'graduated-cylinder',
    label: 'Graduated cylinder',
    visual: 'graduated-cylinder',
    footprintRadius: 0.25,
    defaultPosition: { x: -0.42, z: 0.35 },
    maxInstances: 3,
  },
  {
    id: 'beaker',
    label: 'Beaker',
    visual: 'beaker',
    footprintRadius: 0.46,
    defaultPosition: { x: 0.55, z: 0.08 },
    maxInstances: 3,
  },
  {
    id: 'stirring-rod',
    label: 'Stirring rod',
    visual: 'stirring-rod',
    footprintRadius: 0.2,
    defaultPosition: { x: 1.25, z: -0.7 },
    maxInstances: 2,
  },
  {
    id: 'sodium-chloride',
    label: 'Sodium chloride',
    visual: 'sodium-chloride',
    footprintRadius: 0.34,
    defaultPosition: { x: 2.14, z: 0.25 },
    maxInstances: 1,
  },
  {
    id: 'spatula',
    label: 'Laboratory spatula',
    visual: 'spatula',
    footprintRadius: 0.33,
    defaultPosition: { x: 1.93, z: -0.82 },
    maxInstances: 2,
  },
  {
    id: 'weighing-boat',
    label: 'Weighing boat',
    visual: 'weighing-boat',
    footprintRadius: 0.25,
    defaultPosition: { x: -1.37, z: 0.9 },
    maxInstances: 3,
  },
]

/**
 * L4 library equipment: every other catalogue item, rendered from procedural specs. These are
 * practice equipment (no chemistry yet); they are not on the bench at the start.
 */
export const libraryEquipmentRegistry: readonly EquipmentRegistryEntry[] = LIBRARY_MODEL_IDS.map(
  (id) => {
    const spec = LIBRARY_MODELS[id]
    return {
      id,
      label: spec.label,
      visual: 'library',
      modelId: id,
      footprintRadius: spec.footprintRadius,
      defaultPosition: { x: 0, z: 0 },
      maxInstances: spec.maxInstances ?? 1,
      height: spec.height,
    }
  },
)

export const DEFAULT_CAMERA_POSITION = CAMERA_DESKTOP_POSITION
export const DEFAULT_CAMERA_TARGET = CAMERA_TARGET

// ---------------------------------------------------------------------------
// L3 equipment instances
// ---------------------------------------------------------------------------

/**
 * The first copy of a type keeps its canonical id (e.g. 'beaker'); that is the copy linked to the
 * experiment chemistry. Extra copies are 'beaker~2', 'beaker~3': same model and footprint, empty,
 * and never part of the salt chemistry or workflow.
 */
export const INSTANCE_SEPARATOR = '~'

export function instanceTypeId(id: string) {
  const at = id.indexOf(INSTANCE_SEPARATOR)
  return at === -1 ? id : id.slice(0, at)
}

export function instanceNumber(id: string) {
  const at = id.indexOf(INSTANCE_SEPARATOR)
  if (at === -1) return 1
  const n = Number(id.slice(at + 1))
  return Number.isInteger(n) && n >= 2 ? n : NaN
}

export function isExtraInstance(id: string) {
  return id.includes(INSTANCE_SEPARATOR)
}

export function makeInstanceId(typeId: string, n: number) {
  return n <= 1 ? typeId : `${typeId}${INSTANCE_SEPARATOR}${n}`
}

const resolvedCache = new Map<string, EquipmentRegistryEntry>(
  [...equipmentRegistry, ...libraryEquipmentRegistry].map((entry) => [entry.id, entry]),
)

const chemistryIds = new Set(equipmentRegistry.map((entry) => entry.id))

/** The experiment's own items (canonical ids) — the only ones linked to the chemistry today. */
export function isChemistryLinked(id: string) {
  return chemistryIds.has(id)
}

/** L4 library model (any copy). */
export function isLibraryEquipment(id: string) {
  return resolveEquipment(id)?.visual === 'library'
}

/** Registry entry for a canonical or extra-instance id; undefined for unknown/invalid ids. */
export function resolveEquipment(id: string): EquipmentRegistryEntry | undefined {
  const cached = resolvedCache.get(id)
  if (cached) return cached
  const base = resolvedCache.get(instanceTypeId(id))
  const n = instanceNumber(id)
  if (!base || !Number.isFinite(n) || n > (base.maxInstances ?? 1) || isExtraInstance(base.id))
    return undefined
  const entry: EquipmentRegistryEntry = { ...base, id, label: `${base.label} ${n}` }
  resolvedCache.set(id, entry)
  return entry
}

export function isKnownEquipment(id: string) {
  return resolveEquipment(id) !== undefined
}

/**
 * Id to use when adding one more of a type: the canonical id if it is not on the bench, otherwise
 * the lowest free extra-instance number; null when the type is at its limit or unknown.
 */
export function nextInstanceId(typeId: string, placedIds: readonly string[]) {
  const base = resolvedCache.get(typeId)
  if (!base || isExtraInstance(typeId)) return null
  for (let n = 1; n <= (base.maxInstances ?? 1); n++) {
    const id = makeInstanceId(typeId, n)
    if (!placedIds.includes(id)) return id
  }
  return null
}

export function instancesOnBench(typeId: string, placedIds: readonly string[]) {
  return placedIds.filter((id) => instanceTypeId(id) === typeId).length
}
