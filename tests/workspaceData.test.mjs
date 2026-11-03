import assert from 'node:assert/strict'
import test from 'node:test'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'
import { saltDissolutionWorkspace } from '../src/features/simulations/data/saltDissolutionWorkspace.ts'
import {
  clampGuideStage,
  findInventoryItem,
  getLaboratoryPresentation,
  guidePositionPercent,
} from '../src/features/simulations/lib/workspaceSelectors.ts'

test('the salt demonstration contains six tools, two materials and five guide stages', () => {
  const workspace = getLaboratoryPresentation('exp-salt-water-001')
  assert.equal(workspace, saltDissolutionWorkspace)
  assert.equal(workspace.inventory.filter((item) => item.category === 'equipment').length, 6)
  assert.equal(workspace.inventory.filter((item) => item.category === 'materials').length, 2)
  assert.deepEqual(
    workspace.stages.map((stage) => stage.kind),
    ['equipment', 'materials', 'procedure', 'measurements', 'observations'],
  )
  assert.equal(new Set(workspace.inventory.map((item) => item.id)).size, 8)
  assert.equal(new Set(workspace.stages.map((stage) => stage.id)).size, 5)
  assert.equal(getLaboratoryPresentation('exp-ph-003'), undefined)
})

test('inventory selection lookup is stable and does not mutate metadata', () => {
  assert.equal(findInventoryItem(saltDissolutionWorkspace.inventory, 'beaker')?.title, 'Beaker')
  assert.equal(findInventoryItem(saltDissolutionWorkspace.inventory, null), undefined)
  assert.equal(findInventoryItem(saltDissolutionWorkspace.inventory, 'unknown'), undefined)
  assert.equal(
    findInventoryItem(saltDissolutionWorkspace.inventory, 'sodium-chloride')?.visual,
    'sodium-chloride',
  )
})

test('guide stage indices clamp to valid boundaries and report reading position', () => {
  assert.equal(clampGuideStage(-4, 5), 0)
  assert.equal(clampGuideStage(100, 5), 4)
  assert.equal(clampGuideStage(2, 5), 2)
  assert.equal(guidePositionPercent(0, 5), 20)
  assert.equal(guidePositionPercent(2, 5), 60)
  assert.equal(guidePositionPercent(4, 5), 100)
  assert.equal(guidePositionPercent(0, 0), 0)
})

test('workspace script states scientific scope without inventing simulated observations', () => {
  const lastStage = saltDissolutionWorkspace.stages.at(-1)
  assert.match(lastStage.introduction, /physical dissolution process/i)
  assert.match(lastStage.note, /simplified simulation rules/i)
  assert.match(saltDissolutionWorkspace.stages[3].note, /simulat/i)
  assert.match(demoCatalog.experiments[0].safety.note, /never taste/i)
})
