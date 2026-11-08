import assert from 'node:assert/strict'
import test from 'node:test'
import {
  pourLiquid,
  readColor,
  readVolumeMl,
} from '../src/features/simulations/engine/core/index.ts'
import {
  BENCH_SUBSTANCES,
  DROP_ML,
  buildBenchDefinition,
  canPourFrom,
  flowRateMlPerS,
  formatMl,
  isBenchLiquidContainer,
  liquidSurfaceY,
  pourSourceDimensions,
  pourStartAngle,
  receiverRimHeight,
} from '../src/features/simulations/lib/benchLiquids.ts'
import {
  benchColor,
  benchPh,
  benchVolumeMl,
  useBenchLiquidsStore,
} from '../src/features/simulations/state/useBenchLiquidsStore.ts'
import { getPourPose } from '../src/features/simulations/three/equipmentPose.ts'

const store = () => useBenchLiquidsStore.getState()
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps

/** Runs the store clock until the pour finishes (bounded). */
function run(seconds, stepMs = 33) {
  for (let t = 0; t < seconds * 1000 && store().pour; t += stepMs) store().tick(stepMs)
}

function totalLiquid() {
  const s = store()
  return s.ids.reduce((sum, id) => sum + benchVolumeMl(s, id), 0) + s.spilledTotalMl
}

test('which bench items hold liquid: practice copies and library vessels, never salt items', () => {
  for (const id of [
    'beaker~2',
    'graduated-cylinder~2',
    'beaker-100',
    'erlenmeyer-flask',
    'test-tube',
    'wash-bottle',
    'hydrochloric-acid',
    'dropper',
  ])
    assert.ok(isBenchLiquidContainer(id), id)
  for (const id of ['beaker', 'graduated-cylinder', 'water', 'tripod', 'spirit-lamp', 'nope'])
    assert.ok(!isBenchLiquidContainer(id), id)
  assert.ok(canPourFrom('wash-bottle') && canPourFrom('beaker-100'))
  assert.ok(
    !canPourFrom('dropper') && !canPourFrom('burette'),
    'dropper drops, burette waits for L8',
  )
  const definition = buildBenchDefinition([
    'wash-bottle',
    'hydrochloric-acid',
    'hydrochloric-acid~2',
  ])
  assert.equal(definition.containers.length, 2, 'only one HCl bottle allowed')
  assert.deepEqual(definition.containers[0].initialContents, [
    { substanceId: 'water', amount: 450 },
  ])
  assert.ok(pourSourceDimensions('beaker~2').rim > 0.7)
  assert.ok(receiverRimHeight('erlenmeyer-flask') > 0.8)
})

test('pourLiquid moves a mixture in proportion, spills the excess and conserves volume', () => {
  const definition = {
    ...buildBenchDefinition(['beaker-100', 'test-tube']),
    substances: [
      ...BENCH_SUBSTANCES,
      { id: 'dye', name: 'Test dye', formula: 'X', state: 'aqueous', color: '#2040ff', opacity: 1 },
    ],
  }
  let lab = {
    timeS: 0,
    containers: {
      'beaker-100': { temperatureC: 22, contents: { water: 80, dye: 0.8 } },
      'test-tube': { temperatureC: 22, contents: {} },
    },
  }
  const half = pourLiquid(definition, lab, 'beaker-100', 'test-tube', 20)
  assert.ok(close(half.pouredMl, 20) && half.spilledMl === 0)
  assert.ok(close(half.state.containers['test-tube'].contents.dye, 0.2), 'dissolved dye follows')
  assert.equal(
    readColor(definition, half.state, 'test-tube'),
    readColor(definition, lab, 'beaker-100'),
  )
  // Overfill: the 25 mL tube already holds 20 mL.
  const over = pourLiquid(definition, half.state, 'beaker-100', 'test-tube', 10)
  assert.ok(close(over.pouredMl, 5) && close(over.spilledMl, 5))
  assert.ok(over.events.some((event) => event.type === 'overflow'))
  const after =
    readVolumeMl(definition, over.state, 'beaker-100') +
    readVolumeMl(definition, over.state, 'test-tube')
  assert.ok(close(after + over.spilledMl, 80), 'volume conserved including the spill')
  // Pouring everything leaves no float residue.
  lab = over.state
  const rest = pourLiquid(definition, lab, 'test-tube', 'beaker-100', 1e9)
  assert.equal(readVolumeMl(definition, rest.state, 'test-tube'), 0)
  assert.equal(pourLiquid(definition, rest.state, 'test-tube', 'beaker-100', 5).pouredMl, 0)
})

test('tilt → flow: fuller vessels pour sooner; flow rises with tilt', () => {
  assert.ok(pourStartAngle(1) < pourStartAngle(0.2))
  assert.equal(flowRateMlPerS(0.3, 0.2, 30), 0, 'not enough tilt for a low level')
  assert.ok(flowRateMlPerS(0.6, 0.9, 30) > 0)
  assert.ok(flowRateMlPerS(1.2, 0.5, 30) > flowRateMlPerS(1.0, 0.5, 30))
  assert.ok(flowRateMlPerS(Math.PI / 2, 0.05, 30) > 0, 'nearly empty still pours fully tipped')
  assert.equal(flowRateMlPerS(1.5, 0.5, 0), 0)
  assert.equal(formatMl(12.345), '12.3 mL')
  assert.equal(formatMl(-0.01), '0.0 mL')
  assert.equal(formatMl(1 - 3 * 0.05), '0.9 mL', 'float dust does not round a true 0.85 down')
})

