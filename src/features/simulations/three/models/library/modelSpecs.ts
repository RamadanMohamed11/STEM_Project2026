/**
 * L4 3D model library: one declarative spec per catalogue equipment id (pure data).
 * Dimensions are display metres (drawn larger than life, matching the existing salt models:
 * the 250 mL beaker is 0.78 tall). Y = 0 is the bench surface; models face +Z.
 * See docs/3D_MODELS.md for the template.
 */
import {
  beakerOutline,
  bottleOutline,
  createFillModel,
  cylinderOutline,
  erlenmeyerOutline,
  glassWall,
  pearOutline,
  roundBottomOutline,
  testTubeOutline,
  watchGlassOutline,
  type FillModel,
  type ProfilePoint,
} from './glassware.ts'
import type { MaterialKey, ModelPart, Vec3 } from './parts.ts'

export interface VesselSpec {
  /** Index of the `glass` part that holds liquid. */
  part: number
  capacityMl: number
  /** Height (in the glass part's frame) of the nominal-capacity line. */
  nominalY: number
  /** Static display contents (e.g. spirit in the lamp, acid in the bottle). */
  contents?: { volumeMl: number; color: string }
}

export interface LibraryModelSpec {
  id: string
  /** Short bench label (the catalogue keeps the full name). */
  label: string
  footprintRadius: number
  /** Collider height and overall model height. */
  height: number
  maxInstances?: number
  parts: readonly ModelPart[]
  vessel?: VesselSpec
}

// ---------------------------------------------------------------------------
// Small part helpers
// ---------------------------------------------------------------------------

const HALF_PI = Math.PI / 2

/** Horizontal rod along X, centred at (cx, y, cz). */
function rodX(
  length: number,
  radius: number,
  material: MaterialKey,
  at: Vec3,
  extra: { radiusTop?: number; segments?: number; color?: string } = {},
): ModelPart {
  return {
    kind: 'cylinder',
    radius,
    radiusTop: extra.radiusTop,
    height: length,
    material,
    color: extra.color,
    segments: extra.segments ?? 16,
    at,
    rot: [0, 0, HALF_PI],
  }
}

/** Vertical cylinder standing with its base at `baseY`. */
function post(
  height: number,
  radius: number,
  material: MaterialKey,
  x: number,
  baseY: number,
  z = 0,
  extra: { radiusTop?: number; segments?: number; color?: string } = {},
): ModelPart {
  return {
    kind: 'cylinder',
    radius,
    radiusTop: extra.radiusTop,
    height,
    material,
    color: extra.color,
    segments: extra.segments ?? 16,
    at: [x, baseY + height / 2, z],
  }
}

function box(
  size: Vec3,
  material: MaterialKey,
  at: Vec3,
  extra: { rot?: Vec3; color?: string } = {},
): ModelPart {
  return { kind: 'box', size, material, at, ...extra }
}

/** Lowest y of a lathe profile after rotating it by `angle` about Z (for items lying down). */
function lowestAfterZRotation(profile: readonly ProfilePoint[], angle: number) {
  let lowest = Infinity
  for (const [r, y] of profile) {
    for (const x of [r, -r]) lowest = Math.min(lowest, x * Math.sin(angle) + y * Math.cos(angle))
  }
  return lowest
}

function label(
  lines: readonly string[],
  width: number,
  height: number,
  at: Vec3,
  extra: { radius?: number; rot?: Vec3; background?: string; color?: string } = {},
): ModelPart {
  return {
    kind: 'label',
    lines,
    width,
    height,
    at,
    rot: extra.rot ?? [0, 0, 0],
    radius: extra.radius,
    background: extra.background,
    color: extra.color,
  }
}

const FLAT: Vec3 = [-HALF_PI, 0, 0]

// ---------------------------------------------------------------------------
// Shared heights used by snap rules
// ---------------------------------------------------------------------------

/** Height of the tripod's ring top (vessels and the gauze sit here). */
export const TRIPOD_TOP = 0.62
export const GAUZE_THICKNESS = 0.012
/** Height of the retort-stand clamp jaws, and the clamp's reach from the base centre. */
export const CLAMP_JAW_Y = 1.02
export const CLAMP_REACH = 0.32

// ---------------------------------------------------------------------------
// Glassware (L4a template: glass part + vessel fill calibration)
// ---------------------------------------------------------------------------

function beakerSpec(id: string, label_: string, capacity: number, r: number, h: number) {
  const outer = beakerOutline({ radius: r, height: h })
  const nominalY = h * 0.84
  const inner = glassWall(outer, 0.014).inner
  const bottomY = inner[0][1]
  return {
    id,
    label: label_,
    footprintRadius: r * 1.12 + 0.03,
    height: h + 0.02,
    maxInstances: 3,
    parts: [
      { kind: 'glass', outer, wall: 0.014 },
      {
        kind: 'graduations',
        capacityMl: capacity,
        stepMl: capacity / 10,
        labelEveryMl: capacity / 5,
        bottomY,
        maxHeight: nominalY - bottomY,
        radiusBottom: r * 1.005 + 0.002,
        radiusTop: r * 1.04,
      },
      label([`${capacity} mL`, 'APPROX. VOL.'], r * 0.75, h * 0.11, [0, h * 0.62, 0], {
        radius: r * 1.035,
        rot: [0, 1.7, 0],
      }),
    ],
    vessel: { part: 0, capacityMl: capacity, nominalY },
  } satisfies LibraryModelSpec
}

function erlenmeyerSpec(id: string, label_: string, capacity: number, scale: number) {
  const outer = erlenmeyerOutline({
    baseRadius: 0.32 * scale,
    height: 0.86 * scale,
    neckRadius: 0.095 * scale,
    neckHeight: 0.22 * scale,
  })
  return {
    id,
    label: label_,
    footprintRadius: 0.32 * scale + 0.04,
    height: 0.88 * scale,
    maxInstances: 3,
    parts: [
      { kind: 'glass', outer, wall: 0.013 },
      label([`${capacity} mL`], 0.2 * scale, 0.07 * scale, [0, 0.17 * scale, 0], {
        radius: 0.29 * scale,
        rot: [0, 1.6, 0],
      }),
    ],
    vessel: { part: 0, capacityMl: capacity, nominalY: 0.5 * scale },
  } satisfies LibraryModelSpec
}

const CORK_RING: ModelPart = {
  kind: 'torus',
  radius: 0.16,
  tube: 0.045,
  material: 'cork',
  segments: 20,
  at: [0, 0.045, 0],
  rot: [HALF_PI, 0, 0],
}

