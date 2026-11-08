import type {
  ChemistryDefinition,
  ContainerDefinition,
  ContainerState,
  EngineErrorCode,
  EngineResult,
  LabEvent,
  LabState,
  QuantityUnit,
  SubstanceDefinition,
} from './types.ts'

/** Amounts below this are treated as zero and removed (avoids float dust). */
export const AMOUNT_EPSILON = 1e-9

export function substanceUnit(substance: Pick<SubstanceDefinition, 'state'>): QuantityUnit {
  return substance.state === 'liquid' ? 'mL' : 'g'
}

export function getSubstance(definition: ChemistryDefinition, id: string) {
  return definition.substances.find((substance) => substance.id === id)
}

export function getContainerDefinition(definition: ChemistryDefinition, id: string) {
  return definition.containers.find((container) => container.id === id)
}

export function createInitialLabState(definition: ChemistryDefinition): LabState {
  const containers: Record<string, ContainerState> = {}
  for (const container of definition.containers) {
    const contents: Record<string, number> = {}
    for (const entry of container.initialContents ?? [])
      contents[entry.substanceId] = (contents[entry.substanceId] ?? 0) + entry.amount
    containers[container.id] = {
      contents,
      temperatureC: container.initialTemperatureC ?? definition.ambientTemperatureC,
    }
  }
  return { containers, timeS: 0 }
}

export function amountOf(state: LabState, containerId: string, substanceId: string) {
  return state.containers[containerId]?.contents[substanceId] ?? 0
}

/** Immutable update of one container's contents; tiny/negative remainders become 0. */
export function withContents(
  state: LabState,
  containerId: string,
  changes: Readonly<Record<string, number>>,
): LabState {
  const container = state.containers[containerId]
  const contents: Record<string, number> = { ...container.contents }
  for (const [substanceId, delta] of Object.entries(changes)) {
    const next = (contents[substanceId] ?? 0) + delta
    if (next <= AMOUNT_EPSILON) delete contents[substanceId]
    else contents[substanceId] = next
  }
  return {
    ...state,
    containers: { ...state.containers, [containerId]: { ...container, contents } },
  }
}

export function withTemperature(state: LabState, containerId: string, temperatureC: number) {
  const container = state.containers[containerId]
  return {
    ...state,
    containers: { ...state.containers, [containerId]: { ...container, temperatureC } },
  }
}

// ---------------------------------------------------------------------------
// Measurement readers
// ---------------------------------------------------------------------------

/** Total liquid volume in mL (solids and dissolved species are not counted). */
export function readVolumeMl(
  definition: ChemistryDefinition,
  state: LabState,
  containerId: string,
) {
  let total = 0
  for (const [substanceId, amount] of Object.entries(state.containers[containerId]?.contents ?? {}))
    if (getSubstance(definition, substanceId)?.state === 'liquid') total += amount
  return total
}

/** Total mass of contents in g (liquids converted with density; default 1 g/mL). */
export function readMassG(definition: ChemistryDefinition, state: LabState, containerId: string) {
  let total = 0
  for (const [substanceId, amount] of Object.entries(
    state.containers[containerId]?.contents ?? {},
  )) {
    const substance = getSubstance(definition, substanceId)
    total += substance?.state === 'liquid' ? amount * (substance.densityGPerMl ?? 1) : amount
  }
  return total
}

export function readTemperatureC(state: LabState, containerId: string) {
  return state.containers[containerId]?.temperatureC ?? null
}

/**
 * Teaching pH model: strong acids/bases only, fully dissociated, in the container's liquid
 * volume. Returns null when there is no liquid. Clamped to 0–14.
 */
