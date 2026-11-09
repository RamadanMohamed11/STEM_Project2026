/**
 * L10 particle (molecular) view — pure model (no React/Three).
 * Turns the L1 engine state of one container into particle counts per species:
 * - solvent particles (e.g. H₂O) are a fixed-size background sample;
 * - solute particles keep their stoichiometric ratio and are scaled so the largest group is
 *   PARTICLE_SOLUTE_MAX (not to scale with the solvent);
 * - a species' particles are `bound` (in a solid lattice) or `free` (dissolved / liquid) or `gas`,
 *   by the state of the substances that contain them, so dissolving releases lattice ions and a
 *   precipitate binds free ions.
 * Motion speed follows the absolute temperature.
 */
import type {
  ChemistryDefinition,
  LabState,
  ParticleSpecies,
  SubstanceDefinition,
  SubstanceParticle,
} from '../engine/core/index.ts'

export const PARTICLE_SOLVENT_COUNT = 90
export const PARTICLE_SOLUTE_MAX = 40
const DEFAULT_MOLAR_MASS = 50
const REFERENCE_K = 293.15

export type ParticleRole = 'solvent' | 'solute'

export interface SpeciesView {
  key: string
  formula: string
  name: string
  color: string
  radius: number
  role: ParticleRole
  /** In a solid lattice. */
  bound: number
  /** Moving freely in the liquid (dissolved ions, liquid molecules). */
  free: number
  /** Gas particles (rise and escape). */
  gas: number
}

export interface ParticleScene {
  containerId: string
  temperatureC: number
  /** Relative particle speed, √(T / 293 K). */
  speed: number
  species: SpeciesView[]
  /** Plain-language summary for screen readers and the panel. */
  description: string
}

/** Moles of a substance amount (liquids by density). */
export function molesOf(substance: SubstanceDefinition, amount: number) {
  const grams = substance.state === 'liquid' ? amount * (substance.densityGPerMl ?? 1) : amount
  return grams / (substance.molarMassGPerMol ?? DEFAULT_MOLAR_MASS)
}

const nearlyClear = (color: string) => {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)?.[1]
  if (!hex) return true
  return [0, 2, 4].every((i) => parseInt(hex.slice(i, i + 2), 16) > 215)
}

/** Particles of a substance: its data, or one species named after the substance. */
export function substanceParticles(substance: SubstanceDefinition): readonly SubstanceParticle[] {
  if (substance.particles?.length) return substance.particles
  return [
    {
      species: {
        key: substance.id,
        formula: substance.formula.replace(/\((s|l|aq|g)\)$/, ''),
        name: substance.name,
        color: nearlyClear(substance.color) ? '#9aa9b3' : substance.color,
      },
      per: 1,
      // A liquid with no particle data is drawn as a solvent.
      solvent: substance.state === 'liquid',
    },
  ]
}

export function particleSpeed(temperatureC: number) {
  const kelvin = Math.max(1, (Number.isFinite(temperatureC) ? temperatureC : 20) + 273.15)
  return Math.sqrt(kelvin / REFERENCE_K)
}

interface Tally {
  species: ParticleSpecies
  role: ParticleRole
  solidMol: number
  freeMol: number
  gasMol: number
}

