/**
 * L5 bench liquids (pure): which bench items hold liquid, the chemistry they use (L1 engine),
 * pour geometry and the tilt → flow model. Practice equipment only: the experiment's own
 * chemistry-linked items keep their guided salt workflow.
 */
import type {
  ChemistryDefinition,
  ContainerDefinition,
  ContentEntry,
  SubstanceDefinition,
} from '../engine/core/index.ts'
import {
  getLiquidSurfaceHeight,
  POUR_SOURCE_DIMENSIONS,
  RECEIVER_RIM_HEIGHTS,
} from '../three/equipmentPose.ts'
import {
  getLibraryModel,
  getModelAnchors,
  getVesselFill,
} from '../three/models/library/modelSpecs.ts'
import { instanceTypeId, isChemistryLinked, resolveEquipment } from '../three/sceneConfig.ts'
import { HYDROCHLORIC_ACID_PARTICLES, WATER_PARTICLES } from '../data/particleSpecies.ts'

/** One drop from the dropper (mL). */
export const DROP_ML = 0.05
/** Dropper bulb capacity (mL). */
export const DROPPER_CAPACITY_ML = 1

/**
 * 1.0 M hydrochloric acid is modelled as one liquid. Its "molar mass" is grams of SOLUTION per
 * mole of HCl (1.02 g/mL ÷ 0.001 mol/mL), so the engine's pH model sees 1.0 mol/L of acid.
 */
export const BENCH_SUBSTANCES: readonly SubstanceDefinition[] = [
  {
    id: 'water',
    name: 'Deionised water',
    formula: 'H₂O',
    state: 'liquid',
    color: '#cde1f2',
    opacity: 0.15,
    densityGPerMl: 1,
    boilingPointC: 100,
    particles: WATER_PARTICLES,
  },
  {
    id: 'hydrochloric-acid',
    name: 'Hydrochloric acid 1.0 M',
    formula: 'HCl(aq)',
    state: 'liquid',
    color: '#cde1f2',
    opacity: 0.15,
    densityGPerMl: 1.02,
    molarMassGPerMol: 1020,
    // Dilute acid boils just above water (teaching value).
    boilingPointC: 100.5,
    particles: HYDROCHLORIC_ACID_PARTICLES,
    acidBase: { type: 'acid', equivalentsPerMol: 1 },
    hazards: ['corrosive'],
  },
]

interface BenchContainerType {
  capacityMl: number
  /** Maximum pouring flow at full tilt (mL/s). 0 = cannot pour (e.g. the dropper). */
  maxFlowMlPerS: number
  initialContents?: readonly ContentEntry[]
  /** Source geometry for the pour pose (rim height, lip reach from the axis). */
  rim: number
  lipRadius: number
}

/** Practice copies of the salt models (beaker~2, graduated-cylinder~2) hold liquid too. */
const SALT_COPY_TYPES: Readonly<Record<string, { capacityMl: number; maxFlowMlPerS: number }>> = {
  beaker: { capacityMl: 250, maxFlowMlPerS: 30 },
  'graduated-cylinder': { capacityMl: 100, maxFlowMlPerS: 15 },
}

/** Library vessels on stands are not pour sources yet (burette tap / funnel tap come with L8). */
const NOT_POURABLE = new Set(['burette', 'separating-funnel', 'spirit-lamp'])

const typeCache = new Map<string, BenchContainerType | null>()

/** Liquid-holding description of an equipment type, or null. */
export function benchContainerType(typeId: string): BenchContainerType | null {
  if (typeCache.has(typeId)) return typeCache.get(typeId)!
  let result: BenchContainerType | null = null
  const salt = SALT_COPY_TYPES[typeId]
  const dims = POUR_SOURCE_DIMENSIONS[typeId]
  if (salt && dims) {
    result = { ...salt, rim: dims.rim, lipRadius: dims.radius }
  } else if (typeId === 'wash-bottle') {
    // Squeeze bottle: delivers through its angled nozzle.
    result = {
      capacityMl: 500,
      maxFlowMlPerS: 20,
      initialContents: [{ substanceId: 'water', amount: 450 }],
      rim: 0.62,
      lipRadius: 0.22,
    }
  } else if (typeId === 'dropper') {
    result = { capacityMl: DROPPER_CAPACITY_ML, maxFlowMlPerS: 0, rim: 0.05, lipRadius: 0.2 }
  } else if (typeId !== 'spirit-lamp') {
    const spec = getLibraryModel(typeId)
    const anchors = getModelAnchors(typeId)
    if (spec?.vessel && anchors) {
      const mouthRadius = anchors.pourLip[0] - anchors.mouth[0]
      const contents = spec.vessel.contents
      result = {
        capacityMl: spec.vessel.capacityMl,
        // Wider mouths pour faster (teaching model, roughly 120 mL/s per metre of radius).
        maxFlowMlPerS: NOT_POURABLE.has(typeId)
          ? 0
          : Math.round(Math.min(40, Math.max(4, 120 * mouthRadius))),
        initialContents:
          typeId === 'hydrochloric-acid' && contents
            ? [{ substanceId: 'hydrochloric-acid', amount: contents.volumeMl }]
            : undefined,
        rim: anchors.mouth[1],
        lipRadius: mouthRadius,
      }
    }
  }
  typeCache.set(typeId, result)
  return result
}

