import { useEffect, useMemo } from 'react'
import { Vector2 } from 'three'
import { GlassVesselShell } from '../GlassVesselShell'
import { SurfaceLabel } from '../SurfaceLabel'
import { ProfiledVesselContents } from '../VesselContents'
import { VesselMarkings } from '../VesselMarkings'
import {
  buildPartGeometry,
  glassShellProfile,
  GLASS_SEGMENTS,
  type MaterialKey,
  type ModelPart,
} from './parts'
import { getLibraryModel, getVesselFill } from './modelSpecs'

interface MaterialLook {
  color: string
  metalness?: number
  roughness?: number
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
}

/** Our own neutral palette; no textures or downloaded assets. */
const LOOKS: Readonly<Record<MaterialKey, MaterialLook>> = {
  glassSolid: { color: '#e3efec', roughness: 0.08, opacity: 0.42 },
  amberGlass: { color: '#a5672a', roughness: 0.12, opacity: 0.6 },
  steel: { color: '#b9c1c6', metalness: 0.85, roughness: 0.3 },
  castIron: { color: '#2f3a44', metalness: 0.45, roughness: 0.62 },
  brass: { color: '#c8a24b', metalness: 0.8, roughness: 0.34 },
  aluminium: { color: '#d3d8dc', metalness: 0.75, roughness: 0.32 },
  rubber: { color: '#26292d', roughness: 0.92 },
  rubberRed: { color: '#a9432f', roughness: 0.8 },
  plasticWhite: { color: '#eef2f3', roughness: 0.5, opacity: 0.94 },
  plasticBlue: { color: '#2f6fb3', roughness: 0.45 },
  plasticDark: { color: '#30363c', roughness: 0.55 },
  plasticYellow: { color: '#e2b324', roughness: 0.5 },
  ceramic: { color: '#f6f5f0', roughness: 0.22 },
  wood: { color: '#b98a55', roughness: 0.82 },
  paper: { color: '#f8f6ef', roughness: 0.95 },
  graphite: { color: '#2b2d31', metalness: 0.3, roughness: 0.6 },
  acrylic: { color: '#d8edf3', roughness: 0.1, opacity: 0.3 },
  cobalt: { color: '#2342b0', roughness: 0.15, opacity: 0.78 },
  copper: { color: '#b8693a', metalness: 0.8, roughness: 0.35 },
  cork: { color: '#a8794a', roughness: 0.95 },
  display: { color: '#a3c19d', roughness: 0.4, emissive: '#3c5a35', emissiveIntensity: 0.25 },
  wireRed: { color: '#c0392b', roughness: 0.55 },
  wireBlack: { color: '#1f2124', roughness: 0.55 },
  spirit: { color: '#cfe6f2', roughness: 0.1, opacity: 0.3 },
  thermoLiquid: { color: '#d0342c', roughness: 0.3 },
  pellets: { color: '#f4f4f0', roughness: 0.6 },
  gauze: { color: '#8d949a', metalness: 0.6, roughness: 0.5, opacity: 0.75 },
  sandpaper: { color: '#4b4640', roughness: 1 },
  lamp: {
    color: '#fff4c4',
    roughness: 0.15,
    opacity: 0.75,
    emissive: '#ffe08a',
    emissiveIntensity: 0.15,
  },
  gasCylinder: { color: '#3d7a5a', metalness: 0.4, roughness: 0.45 },
}

const SELECTED_EMISSIVE = '#4b817c'

function SolidPart({
  part,
  selected,
}: {
  part: Extract<ModelPart, { material: MaterialKey }>
  selected: boolean
}) {
  const geometry = useMemo(() => buildPartGeometry(part), [part])
  useEffect(() => () => geometry.dispose(), [geometry])
  const look = LOOKS[part.material]
  const transparent = look.opacity !== undefined
  return (
    <mesh
      geometry={geometry}
      position={part.at}
      rotation={part.rot}
      castShadow={!transparent}
      receiveShadow
      renderOrder={transparent ? 5 : 0}
    >
      <meshStandardMaterial
        color={part.color ?? look.color}
        metalness={look.metalness ?? 0}
        roughness={look.roughness ?? 0.5}
        transparent={transparent}
        opacity={look.opacity ?? 1}
        depthWrite={!transparent}
        emissive={selected ? SELECTED_EMISSIVE : (look.emissive ?? '#000000')}
        emissiveIntensity={selected ? 0.08 : (look.emissiveIntensity ?? 0)}
      />
    </mesh>
  )
}

function GlassPart({
  part,
  selected,
  children,
}: {
  part: Extract<ModelPart, { kind: 'glass' }>
  selected: boolean
  children?: React.ReactNode
}) {
  const profile = useMemo(
    () => glassShellProfile(part).shell.map(([r, y]) => new Vector2(r, y)),
    [part],
  )
  return (
    <group position={part.at} rotation={part.rot}>
      {children}
      <GlassVesselShell
        profile={profile}
        segments={part.segments ?? GLASS_SEGMENTS}
        selected={selected}
        tint={part.tint}
      />
    </group>
  )
}

interface LibraryModelProps {
  id: string
  selected: boolean
  /** Liquid in the vessel (mL). Defaults to the spec's static display contents, if any. */
  volumeMl?: number
  liquidColor?: string
}

/** Renders any L4 library model from its declarative spec. */
export function LibraryModel({ id, selected, volumeMl, liquidColor }: LibraryModelProps) {
  const spec = getLibraryModel(id)
  if (!spec) return null
  const fill = getVesselFill(id)
  const volume = volumeMl ?? spec.vessel?.contents?.volumeMl ?? 0
  const color = liquidColor ?? spec.vessel?.contents?.color

  return (
    <group name={`library-model-${id}`}>
      {spec.parts.map((part, index) => {
        switch (part.kind) {
          case 'glass':
            return (
              <GlassPart key={index} part={part} selected={selected}>
                {fill && spec.vessel?.part === index && volume > 0 && (
                  <ProfiledVesselContents volumeMl={volume} fill={fill} color={color} />
                )}
              </GlassPart>
            )
          case 'label':
            return (
              <group key={index} position={part.at} rotation={part.rot}>
                <SurfaceLabel
                  lines={part.lines}
                  width={part.width}
                  height={part.height}
                  radius={part.radius}
                  color={part.color}
                  background={part.background}
                />
              </group>
            )
          case 'graduations':
            return (
              <group key={index} position={part.at} rotation={part.rot}>
                <VesselMarkings
                  capacityMl={part.capacityMl}
                  stepMl={part.stepMl}
                  labelEveryMl={part.labelEveryMl}
                  bottomY={part.bottomY}
                  maxHeight={part.maxHeight}
                  radiusBottom={part.radiusBottom}
                  radiusTop={part.radiusTop}
                />
              </group>
            )
          default:
            return <SolidPart key={index} part={part} selected={selected} />
        }
      })}
    </group>
  )
}
