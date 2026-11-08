import type { EquipmentVisual } from '@/types/laboratory'
import type { HazardId } from '../../safety/data/hazards'

export type ToolVisualKey = EquipmentVisual | 'weighing-boat'

export interface ExperimentToolItem {
  readonly id: string
  readonly name: string
  readonly visual: ToolVisualKey
  readonly shortExplanation: string
  readonly purpose: string
  readonly specification?: string
  readonly safetyNote?: string
}

export interface MaterialQuantity {
  readonly amount: number
  readonly unit: string
  readonly label: string
  readonly description?: string
}

export interface ExperimentMaterialItem {
  readonly hazards?: readonly HazardId[]
  readonly id: string
  readonly name: string
  readonly formula?: string
  readonly visual: EquipmentVisual
  readonly physicalAppearance: string
  readonly role: 'Solvent' | 'Solute' | 'Reagent' | 'Catalyst' | 'Indicator'
  readonly purpose: string
  readonly stockQuantity: MaterialQuantity
  readonly requiredQuantity: MaterialQuantity
  readonly safetyNotes: readonly string[]
  readonly isModelEstimated?: boolean
}

export interface ExperimentToolsAndMaterialsData {
  readonly experimentId: string
  readonly reviewStatus: 'draft' | 'reviewed'
  readonly tools: readonly ExperimentToolItem[]
  readonly materials: readonly ExperimentMaterialItem[]
  readonly measurementDisclaimer?: string
}