/** Bench items that take part in practice pouring (practice copies and library vessels). */
export function isBenchLiquidContainer(id: string) {
  return (
    !isChemistryLinked(id) && !!resolveEquipment(id) && !!benchContainerType(instanceTypeId(id))
  )
}

export function canPourFrom(id: string) {
  return (
    isBenchLiquidContainer(id) && (benchContainerType(instanceTypeId(id))?.maxFlowMlPerS ?? 0) > 0
  )
}

export function benchContainerDefinition(id: string): ContainerDefinition | null {
  if (!isBenchLiquidContainer(id)) return null
  const type = benchContainerType(instanceTypeId(id))!
  return {
    id,
    label: resolveEquipment(id)?.label ?? id,
    equipmentId: id,
    capacity: { value: type.capacityMl, unit: 'mL' },
    accepts: ['liquid', 'aqueous'],
    open: true,
    // Copies start empty; only the first bottle of a reagent starts filled.
    initialContents: id === instanceTypeId(id) ? type.initialContents : undefined,
  }
}

/** Chemistry definition for the containers currently on the bench. */
export function buildBenchDefinition(ids: readonly string[]): ChemistryDefinition {
  return {
    schemaVersion: 1,
    ambientTemperatureC: 22,
    coolingPerSecond: 0.02,
    substances: BENCH_SUBSTANCES,
    containers: ids
      .map(benchContainerDefinition)
      .filter((container): container is ContainerDefinition => container !== null),
    processes: BENCH_PROCESSES,
    reactions: [],
  }
}

/** L7: heated liquids at their boiling point boil away (mL/s, teaching speed). */
export const BOIL_OFF_ML_PER_S = 0.25
const BENCH_PROCESSES: ChemistryDefinition['processes'] = [
  {
    kind: 'evaporation',
    id: 'water-boils',
    substanceId: 'water',
    rateMlPerSecond: BOIL_OFF_ML_PER_S,
  },
  {
    kind: 'evaporation',
    id: 'acid-boils',
    substanceId: 'hydrochloric-acid',
    rateMlPerSecond: BOIL_OFF_ML_PER_S,
  },
]

// ---------------------------------------------------------------------------
// Tilt → flow
// ---------------------------------------------------------------------------

export const MAX_TILT = Math.PI / 2

/**
 * Tilt (radians) at which liquid reaches the lip: a full vessel pours almost at once, a nearly
 * empty one must be tipped far over.
 */
export function pourStartAngle(fillFraction: number) {
  const fill = Math.max(0, Math.min(1, Number.isFinite(fillFraction) ? fillFraction : 0))
  return 0.22 + (1 - fill) * 1.05
}

/** Flow (mL/s) for a tilt: zero below the start angle, rising to the vessel's maximum. */
export function flowRateMlPerS(angle: number, fillFraction: number, maxFlowMlPerS: number) {
  if (!(maxFlowMlPerS > 0) || !Number.isFinite(angle) || fillFraction <= 0) return 0
  const start = pourStartAngle(fillFraction)
  const over = (Math.min(angle, MAX_TILT) - start) / 0.45
  if (over <= 0) return 0
  const t = Math.min(1, over)
  return maxFlowMlPerS * t * t
}

/** A tilt that pours steadily for the keyboard "Pour N mL" buttons. */
export function steadyPourAngle(fillFraction: number) {
  return Math.min(MAX_TILT, pourStartAngle(fillFraction) + 0.4)
}

// ---------------------------------------------------------------------------
// Geometry used by the pour pose, stream and readout
// ---------------------------------------------------------------------------

/** Rim height and lip reach of a pouring source (for getPourPose). */
export function pourSourceDimensions(id: string) {
  const exact = POUR_SOURCE_DIMENSIONS[id]
  if (exact) return exact
  const type = benchContainerType(instanceTypeId(id))
  return type ? { rim: type.rim, radius: type.lipRadius } : undefined
}

/** Receiver rim height (the source lip stays above it). */
export function receiverRimHeight(id: string) {
  const exact = RECEIVER_RIM_HEIGHTS[id]
  if (exact !== undefined) return exact
  const typeId = instanceTypeId(id)
  if (RECEIVER_RIM_HEIGHTS[typeId] !== undefined) return RECEIVER_RIM_HEIGHTS[typeId]
  return benchContainerType(typeId)?.rim
}

/** Liquid surface height above the bench for a volume in a container (model frame). */
export function liquidSurfaceY(id: string, volumeMl: number) {
  const typeId = instanceTypeId(id)
  if (SALT_COPY_TYPES[typeId]) return getLiquidSurfaceHeight(typeId, volumeMl)
  const fill = getVesselFill(typeId)
  const anchors = getModelAnchors(typeId)
  if (fill && anchors) return anchors.liquidBase - fill.floorY + fill.heightForVolume(volumeMl)
  return receiverRimHeight(id) ?? 0.1
}

/** Readouts are shown to 0.1 mL. */
export function formatMl(value: number) {
  // The small offset keeps float dust (0.8499999…) from rounding a true 0.85 down.
  const rounded = Math.round((Number.isFinite(value) ? value : 0) * 10 + 1e-9) / 10
  return `${(Object.is(rounded, -0) ? 0 : rounded).toFixed(1)} mL`
}