function roundFlaskParts(neckHeight: number, segments = 9, glassSegments = 36): ModelPart[] {
  return [
    {
      kind: 'glass',
      outer: roundBottomOutline({ bulbRadius: 0.3, neckRadius: 0.085, neckHeight, segments }),
      wall: 0.012,
      segments: glassSegments,
      at: [0, 0.035, 0],
    },
    CORK_RING,
  ]
}

const sideNeck = (side: 1 | -1): ModelPart => ({
  kind: 'glass',
  outer: cylinderOutline({ radius: 0.06, height: 0.3 }),
  wall: 0.01,
  segments: 20,
  at: [side * 0.17, 0.4, 0],
  rot: [0, 0, -side * 0.5],
})

const testTubeOuter = testTubeOutline({ radius: 0.07, height: 0.86 })
const hardTubeOuter = testTubeOutline({ radius: 0.09, height: 0.95 })

const funnelOuter: ProfilePoint[] = [
  [0, 0],
  [0.02, 0],
  [0.02, 0.26],
  [0.035, 0.29],
  [0.23, 0.5],
  [0.245, 0.51],
]
const FUNNEL_TILT = HALF_PI - Math.atan2(0.23 - 0.035, 0.5 - 0.29)

const watchOuter = watchGlassOutline({ radius: 0.26, depth: 0.07 })

// ---------------------------------------------------------------------------
// Catalogue models
// ---------------------------------------------------------------------------