/** Particle scene for one container (null when the container is unknown). */
export function buildParticleScene(
  definition: ChemistryDefinition,
  lab: LabState,
  containerId: string,
): ParticleScene | null {
  const container = lab.containers[containerId]
  if (!container) return null
  const tallies = new Map<string, Tally>()
  let solventPresent = false

  for (const [substanceId, amount] of Object.entries(container.contents)) {
    if (!(amount > 0)) continue
    const substance = definition.substances.find((entry) => entry.id === substanceId)
    if (!substance) continue
    const moles = molesOf(substance, amount)
    for (const part of substanceParticles(substance)) {
      const role: ParticleRole = part.solvent ? 'solvent' : 'solute'
      if (role === 'solvent') solventPresent = true
      const tally = tallies.get(part.species.key) ?? {
        species: part.species,
        role,
        solidMol: 0,
        freeMol: 0,
        gasMol: 0,
      }
      if (role === 'solvent') tally.role = 'solvent'
      const n = moles * part.per
      if (substance.state === 'solid') tally.solidMol += n
      else if (substance.state === 'gas') tally.gasMol += n
      else tally.freeMol += n
      tallies.set(part.species.key, tally)
    }
  }

  const solutes = [...tallies.values()].filter((t) => t.role === 'solute')
  const maxSolute = Math.max(0, ...solutes.map((t) => t.solidMol + t.freeMol + t.gasMol))
  const solventTotal = [...tallies.values()]
    .filter((t) => t.role === 'solvent')
    .reduce((sum, t) => sum + t.freeMol + t.solidMol + t.gasMol, 0)

  const species: SpeciesView[] = [...tallies.values()].map((t) => {
    const total = t.solidMol + t.freeMol + t.gasMol
    let count: number
    if (t.role === 'solvent')
      count = solventTotal > 0 ? Math.round((PARTICLE_SOLVENT_COUNT * total) / solventTotal) : 0
    else
      count =
        maxSolute > 0 && total > 0
          ? Math.max(1, Math.round((PARTICLE_SOLUTE_MAX * total) / maxSolute))
          : 0
    const bound = total > 0 ? Math.round((count * t.solidMol) / total) : 0
    const gas = total > 0 ? Math.min(count - bound, Math.round((count * t.gasMol) / total)) : 0
    return {
      key: t.species.key,
      formula: t.species.formula,
      name: t.species.name,
      color: t.species.color,
      radius: t.species.radius ?? (t.role === 'solvent' ? 0.7 : 1),
      role: t.role,
      bound,
      free: count - bound - gas,
      gas,
    }
  })
  species.sort((a, b) => (a.role === b.role ? 0 : a.role === 'solvent' ? 1 : -1))

  const scene: ParticleScene = {
    containerId,
    temperatureC: container.temperatureC,
    speed: particleSpeed(container.temperatureC),
    species,
    description: '',
  }
  scene.description = describeParticles(scene, solventPresent)
  return scene
}

const list = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

/** Plain-language description of a scene. */
export function describeParticles(scene: ParticleScene, solventPresent = true) {
  const solutes = scene.species.filter((s) => s.role === 'solute')
  const solvent = scene.species.filter((s) => s.role === 'solvent')
  if (!scene.species.length) return 'The container is empty — there are no particles to show.'
  const parts: string[] = []
  if (solventPresent && solvent.length)
    parts.push(
      `${list(solvent.map((s) => s.formula))} molecules (a small sample) move around each other`,
    )
  const bound = solutes.filter((s) => s.bound > 0 && s.free === 0 && s.gas === 0)
  const mixed = solutes.filter((s) => s.bound > 0 && (s.free > 0 || s.gas > 0))
  const free = solutes.filter((s) => s.bound === 0 && s.free > 0)
  const gas = solutes.filter((s) => s.gas > 0)
  if (bound.length) parts.push(`${list(bound.map((s) => s.formula))} are held in a solid lattice`)
  if (mixed.length)
    parts.push(
      `${list(mixed.map((s) => s.formula))} are partly in the solid lattice and partly separated, surrounded by the solvent`,
    )
  if (free.length)
    parts.push(
      `${list(free.map((s) => s.formula))} ${solventPresent ? 'are separated and spread through the solvent' : 'move freely'}`,
    )
  if (gas.length) parts.push(`${list(gas.map((s) => s.formula))} gas particles rise and escape`)
  const pace =
    scene.speed > 1.12
      ? 'faster than at room temperature'
      : scene.speed < 0.95
        ? 'slower than at room temperature'
        : 'at room-temperature speed'
  return `${parts.join('; ')}. At ${Math.round(scene.temperatureC)} °C the particles move ${pace}.`
}

/**
 * Lattice slots at the bottom of the view (x, y in −1…1): a checkerboard so alternating species
 * (Na⁺, Cl⁻) sit next to each other, as in an ionic crystal. Returns slots per species.
 */
export function latticeSlots(boundCounts: readonly number[], spacing = 0.12) {
  const total = boundCounts.reduce((a, b) => a + b, 0)
  const columns = Math.max(1, Math.ceil(Math.sqrt(total * 2)))
  const result: [number, number][][] = boundCounts.map(() => [])
  const remaining = [...boundCounts]
  let k = 0
  for (let row = 0; remaining.some((n) => n > 0) && row < 200; row++)
    for (let col = 0; col < columns && remaining.some((n) => n > 0); col++, k++) {
      // Preferred species alternates like a checkerboard; fall back to any species still left.
      const preferred = (row + col) % Math.max(1, boundCounts.length)
      const pick = remaining[preferred] > 0 ? preferred : remaining.findIndex((n) => n > 0)
      remaining[pick]--
      result[pick].push([(col - (columns - 1) / 2) * spacing, -0.92 + row * spacing])
    }
  return result
}
