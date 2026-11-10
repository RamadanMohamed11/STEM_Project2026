/** Durable, plain-data boundary. No rendering objects, actions or transient UI are stored. */
import { saltExperimentDefinition as definition } from '../data/saltExperimentDefinition.ts'
import { saltCoreExperiment } from '../data/saltCoreDefinition.ts'
import { isValidSaltExperimentState } from '../engine/saltExperiment.ts'
import { transferStateIsValid } from '../engine/materialTransfers.ts'
import { isSimulationEvent, type SimulationEvent } from '../engine/simulationEvents.ts'
import { transitionWorkflow } from '../engine/workflow.ts'
import type { SaltExperimentState } from '../engine/types.ts'
import type { WorkflowState, WorkflowValidation } from '../engine/workflowTypes.ts'
import type { LabState } from '../engine/core/index.ts'
import type { BenchSnapshot } from '../state/useLabSceneStore.ts'
import type { LabMistake, LabMode } from '../state/useLabSafetyStore.ts'
import type { MeasurementRow } from './measurementLog.ts'
import { QUANTITY_UNITS } from './measurementLog.ts'
import { buildBenchDefinition, isBenchLiquidContainer } from './benchLiquids.ts'
import { isHeatSource } from './benchHeating.ts'
import { isKnownEquipment, EQUIPMENT_LIMITS } from '../three/sceneConfig.ts'
import { getHazard } from '../../safety/data/hazards.ts'

export const LAB_SESSION_VERSION = 1
export const labSessionKey = (experimentId: string) => `stem-lab-session:${experimentId}`

export interface LabSessionSnapshot {
  version: typeof LAB_SESSION_VERSION
  experimentId: string
  definitionId: string
  definitionVersion: string
  coreVersion: string
  scene: BenchSnapshot
  bench: { lab: LabState; lit: readonly string[]; spilledTotalMl: number }
  safety: { mode: LabMode; mistakes: readonly LabMistake[] }
  measurements: {
    startedAtMs: number | null
    rows: readonly MeasurementRow[]
    tare: Readonly<Record<string, number>>
    /** A running stopwatch resumes paused, with its reading retained. */
    elapsedS: number
  }
  salt: {
    experiment: SaltExperimentState
    workflow: WorkflowState
    events: readonly SimulationEvent[]
    guidedResumeIssue: string | null
    pausedEquipmentIds: readonly string[] | null
  }
}

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const number = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
const text = (v: unknown, max = 2000): v is string => typeof v === 'string' && v.length <= max
const ids = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.length <= 300 &&
  v.every((id) => text(id, 100) && isKnownEquipment(id)) &&
  new Set(v).size === v.length
const safeKeys = (v: Record<string, unknown>) =>
  Object.keys(v).every((key) => !['__proto__', 'constructor', 'prototype'].includes(key))
const values = (v: unknown, check: (value: unknown, key: string) => boolean, max = 5000) =>
  record(v) &&
  safeKeys(v) &&
  Object.keys(v).length <= max &&
  Object.entries(v).every(([key, value]) => check(value, key))
const validation = (v: unknown): v is WorkflowValidation =>
  record(v) &&
  typeof v.valid === 'boolean' &&
  text(v.code, 100) &&
  text(v.message) &&
  ['success', 'info', 'warning', 'error'].includes(v.severity as string) &&
  definition.steps.some((step) => step.id === v.stepId)

function validScene(scene: BenchSnapshot) {
  if (!record(scene) || !ids(scene.placedIds)) return false
  const placed = scene.placedIds
  if (
    !values(
      scene.positions,
      (p, id) =>
        placed.includes(id) &&
        record(p) &&
        number(p.x, EQUIPMENT_LIMITS.minX, EQUIPMENT_LIMITS.maxX) &&
        number(p.z, EQUIPMENT_LIMITS.minZ, EQUIPMENT_LIMITS.maxZ),
      300,
    ) ||
    placed.some((id) => !scene.positions[id])
  )
    return false
  if (
    !values(scene.rotations, (n, id) => placed.includes(id) && number(n, -1e6, 1e6), 300) ||
    placed.some((id) => scene.rotations[id] === undefined)
  )
    return false
  if (
    !values(
      scene.relationships,
      (r, id) =>
        record(r) &&
        r.actorId === id &&
        placed.includes(id) &&
        placed.includes(r.targetId as string) &&
        r.targetId !== id &&
        [
          'snapped',
          'liquid-receiver',
          'solid-receiver',
          'insertion',
          'balance-contact',
          'scoop',
          'solid-deposit',
        ].includes(r.kind as string),
      300,
    )
  )
    return false
  // Holder chains must be acyclic; corrupt chains can otherwise recurse in scene layout.
  return placed.every((id) => {
    const seen = new Set<string>()
    let at: string | undefined = id
    while (at && scene.relationships[at]?.kind === 'snapped') {
      if (seen.has(at)) return false
      seen.add(at)
      at = scene.relationships[at]?.targetId
    }
    return true
  })
}

