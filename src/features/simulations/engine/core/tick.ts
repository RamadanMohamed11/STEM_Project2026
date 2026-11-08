import {
  AMOUNT_EPSILON,
  amountOf,
  getSubstance,
  readVolumeMl,
  withContents,
  withTemperature,
} from './state.ts'
import type {
  ChemistryDefinition,
  DissolutionProcess,
  EngineResult,
  EvaporationProcess,
  LabEvent,
  LabState,
  ReactionRule,
  TickConditions,
} from './types.ts'

/** Longest single step; callers split longer intervals for stable results. */
export const MAX_TICK_SECONDS = 60

/** Solubility (g/100 mL) at a temperature; never negative. */
export function solubilityAt(process: DissolutionProcess, temperatureC: number) {
  return Math.max(
    0,
    process.solubilityGPer100Ml + (process.solubilityPerDegreeC ?? 0) * (temperatureC - 20),
  )
}

/** Maximum dissolved mass (g) the container's solvent can hold for this process. */
export function saturationLimitG(
  process: DissolutionProcess,
  state: LabState,
  containerId: string,
) {
  const solventMl = amountOf(state, containerId, process.solventId)
  const temperature = state.containers[containerId]?.temperatureC ?? 20
  return (solventMl * solubilityAt(process, temperature)) / 100
}

function lowestBoilingPointPresent(
  definition: ChemistryDefinition,
  state: LabState,
  containerId: string,
) {
  let lowest = Infinity
  for (const substanceId of Object.keys(state.containers[containerId].contents)) {
    const substance = getSubstance(definition, substanceId)
    if (substance?.state === 'liquid' && substance.boilingPointC !== undefined)
      lowest = Math.min(lowest, substance.boilingPointC)
  }
  return lowest
}

function updateTemperatures(
  definition: ChemistryDefinition,
  state: LabState,
  dt: number,
  conditions: TickConditions,
) {
  let next = state
  for (const container of definition.containers) {
    const current = next.containers[container.id]
    const heating = conditions.heatingCPerSecond?.[container.id] ?? 0
    let temperature =
      heating > 0
        ? current.temperatureC + heating * dt
        : current.temperatureC +
          (definition.ambientTemperatureC - current.temperatureC) *
            Math.min(1, definition.coolingPerSecond * dt)
    // A boiling liquid holds the temperature at its boiling point.
    temperature = Math.min(temperature, lowestBoilingPointPresent(definition, next, container.id))
    if (temperature !== current.temperatureC)
      next = withTemperature(next, container.id, temperature)
  }
  return next
}

function applyDissolution(
  state: LabState,
  process: DissolutionProcess,
  dt: number,
  conditions: TickConditions,
  containerIds: readonly string[],
  events: LabEvent[],
) {
  let next = state
  for (const containerId of containerIds) {
    const solvent = amountOf(next, containerId, process.solventId)
    if (solvent <= 0) continue
    const solid = amountOf(next, containerId, process.soluteId)
    const dissolved = amountOf(next, containerId, process.dissolvedId)
    const limit = saturationLimitG(process, next, containerId)

    // Cooling or evaporation below the limit: excess crystallises immediately.
    if (dissolved > limit + AMOUNT_EPSILON) {
      const excess = dissolved - limit
      next = withContents(next, containerId, {
        [process.dissolvedId]: -excess,
        [process.soluteId]: excess,
      })
      events.push(
        { type: 'effect', containerId, effect: 'precipitate', intensity: 1, sourceId: process.id },
        { type: 'saturated', containerId, processId: process.id, soluteId: process.soluteId },
      )
      continue
    }
    if (solid <= 0) continue

    const stirred = conditions.stirring?.includes(containerId) ?? false
    const rate = stirred ? process.rateGPerSecondStirred : (process.rateGPerSecondUnstirred ?? 0)
    if (rate <= 0) continue
    const potential = rate * dt
    const room = Math.max(0, limit - dissolved)
    const amount = Math.min(room, solid, potential)
    if (amount > AMOUNT_EPSILON) {
      next = withContents(next, containerId, {
        [process.soluteId]: -amount,
        [process.dissolvedId]: amount,
      })
      events.push(
        {
          type: 'dissolved',
          containerId,
          processId: process.id,
          soluteId: process.soluteId,
          amount,
        },
        {
          type: 'effect',
          containerId,
          effect: 'dissolve',
          intensity: amount / potential,
          sourceId: process.id,
        },
      )
    }
    if (room < solid && room <= potential)
      events.push({
        type: 'saturated',
        containerId,
        processId: process.id,
        soluteId: process.soluteId,
      })
  }
  return next
}

