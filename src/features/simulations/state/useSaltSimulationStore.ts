import { create } from 'zustand'
import { saltExperimentDefinition } from '../data/saltExperimentDefinition.ts'
import { executeSaltCommand, initialSaltExperimentState } from '../engine/saltExperiment.ts'
import { initialWorkflowState, transitionWorkflow } from '../engine/workflow.ts'
import { applySimulationEvent, type SimulationEvent } from '../engine/simulationEvents.ts'
import type { WorkflowValidation, WorkflowAction, WorkflowState } from '../engine/workflowTypes.ts'
import type { SaltExperimentState, SimulationCommand, SimulationEffect } from '../engine/types.ts'
import { useLabSceneStore } from './useLabSceneStore.ts'

export type ManualWorkflowAction = Exclude<WorkflowAction, { kind: 'command' }>

interface SaltSimulationStore {
  activeExperimentId: string
  resetRevision: number
  experiment: SaltExperimentState
  workflow: WorkflowState
  validation: WorkflowValidation | null
  effect: SimulationEffect | null
  /** Real held tilt: visuals render only when this source is actively transferring. */
  livePour: { sourceId: string; targetId: string; angle: number } | null
  streamRemainderMl: number
  feedback: { ok: boolean; message: string } | null
  /** Accepted semantic evidence only; cleared by unified restart. */
  events: readonly SimulationEvent[]
  emit: (event: SimulationEvent) => boolean
  execute: (command: SimulationCommand) => boolean
  streamTick: (
    source: 'water' | 'graduated-cylinder',
    target: 'graduated-cylinder' | 'beaker',
    angle: number,
    deltaMs: number,
  ) => boolean
  stopStream: () => void
  dispatch: (action: ManualWorkflowAction) => boolean
  stopEffect: (id: number) => void
  reset: () => void
}

const initialSession = () => ({
  activeExperimentId: saltExperimentDefinition.experimentId,
  experiment: initialSaltExperimentState(),
  workflow: initialWorkflowState(saltExperimentDefinition),
  validation: null,
  effect: null,
  livePour: null,
  streamRemainderMl: 0,
  feedback: null,
  events: [] as readonly SimulationEvent[],
})

function busyFeedback(state: SaltSimulationStore): WorkflowValidation | null {
  const scene = useLabSceneStore.getState()
  if (!state.effect && !scene.draggingId && !scene.placement) return null
  return {
    valid: false,
    severity: 'warning',
    code: 'interaction-busy',
    stepId: saltExperimentDefinition.steps[state.workflow.stepIndex]?.id ?? 'review',
    message: 'Finish the active animation or equipment movement before performing the next step.',
  }
}

/**
 * Authoritative educational session. The high-frequency Three.js object transforms,
 * hover and drag data intentionally remain in useLabSceneStore instead.
 * The chemistry transition and workflow validation commit atomically.
 */
