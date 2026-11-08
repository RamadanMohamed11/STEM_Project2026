/**
 * L4 model parts: a small declarative vocabulary (lathe, glass vessel, cylinder, box, sphere,
 * torus, tube, label, graduations) and a pure geometry builder. Every library model is a list of
 * parts; the same builder feeds the renderer and the triangle-budget test.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  LatheGeometry,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { glassWall, type ProfilePoint } from './glassware.ts'

export type Vec3 = readonly [number, number, number]

export type MaterialKey =
  | 'glassSolid'
  | 'amberGlass'
  | 'steel'
  | 'castIron'
  | 'brass'
  | 'aluminium'
  | 'rubber'
  | 'rubberRed'
  | 'plasticWhite'
  | 'plasticBlue'
  | 'plasticDark'
  | 'plasticYellow'
  | 'ceramic'
  | 'wood'
  | 'paper'
  | 'graphite'
  | 'acrylic'
  | 'cobalt'
  | 'copper'
  | 'cork'
  | 'display'
  | 'wireRed'
  | 'wireBlack'
  | 'spirit'
  | 'thermoLiquid'
  | 'pellets'
  | 'gauze'
  | 'sandpaper'
  | 'lamp'
  | 'gasCylinder'

interface Placed {
  at?: Vec3
  rot?: Vec3
  name?: string
}

interface Solid extends Placed {
  material: MaterialKey
  /** Overrides the material colour. */
  color?: string
}

export type ModelPart =
  | (Solid & { kind: 'lathe'; profile: readonly ProfilePoint[]; segments?: number })
  | (Placed & {
      kind: 'glass'
      /** Outer silhouette (see glassware.ts); the wall and floor are generated. */
      outer: readonly ProfilePoint[]
      wall: number
      floor?: number
      segments?: number
      tint?: string
    })
  | (Solid & {
      kind: 'cylinder'
      radius: number
      radiusTop?: number
      height: number
      segments?: number
      open?: boolean
    })
  | (Solid & { kind: 'box'; size: Vec3 })
  | (Solid & { kind: 'sphere'; radius: number; segments?: number })
  | (Solid & {
      kind: 'torus'
      radius: number
      tube: number
      arc?: number
      segments?: number
    })
  | (Solid & {
      kind: 'tube'
      path: readonly Vec3[]
      radius: number
      segments?: number
      radial?: number
    })
  | (Placed & {
      kind: 'label'
      lines: readonly string[]
      width: number
      height: number
      /** Wrap around a cylinder of this radius; flat when omitted. */
      radius?: number
      color?: string
      background?: string
    })
  | (Placed & {
      kind: 'graduations'
      capacityMl: number
      stepMl: number
      labelEveryMl: number
      bottomY: number
      maxHeight: number
      radiusBottom: number
      radiusTop: number
    })

export const DEFAULT_SEGMENTS = 32
export const GLASS_SEGMENTS = 40

const v2 = (points: readonly ProfilePoint[]) => points.map(([r, y]) => new Vector2(r, y))

/** Glass wall cross-section for a `glass` part (memoisable). */
export function glassShellProfile(part: Extract<ModelPart, { kind: 'glass' }>) {
  return glassWall(part.outer, part.wall, { floor: part.floor })
}

/**
 * Geometry for one part, in the part's local frame (apply `at`/`rot` on the mesh).
 * Glass parts return the shell; the renderer draws it twice (inner and outer faces).
 */
export function buildPartGeometry(part: ModelPart): BufferGeometry {
  switch (part.kind) {
    case 'lathe':
      return new LatheGeometry(v2(part.profile), part.segments ?? DEFAULT_SEGMENTS)
    case 'glass':
      return new LatheGeometry(v2(glassShellProfile(part).shell), part.segments ?? GLASS_SEGMENTS)
    case 'cylinder':
      return new CylinderGeometry(
        part.radiusTop ?? part.radius,
        part.radius,
        part.height,
        part.segments ?? DEFAULT_SEGMENTS,
        1,
        part.open ?? false,
      )
    case 'box':
      return new BoxGeometry(...part.size)
    case 'sphere':
      return new SphereGeometry(
        part.radius,
        part.segments ?? 20,
        Math.ceil((part.segments ?? 20) * 0.6),
      )
    case 'torus':
      return new TorusGeometry(
        part.radius,
        part.tube,
        8,
        part.segments ?? DEFAULT_SEGMENTS,
        part.arc ?? Math.PI * 2,
      )
    case 'tube': {
      const curve = new CatmullRomCurve3(
        part.path.map(([x, y, z]) => new Vector3(x, y, z)),
        false,
        'centripetal',
      )
      return new TubeGeometry(curve, part.segments ?? 24, part.radius, part.radial ?? 8, false)
    }
    case 'label':
      return part.radius
        ? new CylinderGeometry(
            part.radius,
            part.radius,
            part.height,
            40,
            1,
            true,
            -part.width / part.radius / 2,
            part.width / part.radius,
          )
        : new PlaneGeometry(part.width, part.height)
    case 'graduations':
      return new CylinderGeometry(
        part.radiusTop,
        part.radiusBottom,
        part.maxHeight,
        48,
        1,
        true,
        -0.95,
        1.9,
      )
  }
}

export function triangleCount(geometry: BufferGeometry) {
  const index = geometry.getIndex()
  return (index ? index.count : geometry.getAttribute('position').count) / 3
}

/** Rendered triangles for a part (glass shells are drawn twice: back and front faces). */
export function partTriangles(part: ModelPart) {
  const geometry = buildPartGeometry(part)
  const count = triangleCount(geometry) * (part.kind === 'glass' ? 2 : 1)
  geometry.dispose()
  return count
}
