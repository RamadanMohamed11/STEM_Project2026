import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'

test('SidebarNavigation renders toggle button with aria-expanded and handles collapse state', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { SidebarNavigation } = await vite.ssrLoadModule('/src/components/layout/SidebarNavigation.tsx')
    const { useSidebarStore } = await vite.ssrLoadModule('/src/components/layout/useSidebarStore.ts')

    // Test store operations
    const initial = useSidebarStore.getState().isCollapsed
    useSidebarStore.getState().toggleSidebar()
    assert.equal(useSidebarStore.getState().isCollapsed, !initial)
    useSidebarStore.getState().toggleSidebar()
    assert.equal(useSidebarStore.getState().isCollapsed, initial)

    // Test in default expanded mode
    const expandedHtml = await renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(SidebarNavigation, { collapsed: false })),
    )
    assert.ok(expandedHtml.includes('aria-label="Main desktop sidebar"'))
    assert.ok(expandedHtml.includes('aria-expanded="true"'))
    assert.ok(expandedHtml.includes('Collapse sidebar'))
    assert.ok(expandedHtml.includes('STEM Virtual Lab'))
    assert.ok(expandedHtml.includes('Explore Science'))

    // Test in collapsed mode
    const collapsedHtml = await renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(SidebarNavigation, { collapsed: true })),
    )
    assert.ok(collapsedHtml.includes('aria-label="Main desktop sidebar"'))
    assert.ok(collapsedHtml.includes('aria-expanded="false"'))
    assert.ok(collapsedHtml.includes('Expand sidebar'))
    // Labels are still accessible to screen readers via sr-only
    assert.ok(collapsedHtml.includes('sr-only'))

    // Test default uncontrolled rendering
    const defaultHtml = await renderToStaticMarkup(
      React.createElement(MemoryRouter, null, React.createElement(SidebarNavigation)),
    )
    assert.ok(defaultHtml.includes('aria-label="Main desktop sidebar"'))
    assert.ok(defaultHtml.includes('Main navigation'))
  } finally {
    await vite.close()
  }
})
