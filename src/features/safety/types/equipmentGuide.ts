export type EquipmentCategory = 'all' | 'glassware' | 'measurement' | 'handling' | 'storage'

export type EquipmentGuideVisualKey =
  | 'beaker'
  | 'test-tube'
  | 'graduated-cylinder'
  | 'stirring-rod'
  | 'digital-balance'
  | 'spatula'
  | 'dropper-pipette'
  | 'chemical-container'

export interface EquipmentGuideItem {
  id: string
  name: string
  category: Exclude<EquipmentCategory, 'all'>
  categoryLabel: string
  shortPurpose: string
  description: string
  intendedUse: readonly string[]
  safetyNotes: readonly string[]
  commonMistakes: readonly string[]
  materialType: string
  visualKey: EquipmentGuideVisualKey
}
