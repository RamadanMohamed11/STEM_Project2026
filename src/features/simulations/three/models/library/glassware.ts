/**
 * L4a parametric glassware (pure, no React / three imports).
 *
 * A vessel is described by its OUTER silhouette: [radius, y] points from the axis at the base up
 * to the rim. `glassWall` turns that silhouette into the closed wall cross-section used by the
 * lathe shell (outer wall → rolled rim → inner wall → floor), and returns the inner surface that
 * the liquid follows. `createFillModel` maps a volume in mL to a liquid height that follows the
 * real inner shape (a conical flask fills fast at the top, a round flask slowly at the equator).
 */
export type ProfilePoint = readonly [radius: number, y: number]

export interface GlassWall {
  /** Closed lathe cross-section (outer then inner, ending on the axis). */
  shell: ProfilePoint[]
  /** Inner surface from the axis at the floor up to the rim (bottom → top). */
  inner: ProfilePoint[]
}

const round = (value: number) => Math.round(value * 1e5) / 1e5

/**
 * Offsets the silhouette inwards along its normals (in the r–y plane) by `wall`, keeps radii
 * non-negative, and lifts the floor by `floor` (thick glass base).
 */
export function glassWall(
  outer: readonly ProfilePoint[],
  wall: number,
  options: { floor?: number; lip?: number } = {},
): GlassWall {
  if (outer.length < 3) throw new Error('A glass silhouette needs at least 3 points')
  const floor = options.floor ?? wall
  const lip = options.lip ?? wall * 0.6
  const pts = outer.map(([r, y]) => [r, y] as const)
  const inner: ProfilePoint[] = []
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const next = pts[Math.min(i + 1, pts.length - 1)]
    // Tangent along the silhouette; the inward normal points towards the axis/inside.
    let tr = next[0] - prev[0]
    let ty = next[1] - prev[1]
    const length = Math.hypot(tr, ty) || 1
    tr /= length
    ty /= length
    const nr = -ty
    const ny = tr
    const [r, y] = pts[i]
    inner.push([round(Math.max(0, r + nr * wall)), round(y + ny * wall)])
  }
  const baseY = pts[0][1]
  const floorY = round(baseY + floor)
  // Inner points must stay above the floor and keep increasing in height.
  const cleaned: ProfilePoint[] = []
  let lastY = floorY
  for (const [r, y] of inner) {
    const safeY = Math.max(y, lastY + 1e-4)
    cleaned.push([r, round(safeY)])
    lastY = safeY
  }
  const rim = pts[pts.length - 1]
  const innerTop = cleaned[cleaned.length - 1]
  // The rim rounds over from the outer to the inner top point.
  const rimPoint: ProfilePoint = [round((rim[0] + innerTop[0]) / 2), round(rim[1] + lip)]
  const innerSurface: ProfilePoint[] = [[0, floorY], ...cleaned.filter(([, y]) => y > floorY)]
  // Make the topmost inner point share the rim height (the cut edge of the glass).
  innerSurface[innerSurface.length - 1] = [innerTop[0], round(rim[1])]
  const shell: ProfilePoint[] = [...pts, rimPoint, ...[...innerSurface].reverse()]
  return { shell, inner: innerSurface }
}

/** Radius of the inner surface at height y (linear between profile points). */
export function radiusAt(inner: readonly ProfilePoint[], y: number) {
  if (y <= inner[0][1]) return inner[0][0]
  for (let i = 1; i < inner.length; i++) {
    const [r1, y1] = inner[i]
    const [r0, y0] = inner[i - 1]
    if (y <= y1) {
      const t = y1 === y0 ? 1 : (y - y0) / (y1 - y0)
      return r0 + (r1 - r0) * t
    }
  }
  return inner[inner.length - 1][0]
}

/** Volume of revolution (model units³) of the inner surface from the floor up to `top`. */
export function innerVolume(inner: readonly ProfilePoint[], top: number) {
  let volume = 0
  for (let i = 1; i < inner.length; i++) {
    const [r0, y0] = inner[i - 1]
    const y1raw = inner[i][1]
    if (y0 >= top) break
    const y1 = Math.min(y1raw, top)
    const r1 = y1 === y1raw ? inner[i][0] : radiusAt(inner, y1)
    const h = y1 - y0
    if (h > 0) volume += (Math.PI * h * (r0 * r0 + r0 * r1 + r1 * r1)) / 3
  }
  return volume
}

export interface FillModel {
  capacityMl: number
  /** Height of the nominal-capacity line (model units). */
  nominalY: number
  floorY: number
  /** Liquid height for a volume (clamped to 0 … rim). */
  heightForVolume(volumeMl: number): number
  /** Volume (mL) held up to height y. */
  volumeAtHeight(y: number): number
  /** Closed lathe profile of the liquid body (axis → wall → surface → axis), or null if empty. */
  liquidProfile(volumeMl: number): ProfilePoint[] | null
  /** Radius of the free surface (for the meniscus ring). */
  surfaceRadius(volumeMl: number): number
}

/**
 * Display calibration: the inner volume up to `nominalY` represents `capacityMl`. Models are
 * drawn larger than life, so this keeps readouts and graduations honest for any shape.
 */
