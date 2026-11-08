/**
 * Salt-dissolution adapter on top of the L1 generic engine (engine/core).
 *
 * The 3D lab, workflow and results UI still consume `SaltExperimentState`. That state is now a
 * projection of the core `LabState`: each command validates its legacy preconditions (keeping
 * the exact student-facing messages), runs the material change through the core engine
 * (`transferMaterial` / `simulateTick`), and projects the resulting engine events back onto the
 * salt state. All quantities and limits come from `data/saltCoreDefinition.ts`.
 */
import { saltCoreExperiment, saltDissolutionProcess } from '../data/saltCoreDefinition.ts'
import {
  amountOf,
  getContainerDefinition,
  saturationLimitG,
  simulateTick,
  transferMaterial,
  type LabEvent,
  type LabState,
} from './core/index.ts'
import type {
  LiquidContainerId,
  SaltExperimentState,
  SimulationActionKind,
  SimulationCommand,
  TransferDestination,
  TransitionResult,
} from './types.ts'

const chemistry = saltCoreExperiment.chemistry

function capacityOf(containerId: string) {
  const container = getContainerDefinition(chemistry, containerId)
  if (!container) throw new Error(`Salt core definition is missing container "${containerId}".`)
  return container.capacity.value
}

function initialAmount(containerId: string, substanceId: string) {
  return (
    getContainerDefinition(chemistry, containerId)?.initialContents?.find(
      (entry) => entry.substanceId === substanceId,
    )?.amount ?? 0
  )
}

export const CAPACITIES_ML: Record<LiquidContainerId, number> = {
  water: capacityOf('water'),
  'graduated-cylinder': capacityOf('graduated-cylinder'),
  beaker: capacityOf('beaker'),
}

export const INITIAL_WATER_ML = initialAmount('water', 'water')
export const INITIAL_SALT_STOCK_G = initialAmount('sodium-chloride', 'sodium-chloride')
/** Illustrative approximate NaCl solubility near 20°C, not calibrated to a measured experiment. */
export const SOLUBILITY_G_PER_100ML = saltDissolutionProcess.solubilityGPer100Ml
export const STIR_ACTION_DURATION_MS = 1500
export const STIR_DISSOLUTION_G_PER_SECOND = saltDissolutionProcess.rateGPerSecondStirred
/** Deliberately simplified teaching rate, not measured NaCl kinetics. */
export const STIR_DISSOLUTION_G_PER_ACTION =
  (STIR_DISSOLUTION_G_PER_SECOND * STIR_ACTION_DURATION_MS) / 1000

export const DEMO_ACTION_RULES: Readonly<
  Record<
    SimulationActionKind,
    {
      actors: readonly string[]
      targets: readonly string[]
      prerequisite: string
    }
  >
> = {
  select: {
    actors: ['all equipment'],
    targets: [],
    prerequisite: 'Equipment is in the inventory or on the bench.',
  },
  'pick-up': {
    actors: ['all placed equipment'],
    targets: ['workbench'],
    prerequisite: 'No experiment animation is active; positioning uses the T06 constrained drag.',
  },
  place: {
    actors: ['all inventory items'],
    targets: ['workbench'],
    prerequisite: 'A free validated placement on the bench is available.',
  },
  rotate: {
    actors: ['all placed equipment'],
    targets: [],
    prerequisite: 'Equipment must be placed and the workspace must be idle.',
  },
  pour: {
    actors: ['water', 'graduated-cylinder'],
    targets: ['graduated-cylinder', 'beaker'],
    prerequisite:
      'Both vessels placed, nonzero source volume, different source/target, and adequate destination capacity.',
  },
  'add-substance': {
    actors: ['weighing-boat'],
    targets: ['beaker'],
    prerequisite:
      'Measured salt must be on a weighing boat; tilt the boat above the beaker containing water.',
  },
  'scoop-salt': {
    actors: ['spatula'],
    targets: ['sodium-chloride'],
    prerequisite: 'Insert the clean spatula into the NaCl jar, then scoop 5 g teaching portion.',
  },
  'deposit-salt': {
    actors: ['spatula'],
    targets: ['weighing-boat'],
    prerequisite: 'Move the loaded spatula above the weighing boat and release its salt.',
  },
  stir: {
    actors: ['stirring-rod'],
    targets: ['beaker'],
    prerequisite: 'Rod and beaker placed; beaker contains water and undissolved salt.',
  },
  measure: {
    actors: ['graduated-cylinder', 'beaker', 'digital-balance'],
    targets: ['measurements'],
    prerequisite: 'Read the modelled load on a tared weighing boat; calibration not simulated.',
  },
  inspect: {
    actors: ['all equipment'],
    targets: ['information panel'],
    prerequisite: 'An inventory item has been selected.',
  },
}

