/**
 * L6 reaction visual effects — pure model (no React/Three).
 * Engine `effect` events (from `simulateTick`) become active effects per container + kind.
 * Each effect eases in while events keep arriving and fades out after they stop; an explosion
 * is a one-shot burst. Nothing here knows about a specific experiment.
 */
import type {
  ChemistryDefinition,
  EffectKind,
  LabEvent,
  PhysicalState,
} from '../engine/core/index.ts'

export const EFFECT_KINDS: readonly EffectKind[] = [
  'colorChange',
  'precipitate',
  'gas',
  'flame',
  'smoke',
  'heat',
  'explosion',
  'dissolve',
]

export interface ActiveEffect {
  key: string
  containerId: string
  kind: EffectKind
  /** Displayed strength 0–1 (eases towards `target`). */
  intensity: number
  /** Latest event intensity; drops to 0 once events stop for `HOLD_S`. */
  target: number
  /** CSS hex colour for the effect (product colour, or the kind's default). */
  color: string
  startedS: number
  lastEventS: number
  /** Explosions: increments for each new burst. */
  burst: number
}

export interface EffectsState {
  timeS: number
  effects: Readonly<Record<string, ActiveEffect>>
}

/** Seconds an effect stays at its target after the last event (events arrive every tick). */
export const HOLD_S = 0.6
/** How fast the displayed intensity eases in / out (per second). */
const RISE_PER_S = 4
/** Fade-out time constant per kind: settled solids and smoke linger, flames vanish fast. */
export const FADE_PER_S: Readonly<Record<EffectKind, number>> = {
  colorChange: 1.2,
  precipitate: 0.15,
  gas: 2,
  flame: 3,
  smoke: 0.5,
  heat: 0.4,
  explosion: 1,
  dissolve: 1.5,
}
/** Explosion burst length (s); a new burst needs this much quiet first. */
export const EXPLOSION_S = 1.4
const VISIBLE_EPSILON = 0.01

export const DEFAULT_EFFECT_COLORS: Readonly<Record<EffectKind, string>> = {
  colorChange: '#7aa7ff',
  precipitate: '#f2f2ee',
  gas: '#eef6f8',
  flame: '#ff9a2e',
  smoke: '#d9dcdf',
  heat: '#ff6a2a',
  explosion: '#fff2b0',
  dissolve: '#cfe7f2',
}

/** Which product state gives each effect its colour. */
const COLOR_FROM_STATE: Readonly<Record<EffectKind, readonly PhysicalState[]>> = {
  colorChange: ['aqueous', 'liquid'],
  precipitate: ['solid'],
  gas: ['gas'],
  flame: ['gas'],
  smoke: ['solid'],
  heat: [],
  explosion: [],
  dissolve: ['aqueous'],
}

export const effectKey = (containerId: string, kind: EffectKind) => `${containerId}::${kind}`

export const emptyEffects = (): EffectsState => ({ timeS: 0, effects: {} })

/** Colour for an effect from the source rule's products (or a dissolution's dissolved species). */
export function effectColor(
  definition: ChemistryDefinition | undefined,
  kind: EffectKind,
  sourceId: string,
) {
  const states = COLOR_FROM_STATE[kind]
  if (definition && states.length) {
    const rule = definition.reactions.find((reaction) => reaction.id === sourceId)
    const process = definition.processes.find((entry) => entry.id === sourceId)
    const candidates = rule
      ? rule.products.map((product) => product.substanceId)
      : process?.kind === 'dissolution'
        ? [process.dissolvedId]
        : []
    for (const state of states)
      for (const id of candidates) {
        const substance = definition.substances.find((entry) => entry.id === id)
        // Colourless gases/solutions fall back to the effect's default look.
        if (substance?.state === state && !isNearlyWhite(substance.color, kind))
          return substance.color
      }
  }
  return DEFAULT_EFFECT_COLORS[kind]
}

function isNearlyWhite(color: string, kind: EffectKind) {
  // A white precipitate or smoke is meaningful; a "white" (clear) solution or gas is not.
  if (kind === 'precipitate' || kind === 'smoke') return false
  const rgb = parseHex(color)
  return !rgb || Math.min(...rgb) > 225
}

