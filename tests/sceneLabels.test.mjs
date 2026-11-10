import assert from 'node:assert/strict'
import test from 'node:test'
import { Group, PerspectiveCamera, Vector3 } from 'three'
import { projectSceneLabel } from '../src/features/simulations/three/labelProjection.ts'

function camera() {
  const c = new PerspectiveCamera(45, 2, 0.1, 100)
  c.position.z = 5
  c.updateMatrixWorld()
  return c
}
test('labels project world position into the canvas rectangle on desktop and mobile', () => {
  const c = camera()
  for (const [w, h] of [
    [1440, 900],
    [375, 812],
  ]) {
    const p = projectSceneLabel(new Vector3(), c, w, h, [19, 0])
    assert.equal(p.x, w / 2)
    assert.equal(p.y, h / 2)
    assert.equal(p.visible, true)
    assert.ok(p.zIndex <= 19 && p.zIndex >= 0)
  }
})
test('points behind the camera or outside clipping planes are hidden', () => {
  const c = camera()
  for (const z of [6, -101, 4.99])
    assert.equal(projectSceneLabel(new Vector3(0, 0, z), c, 375, 812, [19, 0]).visible, false)
})
test('labels follow parent equipment movement without changing the scene or camera', () => {
  const c = camera(),
    parent = new Group(),
    child = new Group()
  parent.add(child)
  const project = () => {
    parent.updateMatrixWorld()
    return projectSceneLabel(child.getWorldPosition(new Vector3()), c, 1440, 900, [19, 0])
  }
  const before = project()
  parent.position.x = 1
  const after = project()
  assert.ok(after.x > before.x)
  assert.equal(after.y, before.y)
  assert.equal(parent.position.x, 1)
  assert.deepEqual(c.position.toArray(), [0, 0, 5])
})
