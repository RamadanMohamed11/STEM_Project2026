export type LiquidContainerId = 'water' | 'graduated-cylinder' | 'beaker'
export type TransferDestination = 'graduated-cylinder' | 'beaker'
export type SimulationActionKind =
  | 'select'
  | 'pick-up'
  | 'place'
  | 'rotate'
  | 'pour'
  | 'scoop-salt'
  | 'deposit-salt'
  | 'add-substance'
  | 'stir'
  | 'measure'
  | 'inspect'

export interface SaltExperimentState {
  /** Water in each vessel; millilitres. No random or sensor-derived quantities. */
  waterMl: Record<LiquidContainerId, number>
  /** Mass remaining in the salt source jar; grams. */
  saltStockG: number
  /** Salt physically carried on the procedural spatula or weighing boat. */
  saltOnSpatulaG: number
  saltOnBoatG: number
  /** Mass of all salt transferred into the beaker, including dissolved salt. */
  saltInBeakerG: number
  dissolvedSaltG: number
  operations: number
  stirCount: number
}

export type SimulationCommand =
  | { kind: 'pour'; source: LiquidContainerId; target: TransferDestination; amountMl: number }
  | { kind: 'scoop-salt'; tool: 'spatula'; source: 'sodium-chloride'; massG: number }
  | { kind: 'deposit-salt'; tool: 'spatula'; target: 'weighing-boat'; massG: number }
  | {
      kind: 'add-substance'
      source: 'sodium-chloride' | 'weighing-boat'
      target: 'beaker'
      massG: number
    }
  | { kind: 'stir'; tool: 'stirring-rod'; target: 'beaker' }

export type SimulationEffectKind = 'liquid-transfer' | 'salt-addition' | 'stirring'

export interface SimulationEffect {
  id: number
  kind: SimulationEffectKind
  sourceId: string
  targetId: string
  amount?: number
  startedAt: number
  durationMs: number
}

export interface TransitionResult {
  ok: boolean
  state: SaltExperimentState
  message: string
  effect?: Omit<SimulationEffect, 'id' | 'startedAt'>
}