/** Idealized capacity of the demonstration spatula (g). */
export const SPATULA_CAPACITY_G = capacityOf('spatula')
export const WEIGHING_BOAT_CAPACITY_G = capacityOf('weighing-boat')

// ---------------------------------------------------------------------------
// Projection between the core LabState and the legacy SaltExperimentState
// ---------------------------------------------------------------------------

type SolidField = 'saltStockG' | 'saltOnSpatulaG' | 'saltOnBoatG' | 'saltInBeakerG'
const SOLID_FIELDS: Readonly<Record<string, SolidField>> = {
  'sodium-chloride': 'saltStockG',
  spatula: 'saltOnSpatulaG',
  'weighing-boat': 'saltOnBoatG',
  beaker: 'saltInBeakerG',
}

/** Builds the core state equivalent to a salt state (solid NaCl in the beaker = undissolved). */
export function saltStateToLabState(state: SaltExperimentState): LabState {
  const contents = (entries: [string, number][]) =>
    Object.fromEntries(entries.filter(([, amount]) => amount > 0))
  const temperatureC = chemistry.ambientTemperatureC
  return {
    timeS: 0,
    containers: {
      water: { contents: contents([['water', state.waterMl.water]]), temperatureC },
      'graduated-cylinder': {
        contents: contents([['water', state.waterMl['graduated-cylinder']]]),
        temperatureC,
      },
      beaker: {
        contents: contents([
          ['water', state.waterMl.beaker],
          ['sodium-chloride', undissolvedSaltG(state)],
          ['sodium-chloride-aq', state.dissolvedSaltG],
        ]),
        temperatureC,
      },
      'sodium-chloride': {
        contents: contents([['sodium-chloride', state.saltStockG]]),
        temperatureC,
      },
      spatula: { contents: contents([['sodium-chloride', state.saltOnSpatulaG]]), temperatureC },
      'weighing-boat': {
        contents: contents([['sodium-chloride', state.saltOnBoatG]]),
        temperatureC,
      },
    },
  }
}

/** Reads a salt state back from a core state (counters are not part of the chemistry model). */
export function labStateToSaltState(
  lab: LabState,
  counters: Pick<SaltExperimentState, 'operations' | 'stirCount'>,
): SaltExperimentState {
  const dissolved = amountOf(lab, 'beaker', 'sodium-chloride-aq')
  return {
    waterMl: {
      water: amountOf(lab, 'water', 'water'),
      'graduated-cylinder': amountOf(lab, 'graduated-cylinder', 'water'),
      beaker: amountOf(lab, 'beaker', 'water'),
    },
    saltStockG: amountOf(lab, 'sodium-chloride', 'sodium-chloride'),
    saltOnSpatulaG: amountOf(lab, 'spatula', 'sodium-chloride'),
    saltOnBoatG: amountOf(lab, 'weighing-boat', 'sodium-chloride'),
    saltInBeakerG: amountOf(lab, 'beaker', 'sodium-chloride') + dissolved,
    dissolvedSaltG: dissolved,
    operations: counters.operations,
    stirCount: counters.stirCount,
  }
}

/**
 * Applies core transfer events to a salt state. Deltas are applied to the previous values (not
 * re-summed from the core state) so whole-number quantities stay exactly whole.
 */
function projectTransfers(state: SaltExperimentState, events: readonly LabEvent[]) {
  const next: SaltExperimentState = { ...state, waterMl: { ...state.waterMl } }
  for (const event of events) {
    if (event.type !== 'transferred') continue
    if (event.substanceId === 'water') {
      next.waterMl[event.from as LiquidContainerId] -= event.amount
      next.waterMl[event.to as LiquidContainerId] += event.amount
    } else if (event.substanceId === 'sodium-chloride') {
      next[SOLID_FIELDS[event.from]] -= event.amount
      next[SOLID_FIELDS[event.to]] += event.amount
    }
  }
  return next
}