export function readPh(definition: ChemistryDefinition, state: LabState, containerId: string) {
  const volumeL = readVolumeMl(definition, state, containerId) / 1000
  if (volumeL <= 0) return null
  let netEquivalents = 0
  for (const [substanceId, amount] of Object.entries(
    state.containers[containerId]?.contents ?? {},
  )) {
    const substance = getSubstance(definition, substanceId)
    if (!substance?.acidBase || !substance.molarMassGPerMol) continue
    const grams = substance.state === 'liquid' ? amount * (substance.densityGPerMl ?? 1) : amount
    const equivalents = (grams / substance.molarMassGPerMol) * substance.acidBase.equivalentsPerMol
    netEquivalents += substance.acidBase.type === 'acid' ? equivalents : -equivalents
  }
  const concentration = netEquivalents / volumeL
  const ph =
    concentration > 1e-7
      ? -Math.log10(concentration)
      : concentration < -1e-7
        ? 14 + Math.log10(-concentration)
        : 7
  return Math.min(14, Math.max(0, ph))
}

/** Amount-weighted colour blend of visible contents (for renderers). */
export function readColor(definition: ChemistryDefinition, state: LabState, containerId: string) {
  let weight = 0
  const rgb = [0, 0, 0]
  for (const [substanceId, amount] of Object.entries(
    state.containers[containerId]?.contents ?? {},
  )) {
    const substance = getSubstance(definition, substanceId)
    if (!substance || substance.state === 'gas') continue
    const w = amount * (substance.opacity ?? 0.2)
    const hex = /^#([0-9a-f]{6})$/i.exec(substance.color)?.[1]
    if (!hex || w <= 0) continue
    for (let i = 0; i < 3; i++) rgb[i] += parseInt(hex.slice(i * 2, i * 2 + 2), 16) * w
    weight += w
  }
  if (weight <= 0) return null
  return `#${rgb
    .map((c) =>
      Math.round(c / weight)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

// ---------------------------------------------------------------------------
// Material transfer
// ---------------------------------------------------------------------------

function fail(state: LabState, code: EngineErrorCode, message: string): EngineResult {
  return { ok: false, state, events: [], code, message }
}

/** Amount currently occupying the container's capacity, in the capacity unit. */
export function occupiedCapacity(
  definition: ChemistryDefinition,
  state: LabState,
  container: ContainerDefinition,
) {
  return container.capacity.unit === 'mL'
    ? readVolumeMl(definition, state, container.id)
    : Object.entries(state.containers[container.id]?.contents ?? {}).reduce((sum, [id, amount]) => {
        const substance = getSubstance(definition, id)
        return substance && substanceUnit(substance) === 'g' ? sum + amount : sum
      }, 0)
}

export interface TransferRequest {
  from: string
  to: string
  substanceId: string
  amount: number
  /** 'reject' (default) refuses transfers that exceed capacity; 'spill' fills and spills the rest. */
  onOverflow?: 'reject' | 'spill'
}

/** Moves one substance between containers, conserving the amount (minus any reported spill). */
export function transferMaterial(
  definition: ChemistryDefinition,
  state: LabState,
  request: TransferRequest,
): EngineResult {
  const source = getContainerDefinition(definition, request.from)
  const target = getContainerDefinition(definition, request.to)
  if (!source || !target || !state.containers[source.id] || !state.containers[target.id])
    return fail(state, 'UNKNOWN_CONTAINER', 'Unknown source or destination container.')
  if (source.id === target.id)
    return fail(state, 'SAME_CONTAINER', 'Choose different source and destination containers.')
  const substance = getSubstance(definition, request.substanceId)
  if (!substance) return fail(state, 'UNKNOWN_SUBSTANCE', 'Unknown substance.')
  if (!Number.isFinite(request.amount) || request.amount <= 0)
    return fail(state, 'INVALID_AMOUNT', 'Transfer amount must be a positive number.')
  const available = amountOf(state, source.id, substance.id)
  if (request.amount > available + AMOUNT_EPSILON)
    return fail(
      state,
      'INSUFFICIENT_AMOUNT',
      `Only ${available} ${substanceUnit(substance)} available.`,
    )
  if (!target.accepts.includes(substance.state))
    return fail(state, 'NOT_ACCEPTED', `${target.label} cannot hold ${substance.state} materials.`)

  const unit = substanceUnit(substance)
  const countsTowardCapacity = unit === target.capacity.unit
  const free = countsTowardCapacity
    ? Math.max(0, target.capacity.value - occupiedCapacity(definition, state, target))
    : Infinity
  const events: LabEvent[] = []
  let moved = Math.min(request.amount, available)
  let spilled = 0
  if (moved > free + AMOUNT_EPSILON) {
    if ((request.onOverflow ?? 'reject') === 'reject')
      return fail(
        state,
        'CAPACITY_EXCEEDED',
        `${target.label} capacity is ${target.capacity.value} ${target.capacity.unit}; reduce the amount.`,
      )
    spilled = moved - free
    moved = free
  }

  let next = withContents(state, source.id, { [substance.id]: -(moved + spilled) })
  if (moved > 0) next = withContents(next, target.id, { [substance.id]: moved })
  if (moved > 0)
    events.push({
      type: 'transferred',
      from: source.id,
      to: target.id,
      substanceId: substance.id,
      amount: moved,
      unit,
    })
  if (spilled > 0)
    events.push({
      type: 'overflow',
      containerId: target.id,
      substanceId: substance.id,
      amount: spilled,
      unit,
    })
  return { ok: true, state: next, events }
}

// ---------------------------------------------------------------------------
// L5: pouring a mixture
// ---------------------------------------------------------------------------

export interface PourResult {
  state: LabState
  events: LabEvent[]
  /** Liquid volume that arrived in the target (mL). */
  pouredMl: number
  /** Liquid volume that overflowed the target and was lost (mL). */
  spilledMl: number
}

/**
 * Pours `volumeMl` of liquid from one container to another. Every liquid and dissolved
 * (aqueous) species leaves in proportion to the liquid volume, so mixtures keep their
 * composition; settled solids and gases stay behind. If the target overflows, the excess is
 * spilled (lost) and reported. Amounts are conserved: source loss = target gain + spill.
 */
export function pourLiquid(
  definition: ChemistryDefinition,
  state: LabState,
  from: string,
  to: string,
  volumeMl: number,
): PourResult {
  const none: PourResult = { state, events: [], pouredMl: 0, spilledMl: 0 }
  const target = getContainerDefinition(definition, to)
  if (from === to || !target || !state.containers[from] || !state.containers[to]) return none
  const sourceVolume = readVolumeMl(definition, state, from)
  const requested = Math.min(Number.isFinite(volumeMl) ? volumeMl : 0, sourceVolume)
  if (requested <= AMOUNT_EPSILON) return none
  const fraction = requested / sourceVolume
  const free =
    target.capacity.unit === 'mL'
      ? Math.max(0, target.capacity.value - readVolumeMl(definition, state, to))
      : 0
  const keptFraction = Math.min(1, free / requested)

  const leaving: Record<string, number> = {}
  const arriving: Record<string, number> = {}
  const events: LabEvent[] = []
  for (const [substanceId, amount] of Object.entries(state.containers[from].contents)) {
    const substance = getSubstance(definition, substanceId)
    if (!substance || (substance.state !== 'liquid' && substance.state !== 'aqueous')) continue
    if (!target.accepts.includes(substance.state)) continue
    // A full pour moves the exact remaining amount (no floating-point residue).
    const share = fraction >= 1 - 1e-12 ? amount : amount * fraction
    leaving[substanceId] = -share
    const kept = share * keptFraction
    if (kept > 0) arriving[substanceId] = kept
    const unit = substanceUnit(substance)
    if (kept > AMOUNT_EPSILON)
      events.push({ type: 'transferred', from, to, substanceId, amount: kept, unit })
    if (share - kept > AMOUNT_EPSILON)
      events.push({
        type: 'overflow',
        containerId: to,
        substanceId,
        amount: share - kept,
        unit,
      })
  }
  if (Object.keys(leaving).length === 0) return none
  let next = withContents(state, from, leaving)
  next = withContents(next, to, arriving)
  const pouredMl = requested * keptFraction
  return { state: next, events, pouredMl, spilledMl: requested - pouredMl }
}