function validBench(bench: LabSessionSnapshot['bench'], placed: readonly string[]) {
  if (
    !record(bench) ||
    !record(bench.lab) ||
    !number(bench.lab.timeS) ||
    !number(bench.spilledTotalMl) ||
    !ids(bench.lit) ||
    !bench.lit.every((id) => placed.includes(id) && isHeatSource(id))
  )
    return false
  const expected = placed.filter(isBenchLiquidContainer)
  const chemistry = buildBenchDefinition(expected)
  return (
    values(
      bench.lab.containers,
      (v, id) => {
        const container = chemistry.containers.find((item) => item.id === id)
        if (
          !container ||
          !record(v) ||
          !number(v.temperatureC, 0, 300) ||
          !values(
            v.contents,
            (amount, substance) =>
              number(amount, 0, 10000) &&
              chemistry.substances.some((item) => item.id === substance),
            10,
          )
        )
          return false
        // Bench substances are liquids, and their core amounts are mL.
        return (
          Object.values(v.contents as Record<string, number>).reduce((sum, n) => sum + n, 0) <=
          container.capacity.value + 0.000001
        )
      },
      300,
    ) && Object.keys(bench.lab.containers).length === expected.length
  )
}

function validWorkflow(
  workflow: WorkflowState,
  chemistry: SaltExperimentState,
  placed: readonly string[],
) {
  if (
    !record(workflow) ||
    !Number.isInteger(workflow.stepIndex) ||
    !definition.steps[workflow.stepIndex] ||
    !validation(workflow.validation) ||
    !record(workflow.measurements) ||
    ![workflow.measurements.waterMl, workflow.measurements.saltG].every(
      (n) => n === null || number(n, 0, 1000),
    ) ||
    ![
      workflow.safetyAcknowledged,
      workflow.observationRecorded,
      workflow.reviewRecorded,
      workflow.completed,
    ].every((v) => typeof v === 'boolean') ||
    !values(
      workflow.commandEvidence,
      (n, id) =>
        definition.steps.some((step) => step.id === id) && Number.isSafeInteger(n) && number(n),
    ) ||
    (workflow.eventEvidence !== undefined &&
      !values(workflow.eventEvidence, (v, key) => v === true && text(key, 600))) ||
    !isValidSaltExperimentState(workflow.chemistryCheckpoint) ||
    !transferStateIsValid(workflow.chemistryCheckpoint, workflow, false) ||
    !transferStateIsValid(chemistry, workflow, false)
  )
    return false
  const step = definition.steps[workflow.stepIndex]
  if (
    workflow.stageIndex !== definition.stages.findIndex((stage) => stage.id === step.stageId) ||
    (workflow.stepIndex > 0 && !workflow.safetyAcknowledged)
  )
    return false
  // Stored completion must still satisfy the existing engine. Never advance on restore.
  return (
    !workflow.completed ||
    (workflow.stepIndex === definition.steps.length - 1 &&
      transitionWorkflow(
        definition,
        { ...workflow, completed: false },
        workflow.chemistryCheckpoint,
        placed,
        { kind: 'validate-step' },
      ).state.completed)
  )
}

function validMeasurements(log: LabSessionSnapshot['measurements']) {
  if (
    !record(log) ||
    !(log.startedAtMs === null || number(log.startedAtMs)) ||
    !number(log.elapsedS) ||
    !values(log.tare, (n, id) => isKnownEquipment(id) && number(n, -1e6, 1e6), 300) ||
    !Array.isArray(log.rows) ||
    log.rows.length > 10000
  )
    return false
  const instrumentQuantity = {
    balance: 'mass',
    thermometer: 'temperature',
    'ph-paper': 'pH',
    stopwatch: 'time',
  }
  return (
    new Set(log.rows.map((r) => r?.id)).size === log.rows.length &&
    log.rows.every(
      (r) =>
        record(r) &&
        text(r.id, 100) &&
        number(r.timeS) &&
        text(r.targetLabel, 200) &&
        (r.targetId === '' || (text(r.targetId, 100) && isKnownEquipment(r.targetId))) &&
        text(r.instrument, 30) &&
        Object.hasOwn(instrumentQuantity, r.instrument) &&
        instrumentQuantity[r.instrument as keyof typeof instrumentQuantity] === r.quantity &&
        text(r.quantity, 30) &&
        Object.hasOwn(QUANTITY_UNITS, r.quantity) &&
        r.unit === QUANTITY_UNITS[r.quantity as keyof typeof QUANTITY_UNITS] &&
        number(r.value, -1e9, 1e9),
    )
  )
}