function runTransfer(
  state: SaltExperimentState,
  from: string,
  to: string,
  substanceId: 'water' | 'sodium-chloride',
  amount: number,
): { ok: true; state: SaltExperimentState } | { ok: false; message: string } {
  const result = transferMaterial(chemistry, saltStateToLabState(state), {
    from,
    to,
    substanceId,
    amount,
  })
  if (!result.ok) return { ok: false, message: result.message }
  return {
    ok: true,
    state: { ...projectTransfers(state, result.events), operations: state.operations + 1 },
  }
}

// ---------------------------------------------------------------------------
// Salt state helpers (unchanged public API)
// ---------------------------------------------------------------------------

const reject = (state: SaltExperimentState, message: string): TransitionResult => ({
  ok: false,
  state,
  message,
})
const onBench = (ids: readonly string[], id: string) => ids.includes(id)

export function initialSaltExperimentState(): SaltExperimentState {
  return {
    waterMl: { water: INITIAL_WATER_ML, 'graduated-cylinder': 0, beaker: 0 },
    saltStockG: INITIAL_SALT_STOCK_G,
    saltOnSpatulaG: 0,
    saltOnBoatG: 0,
    saltInBeakerG: 0,
    dissolvedSaltG: 0,
    operations: 0,
    stirCount: 0,
  }
}

export function undissolvedSaltG(state: SaltExperimentState) {
  return Math.max(0, state.saltInBeakerG - state.dissolvedSaltG)
}

/** Saturation limit from the core dissolution process (solvent volume × solubility). */
export function maximumDissolvedSaltG(state: SaltExperimentState) {
  const temperatureC = chemistry.ambientTemperatureC
  const lab: LabState = {
    timeS: 0,
    containers: { beaker: { contents: { water: state.waterMl.beaker }, temperatureC } },
  }
  return saturationLimitG(saltDissolutionProcess, lab, 'beaker')
}

export function isDemonstrationComplete(state: SaltExperimentState) {
  return (
    isValidSaltExperimentState(state) &&
    state.waterMl.beaker > 0 &&
    state.saltInBeakerG > 0 &&
    state.stirCount > 0 &&
    undissolvedSaltG(state) < 0.0001
  )
}

/** Runtime guards also protect JS callers; TypeScript unions do not validate input. */
export function isValidSaltExperimentState(state: SaltExperimentState): boolean {
  const volumes = Object.entries(CAPACITIES_ML) as [LiquidContainerId, number][]
  return (
    !!state &&
    typeof state === 'object' &&
    !!state.waterMl &&
    typeof state.waterMl === 'object' &&
    volumes.every(
      ([id, capacity]) =>
        Number.isFinite(state.waterMl[id]) &&
        Number(state.waterMl[id].toFixed(1)) === state.waterMl[id] &&
        state.waterMl[id] >= 0 &&
        state.waterMl[id] <= capacity,
    ) &&
    [
      state.saltStockG,
      state.saltOnSpatulaG,
      state.saltOnBoatG,
      state.saltInBeakerG,
      state.dissolvedSaltG,
    ].every((mass) => Number.isFinite(mass) && mass >= 0) &&
    state.saltOnSpatulaG <= SPATULA_CAPACITY_G &&
    state.saltOnBoatG <= WEIGHING_BOAT_CAPACITY_G &&
    state.dissolvedSaltG <= state.saltInBeakerG &&
    state.dissolvedSaltG <= maximumDissolvedSaltG(state) &&
    Number.isSafeInteger(state.operations) &&
    state.operations >= 0 &&
    Number.isSafeInteger(state.stirCount) &&
    state.stirCount >= 0 &&
    state.stirCount <= state.operations
  )
}

