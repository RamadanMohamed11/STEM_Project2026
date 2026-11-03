import assert from 'node:assert/strict'
import test from 'node:test'
import { getMouseInteractionCoach } from '../src/features/simulations/lib/mouseInteractionCoach.ts'

const initial = () => ({
  stepId: 'prepare',
  selectedId: null,
  hoveredId: null,
  draggingId: null,
  placementId: null,
  placementValid: null,
  sceneFeedback: null,
  acceptedEvents: 0,
})

test('first-use guidance advertises the left-mouse body and TILT handle paths', () => {
  const context = initial()
  const original = structuredClone(context)
  const result = getMouseInteractionCoach(context)
  assert.match(result.text, /Inventory/)
  assert.match(result.text, /TILT handles/)
  assert.deepEqual(context, original)
})

test('selecting a vessel shows an explicit mouse-only TILT instruction, not a shortcut', () => {
  const result = getMouseInteractionCoach({ ...initial(), selectedId: 'graduated-cylinder' })
  assert.match(result.text, /Drag the visible TILT handle/)
  assert.doesNotMatch(result.text, /Shift|keyboard|Right-drag/)
})

test('drag mode supersedes hover and selection to avoid contradictory instructions', () => {
  const result = getMouseInteractionCoach({
    ...initial(),
    draggingId: 'stirring-rod',
    selectedId: 'water',
    hoveredId: 'sodium-chloride',
  })
  assert.match(result.text, /complete circles/)
  assert.doesNotMatch(result.text, /TILT/)
})

test('placement preview reports collision and then guides clicking green', () => {
  const invalid = getMouseInteractionCoach({
    ...initial(),
    placementId: 'water',
    placementValid: false,
  })
  assert.equal(invalid.tone, 'warning')
  assert.match(invalid.text, /Red placement preview/)
  const valid = getMouseInteractionCoach({
    ...initial(),
    placementId: 'water',
    placementValid: true,
  })
  assert.equal(valid.tone, 'info')
  assert.match(valid.text, /left-click to place/)
})

test('failed collisions show error instead of generic move hint', () => {
  const result = getMouseInteractionCoach({
    ...initial(),
    sceneFeedback: 'Equipment overlaps another apparatus.',
  })
  assert.equal(result.tone, 'warning')
  assert.match(result.text, /overlaps/)
})
