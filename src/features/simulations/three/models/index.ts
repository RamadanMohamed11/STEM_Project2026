import { createElement } from 'react'
import type { EquipmentVisual } from '@/types/laboratory'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { Beaker } from './Beaker'
import { DigitalBalance } from './DigitalBalance'
import { GraduatedCylinder } from './GraduatedCylinder'
import { SodiumChlorideContainer } from './SodiumChlorideContainer'
import { StirringRod } from './StirringRod'
import { Spatula } from './Spatula'
import { WeighingBoat } from './WeighingBoat'
import { WaterContainer } from './WaterContainer'
import { LibraryModel } from './library/LibraryModel'

export {
  Beaker,
  DigitalBalance,
  GraduatedCylinder,
  SodiumChlorideContainer,
  StirringRod,
  Spatula,
  WeighingBoat,
  WaterContainer,
}

export interface EquipmentModelProps {
  visual: EquipmentVisual | 'spatula' | 'weighing-boat' | 'library'
  /** L4: library model id when visual is 'library'. */
  modelId?: string
  /** L5: practice liquid volume / colour for library vessels. */
  liquidMl?: number
  liquidColor?: string
  selected: boolean
  waterMl?: number
  remainingSaltG?: number
  pouring?: boolean
  saltOnSpatulaG?: number
  saltOnBoatG?: number
}

/** Coordinates and interactions are controlled by the scene parent. */
export function EquipmentModel({
  visual,
  modelId,
  liquidMl,
  liquidColor,
  selected,
  waterMl,
  remainingSaltG,
  pouring,
  saltOnSpatulaG,
  saltOnBoatG,
}: EquipmentModelProps) {
  // Optional props support the renderer bridge; live store values keep these tools in sync.
  const spatulaMass = useSaltSimulationStore((state) => state.experiment.saltOnSpatulaG)
  const boatMass = useSaltSimulationStore((state) => state.experiment.saltOnBoatG)
  const liveWaterPour = useSaltSimulationStore((state) => state.livePour?.sourceId === 'water')
  switch (visual) {
    case 'spatula':
      return createElement(Spatula, { selected, saltG: saltOnSpatulaG ?? spatulaMass })
    case 'weighing-boat':
      return createElement(WeighingBoat, { selected, saltG: saltOnBoatG ?? boatMass })
    case 'beaker':
      return createElement(Beaker, { selected, waterMl })
    case 'graduated-cylinder':
      return createElement(GraduatedCylinder, { selected, waterMl })
    case 'stirring-rod':
      return createElement(StirringRod, { selected })
    case 'digital-balance':
      return createElement(DigitalBalance, { selected })
    case 'water':
      return createElement(WaterContainer, { selected, waterMl, pouring: pouring || liveWaterPour })
    case 'sodium-chloride':
      return createElement(SodiumChlorideContainer, { selected, remainingSaltG })
    case 'library':
      return modelId
        ? createElement(LibraryModel, {
            id: modelId,
            selected,
            volumeMl: liquidMl,
            liquidColor,
          })
        : null
  }
}