const specs: LibraryModelSpec[] = [
  // ---- Reaction vessels --------------------------------------------------------------------
  beakerSpec('beaker-100', 'Beaker 100 mL', 100, 0.2, 0.56),
  beakerSpec('beaker-1000', 'Beaker 1000 mL', 1000, 0.38, 1.0),
  erlenmeyerSpec('erlenmeyer-flask', 'Conical flask 250 mL', 250, 1),
  erlenmeyerSpec('erlenmeyer-flask-100', 'Conical flask 100 mL', 100, 0.76),
  {
    id: 'round-bottom-flask',
    label: 'Round-bottom flask',
    footprintRadius: 0.34,
    height: 1.0,
    maxInstances: 2,
    parts: roundFlaskParts(0.32),
    vessel: { part: 0, capacityMl: 250, nominalY: 0.42 },
  },
  {
    id: 'three-neck-flask',
    label: 'Three-neck flask',
    footprintRadius: 0.36,
    height: 0.98,
    maxInstances: 1,
    parts: [...roundFlaskParts(0.3, 7, 30), sideNeck(1), sideNeck(-1)],
    vessel: { part: 0, capacityMl: 250, nominalY: 0.42 },
  },
  {
    id: 'distillation-flask',
    label: 'Distillation flask',
    footprintRadius: 0.36,
    height: 1.1,
    maxInstances: 1,
    parts: [
      ...roundFlaskParts(0.42),
      {
        kind: 'tube',
        path: [
          [0.07, 0.92, 0],
          [0.2, 0.86, 0],
          [0.42, 0.72, 0],
        ],
        radius: 0.018,
        material: 'glassSolid',
        segments: 12,
      },
    ],
    vessel: { part: 0, capacityMl: 250, nominalY: 0.42 },
  },
  {
    id: 'test-tube',
    label: 'Test tube',
    footprintRadius: 0.12,
    height: 0.88,
    maxInstances: 4,
    parts: [{ kind: 'glass', outer: testTubeOuter, wall: 0.008, segments: 28 }],
    vessel: { part: 0, capacityMl: 25, nominalY: 0.72 },
  },
  {
    id: 'hard-glass-tube',
    label: 'Hard-glass tube',
    footprintRadius: 0.14,
    height: 0.97,
    maxInstances: 2,
    parts: [{ kind: 'glass', outer: hardTubeOuter, wall: 0.018, floor: 0.03, segments: 28 }],
    vessel: { part: 0, capacityMl: 40, nominalY: 0.8 },
  },
  {
    id: 'separating-funnel',
    label: 'Separating funnel',
    footprintRadius: 0.32,
    height: 1.42,
    maxInstances: 1,
    parts: [
      // Our own ring-stand: plate, rod, ring and the funnel held in it.
      box([0.5, 0.035, 0.36], 'castIron', [-0.05, 0.0175, 0]),
      post(1.38, 0.018, 'steel', -0.25, 0.035),
      {
        kind: 'torus',
        radius: 0.15,
        tube: 0.012,
        material: 'steel',
        segments: 24,
        at: [0, 0.95, 0],
        rot: [HALF_PI, 0, 0],
      },
      box([0.12, 0.022, 0.03], 'steel', [-0.19, 0.95, 0]),
      {
        kind: 'glass',
        outer: pearOutline({ radius: 0.2, height: 0.62, stemRadius: 0.022 }),
        wall: 0.011,
        segments: 32,
        at: [0, 0.6, 0],
      },
      post(0.32, 0.016, 'glassSolid', 0, 0.3, 0, { radiusTop: 0.016 }),
      rodX(0.16, 0.026, 'plasticWhite', [0, 0.6, 0]),
      {
        kind: 'cylinder',
        radius: 0.012,
        height: 0.06,
        material: 'plasticWhite',
        segments: 10,
        at: [0.1, 0.6, 0],
        rot: [HALF_PI, 0, 0],
      },
      post(0.07, 0.05, 'plasticWhite', 0, 1.22, 0, { radiusTop: 0.06 }),
    ],
    vessel: { part: 4, capacityMl: 250, nominalY: 0.46 },
  },
  {
    id: 'gas-jar',
    label: 'Gas jar',
    footprintRadius: 0.3,
    height: 0.76,
    maxInstances: 2,
    parts: [
      {
        kind: 'glass',
        outer: cylinderOutline({ radius: 0.22, height: 0.72, flare: 1.12 }),
        wall: 0.016,
        floor: 0.03,
      },
      box([0.56, 0.018, 0.56], 'acrylic', [0, 0.735, 0]),
    ],
    vessel: { part: 0, capacityMl: 500, nominalY: 0.66 },
  },
  {
    id: 'trough',
    label: 'Water trough',
    footprintRadius: 0.62,
    height: 0.34,
    maxInstances: 1,
    parts: [
      box([1.1, 0.03, 0.6], 'acrylic', [0, 0.015, 0]),
      box([1.1, 0.32, 0.02], 'acrylic', [0, 0.17, 0.29]),
      box([1.1, 0.32, 0.02], 'acrylic', [0, 0.17, -0.29]),
      box([0.02, 0.32, 0.56], 'acrylic', [0.54, 0.17, 0]),
      box([0.02, 0.32, 0.56], 'acrylic', [-0.54, 0.17, 0]),
      // Beehive shelf
      {
        kind: 'cylinder',
        radius: 0.11,
        radiusTop: 0.09,
        height: 0.1,
        material: 'ceramic',
        segments: 20,
        at: [0.32, 0.08, 0],
      },
      // Water
      box([1.04, 0.22, 0.54], 'spirit', [0, 0.14, 0]),
    ],
  },
  {
    id: 'u-tube-cell',
    label: 'U-tube',
    footprintRadius: 0.3,
    height: 0.96,
    maxInstances: 1,
    parts: [
      box([0.5, 0.05, 0.2], 'wood', [0, 0.025, 0]),
      post(0.8, 0.014, 'steel', 0, 0.05, -0.07),
      box([0.4, 0.03, 0.03], 'steel', [0, 0.72, -0.05]),
      {
        kind: 'tube',
        path: [
          [-0.15, 0.94, 0],
          [-0.15, 0.32, 0],
          [-0.1, 0.17, 0],
          [0, 0.13, 0],
          [0.1, 0.17, 0],
          [0.15, 0.32, 0],
          [0.15, 0.94, 0],
        ],
        radius: 0.05,
        radial: 14,
        segments: 36,
        material: 'glassSolid',
      },
    ],
  },
  {
    id: 'electrolytic-cell',
    label: 'Electrolytic cell',
    footprintRadius: 0.3,
    height: 1.12,
    maxInstances: 1,
    parts: [
      box([0.5, 0.05, 0.2], 'wood', [0, 0.025, 0]),
      post(0.8, 0.014, 'steel', 0, 0.05, -0.07),
      box([0.4, 0.03, 0.03], 'steel', [0, 0.72, -0.05]),
      {
        kind: 'tube',
        path: [
          [-0.15, 0.9, 0],
          [-0.15, 0.32, 0],
          [-0.1, 0.17, 0],
          [0, 0.13, 0],
          [0.1, 0.17, 0],
          [0.15, 0.32, 0],
          [0.15, 0.9, 0],
        ],
        radius: 0.05,
        radial: 14,
        segments: 36,
        material: 'glassSolid',
      },
      post(0.07, 0.048, 'rubber', -0.15, 0.88, 0, { radiusTop: 0.056 }),
      post(0.07, 0.048, 'rubber', 0.15, 0.88, 0, { radiusTop: 0.056 }),
      post(0.62, 0.014, 'graphite', -0.15, 0.48, 0),
      post(0.62, 0.014, 'graphite', 0.15, 0.48, 0),
      // Spirit-coloured electrolyte in the U bend
      box([0.06, 0.02, 0.06], 'spirit', [0, 0.14, 0]),
    ],
  },
  {
    id: 'watch-glass',
    label: 'Watch glass',
    footprintRadius: 0.27,
    height: 0.09,
    maxInstances: 2,
    parts: [{ kind: 'glass', outer: watchOuter, wall: 0.008, floor: 0.008, segments: 36 }],
  },
  {
    id: 'evaporating-dish',
    label: 'Evaporating dish',
    footprintRadius: 0.3,
    height: 0.15,
    maxInstances: 2,
    parts: [
      {
        kind: 'lathe',
        material: 'ceramic',
        segments: 36,
        profile: [
          [0, 0],
          [0.12, 0],
          [0.135, 0.016],
          [0.22, 0.06],
          [0.27, 0.13],
          [0.285, 0.145],
          [0.27, 0.142],
          [0.25, 0.12],
          [0.2, 0.07],
          [0.12, 0.04],
          [0, 0.035],
        ],
      },
      { kind: 'sphere', radius: 0.02, material: 'ceramic', segments: 8, at: [0.28, 0.14, 0] },
    ],
  },

  // ---- Measuring -------------------------------------------------------------------------
  {
    id: 'burette',
    label: 'Burette on stand',
    footprintRadius: 0.32,
    height: 2.3,
    maxInstances: 1,
    parts: [
      box([0.56, 0.035, 0.4], 'castIron', [-0.06, 0.0175, 0]),
      post(2.22, 0.02, 'steel', -0.28, 0.035),
      box([0.1, 0.06, 0.06], 'castIron', [-0.26, 1.65, 0]),
      rodX(0.24, 0.012, 'steel', [-0.12, 1.65, 0]),
      {
        kind: 'torus',
        radius: 0.05,
        tube: 0.012,
        material: 'rubberRed',
        segments: 16,
        at: [0, 1.65, 0],
        rot: [HALF_PI, 0, 0],
      },
      {
        kind: 'glass',
        outer: cylinderOutline({ radius: 0.042, height: 1.18, flare: 1.25 }),
        wall: 0.008,
        segments: 20,
        at: [0, 1.01, 0],
      },
      rodX(0.12, 0.022, 'plasticWhite', [0, 0.97, 0]),
      {
        kind: 'cylinder',
        radius: 0.01,
        height: 0.08,
        material: 'plasticWhite',
        segments: 8,
        at: [0.07, 0.97, 0],
        rot: [HALF_PI, 0, 0],
      },
      post(0.06, 0.012, 'glassSolid', 0, 0.93, 0, { radiusTop: 0.02, segments: 10 }),
      post(0.08, 0.005, 'glassSolid', 0, 0.85, 0, { radiusTop: 0.012, segments: 10 }),
      // A burette reads 0 at the top; that scale arrives with the L8 instruments.
      label(['50 mL', 'CLASS A'], 0.09, 0.07, [0, 1.95, 0], { radius: 0.0435, rot: [0, 0.3, 0] }),
    ],
    vessel: { part: 5, capacityMl: 50, nominalY: 1.04 },
  },
  {
    id: 'pipette',
    label: 'Volumetric pipette',
    footprintRadius: 0.42,
    height: 0.11,
    maxInstances: 2,
    parts: [
      rodX(0.34, 0.013, 'glassSolid', [-0.27, 0.052, 0]),
      rodX(0.3, 0.013, 'glassSolid', [0.25, 0.052, 0], { radiusTop: 0.005 }),
      {
        kind: 'lathe',
        material: 'glassSolid',
        segments: 20,
        at: [-0.1, 0.052, 0],
        rot: [0, 0, -HALF_PI],
        profile: [
          [0.013, 0],
          [0.035, 0.03],
          [0.05, 0.08],
          [0.05, 0.13],
          [0.035, 0.18],
          [0.013, 0.2],
        ],
      },
      {
        kind: 'torus',
        radius: 0.014,
        tube: 0.002,
        material: 'wireBlack',
        segments: 12,
        at: [-0.33, 0.052, 0],
        rot: [0, HALF_PI, 0],
      },
    ],
  },
  {
    id: 'thermometer',
    label: 'Thermometer',
    footprintRadius: 0.39,
    height: 0.06,
    maxInstances: 2,
    parts: [
      rodX(0.72, 0.02, 'glassSolid', [0.02, 0.028, 0]),
      {
        kind: 'sphere',
        radius: 0.026,
        material: 'thermoLiquid',
        segments: 12,
        at: [-0.35, 0.028, 0],
      },
      rodX(0.38, 0.006, 'thermoLiquid', [-0.15, 0.03, 0], { segments: 8 }),
      label(['-10  0  20  40  60  80  100 °C'], 0.58, 0.03, [0.02, 0.0485, 0], {
        rot: FLAT,
        color: '#283d3f',
      }),
    ],
  },
  {
    id: 'calorimeter',
    label: 'Calorimeter',
    footprintRadius: 0.27,
    height: 0.95,
    maxInstances: 1,
    parts: [
      {
        kind: 'lathe',
        material: 'plasticWhite',
        segments: 32,
        profile: [
          [0, 0],
          [0.17, 0],
          [0.235, 0.46],
          [0.245, 0.47],
          [0.225, 0.47],
          [0.16, 0.03],
          [0, 0.03],
        ],
      },
      post(0.03, 0.245, 'plasticWhite', 0, 0.46, 0, { segments: 32, color: '#e4e9ea' }),
      post(0.48, 0.016, 'glassSolid', 0.06, 0.32),
      post(0.3, 0.005, 'thermoLiquid', 0.06, 0.34, 0, { segments: 8 }),
      {
        kind: 'tube',
        path: [
          [-0.07, 0.95, 0],
          [-0.07, 0.15, 0],
          [-0.07, 0.1, 0.06],
        ],
        radius: 0.006,
        material: 'steel',
        segments: 10,
        radial: 6,
      },
    ],
  },
  {
    id: 'voltmeter',
    label: 'Multimeter',
    footprintRadius: 0.33,
    height: 0.1,
    maxInstances: 1,
    parts: [
      box([0.36, 0.07, 0.52], 'plasticYellow', [0, 0.035, 0]),
      box([0.3, 0.012, 0.46], 'plasticDark', [0, 0.072, 0]),
      label(['12.00 V'], 0.24, 0.1, [0, 0.0795, -0.13], {
        rot: FLAT,
        background: '#a7c3a0',
        color: '#1d2a22',
      }),
      post(0.02, 0.07, 'plasticDark', 0, 0.078, 0.06, { segments: 20, color: '#1c2024' }),
      box([0.012, 0.012, 0.11], 'steel', [0, 0.1, 0.06]),
      post(0.02, 0.018, 'wireRed', -0.09, 0.078, 0.19, { segments: 10 }),
      post(0.02, 0.018, 'wireBlack', 0.0, 0.078, 0.19, { segments: 10 }),
      post(0.02, 0.018, 'wireRed', 0.09, 0.078, 0.19, { segments: 10 }),
    ],
  },
  {
    id: 'conductivity-apparatus',
    label: 'Conductivity tester',
    footprintRadius: 0.4,
    height: 0.62,
    maxInstances: 1,
    parts: [
      box([0.7, 0.04, 0.34], 'wood', [0, 0.02, 0]),
      box([0.2, 0.1, 0.12], 'plasticDark', [-0.2, 0.09, -0.06]),
      post(0.06, 0.035, 'brass', 0.06, 0.04, -0.08),
      { kind: 'sphere', radius: 0.05, material: 'lamp', segments: 14, at: [0.06, 0.15, -0.08] },
      post(0.5, 0.012, 'steel', 0.18, 0.04, -0.1),
      box([0.24, 0.025, 0.025], 'plasticDark', [0.26, 0.5, -0.1]),
      post(0.34, 0.015, 'graphite', 0.2, 0.17, -0.1),
      post(0.34, 0.015, 'graphite', 0.32, 0.17, -0.1),
      {
        kind: 'tube',
        path: [
          [-0.12, 0.12, -0.06],
          [-0.05, 0.16, 0.02],
          [0.03, 0.08, -0.04],
        ],
        radius: 0.008,
        material: 'wireRed',
        segments: 12,
        radial: 6,
      },
      {
        kind: 'tube',
        path: [
          [0.09, 0.08, -0.06],
          [0.15, 0.3, 0],
          [0.2, 0.52, -0.1],
        ],
        radius: 0.008,
        material: 'wireRed',
        segments: 12,
        radial: 6,
      },
      {
        kind: 'tube',
        path: [
          [-0.28, 0.12, -0.06],
          [-0.1, 0.4, 0.05],
          [0.32, 0.52, -0.1],
        ],
        radius: 0.008,
        material: 'wireBlack',
        segments: 14,
        radial: 6,
      },
    ],
  },
  {
    id: 'ph-paper',
    label: 'pH paper',
    footprintRadius: 0.26,
    height: 0.06,
    maxInstances: 1,
    parts: [
      box([0.22, 0.045, 0.12], 'plasticWhite', [-0.08, 0.0225, -0.08]),
      box([0.13, 0.004, 0.026], 'paper', [0.06, 0.03, -0.08], { color: '#e6b84a' }),
      box([0.44, 0.006, 0.1], 'paper', [0, 0.003, 0.1]),
      ...['#d23a2c', '#e8742c', '#e9c440', '#8fbf45', '#3e9a5a', '#2f7fb3', '#4b3a8c'].map(
        (color, i) => box([0.05, 0.004, 0.05], 'paper', [-0.18 + i * 0.06, 0.008, 0.1], { color }),
      ),
    ],
  },

  // ---- Heating --------------------------------------------------------------------------
  {
    id: 'bunsen-burner',
    label: 'Bunsen burner',
    footprintRadius: 0.18,
    height: 0.5,
    maxInstances: 1,
    parts: [
      {
        kind: 'lathe',
        material: 'castIron',
        segments: 28,
        profile: [
          [0, 0],
          [0.16, 0],
          [0.16, 0.02],
          [0.1, 0.05],
          [0.05, 0.06],
          [0, 0.06],
        ],
      },
      post(0.44, 0.034, 'steel', 0, 0.05),
      post(0.07, 0.044, 'brass', 0, 0.1, 0, { segments: 20 }),
      rodX(0.16, 0.016, 'brass', [0.1, 0.085, 0], { segments: 10 }),
      {
        kind: 'tube',
        path: [
          [0.18, 0.085, 0],
          [0.26, 0.07, 0.04],
          [0.3, 0.02, 0.14],
        ],
        radius: 0.022,
        material: 'rubberRed',
        segments: 10,
        radial: 8,
      },
    ],
  },
  {
    id: 'spirit-lamp',
    label: 'Spirit lamp',
    footprintRadius: 0.18,
    height: 0.36,
    maxInstances: 1,
    parts: [
      {
        kind: 'glass',
        outer: bottleOutline({ radius: 0.16, height: 0.24, neckRadius: 0.05, neckHeight: 0.07 }),
        wall: 0.012,
        floor: 0.02,
        segments: 32,
      },
      post(0.04, 0.056, 'brass', 0, 0.23, 0, { segments: 20 }),
      post(0.09, 0.016, 'paper', 0, 0.26, 0, { segments: 10 }),
    ],
    vessel: {
      part: 0,
      capacityMl: 150,
      nominalY: 0.16,
      contents: { volumeMl: 90, color: '#d9ecf5' },
    },
  },
  {
    id: 'water-bath',
    label: 'Water bath',
    footprintRadius: 0.5,
    height: 0.4,
    maxInstances: 1,
    parts: [
      box([0.8, 0.36, 0.55], 'aluminium', [0, 0.18, 0]),
      {
        kind: 'torus',
        radius: 0.12,
        tube: 0.012,
        material: 'steel',
        segments: 24,
        at: [-0.18, 0.365, -0.04],
        rot: [HALF_PI, 0, 0],
      },
      {
        kind: 'torus',
        radius: 0.12,
        tube: 0.012,
        material: 'steel',
        segments: 24,
        at: [0.18, 0.365, -0.04],
        rot: [HALF_PI, 0, 0],
      },
      post(0.004, 0.1, 'plasticDark', -0.18, 0.36, -0.04, { segments: 20 }),
      post(0.004, 0.1, 'plasticDark', 0.18, 0.36, -0.04, { segments: 20 }),
      label(['37.0 °C'], 0.18, 0.07, [-0.15, 0.2, 0.2755], {
        background: '#1d2a22',
        color: '#ff6a4d',
      }),
      {
        kind: 'cylinder',
        radius: 0.035,
        height: 0.03,
        material: 'plasticDark',
        segments: 16,
        at: [0.15, 0.2, 0.29],
        rot: [HALF_PI, 0, 0],
      },
    ],
  },
  {
    id: 'combustion-spoon',
    label: 'Combustion spoon',
    footprintRadius: 0.38,
    height: 0.2,
    maxInstances: 1,
    parts: [
      rodX(0.7, 0.008, 'steel', [0, 0.1, 0], { segments: 8 }),
      {
        kind: 'cylinder',
        radius: 0.1,
        height: 0.008,
        material: 'steel',
        segments: 24,
        at: [-0.12, 0.1, 0],
        rot: [0, 0, HALF_PI],
      },
      {
        kind: 'lathe',
        material: 'steel',
        segments: 16,
        at: [0.36, 0.085, 0],
        profile: [
          [0, 0],
          [0.03, 0.005],
          [0.04, 0.03],
          [0.036, 0.03],
          [0.026, 0.01],
          [0, 0.008],
        ],
      },
      {
        kind: 'cylinder',
        radius: 0.02,
        height: 0.12,
        material: 'wood',
        segments: 12,
        at: [-0.33, 0.1, 0],
        rot: [0, 0, HALF_PI],
      },
    ],
  },
  {
    id: 'wire-gauze',
    label: 'Wire gauze',
    footprintRadius: 0.36,
    height: 0.02,
    maxInstances: 2,
    parts: [
      box([0.5, GAUZE_THICKNESS * 0.5, 0.5], 'gauze', [0, GAUZE_THICKNESS * 0.25, 0]),
      post(GAUZE_THICKNESS, 0.15, 'ceramic', 0, 0, 0, { segments: 28 }),
      ...[-0.2, -0.1, 0.1, 0.2].flatMap((offset) => [
        box([0.5, 0.004, 0.006], 'steel', [0, GAUZE_THICKNESS * 0.55, offset]),
        box([0.006, 0.004, 0.5], 'steel', [offset, GAUZE_THICKNESS * 0.55, 0]),
      ]),
    ],
  },
  {
    id: 'tripod',
    label: 'Tripod',
    footprintRadius: 0.28,
    height: TRIPOD_TOP + 0.02,
    maxInstances: 1,
    parts: [
      {
        kind: 'torus',
        radius: 0.2,
        tube: 0.018,
        material: 'castIron',
        segments: 28,
        at: [0, TRIPOD_TOP, 0],
        rot: [HALF_PI, 0, 0],
      },
      ...[0, 1, 2].map((leg): ModelPart => {
        const a = (leg / 3) * Math.PI * 2 + Math.PI / 6
        return {
          kind: 'tube',
          path: [
            [Math.cos(a) * 0.2, TRIPOD_TOP, Math.sin(a) * 0.2],
            [Math.cos(a) * 0.235, TRIPOD_TOP * 0.5, Math.sin(a) * 0.235],
            [Math.cos(a) * 0.26, 0.012, Math.sin(a) * 0.26],
          ],
          radius: 0.016,
          material: 'castIron',
          segments: 6,
          radial: 8,
        }
      }),
    ],
  },

  // ---- Assistive devices ----------------------------------------------------------------
  {
    id: 'dropper',
    label: 'Dropper',
    footprintRadius: 0.24,
    height: 0.1,
    maxInstances: 2,
    parts: [
      rodX(0.3, 0.014, 'glassSolid', [0.07, 0.042, 0], { radiusTop: 0.004 }),
      {
        kind: 'lathe',
        material: 'rubberRed',
        segments: 18,
        at: [-0.08, 0.042, 0],
        rot: [0, 0, HALF_PI],
        profile: [
          [0.018, 0],
          [0.035, 0.02],
          [0.042, 0.07],
          [0.03, 0.12],
          [0, 0.13],
        ],
      },
    ],
  },
  {
    id: 'wash-bottle',
    label: 'Wash bottle',
    footprintRadius: 0.21,
    height: 0.78,
    maxInstances: 1,
    parts: [
      {
        kind: 'lathe',
        material: 'plasticWhite',
        segments: 32,
        profile: [
          [0, 0],
          [0.16, 0],
          [0.175, 0.02],
          [0.175, 0.38],
          [0.12, 0.47],
          [0.05, 0.5],
          [0.05, 0.54],
          [0, 0.54],
        ],
      },
      post(0.06, 0.06, 'plasticBlue', 0, 0.52, 0, { segments: 20 }),
      {
        kind: 'tube',
        path: [
          [0, 0.58, 0],
          [0, 0.7, 0],
          [0.04, 0.76, 0],
          [0.16, 0.72, 0],
          [0.22, 0.62, 0],
        ],
        radius: 0.011,
        material: 'plasticWhite',
        segments: 16,
        radial: 6,
      },
      label(['H₂O', 'DEIONISED'], 0.22, 0.1, [0, 0.22, 0], {
        radius: 0.177,
        background: '#e4f1fb',
        color: '#1f5d8a',
      }),
    ],
  },
  {
    id: 'test-tube-rack',
    label: 'Test tube rack',
    footprintRadius: 0.46,
    height: 0.36,
    maxInstances: 1,
    parts: [
      box([0.86, 0.025, 0.24], 'wood', [0, 0.0125, 0]),
      box([0.86, 0.025, 0.22], 'wood', [0, 0.3, 0]),
      box([0.86, 0.025, 0.22], 'wood', [0, 0.16, 0]),
      box([0.03, 0.32, 0.22], 'wood', [-0.415, 0.16, 0]),
      box([0.03, 0.32, 0.22], 'wood', [0.415, 0.16, 0]),
      ...[-0.3, -0.1, 0.1, 0.3].map((x) =>
        post(0.004, 0.06, 'plasticDark', x, 0.312, 0, { segments: 16 }),
      ),
      ...[-0.3, -0.1, 0.1, 0.3].map((x) =>
        post(0.004, 0.06, 'plasticDark', x, 0.172, 0, { segments: 16 }),
      ),
    ],
  },
  {
    id: 'clamp-stand',
    label: 'Clamp stand',
    footprintRadius: 0.42,
    height: 1.7,
    maxInstances: 1,
    parts: [
      box([0.74, 0.04, 0.42], 'castIron', [0.08, 0.02, 0]),
      post(1.62, 0.022, 'steel', -0.12, 0.04),
      box([0.09, 0.09, 0.09], 'castIron', [-0.12, CLAMP_JAW_Y, 0]),
      rodX(CLAMP_REACH - 0.06, 0.013, 'steel', [(-0.12 + CLAMP_REACH - 0.09) / 2, CLAMP_JAW_Y, 0]),
      {
        kind: 'torus',
        radius: 0.085,
        tube: 0.014,
        arc: Math.PI * 1.3,
        material: 'rubberRed',
        segments: 18,
        at: [CLAMP_REACH, CLAMP_JAW_Y, 0],
        rot: [HALF_PI, 0, Math.PI * 0.85],
      },
      {
        kind: 'torus',
        radius: 0.085,
        tube: 0.012,
        arc: Math.PI * 1.3,
        material: 'steel',
        segments: 18,
        at: [CLAMP_REACH, CLAMP_JAW_Y + 0.028, 0],
        rot: [HALF_PI, 0, Math.PI * 0.85],
      },
    ],
  },
  {
    id: 'tongs',
    label: 'Crucible tongs',
    footprintRadius: 0.36,
    height: 0.04,
    maxInstances: 1,
    parts: [
      {
        kind: 'tube',
        path: [
          [-0.34, 0.012, 0.07],
          [-0.05, 0.012, 0.03],
          [0.05, 0.012, -0.015],
          [0.3, 0.012, -0.04],
          [0.34, 0.012, 0.0],
        ],
        radius: 0.01,
        material: 'steel',
        segments: 20,
        radial: 6,
      },
      {
        kind: 'tube',
        path: [
          [-0.34, 0.012, -0.07],
          [-0.05, 0.012, -0.03],
          [0.05, 0.012, 0.015],
          [0.3, 0.012, 0.04],
          [0.34, 0.012, 0.0],
        ],
        radius: 0.01,
        material: 'steel',
        segments: 20,
        radial: 6,
      },
      post(0.03, 0.018, 'steel', 0, 0.0, 0, { segments: 12 }),
    ],
  },
  {
    id: 'funnel',
    label: 'Filter funnel',
    footprintRadius: 0.3,
    height: 0.36,
    maxInstances: 2,
    parts: [
      {
        kind: 'glass',
        outer: funnelOuter,
        wall: 0.01,
        segments: 32,
        rot: [0, 0, FUNNEL_TILT],
        at: [0.22, -lowestAfterZRotation(funnelOuter, FUNNEL_TILT), 0],
      },
    ],
  },
  {
    id: 'condenser',
    label: 'Liebig condenser',
    footprintRadius: 0.44,
    height: 0.18,
    maxInstances: 1,
    parts: [
      rodX(0.64, 0.055, 'glassSolid', [0, 0.075, 0], { segments: 24 }),
      rodX(0.86, 0.018, 'glassSolid', [0, 0.075, 0], { segments: 12 }),
      post(0.08, 0.016, 'glassSolid', -0.24, 0.12, 0, { segments: 10 }),
      post(0.08, 0.016, 'glassSolid', 0.24, 0.12, 0, { segments: 10 }),
      box([0.06, 0.02, 0.12], 'rubber', [-0.22, 0.01, 0]),
      box([0.06, 0.02, 0.12], 'rubber', [0.22, 0.01, 0]),
    ],
  },
  {
    id: 'gas-delivery-tube',
    label: 'Delivery tube',
    footprintRadius: 0.3,
    height: 0.48,
    maxInstances: 2,
    parts: [
      post(0.1, 0.05, 'rubber', -0.22, 0, 0, { radiusTop: 0.062, segments: 20 }),
      {
        kind: 'tube',
        path: [
          [-0.22, 0.04, 0],
          [-0.22, 0.36, 0],
          [-0.17, 0.44, 0],
          [0.16, 0.44, 0],
          [0.22, 0.36, 0],
          [0.22, 0.01, 0],
        ],
        radius: 0.012,
        material: 'glassSolid',
        segments: 28,
        radial: 8,
      },
    ],
  },
  {
    id: 'platinum-wire',
    label: 'Flame-test wire',
    footprintRadius: 0.27,
    height: 0.04,
    maxInstances: 2,
    parts: [
      rodX(0.3, 0.012, 'glassSolid', [-0.1, 0.012, 0]),
      rodX(0.18, 0.0025, 'steel', [0.14, 0.012, 0], { segments: 6, color: '#dcdcd6' }),
      {
        kind: 'torus',
        radius: 0.012,
        tube: 0.0025,
        material: 'steel',
        color: '#dcdcd6',
        segments: 12,
        at: [0.24, 0.012, 0],
        rot: [HALF_PI, 0, 0],
      },
    ],
  },
  {
    id: 'safety-shield',
    label: 'Safety shield',
    footprintRadius: 0.52,
    height: 0.86,
    maxInstances: 1,
    parts: [
      box([1.0, 0.8, 0.02], 'acrylic', [0, 0.44, 0], { rot: [-0.08, 0, 0] }),
      box([0.1, 0.05, 0.32], 'plasticDark', [-0.42, 0.025, 0]),
      box([0.1, 0.05, 0.32], 'plasticDark', [0.42, 0.025, 0]),
      box([1.0, 0.03, 0.03], 'plasticDark', [0, 0.06, 0.005]),
    ],
  },
  {
    id: 'white-tile',
    label: 'White tile',
    footprintRadius: 0.33,
    height: 0.03,
    maxInstances: 1,
    parts: [box([0.45, 0.025, 0.45], 'ceramic', [0, 0.0125, 0])],
  },
  {
    id: 'cobalt-glass',
    label: 'Cobalt glass',
    footprintRadius: 0.19,
    height: 0.02,
    maxInstances: 1,
    parts: [box([0.25, 0.014, 0.25], 'cobalt', [0, 0.007, 0])],
  },
  {
    id: 'wooden-splint',
    label: 'Wooden splints',
    footprintRadius: 0.29,
    height: 0.03,
    maxInstances: 1,
    parts: [-0.05, -0.015, 0.02, 0.055].map((z, i) =>
      box([0.54, 0.012, 0.022], 'wood', [i * 0.01, 0.006 + (i % 2) * 0.012, z], {
        rot: [0, (i - 1.5) * 0.04, 0],
      }),
    ),
  },
  {
    id: 'filter-paper',
    label: 'Filter paper',
    footprintRadius: 0.24,
    height: 0.04,
    maxInstances: 1,
    parts: [0, 1, 2, 3].map((i) =>
      post(0.006, 0.22, 'paper', i * 0.006, i * 0.007, -i * 0.004, { segments: 32 }),
    ),
  },
  {
    id: 'knife',
    label: 'Scalpel',
    footprintRadius: 0.26,
    height: 0.04,
    maxInstances: 1,
    parts: [
      box([0.28, 0.022, 0.04], 'steel', [-0.1, 0.011, 0], { color: '#9aa3a9' }),
      box([0.18, 0.006, 0.05], 'steel', [0.13, 0.006, 0.005], { color: '#e3e7ea' }),
    ],
  },
  {
    id: 'dc-power-supply',
    label: 'DC power supply',
    footprintRadius: 0.4,
    height: 0.34,
    maxInstances: 1,
    parts: [
      box([0.62, 0.32, 0.44], 'plasticDark', [0, 0.16, 0], { color: '#3c454d' }),
      label(['12.0 V'], 0.17, 0.07, [-0.17, 0.22, 0.2205], {
        background: '#141a1f',
        color: '#ff5a3c',
      }),
      label(['0.50 A'], 0.17, 0.07, [0.05, 0.22, 0.2205], {
        background: '#141a1f',
        color: '#ff5a3c',
      }),
      {
        kind: 'cylinder',
        radius: 0.035,
        height: 0.03,
        material: 'plasticDark',
        segments: 16,
        at: [-0.17, 0.09, 0.235],
        rot: [HALF_PI, 0, 0],
      },
      {
        kind: 'cylinder',
        radius: 0.035,
        height: 0.03,
        material: 'plasticDark',
        segments: 16,
        at: [0.05, 0.09, 0.235],
        rot: [HALF_PI, 0, 0],
      },
      {
        kind: 'cylinder',
        radius: 0.022,
        height: 0.04,
        material: 'wireRed',
        segments: 12,
        at: [0.2, 0.16, 0.24],
        rot: [HALF_PI, 0, 0],
      },
      {
        kind: 'cylinder',
        radius: 0.022,
        height: 0.04,
        material: 'wireBlack',
        segments: 12,
        at: [0.2, 0.08, 0.24],
        rot: [HALF_PI, 0, 0],
      },
    ],
  },
  {
    id: 'carbon-electrodes',
    label: 'Carbon electrodes',
    footprintRadius: 0.27,
    height: 0.05,
    maxInstances: 1,
    parts: [
      rodX(0.48, 0.022, 'graphite', [0, 0.022, -0.06]),
      rodX(0.48, 0.022, 'graphite', [0, 0.022, 0.06]),
      rodX(0.04, 0.025, 'brass', [-0.24, 0.022, -0.06]),
      rodX(0.04, 0.025, 'brass', [-0.24, 0.022, 0.06]),
    ],
  },
  {
    id: 'connecting-wires',
    label: 'Connecting wires',
    footprintRadius: 0.33,
    height: 0.04,
    maxInstances: 2,
    parts: [
      {
        kind: 'tube',
        path: [
          [-0.28, 0.012, -0.08],
          [-0.1, 0.012, -0.16],
          [0.1, 0.012, -0.02],
          [0.28, 0.012, -0.1],
        ],
        radius: 0.01,
        material: 'wireRed',
        segments: 24,
        radial: 6,
      },
      {
        kind: 'tube',
        path: [
          [-0.28, 0.012, 0.08],
          [-0.08, 0.012, 0.0],
          [0.12, 0.012, 0.15],
          [0.28, 0.012, 0.08],
        ],
        radius: 0.01,
        material: 'wireBlack',
        segments: 24,
        radial: 6,
      },
      box([0.07, 0.02, 0.03], 'wireRed', [-0.31, 0.012, -0.08]),
      box([0.07, 0.02, 0.03], 'wireRed', [0.31, 0.012, -0.1]),
      box([0.07, 0.02, 0.03], 'wireBlack', [-0.31, 0.012, 0.08]),
      box([0.07, 0.02, 0.03], 'wireBlack', [0.31, 0.012, 0.08]),
    ],
  },
  {
    id: 'sandpaper',
    label: 'Sandpaper',
    footprintRadius: 0.25,
    height: 0.01,
    maxInstances: 1,
    parts: [box([0.4, 0.006, 0.28], 'sandpaper', [0, 0.003, 0])],
  },
  {
    id: 'flashlight',
    label: 'Light source',
    footprintRadius: 0.27,
    height: 0.16,
    maxInstances: 1,
    parts: [
      rodX(0.36, 0.05, 'plasticDark', [-0.06, 0.075, 0], { segments: 20 }),
      rodX(0.12, 0.075, 'aluminium', [0.18, 0.075, 0], { radiusTop: 0.05, segments: 24 }),
      {
        kind: 'cylinder',
        radius: 0.068,
        height: 0.006,
        material: 'lamp',
        segments: 24,
        at: [0.243, 0.075, 0],
        rot: [0, 0, HALF_PI],
      },
      box([0.04, 0.02, 0.03], 'plasticBlue', [-0.06, 0.13, 0]),
    ],
  },

  // ---- Chemicals (reagent containers with our own labels) --------------------------------
  {
    id: 'hydrochloric-acid',
    label: 'Hydrochloric acid',
    footprintRadius: 0.22,
    height: 0.66,
    maxInstances: 1,
    parts: [
      {
        kind: 'glass',
        outer: bottleOutline({ radius: 0.17, height: 0.56, neckRadius: 0.06, neckHeight: 0.12 }),
        wall: 0.012,
        floor: 0.025,
        segments: 32,
        tint: '#c98a45',
      },
      post(0.08, 0.07, 'plasticDark', 0, 0.55, 0, { segments: 20 }),
      label(['HCl', '1.0 M HYDROCHLORIC ACID', 'CORROSIVE'], 0.3, 0.17, [0, 0.24, 0], {
        radius: 0.172,
        background: '#f7f4ec',
        color: '#7a1d1d',
      }),
    ],
    vessel: {
      part: 0,
      capacityMl: 500,
      nominalY: 0.36,
      contents: { volumeMl: 380, color: '#f2efe2' },
    },
  },
  {
    id: 'sodium-hydroxide',
    label: 'Sodium hydroxide',
    footprintRadius: 0.21,
    height: 0.4,
    maxInstances: 1,
    parts: [
      {
        kind: 'lathe',
        material: 'plasticWhite',
        segments: 32,
        profile: [
          [0, 0],
          [0.16, 0],
          [0.17, 0.02],
          [0.17, 0.3],
          [0.15, 0.32],
          [0, 0.32],
        ],
      },
      post(0.07, 0.165, 'plasticBlue', 0, 0.31, 0, { segments: 32 }),
      label(['NaOH', 'SODIUM HYDROXIDE PELLETS', 'CORROSIVE'], 0.3, 0.15, [0, 0.16, 0], {
        radius: 0.172,
        background: '#f7f4ec',
        color: '#7a1d1d',
      }),
    ],
  },
  {
    id: 'ammonia-gas',
    label: 'Ammonia gas',
    footprintRadius: 0.17,
    height: 0.86,
    maxInstances: 1,
    parts: [
      {
        kind: 'lathe',
        material: 'gasCylinder',
        segments: 28,
        profile: [
          [0, 0.03],
          [0.1, 0.03],
          [0.1, 0.62],
          [0.085, 0.69],
          [0.04, 0.72],
          [0, 0.72],
        ],
      },
      post(0.05, 0.14, 'plasticDark', 0, 0, 0, { radiusTop: 0.11, segments: 24 }),
      post(0.08, 0.025, 'brass', 0, 0.72, 0, { segments: 12 }),
      {
        kind: 'torus',
        radius: 0.04,
        tube: 0.008,
        material: 'brass',
        segments: 16,
        at: [0, 0.81, 0],
        rot: [HALF_PI, 0, 0],
      },
      label(['NH₃', 'AMMONIA GAS', 'TOXIC'], 0.22, 0.15, [0, 0.4, 0], {
        radius: 0.102,
        background: '#f7f4ec',
        color: '#24433a',
      }),
    ],
  },
]

