/**
 * L9 safety rules engine — pure and data-driven (no React/Three/stores).
 * Lab actions are described as `SafetyAction`s; each `SafetyRule` is a declarative condition plus
 * the hazard (T41 catalogue), an explanation and an optional visual effect (L6). New experiments
 * add rules as data; no engine code changes.
 */
import type { EffectKind, PhysicalState } from '../engine/core/index.ts'
import type { HazardId } from '../../safety/data/hazards.ts'

/** What a container holds, as the rules see it. */
export interface SubstanceView {
  id: string
  state: PhysicalState
  hazards: readonly string[]
  concentrated: boolean
  incompatibleWith: readonly string[]
}

export type SafetyAction =
  | {
      type: 'pour'
      sourceId: string
      targetId: string
      source: readonly SubstanceView[]
      /** Contents of the receiver before the pour. */
      target: readonly SubstanceView[]
    }
  | { type: 'dip'; instrumentId: string; targetId: string; target: readonly SubstanceView[] }
  | {
      type: 'light'
      burnerId: string
      /** Vessel over the flame, if any. */
      vesselId: string | null
      vesselVolumeMl: number
      vesselOpen: boolean
    }
  | {
      type: 'heating'
      vesselId: string
      volumeMl: number
      /** Liquid before this heating step (boiling dry = it just ran out). */
      previousVolumeMl: number
      temperatureC: number
      open: boolean
    }

export interface SafetyContext {
  /** From the Safety page "Get Lab Ready" activity (or put on in the lab). */
  goggles: boolean
}

/** Declarative rule conditions (all given fields must hold). */
export type SafetyCondition =
  | {
      /** Water (or any liquid) poured INTO a concentrated reagent ("always add acid to water"). */
      kind: 'liquid-into-concentrated'
    }
  | {
      /** Handling a substance with this hazard without the PPE. */
      kind: 'hazard-without-ppe'
      hazard: string
      ppe: 'goggles'
      actions: readonly ('pour' | 'dip')[]
    }
  | { kind: 'flame-without-ppe'; ppe: 'goggles' }
  | { kind: 'incompatible-mix' }
  | { kind: 'heat-empty-vessel' }
  | { kind: 'heat-closed-vessel'; aboveC: number }
  | { kind: 'boil-dry' }

export interface SafetyRule {
  id: string
  title: string
  hazard: HazardId
  severity: 'warning' | 'danger'
  /** What went wrong and the correct practice (shown to the student). */
  explanation: string
  /** L6 effect played on the vessel when the rule fires. */
  effect?: EffectKind
  when: SafetyCondition
}

export interface SafetyViolation {
  ruleId: string
  title: string
  hazard: HazardId
  severity: 'warning' | 'danger'
  explanation: string
  effect?: EffectKind
  /** Bench item the violation concerns (the vessel, or the burner). */
  targetId: string
  /** De-duplication key: one record per rule and item. */
  key: string
}

const has = (list: readonly SubstanceView[], test: (s: SubstanceView) => boolean) => list.some(test)
const isLiquidLike = (s: SubstanceView) => s.state === 'liquid' || s.state === 'aqueous'

function holds(rule: SafetyRule, action: SafetyAction, context: SafetyContext): string | null {
  const c = rule.when
  switch (c.kind) {
    case 'liquid-into-concentrated':
      return action.type === 'pour' &&
        has(action.target, (s) => s.concentrated) &&
        has(action.source, (s) => isLiquidLike(s) && !s.concentrated)
        ? action.targetId
        : null
    case 'hazard-without-ppe': {
      if (context[c.ppe]) return null
      if (action.type === 'pour' && c.actions.includes('pour'))
        return has([...action.source, ...action.target], (s) => s.hazards.includes(c.hazard))
          ? action.targetId
          : null
      if (action.type === 'dip' && c.actions.includes('dip'))
        return has(action.target, (s) => s.hazards.includes(c.hazard)) ? action.targetId : null
      return null
    }
    case 'flame-without-ppe':
      return action.type === 'light' && !context[c.ppe] ? action.burnerId : null
    case 'incompatible-mix': {
      if (action.type !== 'pour') return null
      const clash = action.source.some((a) =>
        action.target.some(
          (b) => a.incompatibleWith.includes(b.id) || b.incompatibleWith.includes(a.id),
        ),
      )
      return clash ? action.targetId : null
    }
    case 'heat-empty-vessel':
      return action.type === 'light' && action.vesselId && action.vesselVolumeMl <= 1e-6
        ? action.vesselId
        : null
    case 'heat-closed-vessel':
      if (action.type === 'light' && action.vesselId && !action.vesselOpen) return action.vesselId
      return action.type === 'heating' && !action.open && action.temperatureC >= c.aboveC
        ? action.vesselId
        : null
    case 'boil-dry':
      return action.type === 'heating' && action.volumeMl <= 1e-6 && action.previousVolumeMl > 1e-6
        ? action.vesselId
        : null
  }
}

/** Every rule the action breaks, in rule order. */
export function evaluateSafety(
  rules: readonly SafetyRule[],
  action: SafetyAction,
  context: SafetyContext,
): SafetyViolation[] {
  const violations: SafetyViolation[] = []
  for (const rule of rules) {
    const targetId = holds(rule, action, context)
    if (!targetId) continue
    violations.push({
      ruleId: rule.id,
      title: rule.title,
      hazard: rule.hazard,
      severity: rule.severity,
      explanation: rule.explanation,
      effect: rule.effect,
      targetId,
      key: `${rule.id}:${targetId}`,
    })
  }
  return violations
}
