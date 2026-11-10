import { saltExperimentDefinition as definition } from '../data/saltExperimentDefinition.ts'
import {
  CAPACITIES_ML,
  isValidSaltExperimentState,
  SPATULA_CAPACITY_G,
  WEIGHING_BOAT_CAPACITY_G,
} from './saltExperiment.ts'
import type { LiquidContainerId, SaltExperimentState } from './types.ts'
import type { WorkflowState } from './workflowTypes.ts'

export type MaterialId = 'water' | 'NaCl'
export type TransferRequest = {
  requestId: string
  sourceId: string
  targetId: string
  materialId: MaterialId
  amount: number
  unit: 'mL' | 'L' | 'g' | 'mg'
}
export type ResolvedTransfer = {
  id: string
  sourceId: string
  targetId: string
  materialId: MaterialId
  kind: 'liquid' | 'solid'
  method: 'pour' | 'scoop' | 'deposit'
  available: number
  freeCapacity: number
  maxAmount: number
  canonicalUnit: 'mL' | 'g'
  /** Decimal places in the canonical unit. */
  precision: number
  enabled: boolean
  reason: string | null
  sourceLabel: string
  targetLabel: string
}
export type TransferOperation = {
  operationId: string
  requestId: string
  sourceId: string
  targetId: string
  materialId: MaterialId
  kind: ResolvedTransfer['kind']
  method: ResolvedTransfer['method']
  amount: number
  transferred: number
  unit: 'mL' | 'g'
  elapsedMs: number
  durationMs: number
  approachMs: number
  flowMs: number
  returnMs: number
  cancelled: boolean
  /** Original snapshot authenticates the entire cumulative transfer, not just the last tick. */
  beforeChemistry: SaltExperimentState
  stepId: string
  sessionRevision: number
}

type SolidReservoir = 'saltStockG' | 'saltOnSpatulaG' | 'saltOnBoatG' | 'saltInBeakerG'
type EquipmentCapability = {
  label: string
  liquid?: { reservoir: LiquidContainerId; capacity: number; source: boolean; receiver: boolean }
  solid?: { reservoir: SolidReservoir; capacity: number }
}
/** Scientific apparatus IDs and capabilities; deliberately independent of renderer mesh names. */
export const transferEquipment: Readonly<Record<string, EquipmentCapability>> = {
  water: {
    label: 'Water container',
    liquid: { reservoir: 'water', capacity: CAPACITIES_ML.water, source: true, receiver: false },
  },
  'graduated-cylinder': {
    label: 'Graduated cylinder',
    liquid: {
      reservoir: 'graduated-cylinder',
      capacity: CAPACITIES_ML['graduated-cylinder'],
      source: true,
      receiver: true,
    },
  },
  beaker: {
    label: 'Beaker',
    liquid: { reservoir: 'beaker', capacity: CAPACITIES_ML.beaker, source: true, receiver: true },
    solid: { reservoir: 'saltInBeakerG', capacity: definition.measurementRequirements.saltG.exact },
  },
  'sodium-chloride': {
    label: 'Sodium chloride jar',
    solid: { reservoir: 'saltStockG', capacity: definition.initialConditions.chemistry.saltStockG },
  },
  spatula: {
    label: 'Spatula',
    solid: { reservoir: 'saltOnSpatulaG', capacity: SPATULA_CAPACITY_G },
  },
  'weighing-boat': {
    label: 'Weighing boat',
    solid: { reservoir: 'saltOnBoatG', capacity: WEIGHING_BOAT_CAPACITY_G },
  },
  'digital-balance': { label: 'Digital balance' },
  'stirring-rod': { label: 'Stirring rod' },
}

export function sameTransferChemistry(a: SaltExperimentState, b: SaltExperimentState): boolean {
  return (
    !!a &&
    !!b &&
    !!a.waterMl &&
    !!b.waterMl &&
    (Object.keys(CAPACITIES_ML) as LiquidContainerId[]).every(
      (id) => a.waterMl[id] === b.waterMl[id],
    ) &&
    (
      [
        'saltStockG',
        'saltOnSpatulaG',
        'saltOnBoatG',
        'saltInBeakerG',
        'dissolvedSaltG',
        'operations',
        'stirCount',
      ] as const
    ).every((key) => a[key] === b[key])
  )
}

