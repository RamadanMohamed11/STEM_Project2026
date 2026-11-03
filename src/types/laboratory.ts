import type { Experiment, SafetyMetadata } from '@/types/experiment'

export type InventoryCategory = 'equipment' | 'materials'
export type EquipmentVisual =
  | 'beaker'
  | 'graduated-cylinder'
  | 'stirring-rod'
  | 'digital-balance'
  | 'water'
  | 'sodium-chloride'
  | 'spatula'
  | 'weighing-boat'

export interface InventoryItem {
  id: string
  title: string
  category: InventoryCategory
  description: string
  visual: EquipmentVisual
  detail?: string
}

export type GuideStageKind =
  'equipment' | 'materials' | 'procedure' | 'measurements' | 'observations'

export interface ExperimentGuideStage {
  id: string
  kind: GuideStageKind
  title: string
  introduction: string
  steps: readonly string[]
  note: string
}

/** Instructional UI content; the underlying experiment data stays in the catalog domain. */
export interface LaboratoryPresentation {
  experimentId: Experiment['id']
  inventory: readonly InventoryItem[]
  stages: readonly ExperimentGuideStage[]
  safety?: SafetyMetadata
  assistantNote: string
}
