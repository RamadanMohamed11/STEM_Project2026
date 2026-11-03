import type { SimulationEvent } from '../engine/simulationEvents'

/** Accepted scientific evidence labels; never a completion trigger. */
export const semanticEventLabels: Record<SimulationEvent['type'], string> = {
  SAFETY_ACKNOWLEDGED: 'Safety confirmed',
  EQUIPMENT_PLACEMENT_VALIDATED: 'Beaker position validated',
  LIQUID_TRANSFER_COMPLETED: 'Liquid transfer validated',
  SOLID_TRANSFER_COMPLETED: 'Solid transfer validated',
  MASS_MEASUREMENT_RECORDED: 'Balance mass validated',
  STIRRING_REQUIREMENT_COMPLETED: 'Stirring requirement met',
  OBSERVATION_RECORDED: 'Dissolution observed',
  REVIEW_INSPECTED: 'Scientific review completed',
}
