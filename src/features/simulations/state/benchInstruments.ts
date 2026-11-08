/**
 * L8: instrument readings for bench items, combining the bench layout (what sits on the balance
 * pan) with the bench liquids (L1 engine) and the log's tare values.
 */
import { readMassG } from '../engine/core/index.ts'
import type { SpatialRelationship } from '../engine/spatialInteractions.ts'
import { benchContainerType } from '../lib/benchLiquids.ts'
import { balanceReadingG, glassMassG } from '../lib/measurementLog.ts'
import { instanceTypeId, isExtraInstance } from '../three/sceneConfig.ts'
import type { useBenchLiquidsStore } from './useBenchLiquidsStore.ts'

type Bench = Pick<ReturnType<typeof useBenchLiquidsStore.getState>, 'definition' | 'lab'>
type Relationships = Readonly<Record<string, SpatialRelationship>>

export const isPracticeBalance = (id: string) =>
  instanceTypeId(id) === 'digital-balance' && isExtraInstance(id)
export const isThermometer = (id: string) => instanceTypeId(id) === 'thermometer'
export const isPhPaper = (id: string) => instanceTypeId(id) === 'ph-paper'
export const isInstrument = (id: string) =>
  isPracticeBalance(id) || isThermometer(id) || isPhPaper(id)

/** The item standing on a balance pan, or null. */
export function itemOnBalance(balanceId: string, relationships: Relationships) {
  for (const relation of Object.values(relationships))
    if (relation.kind === 'snapped' && relation.targetId === balanceId) return relation.actorId
  return null
}

/** Mass of an item on the pan: empty glassware estimate + its engine contents (g). */
export function itemMassG(id: string, bench: Bench) {
  const capacity = benchContainerType(instanceTypeId(id))?.capacityMl ?? 0
  const contents = bench.lab.containers[id] ? readMassG(bench.definition, bench.lab, id) : 0
  return glassMassG(capacity) + contents
}

export function balanceGrossG(balanceId: string, relationships: Relationships, bench: Bench) {
  const item = itemOnBalance(balanceId, relationships)
  return item ? itemMassG(item, bench) : 0
}

/** Displayed reading (g, 0.01 g) after the tare. */
export function balanceDisplayG(
  balanceId: string,
  relationships: Relationships,
  bench: Bench,
  tare: Readonly<Record<string, number>>,
) {
  return balanceReadingG(balanceGrossG(balanceId, relationships, bench), tare[balanceId] ?? 0)
}
