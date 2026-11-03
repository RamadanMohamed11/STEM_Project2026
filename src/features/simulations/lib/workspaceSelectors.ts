import { saltDissolutionWorkspace } from '../data/saltDissolutionWorkspace.ts'
import type { InventoryItem, LaboratoryPresentation } from '@/types/laboratory'

const demoPresentations: readonly LaboratoryPresentation[] = [saltDissolutionWorkspace]

export function getLaboratoryPresentation(experimentId: string) {
  return demoPresentations.find((item) => item.experimentId === experimentId)
}

export function findInventoryItem(items: readonly InventoryItem[], id: string | null) {
  return id ? items.find((item) => item.id === id) : undefined
}

export function clampGuideStage(index: number, count: number) {
  return Math.max(0, Math.min(Math.trunc(index), Math.max(0, count - 1)))
}

/** Reading progress, not a completion or performance score. */
export function guidePositionPercent(index: number, count: number) {
  return count > 0 ? Math.round(((clampGuideStage(index, count) + 1) / count) * 100) : 0
}
