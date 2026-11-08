import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  ALPHABET,
  INVENTORY_CATEGORIES,
  availableLetters,
  buildInventoryEntries,
  countByCategory,
  filterInventory,
  firstLetter,
  normalizeSearch,
} from '../src/features/simulations/lib/inventoryBrowser.ts'
import { saltDissolutionWorkspace } from '../src/features/simulations/data/saltDissolutionWorkspace.ts'
import { saltCoreExperiment } from '../src/features/simulations/data/saltCoreDefinition.ts'
import { equipmentCatalog } from '../src/features/experiments/data/equipmentCatalog.ts'

const items = saltDissolutionWorkspace.inventory
const guided = buildInventoryEntries({ experimentItems: items, core: saltCoreExperiment })
const all = { category: 'all', query: '', letter: null }
const ids = (entries) => entries.map((entry) => entry.id)

test('salt items map to catalogue categories and engine formulas, in experiment order', () => {
  assert.deepEqual(
    ids(guided),
    items.map((item) => item.id),
  )
  const byId = Object.fromEntries(guided.map((entry) => [entry.id, entry]))
  assert.equal(byId.beaker.category, 'reaction-vessel')
  assert.equal(byId['graduated-cylinder'].category, 'measuring')
  assert.equal(byId['digital-balance'].category, 'measuring')
  assert.equal(byId.spatula.category, 'assistive-device')
  assert.equal(byId.water.category, 'liquid-chemical')
  assert.equal(byId['sodium-chloride'].category, 'solid-chemical')
  assert.equal(byId.water.formula, 'H₂O')
  assert.equal(byId['sodium-chloride'].formula, 'NaCl')
  assert.equal(byId.beaker.formula, undefined)
  for (const entry of guided) {
    assert.equal(entry.inExperiment, true)
    assert.deepEqual(entry.availability, { status: 'available' })
    assert.ok(entry.visual, `${entry.id} renders in 3D`)
  }
})

test('search matches names, formulas with plain digits, ids and aliases; terms combine', () => {
  assert.equal(normalizeSearch('  H₂O   Na⁺ '), 'h2o na+')
  const search = (query) => ids(filterInventory(guided, { ...all, query }))
  assert.deepEqual(search('nacl'), ['sodium-chloride'])
  assert.deepEqual(search('H2O'), ['water'])
  assert.deepEqual(search('h₂o'), ['water'])
  assert.deepEqual(search('CHLORIDE'), ['sodium-chloride'])
  assert.deepEqual(search('glass beaker'), ['beaker'], 'catalogue alias')
  assert.deepEqual(search('weighing boat'), ['weighing-boat'])
  assert.deepEqual(search('unobtainium'), [])
  assert.deepEqual(search(''), ids(guided))
})

test('category, search and letter filters combine; counts and letters follow the filters', () => {
  const measuring = filterInventory(guided, { ...all, category: 'measuring' })
  assert.deepEqual(ids(measuring), ['graduated-cylinder', 'digital-balance'])
  assert.deepEqual(ids(filterInventory(guided, { ...all, category: 'measuring', letter: 'D' })), [
    'digital-balance',
  ])
  assert.deepEqual(
    ids(filterInventory(guided, { category: 'measuring', query: 'cylinder', letter: 'D' })),
    [],
  )
  assert.deepEqual(filterInventory(guided, { ...all, category: 'heating' }), [])

  const counts = countByCategory(guided, { query: '', letter: null })
  assert.equal(counts.all, 8)
  assert.equal(counts['reaction-vessel'], 1)
  assert.equal(counts['assistive-device'], 3)
  assert.equal(counts.measuring, 2)
  assert.equal(counts['solid-chemical'], 1)
  assert.equal(counts['liquid-chemical'], 1)
  assert.equal(counts.heating + counts['gas-chemical'], 0)
  assert.equal(
    INVENTORY_CATEGORIES.reduce((sum, c) => sum + counts[c.id], 0),
    counts.all,
  )
  assert.equal(countByCategory(guided, { query: 'nacl', letter: null }).all, 1)

  assert.deepEqual([...availableLetters(guided, { category: 'all', query: '' })].sort(), [
    'B',
    'D',
    'G',
    'L',
    'S',
    'W',
  ])
  assert.deepEqual([...availableLetters(guided, { category: 'measuring', query: '' })].sort(), [
    'D',
    'G',
  ])
  assert.equal(firstLetter({ name: '2-propanol' }), '#')
  assert.equal(ALPHABET.length, 26)
})