function validSafety(safety: LabSessionSnapshot['safety']) {
  return (
    record(safety) &&
    ['guided', 'free'].includes(safety.mode) &&
    Array.isArray(safety.mistakes) &&
    safety.mistakes.length <= 1000 &&
    safety.mistakes.every(
      (m) =>
        record(m) &&
        text(m.id, 100) &&
        text(m.kind, 30) &&
        ['safety', 'step'].includes(m.kind) &&
        text(m.key, 400) &&
        text(m.title, 300) &&
        text(m.explanation) &&
        text(m.severity, 30) &&
        ['warning', 'danger', 'error'].includes(m.severity) &&
        Number.isSafeInteger(m.count) &&
        number(m.count, 1) &&
        (m.hazard === undefined || (text(m.hazard, 100) && !!getHazard(m.hazard))) &&
        (m.targetId === undefined || (text(m.targetId, 100) && isKnownEquipment(m.targetId))) &&
        (m.ruleId === undefined || text(m.ruleId, 100)),
    )
  )
}

function validEvent(value: unknown): value is SimulationEvent {
  if (!isSimulationEvent(value)) return false
  if (
    'sourceId' in value &&
    (!isKnownEquipment(value.sourceId) || !isKnownEquipment(value.targetId))
  )
    return false
  if ('toolId' in value && (!isKnownEquipment(value.toolId) || !isKnownEquipment(value.targetId)))
    return false
  if ('equipmentId' in value && !isKnownEquipment(value.equipmentId)) return false
  if (
    value.type === 'MATERIAL_TRANSFER_COMPLETED' ||
    value.type === 'MATERIAL_TRANSFER_INTERRUPTED'
  ) {
    const match = /^material-transfer-(\d+)$/.exec(value.operationId)
    return (
      value.experimentId === definition.experimentId &&
      text(value.requestId, 300) &&
      !!match &&
      number(Number(match[1]), 1, Number.MAX_SAFE_INTEGER - 1) &&
      value.sequence < Number.MAX_SAFE_INTEGER
    )
  }
  return true
}

/** A new schema/definition deliberately starts fresh; no unsafe guessing at old layouts. */
export function migrateLabSession(value: unknown, experimentId: string): LabSessionSnapshot | null {
  try {
    if (
      !record(value) ||
      value.version !== LAB_SESSION_VERSION ||
      value.experimentId !== experimentId ||
      experimentId !== definition.experimentId ||
      value.definitionId !== definition.id ||
      value.definitionVersion !== definition.version ||
      value.coreVersion !== saltCoreExperiment.version
    )
      return null
    const snapshot = value as unknown as LabSessionSnapshot
    const salt = snapshot.salt
    if (
      !validScene(snapshot.scene) ||
      !validBench(snapshot.bench, snapshot.scene.placedIds) ||
      !validMeasurements(snapshot.measurements) ||
      !validSafety(snapshot.safety) ||
      !record(salt) ||
      !isValidSaltExperimentState(salt.experiment) ||
      !validWorkflow(salt.workflow, salt.experiment, snapshot.scene.placedIds) ||
      !(salt.guidedResumeIssue === null || text(salt.guidedResumeIssue)) ||
      !(salt.pausedEquipmentIds === null || ids(salt.pausedEquipmentIds)) ||
      !Array.isArray(salt.events) ||
      salt.events.length > 10000 ||
      !salt.events.every(validEvent)
    )
      return null
    if (
      snapshot.safety.mode === 'guided' &&
      !salt.guidedResumeIssue &&
      !transferStateIsValid(salt.experiment, salt.workflow)
    )
      return null
    return snapshot
  } catch {
    return null
  }
}

export function decodeLabSession(json: string | null, experimentId: string) {
  try {
    return json && json.length <= 4_000_000
      ? migrateLabSession(JSON.parse(json), experimentId)
      : null
  } catch {
    return null
  }
}
