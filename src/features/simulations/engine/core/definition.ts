import { amountOf, getSubstance, readPh, readTemperatureC, readVolumeMl } from './state.ts'
import type { ChemistryDefinition, LabState, PhysicalState } from './types.ts'

/**
 * Data-only description of an experiment for the generic engine. New experiments are added by
 * writing one of these (plus any missing substances/rules); no engine code is needed.
 */
export type ComparisonOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'

export type Criterion =
  | {
      kind: 'amount'
      containerId: string
      substanceId: string
      operator: ComparisonOperator
      value: number
    }
  | { kind: 'volume'; containerId: string; operator: ComparisonOperator; value: number }
  | { kind: 'temperature'; containerId: string; operator: ComparisonOperator; value: number }
  | { kind: 'ph'; containerId: string; operator: ComparisonOperator; value: number }

/** Declarative guided step: an expected action plus checks that must hold afterwards. */
export interface GuidedStepDefinition {
  id: string
  title: string
  instruction: string
  expectedAction:
    | { kind: 'transfer'; from: string; to: string; substanceId: string }
    | { kind: 'stir'; containerId: string }
    | { kind: 'heat'; containerId: string }
    | { kind: 'observe' }
  completeWhen: readonly Criterion[]
}

export interface CoreExperimentDefinition {
  schemaVersion: 1
  id: string
  experimentId: string
  version: string
  title: string
  chemistry: ChemistryDefinition
  /** Inventory ids offered in guided mode (free mode may offer the full catalogue). */
  allowedEquipment: readonly string[]
  allowedSubstances: readonly string[]
  guidedSteps?: readonly GuidedStepDefinition[]
  successCriteria: readonly Criterion[]
  /** Hazard ids shown before and during the experiment. */
  hazards: readonly string[]
}

/** Floating-point tolerance for criteria comparisons (g, mL, °C, pH). */
export const CRITERION_TOLERANCE = 1e-6

export function compare(actual: number, operator: ComparisonOperator, expected: number) {
  switch (operator) {
    case 'eq':
      return Math.abs(actual - expected) <= CRITERION_TOLERANCE
    case 'ne':
      return Math.abs(actual - expected) > CRITERION_TOLERANCE
    case 'gt':
      return actual > expected + CRITERION_TOLERANCE
    case 'gte':
      return actual >= expected - CRITERION_TOLERANCE
    case 'lt':
      return actual < expected - CRITERION_TOLERANCE
    case 'lte':
      return actual <= expected + CRITERION_TOLERANCE
  }
}

export function evaluateCriterion(
  chemistry: ChemistryDefinition,
  state: LabState,
  criterion: Criterion,
): boolean {
  let actual: number | null
  switch (criterion.kind) {
    case 'amount':
      actual = amountOf(state, criterion.containerId, criterion.substanceId)
      break
    case 'volume':
      actual = readVolumeMl(chemistry, state, criterion.containerId)
      break
    case 'temperature':
      actual = readTemperatureC(state, criterion.containerId)
      break
    case 'ph':
      actual = readPh(chemistry, state, criterion.containerId)
      break
  }
  return actual !== null && compare(actual, criterion.operator, criterion.value)
}

export function evaluateCriteria(
  chemistry: ChemistryDefinition,
  state: LabState,
  criteria: readonly Criterion[],
) {
  return criteria.every((criterion) => evaluateCriterion(chemistry, state, criterion))
}

// ---------------------------------------------------------------------------
// Runtime validation (hand-written guards; definitions may come from JSON/admin data later)
// ---------------------------------------------------------------------------

export interface DefinitionIssue {
  path: string
  message: string
}

const STATES: readonly PhysicalState[] = ['solid', 'liquid', 'aqueous', 'gas']
const OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte']
const EFFECTS = [
  'colorChange',
  'precipitate',
  'gas',
  'flame',
  'smoke',
  'heat',
  'explosion',
  'dissolve',
]
const ID = /^[a-z0-9][a-z0-9-]{0,79}$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isPositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
const isNonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

/** Mass of one stoichiometric side in grams (liquids via density, default 1 g/mL). */
function sideMass(
  chemistry: ChemistryDefinition,
  entries: readonly { substanceId: string; amount: number }[],
) {
  return entries.reduce((sum, entry) => {
    const substance = getSubstance(chemistry, entry.substanceId)
    return (
      sum +
      (substance?.state === 'liquid' ? entry.amount * (substance.densityGPerMl ?? 1) : entry.amount)
    )
  }, 0)
}

