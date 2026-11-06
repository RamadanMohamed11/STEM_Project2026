import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import {
  safetyChecklist,
  getChecklistProgress,
} from '../src/features/safety/data/safetyChecklist.ts'

test('acknowledgement requires every current item, ignores stale IDs and reverses when unchecked', () => {
  assert.equal(new Set(safetyChecklist.map((item) => item.id)).size, safetyChecklist.length)
  assert.equal(safetyChecklist.length, 6)
  const selected = new Set(['old-item'])
  assert.deepEqual(getChecklistProgress(safetyChecklist, selected), {
    count: 0,
    total: 6,
    complete: false,
  })
  for (const [index, item] of safetyChecklist.entries()) {
    selected.add(item.id)
    const progress = getChecklistProgress(safetyChecklist, selected)
    assert.equal(progress.count, index + 1)
    assert.equal(progress.complete, index === safetyChecklist.length - 1)
  }
  selected.delete(safetyChecklist[2].id)
  assert.deepEqual(getChecklistProgress(safetyChecklist, selected), {
    count: 5,
    total: 6,
    complete: false,
  })
  assert.equal(getChecklistProgress([], new Set()).complete, false)
  const added = [
    ...safetyChecklist,
    { id: 'new-lesson', statement: 'New review item', reviewSection: 'before-lab' },
  ]
  const previousCompletion = new Set(safetyChecklist.map((item) => item.id))
  assert.equal(getChecklistProgress(added, previousCompletion).complete, false)
})

test('safety checklist is unchecked, accessible and linked to lessons; lab and grades remain public', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const render = (path) =>
      renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(AppRoutes),
        ),
      )
    const html = render('/safety')
    const checkboxes = html.match(/<input[^>]*type="checkbox"[^>]*>/g) ?? []
    assert.equal(checkboxes.length, safetyChecklist.length)
    for (const checkbox of checkboxes) assert.doesNotMatch(checkbox, /checked=|disabled=/)
    assert.match(html, /0 of 6 confirmed/)
    assert.match(html, /<progress[^>]*max="6"[^>]*value="0"|<progress[^>]*value="0"[^>]*max="6"/)
    assert.match(html, /<legend[^>]*>Before You Continue/)
    assert.match(html, /not proof of practical lab skills or a safety certificate/)
    assert.match(html, /not saved to your account/)
    assert.match(html, /Continue to Grade Selection/)
    for (const item of safetyChecklist) {
      assert.ok(html.includes(`href="#${item.reviewSection}"`))
      assert.ok(html.includes(`id="${item.reviewSection}"`))
    }
    assert.match(render('/grades'), /<h1[^>]*>Choose Your Grade/)
    assert.match(render('/experiments/preview/lab'), /Immersive laboratory workspace/)
    assert.match(render('/experiments/exp-salt-water-001/lab'), /Immersive laboratory workspace/)
  } finally {
    await vite.close()
  }
})