function validCommandApparatus(command: SimulationCommand): boolean {
  if (!command || typeof command !== 'object') return false
  switch (command.kind) {
    case 'pour':
      return (
        ['water', 'graduated-cylinder'].includes(command.source) &&
        ['graduated-cylinder', 'beaker'].includes(command.target)
      )
    case 'scoop-salt':
      return command.tool === 'spatula' && command.source === 'sodium-chloride'
    case 'deposit-salt':
      return command.tool === 'spatula' && command.target === 'weighing-boat'
    case 'add-substance':
      return (
        ['sodium-chloride', 'weighing-boat'].includes(command.source) && command.target === 'beaker'
      )
    case 'stir':
      return command.tool === 'stirring-rod' && command.target === 'beaker'
    default:
      return false
  }
}

export function executeSaltCommand(
  state: SaltExperimentState,
  command: SimulationCommand,
  placedIds: readonly string[],
): TransitionResult {
  if (!validCommandApparatus(command))
    return reject(state, 'Unsupported scientific command, source, tool or target.')
  if (!isValidSaltExperimentState(state) || state.operations === Number.MAX_SAFE_INTEGER)
    return reject(state, 'Scientific quantities or operation counters are invalid.')
  if (command.kind === 'pour')
    return pourWater(state, command.source, command.target, command.amountMl, placedIds)
  if (command.kind === 'scoop-salt') return scoopSalt(state, command.massG, placedIds)
  if (command.kind === 'deposit-salt') return depositSalt(state, command.massG, placedIds)
  if (command.kind === 'add-substance')
    return addSalt(state, command.source, command.massG, placedIds)
  if (command.kind === 'stir') return stir(state, placedIds, command.elapsedMs)
  return reject(state, 'Unsupported scientific command.')
}

function scoopSalt(
  state: SaltExperimentState,
  massG: number,
  placedIds: readonly string[],
): TransitionResult {
  if (!['spatula', 'sodium-chloride'].every((id) => onBench(placedIds, id)))
    return reject(state, 'Place the NaCl jar and spatula on the bench.')
  if (!Number.isInteger(massG) || massG <= 0 || massG > SPATULA_CAPACITY_G)
    return reject(state, 'The demonstration spatula holds a maximum 5 g whole-number portion.')
  if (state.saltOnSpatulaG + massG > SPATULA_CAPACITY_G || state.saltStockG < massG)
    return reject(state, 'Spatula full or insufficient salt stock.')
  const result = runTransfer(state, 'sodium-chloride', 'spatula', 'sodium-chloride', massG)
  if (!result.ok) return reject(state, result.message)
  return {
    ok: true,
    state: result.state,
    message: `Scooped ${massG} g of modelled solid NaCl onto the spatula.`,
  }
}

function depositSalt(
  state: SaltExperimentState,
  massG: number,
  placedIds: readonly string[],
): TransitionResult {
  if (!['spatula', 'weighing-boat'].every((id) => onBench(placedIds, id)))
    return reject(state, 'Place the spatula and weighing boat on the bench.')
  if (!Number.isInteger(massG) || massG <= 0 || massG > state.saltOnSpatulaG)
    return reject(state, 'The spatula cannot deposit a mass that it does not contain.')
  if (state.saltOnBoatG + massG > WEIGHING_BOAT_CAPACITY_G)
    return reject(state, 'The weighing boat would exceed its modelled capacity.')
  const result = runTransfer(state, 'spatula', 'weighing-boat', 'sodium-chloride', massG)
  if (!result.ok) return reject(state, result.message)
  return {
    ok: true,
    state: result.state,
    message: `Deposited ${massG} g NaCl in the weighing boat.`,
  }
}

function pourWater(
  state: SaltExperimentState,
  source: LiquidContainerId,
  target: TransferDestination,
  amountMl: number,
  placedIds: readonly string[],
): TransitionResult {
  if (source === target) return reject(state, 'Choose different source and destination vessels.')
  if (source === 'beaker')
    return reject(
      state,
      'This demonstration pours from the water container or graduated cylinder, not out of the beaker.',
    )
  if (!onBench(placedIds, source) || !onBench(placedIds, target))
    return reject(state, 'Place both source and destination on the workbench first.')
  if (!Number.isFinite(amountMl) || amountMl <= 0 || !Number.isInteger(amountMl))
    return reject(state, 'Enter a positive whole-number volume in mL.')
  if (amountMl > state.waterMl[source])
    return reject(state, `Not enough water in ${source}. Available: ${state.waterMl[source]} mL.`)
  if (state.waterMl[target] + amountMl > CAPACITIES_ML[target])
    return reject(
      state,
      `${target} capacity is ${CAPACITIES_ML[target]} mL; reduce the transfer amount.`,
    )
  const result = runTransfer(state, source, target, 'water', amountMl)
  if (!result.ok) return reject(state, result.message)
  return {
    ok: true,
    state: result.state,
    message: `Transferred ${amountMl} mL of water from ${source} to ${target}.`,
    effect: {
      kind: 'liquid-transfer',
      sourceId: source,
      targetId: target,
      amount: amountMl,
      durationMs: 1400,
    },
  }
}