function applyEvaporation(
  definition: ChemistryDefinition,
  state: LabState,
  process: EvaporationProcess,
  dt: number,
  conditions: TickConditions,
  containerIds: readonly string[],
  events: LabEvent[],
) {
  const boilingPoint = getSubstance(definition, process.substanceId)?.boilingPointC
  if (boilingPoint === undefined) return state
  let next = state
  for (const containerId of containerIds) {
    if ((conditions.heatingCPerSecond?.[containerId] ?? 0) <= 0) continue
    if (next.containers[containerId].temperatureC < boilingPoint - AMOUNT_EPSILON) continue
    const amount = Math.min(
      amountOf(next, containerId, process.substanceId),
      process.rateMlPerSecond * dt,
    )
    if (amount <= AMOUNT_EPSILON) continue
    next = withContents(next, containerId, { [process.substanceId]: -amount })
    events.push(
      { type: 'evaporated', containerId, substanceId: process.substanceId, amount },
      { type: 'effect', containerId, effect: 'heat', intensity: 1, sourceId: process.id },
    )
  }
  return next
}

/** Whether a rule's conditions hold in a container right now (reactant amounts excluded). */
export function reactionConditionsMet(
  rule: ReactionRule,
  state: LabState,
  containerId: string,
  conditions: TickConditions,
) {
  const c = rule.conditions
  if (!c) return true
  const temperature = state.containers[containerId].temperatureC
  if (c.minTemperatureC !== undefined && temperature < c.minTemperatureC) return false
  if (c.maxTemperatureC !== undefined && temperature > c.maxTemperatureC) return false
  if (c.requiresStirring && !(conditions.stirring?.includes(containerId) ?? false)) return false
  if (c.requiresHeating && !((conditions.heatingCPerSecond?.[containerId] ?? 0) > 0)) return false
  return (c.catalystIds ?? []).every((id) => amountOf(state, containerId, id) > AMOUNT_EPSILON)
}

function applyReaction(
  definition: ChemistryDefinition,
  state: LabState,
  rule: ReactionRule,
  dt: number,
  conditions: TickConditions,
  containerIds: readonly string[],
  events: LabEvent[],
) {
  let next = state
  for (const containerId of containerIds) {
    if (!reactionConditionsMet(rule, next, containerId, conditions)) continue
    let available = Infinity
    for (const reactant of rule.reactants)
      available = Math.min(
        available,
        amountOf(next, containerId, reactant.substanceId) / reactant.amount,
      )
    const potential = rule.ratePerSecond * dt
    const extent = Math.min(available, potential)
    if (!(extent > AMOUNT_EPSILON)) continue

    const changes: Record<string, number> = {}
    for (const reactant of rule.reactants)
      changes[reactant.substanceId] =
        (changes[reactant.substanceId] ?? 0) - reactant.amount * extent
    for (const product of rule.products)
      changes[product.substanceId] = (changes[product.substanceId] ?? 0) + product.amount * extent
    next = withContents(next, containerId, changes)

    if (rule.temperatureChangeCPer100Ml) {
      const volume = Math.max(10, readVolumeMl(definition, next, containerId))
      const current = next.containers[containerId].temperatureC
      next = withTemperature(
        next,
        containerId,
        current + (rule.temperatureChangeCPer100Ml * extent * 100) / volume,
      )
    }

    events.push({
      type: 'reacted',
      containerId,
      ruleId: rule.id,
      extent,
      observation: rule.observation,
    })
    for (const effect of rule.effects)
      events.push({
        type: 'effect',
        containerId,
        effect,
        intensity: Math.min(1, extent / potential),
        sourceId: rule.id,
      })
    for (const hazard of rule.hazards ?? [])
      events.push({ type: 'hazard', containerId, hazard, sourceId: rule.id })
  }
  return next
}

function releaseGases(definition: ChemistryDefinition, state: LabState, events: LabEvent[]) {
  let next = state
  for (const container of definition.containers) {
    if (!container.open) continue
    for (const [substanceId, amount] of Object.entries(next.containers[container.id].contents)) {
      if (getSubstance(definition, substanceId)?.state !== 'gas') continue
      next = withContents(next, container.id, { [substanceId]: -amount })
      events.push({ type: 'gas-released', containerId: container.id, substanceId, amount })
    }
  }
  return next
}

/**
 * Advances the lab by `dtSeconds`. Deterministic: the same definition, state, dt and conditions
 * always give the same result. Order: temperature → physical processes → reactions → gas release.
 */
export function simulateTick(
  definition: ChemistryDefinition,
  state: LabState,
  dtSeconds: number,
  conditions: TickConditions = {},
): EngineResult {
  if (!Number.isFinite(dtSeconds) || dtSeconds < 0 || dtSeconds > MAX_TICK_SECONDS)
    return {
      ok: false,
      state,
      events: [],
      code: 'INVALID_TIME_STEP',
      message: `Time step must be between 0 and ${MAX_TICK_SECONDS} seconds.`,
    }
  const events: LabEvent[] = []
  const containerIds = definition.containers.map((container) => container.id)
  let next = updateTemperatures(definition, state, dtSeconds, conditions)

  for (const process of definition.processes)
    next =
      process.kind === 'dissolution'
        ? applyDissolution(next, process, dtSeconds, conditions, containerIds, events)
        : applyEvaporation(definition, next, process, dtSeconds, conditions, containerIds, events)

  for (const rule of definition.reactions)
    next = applyReaction(definition, next, rule, dtSeconds, conditions, containerIds, events)

  next = releaseGases(definition, next, events)
  return { ok: true, state: { ...next, timeS: next.timeS + dtSeconds }, events }
}
