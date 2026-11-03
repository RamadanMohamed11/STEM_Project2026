import type {
  LiquidContainerId,
  SaltExperimentState,
  SimulationActionKind,
  SimulationCommand,
  TransferDestination,
  TransitionResult,
} from './types.ts'

export const CAPACITIES_ML: Record<LiquidContainerId, number> = {
  water: 500,
  'graduated-cylinder': 100,
  beaker: 250,
}

export const INITIAL_WATER_ML = 400
export const INITIAL_SALT_STOCK_G = 100
/** Illustrative approximate NaCl solubility near 20°C, not calibrated to a measured experiment. */
export const SOLUBILITY_G_PER_100ML = 35.9
/** Deliberately simplified: each confirmed stirring action disperses at most 4 g. */
export const STIR_DISSOLUTION_G_PER_ACTION = 4

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
  return Math.max(0, Number((state.saltInBeakerG - state.dissolvedSaltG).toFixed(4)))
}

export function maximumDissolvedSaltG(state: SaltExperimentState) {
  return (state.waterMl.beaker * SOLUBILITY_G_PER_100ML) / 100
}

export function isDemonstrationComplete(state: SaltExperimentState) {
  return (
    state.waterMl.beaker > 0 &&
    state.saltInBeakerG > 0 &&
    state.stirCount > 0 &&
    undissolvedSaltG(state) < 0.0001
  )
}

export function executeSaltCommand(
  state: SaltExperimentState,
  command: SimulationCommand,
  placedIds: readonly string[],
): TransitionResult {
  if (command.kind === 'pour')
    return pourWater(state, command.source, command.target, command.amountMl, placedIds)
  if (command.kind === 'scoop-salt') return scoopSalt(state, command.massG, placedIds)
  if (command.kind === 'deposit-salt') return depositSalt(state, command.massG, placedIds)
  if (command.kind === 'add-substance')
    return addSalt(state, command.source, command.massG, placedIds)
  return stir(state, placedIds)
}

/** 5 g is the idealized capacity of this demonstration spatula. */
export const SPATULA_CAPACITY_G = 5
export const WEIGHING_BOAT_CAPACITY_G = 25

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
  return {
    ok: true,
    state: {
      ...state,
      saltStockG: state.saltStockG - massG,
      saltOnSpatulaG: state.saltOnSpatulaG + massG,
      operations: state.operations + 1,
    },
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
  return {
    ok: true,
    state: {
      ...state,
      saltOnSpatulaG: state.saltOnSpatulaG - massG,
      saltOnBoatG: state.saltOnBoatG + massG,
      operations: state.operations + 1,
    },
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
  const result: SaltExperimentState = {
    ...state,
    waterMl: {
      ...state.waterMl,
      [source]: state.waterMl[source] - amountMl,
      [target]: state.waterMl[target] + amountMl,
    },
    operations: state.operations + 1,
  }
  return {
    ok: true,
    state: result,
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
  return {
    ok: true,
    state: {
      ...state,
      saltStockG: state.saltStockG - (source === 'sodium-chloride' ? massG : 0),
      saltOnBoatG: state.saltOnBoatG - (source === 'weighing-boat' ? massG : 0),
      saltInBeakerG: state.saltInBeakerG + massG,
      operations: state.operations + 1,
    },
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

function stir(state: SaltExperimentState, placedIds: readonly string[]): TransitionResult {
  if (!onBench(placedIds, 'stirring-rod') || !onBench(placedIds, 'beaker'))
    return reject(state, 'Place the stirring rod and beaker on the bench first.')
  if (state.waterMl.beaker <= 0) return reject(state, 'The beaker must contain water to stir salt.')
  const undissolved = undissolvedSaltG(state)
  if (undissolved <= 0) return reject(state, 'No undissolved salt remains to disperse.')
  const room = Math.max(0, maximumDissolvedSaltG(state) - state.dissolvedSaltG)
  const dissolvedNow = Math.min(room, undissolved, STIR_DISSOLUTION_G_PER_ACTION)
  if (dissolvedNow <= 0)
    return reject(
      state,
      'The demonstration solubility limit has been reached. Add more water before stirring again.',
    )
  const newDissolved = Number((state.dissolvedSaltG + dissolvedNow).toFixed(4))
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
      durationMs: 1500,
    },
  }
}