test('catalogue items: guided shows them disabled, free mode marks them as no 3D model yet', () => {
  const withCatalog = buildInventoryEntries({
    experimentItems: items,
    core: saltCoreExperiment,
    includeCatalog: true,
  })
  assert.deepEqual(
    ids(withCatalog.slice(0, items.length)),
    items.map((item) => item.id),
    'experiment items first',
  )
  assert.equal(
    new Set(ids(withCatalog)).size,
    withCatalog.length,
    'no duplicates (aliases deduplicated)',
  )
  assert.ok(withCatalog.length > items.length)
  const extra = withCatalog.filter((entry) => !entry.inExperiment)
  assert.ok(
    extra.every((entry) => entry.availability.status === 'not-in-experiment' && !entry.visual),
  )
  assert.ok(
    extra.some((entry) => entry.category === 'heating'),
    'catalogue adds heating equipment',
  )
  assert.ok(extra.length <= equipmentCatalog.length)

  const free = buildInventoryEntries({ experimentItems: items, mode: 'free' })
  assert.ok(
    free.filter((e) => !e.inExperiment).every((e) => e.availability.status === 'no-3d-model'),
  )
  assert.ok(free.filter((e) => e.inExperiment).every((e) => e.availability.status === 'available'))
  assert.deepEqual(ids(filterInventory(free, { ...all, query: 'bunsen' })).length > 0, true)
})

test('inventory panel renders rail, labelled search, A–Z index, formula cards and notes', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { LabInventoryPanel } = await vite.ssrLoadModule(
      '/src/features/simulations/components/LabInventoryPanel.tsx',
    )
    const render = (props) =>
      renderToStaticMarkup(
        React.createElement(LabInventoryPanel, {
          open: true,
          items,
          core: saltCoreExperiment,
          placedIds: ['beaker', 'digital-balance'],
          selectedId: null,
          placingId: 'spatula',
          disabled: false,
          onItemClick: () => {},
          onCollapse: () => {},
          ...props,
        }),
      )
    const html = await render()
    assert.match(html, /<aside[^>]*aria-label="Lab inventory"/)
    assert.doesNotMatch(html, /<aside[^>]*hidden=""/)
    assert.match(html, /aria-label="Collapse inventory"/)
    assert.match(html, /<nav[^>]*aria-label="Inventory categories"/)
    for (const category of INVENTORY_CATEGORIES)
      assert.ok(html.includes(category.label), category.label)
    assert.match(html, /aria-label="All items \(8\)"/)
    assert.match(html, /aria-label="Heating \(0\)"/)
    assert.match(html, /<label[^>]*>Search equipment and chemicals by name or formula<\/label>/)
    assert.match(html, /aria-label="Items starting with B"(?![^>]*disabled)/)
    assert.match(
      html,
      /<button[^>]*disabled=""[^>]*aria-label="Items starting with Z"|<button[^>]*aria-label="Items starting with Z"[^>]*disabled/,
    )
    assert.match(html, />NaCl</)
    assert.match(html, />H₂O</)
    assert.match(html, /On workbench · grab to move/)
    assert.match(html, /Click bench to place/)
    assert.match(html, /draggable="true"/)
    assert.match(html, /aria-label="Note for Beaker"/)
    assert.match(html, /Show all lab equipment/)
    assert.match(html, /8 items/)

    // The first button containing an item's name must be its card (browser scripts rely on it).
    const buttons = [...html.matchAll(/<button[\s\S]*?<\/button>/g)].map((m) => m[0])
    for (const item of items) {
      const first = buttons.find((b) =>
        b
          .replace(/<[^>]+>/g, ' ')
          .toLowerCase()
          .includes(item.title.toLowerCase()),
      )
      assert.ok(first && first.includes(`title="${item.description}"`), item.title)
    }

    const hidden = await render({ open: false })
    assert.match(hidden, /<aside[^>]*hidden=""/)
    const busy = await render({ disabled: true })
    assert.equal((busy.match(/draggable="true"/g) ?? []).length, 0, 'no dragging during a transfer')
  } finally {
    await vite.close()
  }
})
