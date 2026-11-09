/**
 * L9: guided / free mode, mistakes and safety alerts for the lab session.
 * - Safety: lab actions are checked against the data-driven rules (`LAB_SAFETY_RULES`); a broken
 *   rule raises an alert (T41 hazard text), plays its L6 effect and is recorded once per item.
 * - Guided steps: rejected workflow actions (with their explanations) are recorded as mistakes.
 * The completion summary and the results page list the recorded mistakes.
 */
import { create } from 'zustand'
import { LAB_SAFETY_RULES } from '../data/safetyRules.ts'
import {
  evaluateSafety,
  type SafetyAction,
  type SafetyRule,
  type SafetyViolation,
} from '../lib/safetyRules.ts'
import { useLabReadinessStore } from '../../safety/state/useLabReadinessStore.ts'
import { useReactionEffectsStore } from './useReactionEffectsStore.ts'
import type { HazardId } from '../../safety/data/hazards.ts'

export type LabMode = 'guided' | 'free'

export interface LabMistake {
  id: string
  kind: 'safety' | 'step'
  key: string
  title: string
  explanation: string
  severity: 'warning' | 'danger' | 'error'
  hazard?: HazardId
  targetId?: string
  ruleId?: string
  /** Number of times it happened (repeats are counted, not listed again). */
  count: number
}

export interface SafetyAlert {
  mistake: LabMistake
  /** The alert offers "Put on goggles" when the rule is about goggles. */
  needsGoggles: boolean
  seq: number
}

interface LabSafetyState {
  mode: LabMode
  experimentId: string | null
  mistakes: readonly LabMistake[]
  alert: SafetyAlert | null
  setMode: (mode: LabMode) => void
  /** Starts (or keeps) the record for an experiment session. */
  begin: (experimentId: string) => void
  /** Checks a lab action against the safety rules; returns the violations raised. */
  report: (action: SafetyAction, rules?: readonly SafetyRule[]) => SafetyViolation[]
  /** A rejected guided step (the workflow's own explanation). */
  recordStepMistake: (entry: { code: string; stepId: string; message: string }) => void
  /** A hot item the student tried to handle (L7). */
  recordHotTouch: (itemId: string, message: string) => void
  dismissAlert: () => void
  clear: () => void
}

const GOGGLE_RULES = new Set(['corrosive-without-goggles', 'flame-without-goggles'])

function upsert(
  mistakes: readonly LabMistake[],
  entry: Omit<LabMistake, 'id' | 'count'>,
): { mistakes: LabMistake[]; mistake: LabMistake; isNew: boolean } {
  const existing = mistakes.find((m) => m.key === entry.key)
  if (existing) {
    const mistake = { ...existing, count: existing.count + 1 }
    return {
      mistakes: mistakes.map((m) => (m.key === entry.key ? mistake : m)),
      mistake,
      isNew: false,
    }
  }
  const mistake: LabMistake = { ...entry, id: `x${mistakes.length + 1}`, count: 1 }
  return { mistakes: [...mistakes, mistake], mistake, isNew: true }
}

export const useLabSafetyStore = create<LabSafetyState>()((set, get) => ({
  mode: 'guided',
  experimentId: null,
  mistakes: [],
  alert: null,

  setMode: (mode) => set({ mode }),

  begin: (experimentId) => {
    if (get().experimentId === experimentId) return
    set({ experimentId, mistakes: [], alert: null })
  },

  report: (action, rules = LAB_SAFETY_RULES) => {
    const violations = evaluateSafety(rules, action, {
      goggles: useLabReadinessStore.getState().goggles,
    })
    if (!violations.length) return violations
    let { mistakes } = get()
    let alert = get().alert
    for (const violation of violations) {
      const result = upsert(mistakes, {
        kind: 'safety',
        key: violation.key,
        title: violation.title,
        explanation: violation.explanation,
        severity: violation.severity,
        hazard: violation.hazard,
        targetId: violation.targetId,
        ruleId: violation.ruleId,
      })
      mistakes = result.mistakes
      // Continuous checks (heating) only alert the first time; actions alert every time.
      if (result.isNew || action.type !== 'heating')
        alert = {
          mistake: result.mistake,
          needsGoggles: GOGGLE_RULES.has(violation.ruleId),
          seq: (alert?.seq ?? 0) + 1,
        }
      if (violation.effect && (result.isNew || action.type !== 'heating'))
        useReactionEffectsStore.getState().ingest([
          {
            type: 'effect',
            containerId: violation.targetId,
            effect: violation.effect,
            intensity: 1,
            sourceId: violation.ruleId,
          },
        ])
    }
    set({ mistakes, alert })
    return violations
  },

  recordStepMistake: ({ code, stepId, message }) => {
    if (get().mode !== 'guided') return
    const { mistakes } = upsert(get().mistakes, {
      kind: 'step',
      key: `step:${stepId}:${code}`,
      title: 'Step not accepted',
      explanation: message,
      severity: 'error',
    })
    set({ mistakes })
  },

  recordHotTouch: (itemId, message) => {
    const { mistakes } = upsert(get().mistakes, {
      kind: 'safety',
      key: `hot-touch:${itemId}`,
      title: 'Tried to handle a hot item',
      explanation: message,
      severity: 'warning',
      hazard: 'hot-surface',
      targetId: itemId,
      ruleId: 'hot-touch',
    })
    set({ mistakes })
  },

  dismissAlert: () => set({ alert: null }),
  clear: () => set({ mistakes: [], alert: null }),
}))