export function validateChemistryDefinition(input: unknown): DefinitionIssue[] {
  const issues: DefinitionIssue[] = []
  const add = (path: string, message: string) => issues.push({ path, message })
  if (!isRecord(input)) return [{ path: '', message: 'Chemistry definition must be an object.' }]
  if (input.schemaVersion !== 1) add('schemaVersion', 'Unsupported schema version.')
  if (typeof input.ambientTemperatureC !== 'number' || !Number.isFinite(input.ambientTemperatureC))
    add('ambientTemperatureC', 'Must be a number.')
  if (!isNonNegative(input.coolingPerSecond)) add('coolingPerSecond', 'Must be ≥ 0.')
  for (const key of ['substances', 'containers', 'processes', 'reactions'])
    if (!Array.isArray(input[key])) add(key, 'Must be an array.')
  if (issues.length) return issues

  const chemistry = input as unknown as ChemistryDefinition
  const substanceIds = new Set<string>()
  chemistry.substances.forEach((substance, i) => {
    const path = `substances[${i}]`
    if (!isRecord(substance) || typeof substance.id !== 'string' || !ID.test(substance.id))
      return add(path, 'Substance needs a lowercase id.')
    if (substanceIds.has(substance.id)) add(path, `Duplicate substance id "${substance.id}".`)
    substanceIds.add(substance.id)
    if (!STATES.includes(substance.state)) add(`${path}.state`, 'Unknown physical state.')
    if (typeof substance.name !== 'string' || !substance.name.trim())
      add(`${path}.name`, 'Name required.')
    if (typeof substance.formula !== 'string') add(`${path}.formula`, 'Formula required.')
    if (!/^#[0-9a-f]{6}$/i.test(substance.color)) add(`${path}.color`, 'Colour must be #rrggbb.')
    if (substance.acidBase && !isPositive(substance.molarMassGPerMol))
      add(`${path}.molarMassGPerMol`, 'Acids/bases need a molar mass.')
    if (substance.densityGPerMl !== undefined && !isPositive(substance.densityGPerMl))
      add(`${path}.densityGPerMl`, 'Density must be positive.')
  })

  const containerIds = new Set<string>()
  chemistry.containers.forEach((container, i) => {
    const path = `containers[${i}]`
    if (!isRecord(container) || typeof container.id !== 'string' || !ID.test(container.id))
      return add(path, 'Container needs a lowercase id.')
    if (containerIds.has(container.id)) add(path, `Duplicate container id "${container.id}".`)
    containerIds.add(container.id)
    if (
      !isRecord(container.capacity) ||
      !isPositive(container.capacity.value) ||
      !['g', 'mL'].includes(container.capacity.unit)
    )
      add(`${path}.capacity`, 'Capacity needs a positive value and unit g or mL.')
    if (!Array.isArray(container.accepts) || !container.accepts.every((s) => STATES.includes(s)))
      add(`${path}.accepts`, 'accepts must list physical states.')
    let used = 0
    for (const [j, entry] of (container.initialContents ?? []).entries()) {
      const substance = getSubstance(chemistry, entry.substanceId)
      if (!substance)
        add(`${path}.initialContents[${j}]`, `Unknown substance "${entry.substanceId}".`)
      else if (!container.accepts.includes(substance.state))
        add(`${path}.initialContents[${j}]`, `${container.id} does not accept ${substance.state}.`)
      if (!isPositive(entry.amount))
        add(`${path}.initialContents[${j}].amount`, 'Must be positive.')
      if (substance && (substance.state === 'liquid' ? 'mL' : 'g') === container.capacity?.unit)
        used += entry.amount
    }
    if (isRecord(container.capacity) && used > container.capacity.value + 1e-9)
      add(`${path}.initialContents`, 'Initial contents exceed capacity.')
  })

  chemistry.processes.forEach((process, i) => {
    const path = `processes[${i}]`
    if (process.kind === 'dissolution') {
      for (const key of ['soluteId', 'solventId', 'dissolvedId'] as const)
        if (!substanceIds.has(process[key]))
          add(`${path}.${key}`, `Unknown substance "${process[key]}".`)
      if (!isNonNegative(process.solubilityGPer100Ml))
        add(`${path}.solubilityGPer100Ml`, 'Must be ≥ 0.')
      if (!isNonNegative(process.rateGPerSecondStirred))
        add(`${path}.rateGPerSecondStirred`, 'Must be ≥ 0.')
      if (getSubstance(chemistry, process.solventId)?.state !== 'liquid')
        add(`${path}.solventId`, 'Solvent must be a liquid.')
      if (getSubstance(chemistry, process.dissolvedId)?.state !== 'aqueous')
        add(`${path}.dissolvedId`, 'Dissolved species must be aqueous.')
    } else if (process.kind === 'evaporation') {
      const substance = getSubstance(chemistry, process.substanceId)
      if (substance?.state !== 'liquid' || substance.boilingPointC === undefined)
        add(`${path}.substanceId`, 'Evaporation needs a liquid with a boiling point.')
      if (!isPositive(process.rateMlPerSecond)) add(`${path}.rateMlPerSecond`, 'Must be positive.')
    } else add(path, 'Unknown process kind.')
  })

  const ruleIds = new Set<string>()
  chemistry.reactions.forEach((rule, i) => {
    const path = `reactions[${i}]`
    if (!ID.test(rule.id ?? '')) add(`${path}.id`, 'Reaction needs a lowercase id.')
    if (ruleIds.has(rule.id)) add(`${path}.id`, `Duplicate reaction id "${rule.id}".`)
    ruleIds.add(rule.id)
    if (!Array.isArray(rule.reactants) || rule.reactants.length === 0)
      add(`${path}.reactants`, 'At least one reactant.')
    if (!Array.isArray(rule.products) || rule.products.length === 0)
      add(`${path}.products`, 'At least one product.')
    for (const entry of [
      ...(rule.reactants ?? []),
      ...(rule.products ?? []),
      ...(rule.conditions?.catalystIds ?? []).map((substanceId) => ({ substanceId, amount: 1 })),
    ]) {
      if (!substanceIds.has(entry.substanceId))
        add(path, `Unknown substance "${entry.substanceId}".`)
      if (!isPositive(entry.amount))
        add(path, `Amount for "${entry.substanceId}" must be positive.`)
    }
    if (!isPositive(rule.ratePerSecond)) add(`${path}.ratePerSecond`, 'Must be positive.')
    if (!Array.isArray(rule.effects) || !rule.effects.every((e) => EFFECTS.includes(e)))
      add(`${path}.effects`, 'Unknown effect.')
    if (typeof rule.observation !== 'string' || !rule.observation.trim())
      add(`${path}.observation`, 'Observation text required.')
    if (
      Array.isArray(rule.reactants) &&
      Array.isArray(rule.products) &&
      issues.every((issue) => !issue.path.startsWith(path))
    ) {
      const before = sideMass(chemistry, rule.reactants)
      const after = sideMass(chemistry, rule.products)
      if (Math.abs(before - after) > Math.max(1e-6, before * 0.01))
        add(path, `Mass is not conserved (${before.toFixed(3)} g → ${after.toFixed(3)} g).`)
    }
  })
  return issues
}

function validateCriteria(
  chemistry: ChemistryDefinition,
  criteria: unknown,
  path: string,
  add: (path: string, message: string) => void,
) {
  if (!Array.isArray(criteria)) return add(path, 'Must be an array of criteria.')
  const containerIds = new Set(chemistry.containers.map((c) => c.id))
  criteria.forEach((criterion, i) => {
    if (!isRecord(criterion)) return add(`${path}[${i}]`, 'Criterion must be an object.')
    if (!['amount', 'volume', 'temperature', 'ph'].includes(String(criterion.kind)))
      add(`${path}[${i}].kind`, 'Unknown criterion kind.')
    if (!containerIds.has(String(criterion.containerId)))
      add(`${path}[${i}].containerId`, 'Unknown container.')
    if (criterion.kind === 'amount' && !getSubstance(chemistry, String(criterion.substanceId)))
      add(`${path}[${i}].substanceId`, 'Unknown substance.')
    if (!OPERATORS.includes(String(criterion.operator)))
      add(`${path}[${i}].operator`, 'Unknown operator.')
    if (typeof criterion.value !== 'number' || !Number.isFinite(criterion.value))
      add(`${path}[${i}].value`, 'Must be a number.')
  })
}

export function validateExperimentDefinition(input: unknown): DefinitionIssue[] {
  if (!isRecord(input)) return [{ path: '', message: 'Experiment definition must be an object.' }]
  const issues = validateChemistryDefinition(input.chemistry).map((issue) => ({
    path: `chemistry.${issue.path}`,
    message: issue.message,
  }))
  const add = (path: string, message: string) => issues.push({ path, message })
  if (input.schemaVersion !== 1) add('schemaVersion', 'Unsupported schema version.')
  for (const key of ['id', 'experimentId', 'version', 'title'])
    if (typeof input[key] !== 'string' || !(input[key] as string).trim()) add(key, 'Required text.')
  for (const key of ['allowedEquipment', 'allowedSubstances', 'hazards'])
    if (
      !Array.isArray(input[key]) ||
      !(input[key] as unknown[]).every((v) => typeof v === 'string')
    )
      add(key, 'Must be a list of ids.')
  if (issues.length) return issues

  const definition = input as unknown as CoreExperimentDefinition
  for (const id of definition.allowedSubstances)
    if (!getSubstance(definition.chemistry, id))
      add('allowedSubstances', `Unknown substance "${id}".`)
  validateCriteria(definition.chemistry, definition.successCriteria, 'successCriteria', add)
  const containerIds = new Set(definition.chemistry.containers.map((c) => c.id))
  const stepIds = new Set<string>()
  ;(definition.guidedSteps ?? []).forEach((step, i) => {
    const path = `guidedSteps[${i}]`
    if (stepIds.has(step.id)) add(`${path}.id`, `Duplicate step id "${step.id}".`)
    stepIds.add(step.id)
    const action = step.expectedAction
    if (action.kind === 'transfer') {
      if (!containerIds.has(action.from) || !containerIds.has(action.to))
        add(`${path}.expectedAction`, 'Unknown container.')
      if (!getSubstance(definition.chemistry, action.substanceId))
        add(`${path}.expectedAction`, 'Unknown substance.')
    } else if (
      (action.kind === 'stir' || action.kind === 'heat') &&
      !containerIds.has(action.containerId)
    )
      add(`${path}.expectedAction`, 'Unknown container.')
    validateCriteria(definition.chemistry, step.completeWhen, `${path}.completeWhen`, add)
  })
  return issues
}

export function isValidExperimentDefinition(input: unknown): input is CoreExperimentDefinition {
  return validateExperimentDefinition(input).length === 0
}
