import assert from 'node:assert/strict'
import test from 'node:test'
import { validateChemistryDefinition } from '../src/features/simulations/engine/core/index.ts'
import { saltCoreExperiment } from '../src/features/simulations/data/saltCoreDefinition.ts'
import { EFFECTS_DEMO_DEFINITION } from '../src/features/simulations/data/effectsDemoDefinition.ts'
import { buildBenchDefinition } from '../src/features/simulations/lib/benchLiquids.ts'
import {
  PARTICLE_SOLUTE_MAX,
  PARTICLE_SOLVENT_COUNT,
  buildParticleScene,
  latticeSlots,
  particleSpeed,
} from '../src/features/simulations/lib/particleModel.ts'

const salt = saltCoreExperiment.chemistry
const lab = (contents, temperatureC = 20) => ({
  timeS: 0,
  containers: { beaker: { temperatureC, contents } },
})
const byKey = (scene) => Object.fromEntries(scene.species.map((s) => [s.key, s]))

test('particle data keeps the definitions valid', () => {
  assert.deepEqual(validateChemistryDefinition(salt), [])
  assert.deepEqual(validateChemistryDefinition(buildBenchDefinition(['wash-bottle'])), [])
})

test('undissolved salt: Na⁺ and Cl⁻ in a lattice, 1:1, with a water sample around', () => {
  const s = byKey(buildParticleScene(salt, lab({ water: 100, 'sodium-chloride': 5 }), 'beaker'))
  assert.equal(s['Na+'].bound, PARTICLE_SOLUTE_MAX)
  assert.equal(s['Cl-'].bound, PARTICLE_SOLUTE_MAX)
  assert.equal(s['Na+'].free, 0)
  assert.equal(s.H2O.role, 'solvent')
  assert.equal(s.H2O.free, PARTICLE_SOLVENT_COUNT)
})

test('dissolving moves ions out of the lattice; the total stays the same', () => {
  const part = byKey(
    buildParticleScene(
      salt,
      lab({ water: 100, 'sodium-chloride': 2, 'sodium-chloride-aq': 3 }),
      'beaker',
    ),
  )
  assert.equal(part['Na+'].bound + part['Na+'].free, PARTICLE_SOLUTE_MAX)
  assert.equal(part['Na+'].bound, 16, '2 g of 5 g still solid → 40 %')
  assert.equal(part['Cl-'].free, 24)
  const done = byKey(
    buildParticleScene(salt, lab({ water: 100, 'sodium-chloride-aq': 5 }), 'beaker'),
  )
  assert.equal(done['Na+'].bound, 0)
  assert.equal(done['Na+'].free, PARTICLE_SOLUTE_MAX)
  const scene = buildParticleScene(salt, lab({ water: 100, 'sodium-chloride-aq': 5 }), 'beaker')
  assert.match(scene.description, /Na⁺ and Cl⁻ are separated and spread through the solvent/)
})

test('motion speed follows the absolute temperature', () => {
  assert.ok(Math.abs(particleSpeed(20) - 1) < 1e-9)
  assert.ok(particleSpeed(100) > 1.12 && particleSpeed(0) < 1)
  const hot = buildParticleScene(salt, lab({ water: 100 }, 95), 'beaker')
  assert.match(hot.description, /faster than at room temperature/)
  assert.ok(hot.speed > 1.1)
})

test('bench acid shows H₃O⁺ and Cl⁻ in water; unknown or empty containers', () => {
  const definition = buildBenchDefinition(['hydrochloric-acid', 'beaker-100'])
  const state = {
    timeS: 0,
    containers: { 'beaker-100': { temperatureC: 22, contents: { 'hydrochloric-acid': 10 } } },
  }
  const s = byKey(buildParticleScene(definition, state, 'beaker-100'))
  assert.equal(s['H3O+'].free, PARTICLE_SOLUTE_MAX)
  assert.equal(s['Cl-'].free, PARTICLE_SOLUTE_MAX)
  assert.equal(s.H2O.role, 'solvent')
  assert.equal(buildParticleScene(definition, state, 'nope'), null)
  const empty = buildParticleScene(
    definition,
    { timeS: 0, containers: { x: { temperatureC: 22, contents: {} } } },
    'x',
  )
  assert.deepEqual(empty.species, [])
  assert.match(empty.description, /empty/)
})

test('substances without particle data still show: precipitate bound, gas rising', () => {
  const d = EFFECTS_DEMO_DEFINITION
  const state = {
    timeS: 0,
    containers: {
      p: { temperatureC: 22, contents: { water: 60, agcl: 0.7, nano3: 0.4 } },
      g: { temperatureC: 22, contents: { water: 80, co2: 0.2, cacl2: 1 } },
    },
  }
  const p = byKey(buildParticleScene(d, state, 'p'))
  assert.ok(p.agcl.bound > 0 && p.agcl.free === 0, 'solid AgCl is a lattice')
  assert.ok(p.nano3.free > 0)
  assert.equal(p.water.role, 'solvent')
  const g = byKey(buildParticleScene(d, state, 'g'))
  assert.ok(g.co2.gas > 0, 'CO₂ particles are gas')
})

test('lattice slots alternate species like an ionic crystal and match the counts', () => {
  const [na, cl] = latticeSlots([8, 8])
  assert.equal(na.length, 8)
  assert.equal(cl.length, 8)
  const key = ([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`
  const all = new Set([...na, ...cl].map(key))
  assert.equal(all.size, 16, 'no two particles share a slot')
  // Horizontal neighbours on the bottom row belong to different species.
  const bottom = [...na.map((p) => [...p, 'Na']), ...cl.map((p) => [...p, 'Cl'])]
    .filter(([, y]) => Math.abs(y + 0.92) < 1e-9)
    .sort((a, b) => a[0] - b[0])
  for (let i = 1; i < bottom.length; i++) assert.notEqual(bottom[i][2], bottom[i - 1][2])
  assert.deepEqual(
    latticeSlots([3, 0]).map((s) => s.length),
    [3, 0],
  )
})
