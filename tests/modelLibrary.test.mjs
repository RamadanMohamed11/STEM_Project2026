import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { equipmentCatalog } from '../src/features/experiments/data/equipmentCatalog.ts'
import {
  beakerOutline,
  createFillModel,
  cylinderOutline,
  erlenmeyerOutline,
  glassWall,
  innerVolume,
  roundBottomOutline,
} from '../src/features/simulations/three/models/library/glassware.ts'
import {
  CLAMP_JAW_Y,
  CLAMP_REACH,
  LIBRARY_MODEL_IDS,
  LIBRARY_MODELS,
  TRIPOD_TOP,
  getModelAnchors,
  getVesselFill,
} from '../src/features/simulations/three/models/library/modelSpecs.ts'
import { partTriangles } from '../src/features/simulations/three/models/library/parts.ts'
import {
  equipmentRegistry,
  isChemistryLinked,
  isLibraryEquipment,
  nextInstanceId,
  resolveEquipment,
} from '../src/features/simulations/three/sceneConfig.ts'
import {
  SNAP_RULES,
  findSnapTarget,
  snapElevation,
} from '../src/features/simulations/three/benchLayout.ts'
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { buildInventoryEntries } from '../src/features/simulations/lib/inventoryBrowser.ts'

const scene = () => useLabSceneStore.getState()
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps

test('every catalogue equipment id renders a 3D model (salt models or the L4 library)', () => {
  const salt = new Set(equipmentRegistry.map((entry) => entry.id))
  const missing = equipmentCatalog
    .map((item) => item.id)
    .filter((id) => !salt.has(id) && !LIBRARY_MODELS[id])
  assert.deepEqual(missing, [])
  for (const id of LIBRARY_MODEL_IDS) {
    assert.ok(
      equipmentCatalog.some((item) => item.id === id),
      `${id} is a catalogue id`,
    )
    assert.ok(!salt.has(id), `${id} does not duplicate a salt model`)
  }
  assert.equal(LIBRARY_MODEL_IDS.length, 52)
})

test('every library model is low poly (< 5k triangles) and fully procedural', () => {
  for (const id of LIBRARY_MODEL_IDS) {
    const spec = LIBRARY_MODELS[id]
    const triangles = spec.parts.reduce((sum, part) => sum + partTriangles(part), 0)
    assert.ok(triangles > 0 && triangles < 5000, `${id}: ${triangles} triangles`)
    assert.ok(spec.footprintRadius > 0.05 && spec.footprintRadius <= 0.65, `${id} footprint`)
    assert.ok(spec.height > 0 && spec.height < 2.5, `${id} height`)
    assert.ok(spec.label.length > 0 && spec.label.length <= 24, `${id} short label`)
  }
  const sources = ['modelSpecs.ts', 'parts.ts', 'glassware.ts', 'LibraryModel.tsx']
    .map((file) =>
      readFileSync(
        new URL(`../src/features/simulations/three/models/library/${file}`, import.meta.url),
        'utf8',
      ),
    )
    .join('\n')
  assert.doesNotMatch(sources, /https?:\/\/|\.glb|\.gltf|\.png|\.jpg|useGLTF|TextureLoader/)
})

test('glassWall builds a closed wall: outer up, rim, inner down to the axis', () => {
  const outer = beakerOutline({ radius: 0.2, height: 0.5 })
  const { shell, inner } = glassWall(outer, 0.014)
  assert.equal(shell[0][0], 0, 'starts on the axis')
  assert.equal(shell[shell.length - 1][0], 0, 'closes on the axis (floor)')
  assert.ok(inner[0][1] > 0, 'floor raised by the glass thickness')
  for (let i = 1; i < inner.length; i++)
    assert.ok(inner[i][1] > inner[i - 1][1], 'inner surface rises monotonically')
  const rim = outer[outer.length - 1]
  assert.ok(close(inner[inner.length - 1][1], rim[1]), 'inner top meets the rim height')
  assert.ok(inner[inner.length - 1][0] < rim[0], 'inner radius inside the outer wall')
  // Round bottoms keep a positive wall all round.
  const round = glassWall(
    roundBottomOutline({ bulbRadius: 0.3, neckRadius: 0.085, neckHeight: 0.3 }),
    0.012,
  )
  assert.ok(round.inner.every(([r]) => r >= 0))
  assert.ok(Math.max(...round.inner.map(([r]) => r)) < 0.3)
})

