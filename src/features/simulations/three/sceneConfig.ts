import type { EquipmentVisual } from '@/types/laboratory'

/** All world dimensions are metres; Y is up and the table surface is Y = 0.78. */
export const BENCH_TOP = 0.78
export const BENCH_WIDTH = 6.4
export const BENCH_DEPTH = 3.25
export const EQUIPMENT_LIMITS = { minX: -2.85, maxX: 2.85, minZ: -1.3, maxZ: 1.3 } as const

/**
 * Camera fit is a *view* transform only, never used by pointer projection,
 * world-space physics, or tabletop equipment positions. Keep margins wide
 * enough for the HUD while giving desktop students a much closer bench view.
 */
export const LAB_CAMERA_FOV = 42
export const CAMERA_TARGET = [0, 1.04, 0.04] as const
export const CAMERA_DESKTOP_POSITION = [2.65, 3.52, 5.12] as const
const DESKTOP_DISTANCE = Math.hypot(
  CAMERA_DESKTOP_POSITION[0] - CAMERA_TARGET[0],
  CAMERA_DESKTOP_POSITION[1] - CAMERA_TARGET[1],
  CAMERA_DESKTOP_POSITION[2] - CAMERA_TARGET[2],
)

export function cameraPositionForAspect(aspect: number): [number, number, number] {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9
  const halfFov = (LAB_CAMERA_FOV * Math.PI) / 360
  // 7.4 metres of horizontal content (6.4m workbench + camera/overlay margin).
  const requiredHorizontalDistance = 7.4 / (2 * Math.tan(halfFov) * safeAspect)
  const requiredVerticalDistance = 3.6 / (2 * Math.tan(halfFov))
  const distance = Math.max(DESKTOP_DISTANCE, requiredHorizontalDistance, requiredVerticalDistance)
  const scale = distance / DESKTOP_DISTANCE
  return [
    CAMERA_TARGET[0] + (CAMERA_DESKTOP_POSITION[0] - CAMERA_TARGET[0]) * scale,
    CAMERA_TARGET[1] + (CAMERA_DESKTOP_POSITION[1] - CAMERA_TARGET[1]) * scale,
    CAMERA_TARGET[2] + (CAMERA_DESKTOP_POSITION[2] - CAMERA_TARGET[2]) * scale,
  ]
}

export type Point2D = { x: number; z: number }

export interface EquipmentRegistryEntry {
  id: string
  visual: EquipmentVisual
  label: string
  footprintRadius: number
  defaultPosition: Point2D
}

export const equipmentRegistry: readonly EquipmentRegistryEntry[] = [
  {
    id: 'digital-balance',
    label: 'Digital balance',
    visual: 'digital-balance',
    footprintRadius: 0.48,
    defaultPosition: { x: -2.1, z: 0.18 },
  },
  {
    id: 'water',
    label: 'Water container',
    visual: 'water',
    footprintRadius: 0.34,
    defaultPosition: { x: -1.18, z: -0.55 },
  },
  {
    id: 'graduated-cylinder',
    label: 'Graduated cylinder',
    visual: 'graduated-cylinder',
    footprintRadius: 0.25,
    defaultPosition: { x: -0.42, z: 0.35 },
  },
  {
    id: 'beaker',
    label: 'Beaker',
    visual: 'beaker',
    footprintRadius: 0.46,
    defaultPosition: { x: 0.55, z: 0.08 },
  },
  {
    id: 'stirring-rod',
    label: 'Stirring rod',
    visual: 'stirring-rod',
    footprintRadius: 0.2,
    defaultPosition: { x: 1.25, z: -0.7 },
  },
  {
    id: 'sodium-chloride',
    label: 'Sodium chloride',
    visual: 'sodium-chloride',
    footprintRadius: 0.34,
    defaultPosition: { x: 2.14, z: 0.25 },
  },
  {
    id: 'spatula',
    label: 'Laboratory spatula',
    visual: 'spatula',
    footprintRadius: 0.33,
    defaultPosition: { x: 1.93, z: -0.82 },
  },
  {
    id: 'weighing-boat',
    label: 'Weighing boat',
    visual: 'weighing-boat',
    footprintRadius: 0.25,
    defaultPosition: { x: -1.37, z: 0.9 },
  },
]

export const DEFAULT_CAMERA_POSITION = CAMERA_DESKTOP_POSITION
export const DEFAULT_CAMERA_TARGET = CAMERA_TARGET
