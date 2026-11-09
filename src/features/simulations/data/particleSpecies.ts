import type { ParticleSpecies, SubstanceParticle } from '../engine/core/index.ts'

/** L10 particle species shared by the experiments' substances (our own colour scheme). */
export const WATER_MOLECULE: ParticleSpecies = {
  key: 'H2O',
  formula: 'H₂O',
  name: 'Water molecule',
  color: '#7fb8e8',
  radius: 0.7,
}
export const SODIUM_ION: ParticleSpecies = {
  key: 'Na+',
  formula: 'Na⁺',
  name: 'Sodium ion',
  color: '#8e6bd8',
  radius: 0.85,
}
export const CHLORIDE_ION: ParticleSpecies = {
  key: 'Cl-',
  formula: 'Cl⁻',
  name: 'Chloride ion',
  color: '#4fb86a',
  radius: 1.15,
}
export const HYDRONIUM_ION: ParticleSpecies = {
  key: 'H3O+',
  formula: 'H₃O⁺',
  name: 'Hydronium ion',
  color: '#e8584a',
  radius: 0.8,
}

export const WATER_PARTICLES: readonly SubstanceParticle[] = [
  { species: WATER_MOLECULE, per: 1, solvent: true },
]
export const SODIUM_CHLORIDE_PARTICLES: readonly SubstanceParticle[] = [
  { species: SODIUM_ION, per: 1 },
  { species: CHLORIDE_ION, per: 1 },
]
/** Dilute HCl modelled as one liquid: water as solvent plus H₃O⁺ and Cl⁻ per mole of acid. */
export const HYDROCHLORIC_ACID_PARTICLES: readonly SubstanceParticle[] = [
  { species: WATER_MOLECULE, per: 1, solvent: true },
  { species: HYDRONIUM_ION, per: 1 },
  { species: CHLORIDE_ION, per: 1 },
]
