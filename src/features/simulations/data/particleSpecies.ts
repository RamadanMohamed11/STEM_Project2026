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
export const HYDROXIDE_ION: ParticleSpecies = {
  key: 'OH-',
  formula: 'OH⁻',
  name: 'Hydroxide ion',
  color: '#e87a90',
  radius: 0.8,
}
export const SILVER_ION: ParticleSpecies = {
  key: 'Ag+',
  formula: 'Ag⁺',
  name: 'Silver ion',
  color: '#c0c0c0',
  radius: 1.15,
}
export const NITRATE_ION: ParticleSpecies = {
  key: 'NO3-',
  formula: 'NO₃⁻',
  name: 'Nitrate ion',
  color: '#3f51b5',
  radius: 1.2,
}
export const CALCIUM_ION: ParticleSpecies = {
  key: 'Ca2+',
  formula: 'Ca²⁺',
  name: 'Calcium ion',
  color: '#ff9800',
  radius: 1.0,
}
export const CARBONATE_ION: ParticleSpecies = {
  key: 'CO32-',
  formula: 'CO₃²⁻',
  name: 'Carbonate ion',
  color: '#9c27b0',
  radius: 1.25,
}
export const COPPER_ION: ParticleSpecies = {
  key: 'Cu2+',
  formula: 'Cu²⁺',
  name: 'Copper(II) ion',
  color: '#0288d1',
  radius: 0.95,
}
export const SULFATE_ION: ParticleSpecies = {
  key: 'SO42-',
  formula: 'SO₄²⁻',
  name: 'Sulfate ion',
  color: '#ffd600',
  radius: 1.25,
}
export const POTASSIUM_ION: ParticleSpecies = {
  key: 'K+',
  formula: 'K⁺',
  name: 'Potassium ion',
  color: '#ab47bc',
  radius: 1.3,
}

export const WATER_PARTICLES: readonly SubstanceParticle[] = [
  { species: WATER_MOLECULE, per: 1, solvent: true },
]
export const SODIUM_CHLORIDE_PARTICLES: readonly SubstanceParticle[] = [
  { species: SODIUM_ION, per: 1 },
  { species: CHLORIDE_ION, per: 1 },
]
export const SODIUM_HYDROXIDE_PARTICLES: readonly SubstanceParticle[] = [
  { species: SODIUM_ION, per: 1 },
  { species: HYDROXIDE_ION, per: 1 },
]
export const SILVER_NITRATE_PARTICLES: readonly SubstanceParticle[] = [
  { species: SILVER_ION, per: 1 },
  { species: NITRATE_ION, per: 1 },
]
export const SILVER_CHLORIDE_PARTICLES: readonly SubstanceParticle[] = [
  { species: SILVER_ION, per: 1 },
  { species: CHLORIDE_ION, per: 1 },
]
export const COPPER_SULFATE_PARTICLES: readonly SubstanceParticle[] = [
  { species: COPPER_ION, per: 1 },
  { species: SULFATE_ION, per: 1 },
]
/** Dilute HCl modelled as one liquid: water as solvent plus H₃O⁺ and Cl⁻ per mole of acid. */
export const HYDROCHLORIC_ACID_PARTICLES: readonly SubstanceParticle[] = [
  { species: WATER_MOLECULE, per: 1, solvent: true },
  { species: HYDRONIUM_ION, per: 1 },
  { species: CHLORIDE_ION, per: 1 },
]