/** Parse the number's decimal representation exactly, including exponent notation.
 * No epsilon rounds an over-precise user input onto the supported grid. */
function decimalUnits(value: number, decimalShift: number): number | null {
  if (!Number.isFinite(value) || value < 0) return null
  const [mantissa, exponent = '0'] = value.toString().toLowerCase().split('e')
  const [whole, fraction = ''] = mantissa.split('.')
  const digits = BigInt(whole + fraction)
  const shift = Number(exponent) - fraction.length + decimalShift
  const units = shift >= 0 ? digits * 10n ** BigInt(shift) : digits / 10n ** BigInt(-shift)
  if (shift < 0 && digits % 10n ** BigInt(-shift) !== 0n) return null
  return units <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(units) : null
}

export function quantityUnits(value: number, materialId: MaterialId): number | null {
  return decimalUnits(value, materialId === 'water' ? 1 : 3)
}
export function canonicalQuantity(units: number, materialId: MaterialId): number {
  return units / (materialId === 'water' ? 10 : 1000)
}
export function describeQuantity(amount: number, unit: 'mL' | 'g'): string {
  return `${amount.toFixed(unit === 'mL' ? 1 : 3).replace(/\.?0+$/, '')} ${unit}`
}

function conserved(chemistry: SaltExperimentState): boolean {
  const initial = definition.initialConditions.chemistry
  const water = (s: SaltExperimentState) =>
    Object.values(s.waterMl).reduce((sum, n) => sum + (quantityUnits(n, 'water') ?? NaN), 0)
  const salt = (s: SaltExperimentState) =>
    [s.saltStockG, s.saltOnSpatulaG, s.saltOnBoatG, s.saltInBeakerG].reduce(
      (sum, n) => sum + (quantityUnits(n, 'NaCl') ?? NaN),
      0,
    )
  return water(chemistry) === water(initial) && salt(chemistry) === salt(initial)
}

/** Free practice keeps scientific invariants but does not move the saved guided checkpoint. */
export function transferStateIsValid(
  chemistry: SaltExperimentState,
  workflow: WorkflowState,
  guided = true,
): boolean {
  return (
    isValidSaltExperimentState(chemistry) &&
    conserved(chemistry) &&
    (!guided || sameTransferChemistry(chemistry, workflow.chemistryCheckpoint)) &&
    chemistry.operations < Number.MAX_SAFE_INTEGER
  )
}

type Route = {
  sourceId: string
  targetId: string
  materialId: MaterialId
  method: ResolvedTransfer['method']
  restriction?: string
}
const solidRoutes: readonly Route[] = [
  { sourceId: 'sodium-chloride', targetId: 'spatula', materialId: 'NaCl', method: 'scoop' },
  { sourceId: 'spatula', targetId: 'weighing-boat', materialId: 'NaCl', method: 'deposit' },
  { sourceId: 'weighing-boat', targetId: 'beaker', materialId: 'NaCl', method: 'pour' },
  {
    sourceId: 'sodium-chloride',
    targetId: 'weighing-boat',
    materialId: 'NaCl',
    method: 'deposit',
    restriction: 'Use the spatula to scoop NaCl, then deposit it into the weighing boat.',
  },
  {
    sourceId: 'sodium-chloride',
    targetId: 'beaker',
    materialId: 'NaCl',
    method: 'pour',
    restriction:
      'Use the spatula and weighing boat, then measure 5 g on the balance before adding salt.',
  },
]

