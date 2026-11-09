/**
 * L1 generic chemistry engine — data model.
 * Pure TypeScript: no React, Three.js or store imports. Experiments are described as data
 * (substances, containers, processes, reactions) and run by `simulateTick` / `transferMaterial`.
 *
 * Units: liquids are tracked in millilitres (mL); solids, aqueous (dissolved) species and gases
 * in grams (g). Quantities are simplified teaching models, not calibrated measurements.
 */

export type PhysicalState = 'solid' | 'liquid' | 'aqueous' | 'gas'
export type QuantityUnit = 'g' | 'mL'

export interface SubstanceDefinition {
  id: string
  name: string
  formula: string
  state: PhysicalState
  /** CSS hex colour used to tint container contents (e.g. '#ffffff'). */
  color: string
  /** Opacity contribution 0–1 when blending container colour; clear liquids are low. */
  opacity?: number
  /** g/mL. Required for liquids (mass readings); optional otherwise. */
  densityGPerMl?: number
  /** g/mol. Required when `acidBase` is set (pH model). */
  molarMassGPerMol?: number
  /** °C. Liquids at or above this temperature can evaporate (see EvaporationProcess). */
  boilingPointC?: number
  /** Simple strong acid/base model for pH readings. */
  acidBase?: { type: 'acid' | 'base'; equivalentsPerMol: number }
  /** Hazard ids from the safety catalogue (e.g. 'corrosive', 'flammable'). */
  hazards?: readonly string[]
  /** L9: a concentrated reagent (e.g. conc. H₂SO₄): adding water to it is a safety mistake. */
  concentrated?: boolean
  /** L9: substances this must never be mixed with (safety rules raise an alert). */
  incompatibleWith?: readonly string[]
}

export interface ContentEntry {
  substanceId: string
  /** g for solid/aqueous/gas, mL for liquid. */
  amount: number
}

export interface ContainerDefinition {
  /** Engine id; usually equals the inventory/equipment id that represents it. */
  id: string
  label: string
  /** Inventory/equipment id rendered for this container. */
  equipmentId: string
  /** Liquid capacity in mL (`unit: 'mL'`) or holding capacity in g for solid tools (`'g'`). */
  capacity: { value: number; unit: QuantityUnit }
  /** Physical states this container may hold. */
  accepts: readonly PhysicalState[]
  /** Open containers let gases escape. */
  open: boolean
  initialContents?: readonly ContentEntry[]
  initialTemperatureC?: number
}

/** Solid → aqueous dissolution in a solvent, limited by solubility and a teaching rate. */
export interface DissolutionProcess {
  kind: 'dissolution'
  id: string
  soluteId: string
  solventId: string
  /** Aqueous species produced (keeps the solid and dissolved forms distinguishable). */
  dissolvedId: string
  /** g of solute per 100 mL solvent at 20 °C. */
  solubilityGPer100Ml: number
  /** Change in solubility per °C away from 20 °C (g/100 mL/°C). Default 0. */
  solubilityPerDegreeC?: number
  /** g/s while the container is stirred. */
  rateGPerSecondStirred: number
  /** g/s without stirring. Default 0 (dissolving requires stirring in this model). */
  rateGPerSecondUnstirred?: number
}

/** A liquid at or above its boiling point evaporates while heated. */
export interface EvaporationProcess {
  kind: 'evaporation'
  id: string
  substanceId: string
  /** mL/s while at boiling point and heated. */
  rateMlPerSecond: number
}

export type PhysicalProcess = DissolutionProcess | EvaporationProcess

export type EffectKind =
  'colorChange' | 'precipitate' | 'gas' | 'flame' | 'smoke' | 'heat' | 'explosion' | 'dissolve'

export interface ReactionConditions {
  minTemperatureC?: number
  maxTemperatureC?: number
  requiresStirring?: boolean
  requiresHeating?: boolean
  /** Substances that must be present but are not consumed. */
  catalystIds?: readonly string[]
}

/**
 * Stoichiometry is expressed per unit of "extent": one unit consumes each reactant `amount`
 * (in the substance's unit) and produces each product `amount`. Mass must be conserved.
 */
export interface ReactionRule {
  id: string
  label: string
  /** Display only, e.g. 'AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)'. */
  equation?: string
  reactants: readonly ContentEntry[]
  products: readonly ContentEntry[]
  /** Maximum extent units per second. */
  ratePerSecond: number
  conditions?: ReactionConditions
  /** °C rise per extent unit for 100 mL of liquid (negative = endothermic). */
  temperatureChangeCPer100Ml?: number
  effects: readonly EffectKind[]
  hazards?: readonly string[]
  observation: string
}

export interface ChemistryDefinition {
  schemaVersion: 1
  ambientTemperatureC: number
  /** Fraction of the gap to ambient closed per second when not heated (Newton cooling). */
  coolingPerSecond: number
  substances: readonly SubstanceDefinition[]
  containers: readonly ContainerDefinition[]
  processes: readonly PhysicalProcess[]
  reactions: readonly ReactionRule[]
}

export interface ContainerState {
  /** substanceId → amount (g or mL by substance state). Zero entries are removed. */
  contents: Readonly<Record<string, number>>
  temperatureC: number
}

export interface LabState {
  containers: Readonly<Record<string, ContainerState>>
  /** Simulated seconds since start. */
  timeS: number
}

/** External conditions for one tick (provided by the UI/interaction layer). */
export interface TickConditions {
  stirring?: readonly string[]
  /** containerId → °C per second of heating while the heat source is on. */
  heatingCPerSecond?: Readonly<Record<string, number>>
}

export type LabEvent =
  | {
      type: 'transferred'
      from: string
      to: string
      substanceId: string
      amount: number
      unit: QuantityUnit
    }
  | {
      type: 'overflow'
      containerId: string
      substanceId: string
      amount: number
      unit: QuantityUnit
    }
  | { type: 'dissolved'; containerId: string; processId: string; soluteId: string; amount: number }
  | { type: 'saturated'; containerId: string; processId: string; soluteId: string }
  | { type: 'evaporated'; containerId: string; substanceId: string; amount: number }
  | {
      type: 'reacted'
      containerId: string
      ruleId: string
      extent: number
      observation: string
    }
  | {
      type: 'effect'
      containerId: string
      effect: EffectKind
      /** 0–1 relative to the rule's maximum rate this tick. */
      intensity: number
      sourceId: string
    }
  | { type: 'gas-released'; containerId: string; substanceId: string; amount: number }
  | { type: 'hazard'; containerId: string; hazard: string; sourceId: string }

export type EngineErrorCode =
  | 'UNKNOWN_CONTAINER'
  | 'UNKNOWN_SUBSTANCE'
  | 'SAME_CONTAINER'
  | 'INVALID_AMOUNT'
  | 'INSUFFICIENT_AMOUNT'
  | 'NOT_ACCEPTED'
  | 'CAPACITY_EXCEEDED'
  | 'INVALID_TIME_STEP'

export type EngineResult =
  | { ok: true; state: LabState; events: LabEvent[] }
  | { ok: false; state: LabState; events: []; code: EngineErrorCode; message: string }
