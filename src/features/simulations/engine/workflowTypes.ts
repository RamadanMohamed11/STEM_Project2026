import type { SaltExperimentState, SimulationCommand } from './types.ts'

export type WorkflowStageId = string
export type WorkflowStepId = string

export type WorkflowActionKind =
  | 'acknowledge-safety'
  | 'validate-step'
  | 'record-water-measurement'
  | 'record-salt-measurement'
  | 'record-observation'
  | 'finish-review'
  | 'command'

export type WorkflowAction =
  | { kind: 'acknowledge-safety' }
  | { kind: 'validate-step' }
  | { kind: 'record-water-measurement'; valueMl?: number }
  | { kind: 'record-salt-measurement'; selectedMassG: number }
  | { kind: 'record-observation'; observation: 'no-visible-solid' | 'visible-solid' }
  | { kind: 'finish-review' }
  | {
      kind: 'command'
      /** Original command, not an animation event. */
      command: SimulationCommand
      /** Snapshot before the command; the chemistry argument is its resulting state. */
      beforeChemistry: SaltExperimentState
    }

export type WorkflowSeverity = 'success' | 'info' | 'warning' | 'error'

export interface WorkflowValidation {
  valid: boolean
  code: string
  severity: WorkflowSeverity
  message: string
  stepId: WorkflowStepId
}

export interface WorkflowState {
  stepIndex: number
  stageIndex: number
  measurements: { waterMl: number | null; saltG: number | null }
  safetyAcknowledged: boolean
  observationRecorded: boolean
  reviewRecorded: boolean
  completed: boolean
  validation: WorkflowValidation
  /**
   * Accepted commands are tracked by step; clicking Next cannot substitute for
   * chemistry transitions. Operation count also detects replayed commands.
   */
  commandEvidence: Readonly<Record<WorkflowStepId, number>>
  /** Semantic event receipts; optional for legacy T08 snapshots. Prevents replay. */
  eventEvidence?: Readonly<Record<string, true>>
  /** Last authoritative chemistry snapshot accepted into this workflow. */
  chemistryCheckpoint: SaltExperimentState
}

export interface WorkflowTransition {
  state: WorkflowState
  validation: WorkflowValidation
}

export type WorkflowValueOperator = 'eq' | 'ne' | 'gte' | 'lte'
export type WorkflowPredicate =
  | { kind: 'safety'; code: string; message: string }
  | { kind: 'inventory'; ids: readonly string[]; code: string; message: string }
  | { kind: 'placed'; ids: readonly string[]; code: string; message: string }
  | {
      kind: 'chemistry'
      /** Dot-separated path into SaltExperimentState, or 'undissolvedSaltG'. */
      path: string
      operator: WorkflowValueOperator
      value: number
      code: string
      message: string
    }
  | {
      kind: 'measurement'
      field: 'waterMl' | 'saltG'
      operator: WorkflowValueOperator
      value: number
      code: string
      message: string
    }
  | { kind: 'observation'; code: string; message: string }
  | { kind: 'review'; code: string; message: string }
  | { kind: 'command-evidence'; minCount: number; code: string; message: string }

export type WorkflowCommandRule =
  | {
      kind: 'pour'
      source: 'water' | 'graduated-cylinder'
      target: 'graduated-cylinder' | 'beaker'
      amountMl: number
      requiredPlacedIds: readonly string[]
    }
  | {
      kind: 'scoop-salt'
      tool: 'spatula'
      source: 'sodium-chloride'
      massG: number
      requiredPlacedIds: readonly string[]
    }
  | {
      kind: 'deposit-salt'
      tool: 'spatula'
      target: 'weighing-boat'
      massG: number
      requiredPlacedIds: readonly string[]
    }
  | {
      kind: 'add-substance'
      source: 'sodium-chloride' | 'weighing-boat'
      target: 'beaker'
      massG: number | 'recorded-salt'
      requiredPlacedIds: readonly string[]
    }
  | {
      kind: 'stir'
      tool: 'stirring-rod'
      target: 'beaker'
      requiredPlacedIds: readonly string[]
    }

export interface WorkflowStepDefinition {
  id: WorkflowStepId
  stageId: WorkflowStageId
  title: string
  description: string
  legalActions: readonly WorkflowActionKind[]
  requirements: readonly WorkflowPredicate[]
  commands?: readonly WorkflowCommandRule[]
}

export interface ExperimentWorkflowDefinition {
  id: string
  experimentId: string
  version: string
  title: string
  description: string
  /** Engine adapter. Other experiments can supply a different adapter in future. */
  chemistryEngine: 'salt-dissolution'
  availableInventory: readonly string[]
  requiredEquipment: readonly string[]
  requiredMaterials: readonly string[]
  initialConditions: {
    chemistry: SaltExperimentState
    placedIds: readonly string[]
  }
  stages: readonly { id: WorkflowStageId; title: string }[]
  steps: readonly WorkflowStepDefinition[]
  measurementRequirements: {
    waterMl: { exact: number; method: 'derived-cylinder-volume' }
    saltG: { exact: number; method: 'modelled-tared-balance' | 'selected-mass-unverified' }
  }
  safetyRules: readonly { id: string; instruction: string; required: boolean }[]
  completion: readonly WorkflowPredicate[]
  resultExplanation: string
}