function resolveRoute(
  route: Route,
  chemistry: SaltExperimentState,
  workflow: WorkflowState,
  placedIds: readonly string[],
  guided: boolean,
): ResolvedTransfer {
  const source = transferEquipment[route.sourceId]
  const target = transferEquipment[route.targetId]
  const liquid = route.materialId === 'water'
  const available = liquid
    ? chemistry.waterMl[source.liquid!.reservoir]
    : chemistry[source.solid!.reservoir]
  const load = liquid
    ? chemistry.waterMl[target.liquid!.reservoir]
    : chemistry[target.solid!.reservoir]
  const capacity = liquid ? target.liquid!.capacity : target.solid!.capacity
  const units = (n: number) => quantityUnits(n, route.materialId) ?? 0
  const freeCapacity = canonicalQuantity(
    Math.max(0, units(capacity) - units(load)),
    route.materialId,
  )
  let maxUnits = Math.max(0, Math.min(units(available), units(freeCapacity)))
  const stepId = definition.steps[workflow.stepIndex]?.id
  let reason = route.restriction
    ? guided
      ? route.restriction
      : 'Use the spatula and weighing boat to transfer solid salt.'
    : null
  if (
    guided &&
    !reason &&
    (!workflow.safetyAcknowledged || !workflow.eventEvidence?.['prepare:SAFETY_ACKNOWLEDGED::'])
  )
    reason = 'Acknowledge laboratory safety before transferring materials.'
  if (
    guided &&
    !reason &&
    !workflow.eventEvidence?.['place-beaker:EQUIPMENT_PLACEMENT_VALIDATED:beaker:']
  )
    reason = 'Validate the beaker placement before transferring materials.'
  if (guided && !reason && workflow.completed)
    reason = 'The experiment is complete; restart before transferring materials.'
  if (!reason && !transferStateIsValid(chemistry, workflow, guided))
    reason = 'Scientific quantities or the workflow checkpoint are invalid or stale.'
  if (!reason && ![route.sourceId, route.targetId].every((id) => placedIds.includes(id)))
    reason = 'Place both selected items on the workbench first.'
  if (liquid) {
    if (
      !reason &&
      (chemistry.saltInBeakerG > 0 ||
        chemistry.dissolvedSaltG > 0 ||
        (guided && !['measure-water', 'transfer-water'].includes(stepId ?? '')))
    )
      reason =
        'Water transfers are limited to the pure-water measurement stage; solution transfers would require unsupported solute partitioning.'
    if (
      !reason &&
      guided &&
      stepId === 'measure-water' &&
      !(route.sourceId === 'water' && route.targetId === 'graduated-cylinder')
    )
      reason = 'Measure water from the water container into the graduated cylinder first.'
    if (
      !reason &&
      guided &&
      stepId === 'transfer-water' &&
      !(
        ['graduated-cylinder', 'beaker'].includes(route.sourceId) &&
        ['graduated-cylinder', 'beaker'].includes(route.targetId)
      )
    )
      reason =
        'Transfer only the measured pure water between the cylinder and beaker at this stage.'
    if (
      !reason &&
      guided &&
      stepId === 'transfer-water' &&
      workflow.measurements.waterMl !== definition.measurementRequirements.waterMl.exact
    )
      reason = 'Record the required 100 mL cylinder measurement first.'
  } else {
    const adding = route.sourceId === 'weighing-boat' && route.targetId === 'beaker'
    if (guided && !reason && stepId !== (adding ? 'add-salt' : 'measure-salt'))
      reason = adding
        ? 'Weigh the required 5 g on the balance before adding salt.'
        : 'Scoop and deposit salt during the salt measurement step.'
    const required = adding
      ? ['weighing-boat', 'beaker', 'digital-balance']
      : ['sodium-chloride', 'spatula', 'weighing-boat', 'digital-balance']
    if (guided && !reason && !required.every((id) => placedIds.includes(id)))
      reason = 'Place the salt jar, spatula, weighing boat and required balance on the bench.'
    if (
      !reason &&
      guided &&
      adding &&
      (workflow.measurements.saltG !== definition.measurementRequirements.saltG.exact ||
        !workflow.eventEvidence?.[
          'measure-salt:MASS_MEASUREMENT_RECORDED:weighing-boat:digital-balance'
        ])
    )
      reason = 'Physically weigh and record the required 5 g boat load on the balance first.'
    if (
      !reason &&
      guided &&
      adding &&
      (chemistry.waterMl.beaker !== definition.measurementRequirements.waterMl.exact ||
        chemistry.waterMl['graduated-cylinder'] !== 0)
    )
      reason = 'The beaker must contain the previously measured 100 mL water.'
    if (guided && route.method === 'scoop') {
      const remaining =
        units(definition.measurementRequirements.saltG.exact) -
        units(chemistry.saltOnSpatulaG) -
        units(chemistry.saltOnBoatG)
      maxUnits = Math.max(0, Math.min(maxUnits, remaining))
      if (!reason && remaining <= 0)
        reason = 'The required 5 g portion is already allocated; deposit it and weigh the boat.'
    }
  }
  if (!reason && units(available) <= 0) reason = 'The selected source is empty.'
  if (!reason && maxUnits <= 0) reason = 'The receiving item has no free capacity.'
  return {
    id: `${route.materialId}:${route.sourceId}:${route.targetId}`,
    ...route,
    kind: liquid ? 'liquid' : 'solid',
    available,
    freeCapacity,
    maxAmount: canonicalQuantity(maxUnits, route.materialId),
    canonicalUnit: liquid ? 'mL' : 'g',
    precision: liquid ? 1 : 3,
    enabled: reason === null,
    reason,
    sourceLabel: source.label,
    targetLabel: target.label,
  }
}