export const LIBRARY_MODELS: Readonly<Record<string, LibraryModelSpec>> = Object.freeze(
  Object.fromEntries(specs.map((spec) => [spec.id, spec])),
)

export const LIBRARY_MODEL_IDS: readonly string[] = specs.map((spec) => spec.id)

export function getLibraryModel(id: string): LibraryModelSpec | undefined {
  return LIBRARY_MODELS[id]
}

// ---------------------------------------------------------------------------
// Fill API and anchors (L4a)
// ---------------------------------------------------------------------------

export interface ModelAnchors {
  /** Centre of the opening (model frame). */
  mouth: Vec3
  /** Rim point used as the pouring lip (on +X). */
  pourLip: Vec3
  /** Inner floor height (where liquid starts). */
  liquidBase: number
}

const fillCache = new Map<string, FillModel>()

function vesselPart(spec: LibraryModelSpec) {
  if (!spec.vessel) return undefined
  const part = spec.parts[spec.vessel.part]
  return part?.kind === 'glass' ? part : undefined
}

/** Volume→height model for the vessel (in the glass part's own frame), or undefined. */
export function getVesselFill(id: string): FillModel | undefined {
  const cached = fillCache.get(id)
  if (cached) return cached
  const spec = LIBRARY_MODELS[id]
  const part = spec && vesselPart(spec)
  if (!spec?.vessel || !part) return undefined
  const { inner } = glassWall(part.outer, part.wall, { floor: part.floor })
  const fill = createFillModel(inner, spec.vessel.capacityMl, spec.vessel.nominalY)
  fillCache.set(id, fill)
  return fill
}

/** Liquid anchor points for vessels (model frame, upright vessels only). */
export function getModelAnchors(id: string): ModelAnchors | undefined {
  const spec = LIBRARY_MODELS[id]
  const part = spec && vesselPart(spec)
  if (!part || part.rot) return undefined
  const { inner } = glassWall(part.outer, part.wall, { floor: part.floor })
  const [x, y, z] = part.at ?? [0, 0, 0]
  const [rimR, rimY] = part.outer[part.outer.length - 1]
  return {
    mouth: [x, y + rimY, z],
    pourLip: [x + rimR, y + rimY, z],
    liquidBase: y + inner[0][1],
  }
}