export function createFillModel(
  inner: readonly ProfilePoint[],
  capacityMl: number,
  nominalY: number,
): FillModel {
  const floorY = inner[0][1]
  const rimY = inner[inner.length - 1][1]
  const unitsPerMl = innerVolume(inner, nominalY) / capacityMl
  const maxMl = innerVolume(inner, rimY) / unitsPerMl
  const heightForVolume = (volumeMl: number) => {
    if (!(volumeMl > 0)) return floorY
    const target = Math.min(volumeMl, maxMl) * unitsPerMl
    let low = floorY
    let high = rimY
    for (let step = 0; step < 40; step++) {
      const mid = (low + high) / 2
      if (innerVolume(inner, mid) < target) low = mid
      else high = mid
    }
    return (low + high) / 2
  }
  return {
    capacityMl,
    nominalY,
    floorY,
    heightForVolume,
    volumeAtHeight: (y) => innerVolume(inner, Math.min(Math.max(y, floorY), rimY)) / unitsPerMl,
    surfaceRadius: (volumeMl) => radiusAt(inner, heightForVolume(volumeMl)),
    liquidProfile(volumeMl) {
      if (!(volumeMl > 0)) return null
      const h = heightForVolume(volumeMl)
      const below = inner.filter(([, y]) => y < h)
      return [...below, [round(radiusAt(inner, h)), round(h)], [0, round(h)]]
    },
  }
}

// ---------------------------------------------------------------------------
// Silhouette generators (all start on the axis at y = 0 and end at the rim)
// ---------------------------------------------------------------------------

/** Straight-sided beaker with a slight taper and rounded heel. */
export function beakerOutline(o: { radius: number; height: number }): ProfilePoint[] {
  const { radius: r, height: h } = o
  return [
    [0, 0],
    [r * 0.88, 0],
    [r * 0.97, r * 0.04],
    [r, r * 0.1],
    [r * 1.04, h * 0.9],
    [r * 1.07, h],
  ]
}

/** Test tube: round (hemispherical) bottom and straight walls. */
export function testTubeOutline(o: { radius: number; height: number; segments?: number }) {
  const { radius: r, height: h } = o
  const n = o.segments ?? 5
  const points: ProfilePoint[] = [[0, 0]]
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2)
    points.push([round(Math.sin(a) * r), round(r - Math.cos(a) * r)])
  }
  points.push([r, h - r * 0.2], [r * 1.12, h])
  return points
}

/** Conical (Erlenmeyer) flask: flat base, straight cone, cylindrical neck with a bead rim. */
export function erlenmeyerOutline(o: {
  baseRadius: number
  height: number
  neckRadius: number
  neckHeight: number
}): ProfilePoint[] {
  const { baseRadius: R, height: h, neckRadius: n, neckHeight: nh } = o
  const shoulder = h - nh
  return [
    [0, 0],
    [R * 0.9, 0],
    [R, R * 0.08],
    [R * 0.97, R * 0.2],
    [n * 1.25, shoulder - n * 0.15],
    [n, shoulder + n * 0.25],
    [n, h - n * 0.25],
    [n * 1.18, h],
  ]
}

/** Round-bottom flask: a sphere (bottom on y = 0) with a cylindrical neck. */
export function roundBottomOutline(o: {
  bulbRadius: number
  neckRadius: number
  neckHeight: number
  segments?: number
}): ProfilePoint[] {
  const { bulbRadius: R, neckRadius: n, neckHeight: nh } = o
  const segments = o.segments ?? 9
  const points: ProfilePoint[] = [[0, 0]]
  // Sphere from the bottom pole up to where it meets the neck.
  const topAngle = Math.PI - Math.asin(Math.min(0.95, (n * 1.15) / R))
  for (let i = 1; i <= segments; i++) {
    const a = (i / segments) * topAngle
    points.push([round(Math.sin(a) * R), round(R - Math.cos(a) * R)])
  }
  const neckBase = points[points.length - 1][1]
  points.push([n, neckBase + n * 0.4], [n, neckBase + nh], [n * 1.2, neckBase + nh + n * 0.2])
  return points
}

/** Straight cylinder with a flat base (gas jar, hard-glass tube, burette body). */
export function cylinderOutline(o: { radius: number; height: number; flare?: number }) {
  const { radius: r, height: h } = o
  return [
    [0, 0],
    [r * 0.92, 0],
    [r, r * 0.12],
    [r, h * 0.97],
    [r * (o.flare ?? 1.08), h],
  ] satisfies ProfilePoint[]
}

/** Shallow spherical cap (watch glass), concave side up. */
export function watchGlassOutline(o: { radius: number; depth: number; segments?: number }) {
  const n = o.segments ?? 6
  const points: ProfilePoint[] = [[0, 0]]
  for (let i = 1; i <= n; i++) {
    const t = i / n
    points.push([round(o.radius * t), round(o.depth * t * t)])
  }
  return points
}

/** Bottle: flat base, straight body, rounded shoulder, short neck. */
export function bottleOutline(o: {
  radius: number
  height: number
  neckRadius: number
  neckHeight: number
}): ProfilePoint[] {
  const { radius: r, height: h, neckRadius: n, neckHeight: nh } = o
  const shoulder = h - nh
  return [
    [0, 0],
    [r * 0.92, 0],
    [r, r * 0.1],
    [r, shoulder - r * 0.45],
    [r * 0.82, shoulder - r * 0.12],
    [n * 1.2, shoulder],
    [n, shoulder + nh * 0.25],
    [n, h - nh * 0.1],
    [n * 1.1, h],
  ]
}

/** Pear-shaped separating funnel body (narrow stem end at y = 0, open top). */
export function pearOutline(o: { radius: number; height: number; stemRadius: number }) {
  const { radius: R, height: h, stemRadius: s } = o
  return [
    [0, 0],
    [s, 0],
    [s * 1.6, h * 0.12],
    [R * 0.55, h * 0.35],
    [R * 0.9, h * 0.6],
    [R, h * 0.72],
    [R * 0.8, h * 0.86],
    [s * 2.4, h * 0.95],
    [s * 2.6, h],
  ] satisfies ProfilePoint[]
}

/** Total triangles a lathe of this profile produces with `segments` sides. */
export function latheTriangles(profile: readonly ProfilePoint[], segments: number) {
  return (profile.length - 1) * segments * 2
}