/** Unordered dual selection resolves every supported direction, including disabled explanations. */
export function resolvePairInteractions(
  ids: readonly string[],
  chemistry: SaltExperimentState,
  workflow: WorkflowState,
  placedIds: readonly string[],
  guided = true,
): readonly ResolvedTransfer[] {
  if (
    !isValidSaltExperimentState(chemistry) ||
    ids.length !== 2 ||
    ids[0] === ids[1] ||
    ids.some((id) => !Object.hasOwn(transferEquipment, id))
  )
    return []
  const routes: Route[] = solidRoutes.filter(
    (route) => ids.includes(route.sourceId) && ids.includes(route.targetId),
  )
  for (const sourceId of ids)
    for (const targetId of ids) {
      if (
        sourceId !== targetId &&
        transferEquipment[sourceId].liquid?.source &&
        transferEquipment[targetId].liquid?.receiver
      )
        routes.push({ sourceId, targetId, materialId: 'water', method: 'pour' })
    }
  return routes.map((route) => resolveRoute(route, chemistry, workflow, placedIds, guided))
}

export type TransferValidation =
  | { ok: false; message: string }
  | { ok: true; message: string; resolved: ResolvedTransfer; amount: number; amountUnits: number }
export function validateTransferRequest(
  request: TransferRequest,
  chemistry: SaltExperimentState,
  workflow: WorkflowState,
  placedIds: readonly string[],
  guided = true,
): TransferValidation {
  const no = (message: string): TransferValidation => ({ ok: false, message })
  if (
    !request ||
    typeof request !== 'object' ||
    typeof request.requestId !== 'string' ||
    !request.requestId.trim()
  )
    return no('A nonempty unique requestId is required.')
  if (request.materialId !== 'water' && request.materialId !== 'NaCl')
    return no('Unsupported material.')
  const shifts = request.materialId === 'water' ? { mL: 1, L: 4 } : { g: 3, mg: 0 }
  if (!Object.hasOwn(shifts, request.unit))
    return no('The selected unit does not match this material.')
  if (typeof request.amount !== 'number' || !Number.isFinite(request.amount) || request.amount <= 0)
    return no('Enter a finite positive quantity.')
  const amountUnits = decimalUnits(request.amount, shifts[request.unit as keyof typeof shifts]!)
  if (amountUnits === null || amountUnits <= 0)
    return no(
      'Use increments of 0.1 mL for liquids or 0.001 g (1 mg) for solids; extra precision is not accepted.',
    )
  const resolved = resolvePairInteractions(
    [request.sourceId, request.targetId],
    chemistry,
    workflow,
    placedIds,
    guided,
  ).find(
    (item) =>
      item.sourceId === request.sourceId &&
      item.targetId === request.targetId &&
      item.materialId === request.materialId,
  )
  if (!resolved) return no('These items do not support the requested material transfer.')
  if (!resolved.enabled) return no(resolved.reason!)
  if (amountUnits > (quantityUnits(resolved.maxAmount, request.materialId) ?? 0))
    return no(
      `Requested amount exceeds inventory, free capacity or the remaining guided portion (${resolved.maxAmount} ${resolved.canonicalUnit}).`,
    )
  return {
    ok: true,
    message: 'Transfer ready.',
    resolved,
    amount: canonicalQuantity(amountUnits, request.materialId),
    amountUnits,
  }
}

