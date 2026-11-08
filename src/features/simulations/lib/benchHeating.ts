/**
 * L7 heating on the bench — pure model (no React/Three).
 * A lit burner snapped under a tripod heats the vessel snapped on that tripod. The heating rate
 * is a teaching model: a fixed power spread over the liquid, so small volumes heat faster.
 * Temperatures, boiling and evaporation are then run by the L1 engine (`simulateTick`).
 */
import type { SpatialRelationship } from '../engine/spatialInteractions.ts'
import { instanceTypeId } from '../three/sceneConfig.ts'

export interface HeatSource {
  label: string
  /** °C per second for 100 mL of water (teaching speed, not calibrated). */
  ratePer100Ml: number
  flameColor: string
  /** Height of the flame base above the bench (top of the barrel / wick). */
  flameBaseY: number
  /** Flame height at full power. */
  flameHeight: number
}

export const HEAT_SOURCES: Readonly<Record<string, HeatSource>> = {
  'bunsen-burner': {
    label: 'Bunsen burner',
    ratePer100Ml: 1.6,
    flameColor: '#4f8dff',
    flameBaseY: 0.49,
    flameHeight: 0.16,
  },
  'spirit-lamp': {
    label: 'Spirit lamp',
    ratePer100Ml: 0.8,
    flameColor: '#ffad3b',
    flameBaseY: 0.35,
    flameHeight: 0.2,
  },
}

/** Equipment that can hold a vessel over a flame. */
export const HEAT_HOLDERS: ReadonlySet<string> = new Set(['tripod'])

/** Minimum liquid (plus glass) the heat is spread over, so an empty vessel does not jump. */
export const MIN_HEATED_ML = 15
/** At or above this a vessel (or a burner's tripod) is too hot to touch. */
export const HOT_TOUCH_C = 50

export const isHeatSource = (id: string) => instanceTypeId(id) in HEAT_SOURCES
export const heatSourceOf = (id: string): HeatSource | undefined => HEAT_SOURCES[instanceTypeId(id)]

type Relationships = Readonly<Record<string, SpatialRelationship>>

const snappedTo = (id: string, relationships: Relationships) => {
  const relation = relationships[id]
  return relation?.kind === 'snapped' && relation.actorId === id ? relation.targetId : null
}

/** The burner (lit or not) under the holder a vessel sits on, or null. */
export function burnerUnder(vesselId: string, relationships: Relationships): string | null {
  const holder = snappedTo(vesselId, relationships)
  if (!holder || !HEAT_HOLDERS.has(instanceTypeId(holder))) return null
  for (const relation of Object.values(relationships))
    if (
      relation.kind === 'snapped' &&
      relation.targetId === holder &&
      relation.actorId !== vesselId &&
      isHeatSource(relation.actorId)
    )
      return relation.actorId
  return null
}

/** The vessel a burner heats right now (through its tripod), or null. */
export function vesselOver(
  burnerId: string,
  relationships: Relationships,
  vesselIds: readonly string[],
) {
  return vesselIds.find((id) => burnerUnder(id, relationships) === burnerId) ?? null
}

/** °C/s for a heated volume; the heat is spread over at least MIN_HEATED_ML. */
export function heatingRate(source: HeatSource, volumeMl: number) {
  return (
    (source.ratePer100Ml * 100) / Math.max(MIN_HEATED_ML, Number.isFinite(volumeMl) ? volumeMl : 0)
  )
}

/** Engine heating conditions for every bench vessel over a lit burner. */
export function heatingConditions(
  vesselIds: readonly string[],
  relationships: Relationships,
  lit: readonly string[],
  volumeOf: (id: string) => number,
): Record<string, number> {
  const rates: Record<string, number> = {}
  for (const id of vesselIds) {
    const burner = burnerUnder(id, relationships)
    const source = burner && lit.includes(burner) ? heatSourceOf(burner) : undefined
    if (source) rates[id] = heatingRate(source, volumeOf(id))
  }
  return rates
}

/** Holders (tripods) sitting over a lit burner: hot to touch while it burns. */
export function hotHolders(relationships: Relationships, lit: readonly string[]) {
  const hot = new Set<string>()
  for (const id of lit) {
    const holder = snappedTo(id, relationships)
    if (holder) hot.add(holder)
  }
  return hot
}

/**
 * Why an item is too hot to pick up, or null. Hot = a lit burner, a tripod over a lit burner,
 * or a vessel at HOT_TOUCH_C or above.
 */
export function hotTouchReason(
  id: string,
  relationships: Relationships,
  lit: readonly string[],
  temperatureOf: (id: string) => number | null,
): string | null {
  if (lit.includes(id)) return 'The burner is lit. Turn it off before moving it.'
  if (hotHolders(relationships, lit).has(id))
    return 'The tripod is over a lit flame and is very hot. Turn the burner off and let it cool.'
  const temperature = temperatureOf(id)
  if (temperature !== null && temperature >= HOT_TOUCH_C)
    return `The vessel is ${Math.round(temperature)} °C — too hot to hold. Let it cool below ${HOT_TOUCH_C} °C (or use tongs).`
  return null
}