test('keyboard "Pour 10 mL" delivers exactly 10.0 mL with conservation, then straightens', () => {
  store().reset()
  store().sync(['beaker', 'wash-bottle', 'beaker-100'])
  assert.deepEqual(store().ids, ['wash-bottle', 'beaker-100'])
  const before = totalLiquid()
  assert.ok(store().pourAmount('wash-bottle', 'beaker-100', 10))
  run(20)
  assert.equal(store().pour, null, 'pour ended and the bottle is upright')
  assert.ok(close(benchVolumeMl(store(), 'beaker-100'), 10, 1e-9))
  assert.equal(formatMl(store().readout.pouredMl), '10.0 mL')
  assert.equal(formatMl(store().readout.totalMl), '10.0 mL')
  assert.ok(close(totalLiquid(), before))
  // A second pour of the same pair counts "poured" from zero again.
  store().pourAmount('wash-bottle', 'beaker-100', 5)
  run(20)
  assert.equal(formatMl(store().readout.pouredMl), '5.0 mL')
  assert.equal(formatMl(store().readout.totalMl), '15.0 mL')
})

test('free tilting: flow follows the tilt; straightening stops it; level rises in the vessel shape', () => {
  store().reset()
  store().sync(['wash-bottle', 'erlenmeyer-flask'])
  assert.ok(!store().setTilt('erlenmeyer-flask', 'erlenmeyer-flask', 1))
  assert.ok(store().setTilt('wash-bottle', 'erlenmeyer-flask', 0.2))
  for (let i = 0; i < 30; i++) store().tick(33)
  assert.equal(benchVolumeMl(store(), 'erlenmeyer-flask'), 0, 'small tilt: no flow')
  store().setTilt('wash-bottle', 'erlenmeyer-flask', 1.3)
  for (let i = 0; i < 60; i++) store().tick(33)
  const poured = benchVolumeMl(store(), 'erlenmeyer-flask')
  assert.ok(poured > 1, `poured ${poured}`)
  store().straighten()
  run(5)
  const settled = benchVolumeMl(store(), 'erlenmeyer-flask')
  for (let i = 0; i < 10; i++) store().tick(33)
  assert.equal(benchVolumeMl(store(), 'erlenmeyer-flask'), settled, 'no flow after straightening')
  assert.ok(liquidSurfaceY('erlenmeyer-flask', 100) > liquidSurfaceY('erlenmeyer-flask', 10))
  assert.ok(close(totalLiquid(), 450))
})

test('overflow spills, warns and stops the pour; mixing updates colour and pH via the engine', () => {
  store().reset()
  store().sync(['wash-bottle', 'test-tube', 'hydrochloric-acid', 'beaker-100'])
  store().pourAmount('wash-bottle', 'test-tube', 40)
  run(30)
  assert.ok(close(benchVolumeMl(store(), 'test-tube'), 25, 1e-9), 'filled to capacity')
  assert.ok(store().spill && store().spill.spilledMl > 0)
  assert.match(store().spill.message, /overflowed/)
  assert.equal(store().pour, null)
  assert.ok(close(totalLiquid(), 450 + 380))

  store().pourAmount('wash-bottle', 'beaker-100', 90)
  run(40)
  assert.equal(benchPh(store(), 'beaker-100'), 7)
  store().pourAmount('hydrochloric-acid', 'beaker-100', 10)
  run(40)
  assert.ok(close(benchPh(store(), 'beaker-100'), 1, 1e-6), '10 mL 1 M HCl in 100 mL → pH 1')
  assert.ok(benchColor(store(), 'beaker-100'))
})

test('dropper: fill, then single 0.05 mL drops', () => {
  store().reset()
  store().sync(['hydrochloric-acid', 'dropper', 'test-tube', 'wash-bottle'])
  assert.ok(!store().addDrop('dropper', 'test-tube'), 'empty dropper')
  assert.ok(store().fillDropper('hydrochloric-acid', 'dropper'))
  assert.ok(close(benchVolumeMl(store(), 'dropper'), 1))
  store().pourAmount('wash-bottle', 'test-tube', 10)
  run(20)
  for (let i = 0; i < 3; i++) assert.ok(store().addDrop('dropper', 'test-tube'))
  assert.ok(close(benchVolumeMl(store(), 'test-tube'), 10 + 3 * DROP_ML))
  assert.equal(formatMl(store().readout.pouredMl), '0.2 mL', '3 drops ≈ 0.15 → shown to 0.1 mL')
  assert.equal(store().drop.seq, 3)
  assert.ok(benchPh(store(), 'test-tube') < 3)
})

test('sync: removed vessels lose contents; new copies start empty; pose overrides work', () => {
  store().reset()
  store().sync(['wash-bottle', 'beaker-100'])
  store().pourAmount('wash-bottle', 'beaker-100', 5)
  run(10)
  store().sync(['wash-bottle'])
  store().sync(['wash-bottle', 'beaker-100'])
  assert.equal(benchVolumeMl(store(), 'beaker-100'), 0)
  const pose = getPourPose('beaker-100', { x: 0, z: 0 }, 'erlenmeyer-flask', { x: 1, z: 0 }, 1, 0, {
    source: pourSourceDimensions('beaker-100'),
    targetRim: receiverRimHeight('erlenmeyer-flask'),
  })
  assert.ok(pose.outlet[1] > receiverRimHeight('erlenmeyer-flask'), 'lip above the receiver rim')
  assert.ok(Math.abs(pose.outlet[0] - 1) < 0.05, 'lip over the receiver centre')
  store().reset()
})