/** Both reservoirs change in the same immutable reduction, always in fixed integer units. */
export function reduceMaterialTransfer(
  chemistry: SaltExperimentState,
  route: Pick<ResolvedTransfer, 'sourceId' | 'targetId' | 'materialId'>,
  deltaUnits: number,
  countOperation: boolean,
): SaltExperimentState | null {
  if (!Number.isSafeInteger(deltaUnits) || deltaUnits < 0 || !isValidSaltExperimentState(chemistry))
    return null
  const source = transferEquipment[route.sourceId]
  const target = transferEquipment[route.targetId]
  if (!source || !target || route.sourceId === route.targetId) return null
  const liquid = route.materialId === 'water'
  const from = liquid ? source.liquid : source.solid
  const to = liquid ? target.liquid : target.solid
  if (!from || !to) return null
  const read = (cap: typeof from) =>
    liquid
      ? chemistry.waterMl[cap.reservoir as LiquidContainerId]
      : chemistry[cap.reservoir as SolidReservoir]
  const available = quantityUnits(read(from), route.materialId)
  const load = quantityUnits(read(to), route.materialId)
  const capacity = quantityUnits(to.capacity, route.materialId)
  if (
    available === null ||
    load === null ||
    capacity === null ||
    deltaUnits > available ||
    load + deltaUnits > capacity
  )
    return null
  const next = {
    ...chemistry,
    waterMl: { ...chemistry.waterMl },
    operations: chemistry.operations + (countOperation && deltaUnits > 0 ? 1 : 0),
  }
  if (liquid) {
    next.waterMl[from.reservoir as LiquidContainerId] = canonicalQuantity(
      available - deltaUnits,
      route.materialId,
    )
    next.waterMl[to.reservoir as LiquidContainerId] = canonicalQuantity(
      load + deltaUnits,
      route.materialId,
    )
  } else {
    next[from.reservoir as SolidReservoir] = canonicalQuantity(
      available - deltaUnits,
      route.materialId,
    )
    next[to.reservoir as SolidReservoir] = canonicalQuantity(load + deltaUnits, route.materialId)
  }
  return isValidSaltExperimentState(next) ? next : null
}

export function createTransferOperation(
  request: TransferRequest,
  validated: Extract<TransferValidation, { ok: true }>,
  chemistry: SaltExperimentState,
  workflow: WorkflowState,
  operationId: string,
  sessionRevision: number,
): TransferOperation {
  const flowMs = Math.round(
    Math.min(4500, Math.max(1000, validated.amount * (request.materialId === 'water' ? 35 : 650))),
  )
  return {
    operationId,
    requestId: request.requestId,
    sourceId: request.sourceId,
    targetId: request.targetId,
    materialId: request.materialId,
    kind: validated.resolved.kind,
    method: validated.resolved.method,
    amount: validated.amount,
    transferred: 0,
    unit: validated.resolved.canonicalUnit,
    elapsedMs: 0,
    durationMs: 600 + flowMs + 600,
    approachMs: 600,
    flowMs,
    returnMs: 600,
    cancelled: false,
    beforeChemistry: { ...chemistry, waterMl: { ...chemistry.waterMl } },
    stepId: definition.steps[workflow.stepIndex]?.id ?? 'review',
    sessionRevision,
  }
}

export function advanceTransferOperation(
  operation: TransferOperation,
  deltaMs: number,
): TransferOperation {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return operation
  const elapsedMs = Math.min(operation.durationMs, operation.elapsedMs + deltaMs)
  if (operation.cancelled) return { ...operation, elapsedMs }
  const flowElapsed = Math.min(operation.flowMs, Math.max(0, elapsedMs - operation.approachMs))
  const amountUnits = quantityUnits(operation.amount, operation.materialId)!
  const cumulativeUnits =
    flowElapsed === operation.flowMs
      ? amountUnits
      : Math.floor(amountUnits * (flowElapsed / operation.flowMs))
  return {
    ...operation,
    elapsedMs,
    transferred: canonicalQuantity(cumulativeUnits, operation.materialId),
  }
}

export function cancelTransferOperation(operation: TransferOperation): TransferOperation {
  if (operation.cancelled) return operation
  const alreadyReturning = Math.max(
    0,
    operation.elapsedMs - operation.approachMs - operation.flowMs,
  )
  return {
    ...operation,
    cancelled: true,
    durationMs: operation.elapsedMs + Math.max(0, operation.returnMs - alreadyReturning),
  }
}