function addSalt(
  state: SaltExperimentState,
  source: 'sodium-chloride' | 'weighing-boat',
  massG: number,
  placedIds: readonly string[],
): TransitionResult {
  if (![source, 'beaker', 'digital-balance'].every((id) => onBench(placedIds, id)))
    return reject(state, 'Place the salt source, beaker and digital balance on the bench first.')
  if (state.waterMl.beaker <= 0)
    return reject(state, 'Add water to the beaker before introducing sodium chloride.')
  if (!Number.isFinite(massG) || massG <= 0 || !Number.isInteger(massG))
    return reject(state, 'Choose a positive whole-number salt quantity in grams.')
  const available = source === 'weighing-boat' ? state.saltOnBoatG : state.saltStockG
  if (massG > available)
    return reject(state, `Only ${available} g remains in the selected salt source.`)
  const result = runTransfer(state, source, 'beaker', 'sodium-chloride', massG)
  if (!result.ok) return reject(state, result.message)
  return {
    ok: true,
    state: result.state,
    message: `Added ${massG} g NaCl to the beaker; stir to model dissolution.`,
    effect: {
      kind: 'salt-addition',
      sourceId: source,
      targetId: 'beaker',
      amount: massG,
      durationMs: 1150,
    },
  }
}

function stir(
  state: SaltExperimentState,
  placedIds: readonly string[],
  elapsedMs = STIR_ACTION_DURATION_MS,
): TransitionResult {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || elapsedMs > STIR_ACTION_DURATION_MS)
    return reject(state, 'Active stirring time must be positive and no more than 1500 ms.')
  if (!onBench(placedIds, 'stirring-rod') || !onBench(placedIds, 'beaker'))
    return reject(state, 'Place the stirring rod and beaker on the bench first.')
  if (state.waterMl.beaker <= 0) return reject(state, 'The beaker must contain water to stir salt.')
  if (undissolvedSaltG(state) <= 0) return reject(state, 'No undissolved salt remains to disperse.')

  // The core engine decides how much dissolves (rate × time, solubility room, available solid).
  const tick = simulateTick(chemistry, saltStateToLabState(state), elapsedMs / 1000, {
    stirring: ['beaker'],
  })
  const dissolvedNow = tick.events.reduce(
    (sum, event) =>
      event.type === 'dissolved' && event.containerId === 'beaker' ? sum + event.amount : sum,
    0,
  )
  if (dissolvedNow <= 0)
    return reject(
      state,
      'The demonstration solubility limit has been reached. Add more water before stirring again.',
    )
  // Clamp the sum itself: decimal rounding must never create dissolved mass
  // beyond the available solid or the water-dependent saturation ceiling.
  const newDissolved = Math.min(
    state.saltInBeakerG,
    maximumDissolvedSaltG(state),
    state.dissolvedSaltG + dissolvedNow,
  )
  if (newDissolved <= state.dissolvedSaltG)
    return reject(state, 'The stirring interval is too small to change dissolved mass.')
  return {
    ok: true,
    state: {
      ...state,
      dissolvedSaltG: newDissolved,
      operations: state.operations + 1,
      stirCount: state.stirCount + 1,
    },
    message: `Stirred: ${dissolvedNow.toFixed(2)} g more NaCl represented as dissolved ions; ${Math.max(0, state.saltInBeakerG - newDissolved).toFixed(2)} g undissolved.`,
    effect: {
      kind: 'stirring',
      sourceId: 'stirring-rod',
      targetId: 'beaker',
      amount: dissolvedNow,
      durationMs: elapsedMs,
    },
  }
}