/** Adds the `effect` events of one engine tick. Other event types are ignored. */
export function ingestEffectEvents(
  state: EffectsState,
  events: readonly LabEvent[],
  definition?: ChemistryDefinition,
): EffectsState {
  let effects: Record<string, ActiveEffect> | null = null
  for (const raw of events) {
    // L7: a boiling liquid (engine 'evaporated' event) shows rising bubbles and steam.
    const event: LabEvent =
      raw.type === 'evaporated'
        ? {
            type: 'effect',
            containerId: raw.containerId,
            effect: 'gas',
            intensity: 1,
            sourceId: 'boiling',
          }
        : raw
    if (event.type !== 'effect') continue
    effects ??= { ...state.effects }
    const key = effectKey(event.containerId, event.effect)
    const intensity = Math.max(
      0,
      Math.min(1, Number.isFinite(event.intensity) ? event.intensity : 0),
    )
    const existing = effects[key]
    if (event.effect === 'explosion') {
      // One burst per reaction: events inside a running burst do not restart it.
      const running = existing && state.timeS - existing.startedS < EXPLOSION_S
      effects[key] = running
        ? { ...existing, lastEventS: state.timeS }
        : {
            key,
            containerId: event.containerId,
            kind: 'explosion',
            intensity: 1,
            target: 1,
            color: effectColor(definition, 'explosion', event.sourceId),
            startedS: state.timeS,
            lastEventS: state.timeS,
            burst: (existing?.burst ?? 0) + 1,
          }
      continue
    }
    effects[key] = existing
      ? {
          ...existing,
          target: Math.max(intensity, existing.lastEventS === state.timeS ? existing.target : 0),
          lastEventS: state.timeS,
        }
      : {
          key,
          containerId: event.containerId,
          kind: event.effect,
          intensity: 0,
          target: intensity,
          color: effectColor(definition, event.effect, event.sourceId),
          startedS: state.timeS,
          lastEventS: state.timeS,
          burst: 0,
        }
  }
  return effects ? { ...state, effects } : state
}

/** Advances effect intensities by `dtS`; finished effects are removed. */
export function advanceEffects(state: EffectsState, dtS: number): EffectsState {
  const dt = Number.isFinite(dtS) ? Math.max(0, Math.min(0.25, dtS)) : 0
  if (dt === 0) return state
  const timeS = state.timeS + dt
  const effects: Record<string, ActiveEffect> = {}
  for (const effect of Object.values(state.effects)) {
    if (effect.kind === 'explosion') {
      const age = timeS - effect.startedS
      if (age < EXPLOSION_S) effects[effect.key] = { ...effect, intensity: 1 - age / EXPLOSION_S }
      continue
    }
    const target = timeS - effect.lastEventS > HOLD_S ? 0 : effect.target
    const rate = target > effect.intensity ? RISE_PER_S : FADE_PER_S[effect.kind]
    const intensity = effect.intensity + (target - effect.intensity) * (1 - Math.exp(-rate * dt))
    if (target === 0 && intensity < VISIBLE_EPSILON) continue
    effects[effect.key] = { ...effect, target, intensity }
  }
  return { timeS, effects }
}

/** Effects currently shown for one container. */
export function effectsFor(state: EffectsState, containerId: string) {
  return Object.values(state.effects).filter((effect) => effect.containerId === containerId)
}

// ---------------------------------------------------------------------------
// Colour helpers (smooth colour transitions)
// ---------------------------------------------------------------------------

export function parseHex(color: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(color.trim())
  if (!match) return null
  const hex =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((c) => c + c)
          .join('')
      : match[1]
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

const toHex = (rgb: readonly number[]) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`

/** Linear RGB mix of two hex colours, t in 0–1. */
export function mixHex(from: string, to: string, t: number) {
  const a = parseHex(from)
  const b = parseHex(to)
  if (!a || !b) return to
  const k = Math.max(0, Math.min(1, t))
  return toHex(a.map((v, i) => v + (b[i] - v) * k))
}

/** Seconds a colour change takes to look complete (~95 %). */
export const COLOR_TRANSITION_S = 1.5

/** One frame of an eased colour transition (exponential approach, frame-rate independent). */
export function approachColor(current: string, target: string, dtS: number) {
  const a = parseHex(current)
  const b = parseHex(target)
  if (!a || !b) return target
  const t = 1 - Math.exp((-3 * Math.max(0, dtS)) / COLOR_TRANSITION_S)
  // Each channel moves at least one step, so 8-bit rounding never stalls short of the target.
  return toHex(
    a.map((v, i) => {
      const next = Math.round(v + (b[i] - v) * t)
      return next === v && v !== b[i] ? v + Math.sign(b[i] - v) : next
    }),
  )
}

// ---------------------------------------------------------------------------
// Motion budget
// ---------------------------------------------------------------------------

export interface EffectMotion {
  /** Multiplier for particle counts. */
  particles: number
  /** Camera shake allowed for explosions. */
  shake: boolean
  /** Flash brightness multiplier. */
  flash: number
}

/** Reduced motion: fewer particles, no camera shake, a softer flash. */
export function effectMotion(reducedMotion: boolean): EffectMotion {
  return reducedMotion
    ? { particles: 0.35, shake: false, flash: 0.4 }
    : { particles: 1, shake: true, flash: 1 }
}

/** Upper bound of particle instances per effect kind (performance budget). */
export const PARTICLE_BUDGET: Readonly<Record<EffectKind, number>> = {
  colorChange: 24,
  precipitate: 70,
  gas: 48,
  flame: 0,
  smoke: 26,
  heat: 10,
  explosion: 60,
  dissolve: 30,
}

/** Visible particle count for an effect at an intensity, never above the budget. */
export function particleCount(kind: EffectKind, intensity: number, motion: EffectMotion) {
  const budget = PARTICLE_BUDGET[kind]
  const k = Math.max(0, Math.min(1, intensity))
  return Math.min(
    budget,
    Math.round(budget * motion.particles * (0.25 + 0.75 * k) * (k > 0 ? 1 : 0)),
  )
}