test('fill API: heights follow the real inner shape and round-trip volumes to 0.1 mL', () => {
  // A straight cylinder fills linearly.
  const cyl = glassWall(cylinderOutline({ radius: 0.1, height: 1 }), 0.01, { floor: 0.02 })
  const cylinderFill = createFillModel(cyl.inner, 100, 0.8)
  const floor = cylinderFill.floorY
  const half = cylinderFill.heightForVolume(50)
  assert.ok(close(half - floor, (0.8 - floor) / 2, 0.01), 'cylinder: half volume ≈ half height')
  assert.ok(
    close(cylinderFill.heightForVolume(100), 0.8, 1e-4),
    'capacity sits on the nominal line',
  )

  // A conical flask: half the volume sits well below half the nominal height.
  const cone = glassWall(
    erlenmeyerOutline({ baseRadius: 0.32, height: 0.86, neckRadius: 0.095, neckHeight: 0.22 }),
    0.013,
  )
  const coneFill = createFillModel(cone.inner, 250, 0.5)
  assert.ok(coneFill.heightForVolume(125) < 0.25, 'conical flask fills fast near the base')
  assert.ok(coneFill.surfaceRadius(10) > coneFill.surfaceRadius(240), 'surface narrows upwards')

  for (const id of LIBRARY_MODEL_IDS) {
    const fill = getVesselFill(id)
    if (!fill) continue
    let previous = -Infinity
    for (const ml of [0, 0.1, 1, fill.capacityMl / 4, fill.capacityMl / 2, fill.capacityMl]) {
      const h = fill.heightForVolume(ml)
      assert.ok(h >= previous, `${id}: monotonic`)
      previous = h
      assert.ok(
        Math.abs(fill.volumeAtHeight(h) - ml) < 0.1,
        `${id}: ${ml} mL round-trips (${fill.volumeAtHeight(h)})`,
      )
    }
    assert.equal(fill.liquidProfile(0), null, `${id}: empty has no liquid`)
    const body = fill.liquidProfile(fill.capacityMl / 2)
    assert.equal(body[0][0], 0)
    assert.equal(body[body.length - 1][0], 0, `${id}: liquid body is closed`)
    // Overfilling clamps at the rim instead of drawing liquid outside the glass.
    const rim = fill.heightForVolume(1e9)
    assert.ok(rim <= fill.heightForVolume(fill.capacityMl * 10) + 1e-9)
    assert.ok(
      innerVolume(
        [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
        1,
      ) > 0,
    )
  }
})

test('vessels expose mouth, pour-lip and liquid-base anchors', () => {
  const vessels = LIBRARY_MODEL_IDS.filter((id) => getVesselFill(id))
  assert.ok(vessels.length >= 14)
  for (const id of ['test-tube', 'erlenmeyer-flask', 'round-bottom-flask', 'beaker-100']) {
    const anchors = getModelAnchors(id)
    assert.ok(anchors, id)
    assert.ok(anchors.liquidBase > 0 && anchors.liquidBase < anchors.mouth[1], `${id} base`)
    assert.ok(close(anchors.pourLip[1], anchors.mouth[1]), `${id} lip at rim height`)
    assert.ok(anchors.pourLip[0] > anchors.mouth[0], `${id} lip on +X`)
    assert.ok(anchors.mouth[1] <= LIBRARY_MODELS[id].height + 1e-9, `${id} mouth within height`)
  }
  assert.equal(getModelAnchors('tripod'), undefined, 'non-vessels have no liquid anchors')
})

test('library equipment resolves on the bench as practice items, with copies and limits', () => {
  const tripod = resolveEquipment('tripod')
  assert.equal(tripod.visual, 'library')
  assert.equal(tripod.modelId, 'tripod')
  assert.ok(isLibraryEquipment('tripod') && isLibraryEquipment('test-tube~2'))
  assert.ok(!isLibraryEquipment('beaker'))
  assert.equal(resolveEquipment('test-tube~2').label, 'Test tube 2')
  assert.equal(nextInstanceId('tripod', ['tripod']), null, 'one tripod')
  assert.equal(nextInstanceId('test-tube', ['test-tube', 'test-tube~2']), 'test-tube~3')
  assert.ok(isChemistryLinked('beaker') && !isChemistryLinked('beaker~2'))
  assert.ok(!isChemistryLinked('tripod'))

  const entries = buildInventoryEntries({ experimentItems: [], includeCatalog: true })
  const bunsen = entries.find((entry) => entry.id === 'bunsen-burner')
  assert.equal(bunsen.modelId, 'bunsen-burner')
  assert.equal(bunsen.availability.status, 'available')
})

test('real snap rules raise items onto the tripod, into the clamp and under the burette', () => {
  const ids = new Set(SNAP_RULES.flatMap((rule) => [rule.holderType, ...rule.itemTypes]))
  for (const id of ids) assert.ok(resolveEquipment(id), `${id} exists on the bench`)

  const base = (placedIds, positions, relationships = {}) => ({
    placedIds,
    positions,
    rotations: {},
    relationships,
  })
  // Flask released near the tripod: snaps to the ring, raised to the ring top.
  const atTripod = base(['tripod', 'erlenmeyer-flask'], {
    tripod: { x: 1, z: 0 },
    'erlenmeyer-flask': { x: 1.1, z: 0.1 },
  })
  const onTripod = findSnapTarget('erlenmeyer-flask', { x: 1.1, z: 0.1 }, atTripod)
  assert.equal(onTripod.rule.id, 'tripod-holds-vessel')
  const snapped = {
    'erlenmeyer-flask': { actorId: 'erlenmeyer-flask', targetId: 'tripod', kind: 'snapped' },
  }
  assert.ok(snapElevation('erlenmeyer-flask', snapped) > TRIPOD_TOP)
  // Burner goes under the tripod at bench level; occupancy is per rule.
  const burner = findSnapTarget(
    'bunsen-burner',
    { x: 1, z: 0 },
    base(['tripod', 'erlenmeyer-flask', 'bunsen-burner'], atTripod.positions, snapped),
  )
  assert.equal(burner.rule.id, 'burner-under-tripod')
  assert.equal(
    snapElevation('bunsen-burner', {
      'bunsen-burner': { actorId: 'bunsen-burner', targetId: 'tripod', kind: 'snapped' },
    }),
    0,
  )
  // Clamp: per-type heights put each neck at the jaws.
  const clamp = findSnapTarget(
    'test-tube',
    { x: CLAMP_REACH + 0.05, z: 0 },
    base(['clamp-stand', 'test-tube'], {
      'clamp-stand': { x: 0, z: 0 },
      'test-tube': { x: 2, z: 1 },
    }),
  )
  assert.equal(clamp.rule.id, 'clamp-holds-glassware')
  assert.ok(close(clamp.position.x, CLAMP_REACH))
  const inClamp = (id) =>
    snapElevation(id, { [id]: { actorId: id, targetId: 'clamp-stand', kind: 'snapped' } })
  assert.ok(close(inClamp('test-tube'), CLAMP_JAW_Y - 0.7))
  assert.ok(inClamp('erlenmeyer-flask') > 0 && inClamp('erlenmeyer-flask') < CLAMP_JAW_Y)
  // Titration: the conical flask sits on the burette stand's base.
  const titration = findSnapTarget(
    'erlenmeyer-flask-100',
    { x: 0.05, z: 0 },
    base(['burette', 'erlenmeyer-flask-100'], {
      burette: { x: 0, z: 0 },
      'erlenmeyer-flask-100': { x: 2, z: 0 },
    }),
  )
  assert.equal(titration.rule.id, 'flask-under-burette')
  assert.equal(snapElevation('beaker', {}), 0)
})

test('store: add tripod and flask to the bench, snap, move together, undo', () => {
  scene().resetEquipment()
  const tripodId = scene().addToBench('tripod')
  const flaskId = scene().addToBench('erlenmeyer-flask')
  assert.equal(tripodId, 'tripod')
  assert.equal(flaskId, 'erlenmeyer-flask')
  const at = scene().positions.tripod
  scene().snapTo('erlenmeyer-flask', 'tripod', { ...at })
  assert.ok(snapElevation('erlenmeyer-flask', scene().relationships) > TRIPOD_TOP)
  scene().move('tripod', { x: at.x, z: at.z + 0.2 })
  assert.ok(close(scene().positions['erlenmeyer-flask'].z, scene().positions.tripod.z))
  assert.ok(scene().undo())
  assert.ok(close(scene().positions.tripod.z, at.z))
  scene().resetEquipment()
})