export const useSaltSimulationStore = create<SaltSimulationStore>((set, get) => ({
  ...initialSession(),
  resetRevision: 0,
  streamTick: (source, target, angle, deltaMs) => {
    const current = get()
    const stage = saltExperimentDefinition.steps[current.workflow.stepIndex]
    const rule = stage?.commands?.find((command) => command.kind === 'pour')
    const expected = rule?.kind === 'pour' && rule.source === source && rule.target === target
    if (
      !expected ||
      current.workflow.completed ||
      current.effect ||
      !Number.isFinite(deltaMs) ||
      deltaMs < 0 ||
      !Number.isFinite(angle) ||
      angle < 0.45 ||
      !useLabSceneStore.getState().placedIds.includes(source) ||
      !useLabSceneStore.getState().placedIds.includes(target)
    ) {
      if (current.livePour) set({ livePour: null, streamRemainderMl: 0 })
      return false
    }

    const samePair = current.livePour?.sourceId === source && current.livePour.targetId === target
    // A 45 mL/s idealized flow at maximum tilt. Quantities are integers to
    // preserve exact conservation and capacity in the pure reducer.
    const elapsed = Math.min(150, deltaMs)
    const speedFactor = Math.min(1, (angle - 0.45) / 0.25 + 0.35)
    const accumulated =
      (samePair ? current.streamRemainderMl : 0) + (45 * speedFactor * elapsed) / 1000
    const wholeMl = Math.floor(accumulated)
    const remainingTarget =
      rule.kind === 'pour' ? rule.amountMl - current.experiment.waterMl[target] : 0
    const sourceAvailable = current.experiment.waterMl[source]
    const amount = Math.max(0, Math.min(wholeMl, remainingTarget, sourceAvailable))
    const livePour = { sourceId: source, targetId: target, angle }
    if (amount === 0) {
      if (remainingTarget <= 0 || sourceAvailable <= 0) {
        set({ livePour: null, streamRemainderMl: 0 })
        return false
      }
      // Store changes when the pour first starts and when integral flow changes;
      // visual easing uses mutable frame state and does not require a rerender.
      if (!samePair || Math.abs(current.streamRemainderMl - accumulated) > 0.001)
        set({ livePour, streamRemainderMl: accumulated })
      return true
    }
    const command: SimulationCommand = { kind: 'pour', source, target, amountMl: amount }
    const placedIds = useLabSceneStore.getState().placedIds
    const result = executeSaltCommand(current.experiment, command, placedIds)
    if (!result.ok) {
      set({ livePour: null, streamRemainderMl: 0 })
      return false
    }
    const validated = transitionWorkflow(
      saltExperimentDefinition,
      current.workflow,
      result.state,
      placedIds,
      { kind: 'command', command, beforeChemistry: current.experiment },
    )
    if (!validated.validation.valid) {
      set({ livePour: null, streamRemainderMl: 0, validation: validated.validation })
      return false
    }
    set({
      experiment: result.state,
      workflow: validated.state,
      livePour: amount >= remainingTarget ? null : livePour,
      streamRemainderMl: amount >= remainingTarget ? 0 : accumulated - amount,
      validation: validated.validation,
      feedback: null,
    })
    if (
      amount > 0 &&
      sourceAvailable > 0 &&
      rule?.kind === 'pour' &&
      result.state.waterMl[target] === rule.amountMl &&
      current.experiment.waterMl[target] < rule.amountMl
    ) {
      get().emit({
        type: 'LIQUID_TRANSFER_COMPLETED',
        sourceId: source,
        targetId: target,
        quantity: { value: rule.amountMl, unit: 'mL' },
        totalVolumeMl: result.state.waterMl[target],
      })
    }
    return true
  },
  stopStream: () =>
    set((state) =>
      state.livePour || state.streamRemainderMl ? { livePour: null, streamRemainderMl: 0 } : state,
    ),
  execute: (command) => {
    const current = get()
    const busy = busyFeedback(current)
    if (busy) {
      set({ validation: busy, feedback: { ok: false, message: busy.message } })
      return false
    }
    const placedIds = useLabSceneStore.getState().placedIds
    const result = executeSaltCommand(current.experiment, command, placedIds)
    if (!result.ok) {
      const validation: WorkflowValidation = {
        valid: false,
        code: 'invalid-scientific-operation',
        severity: 'warning',
        stepId: saltExperimentDefinition.steps[current.workflow.stepIndex]?.id ?? 'review',
        message: result.message,
      }
      set({ validation, feedback: { ok: false, message: result.message } })
      return false
    }
    const workflowResult = transitionWorkflow(
      saltExperimentDefinition,
      current.workflow,
      result.state,
      placedIds,
      { kind: 'command', command, beforeChemistry: current.experiment },
    )
    if (!workflowResult.validation.valid) {
      set({
        validation: workflowResult.validation,
        feedback: { ok: false, message: workflowResult.validation.message },
      })
      return false
    }
    set({
      experiment: result.state,
      workflow: workflowResult.state,
      validation: workflowResult.validation,
      feedback: { ok: true, message: workflowResult.validation.message },
      effect: result.effect
        ? { ...result.effect, id: current.experiment.operations + 1, startedAt: performance.now() }
        : null,
    })
    if (command.kind === 'scoop-salt' || command.kind === 'deposit-salt') {
      get().emit({
        type: 'SOLID_TRANSFER_COMPLETED',
        sourceId: command.kind === 'scoop-salt' ? command.source : command.tool,
        targetId: command.kind === 'scoop-salt' ? command.tool : command.target,
        substance: 'NaCl',
        quantity: { value: command.massG, unit: 'g' },
      })
    }
    if (
      command.kind === 'add-substance' &&
      result.state.saltInBeakerG === saltExperimentDefinition.measurementRequirements.saltG.exact
    ) {
      get().emit({
        type: 'SOLID_TRANSFER_COMPLETED',
        sourceId: command.source,
        targetId: command.target,
        substance: 'NaCl',
        quantity: { value: command.massG, unit: 'g' },
      })
    }
    if (
      command.kind === 'stir' &&
      result.state.saltInBeakerG > 0 &&
      result.state.saltInBeakerG - result.state.dissolvedSaltG <= 0.0001
    ) {
      const accepted = get().emit({
        type: 'STIRRING_REQUIREMENT_COMPLETED',
        toolId: command.tool,
        targetId: command.target,
        quantity: { value: result.state.dissolvedSaltG, unit: 'g' },
        cycles: result.state.stirCount,
      })
      if (accepted) {
        get().emit({ type: 'OBSERVATION_RECORDED', observation: 'no-visible-solid' })
      }
    }
    return true
  },
  emit: (event) => {
    const current = get()
    // Never trust an externally supplied semantic payload: the pure state
    // machine compares it with placed apparatus and authoritative chemistry.
    // In particular, simulated weighing requires an actual spatial contact.
    if (
      event.type === 'MASS_MEASUREMENT_RECORDED' &&
      useLabSceneStore.getState().relationships['weighing-boat']?.targetId !== 'digital-balance'
    ) {
      const validation: WorkflowValidation = {
        valid: false,
        code: 'BOAT_NOT_ON_BALANCE',
        severity: 'warning',
        stepId: saltExperimentDefinition.steps[current.workflow.stepIndex]?.id ?? 'review',
        message: 'Place the loaded weighing boat on the balance before measuring.',
      }
      set({ validation, feedback: { ok: false, message: validation.message } })
      return false
    }
    const result = applySimulationEvent(
      saltExperimentDefinition,
      current.workflow,
      current.experiment,
      useLabSceneStore.getState().placedIds,
      event,
    )
    if (!result.validation.valid) {
      set({
        validation: result.validation,
        feedback: { ok: false, message: result.validation.message },
      })
      return false
    }
    set({
      workflow: result.state,
      events: [...current.events, event],
      validation: result.validation,
      feedback: { ok: true, message: result.validation.message },
    })
    return true
  },
  dispatch: (action) => {
    const current = get()
    if (
      action.kind === 'record-salt-measurement' &&
      useLabSceneStore.getState().relationships['weighing-boat']?.targetId !== 'digital-balance'
    ) {
      const stepId = saltExperimentDefinition.steps[current.workflow.stepIndex]?.id ?? 'review'
      const warning = {
        valid: false,
        severity: 'warning' as const,
        code: 'BOAT_NOT_ON_BALANCE',
        stepId,
        message:
          'Place the loaded weighing boat on the simulated balance before recording the mass.',
      }
      set({ validation: warning, feedback: { ok: false, message: warning.message } })
      return false
    }
    const busy = busyFeedback(current)
    if (busy) {
      set({ validation: busy, feedback: { ok: false, message: busy.message } })
      return false
    }
    const result = transitionWorkflow(
      saltExperimentDefinition,
      current.workflow,
      current.experiment,
      useLabSceneStore.getState().placedIds,
      action,
    )
    set({
      workflow: result.state,
      validation: result.validation,
      feedback: { ok: result.validation.valid, message: result.validation.message },
    })
    return result.validation.valid
  },
  stopEffect: (id) => set((state) => (state.effect?.id === id ? { effect: null } : state)),
  reset: () =>
    set((current) => ({ ...initialSession(), resetRevision: current.resetRevision + 1 })),
}))
