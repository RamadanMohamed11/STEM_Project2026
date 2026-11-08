import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'

test('shared UI primitives and application shell enforce accessible targets, responsive layouts, and English foundation', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const [
      { Button },
      { ButtonLink },
      { Card },
      { StatusPill },
      { PageHeader },
      { PageContainer },
      { AppRoutes },
    ] = await Promise.all([
      vite.ssrLoadModule('/src/components/ui/Button.tsx'),
      vite.ssrLoadModule('/src/components/ui/ButtonLink.tsx'),
      vite.ssrLoadModule('/src/components/ui/Card.tsx'),
      vite.ssrLoadModule('/src/components/ui/StatusPill.tsx'),
      vite.ssrLoadModule('/src/components/layout/PageHeader.tsx'),
      vite.ssrLoadModule('/src/components/layout/PageContainer.tsx'),
      vite.ssrLoadModule('/src/app/routes.tsx'),
    ])

    // ButtonLink tests
    const linkMarkup = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ButtonLink, { to: '/experiments', variant: 'primary', size: 'md' }, 'Explore'),
      ),
    )
    assert.ok(linkMarkup.includes('href="/experiments"'))
    assert.ok(linkMarkup.includes('min-h-11'))
    assert.ok(linkMarkup.includes('bg-teal'))
    assert.ok(linkMarkup.includes('focus-visible:outline-3'))

    // Button tests
    const buttonMarkup = await renderToStaticMarkup(
      React.createElement(Button, { variant: 'secondary', size: 'md' }, 'Reset'),
    )
    assert.ok(buttonMarkup.includes('type="button"'))
    assert.ok(buttonMarkup.includes('min-h-11'))
    assert.ok(buttonMarkup.includes('border-line-strong'))

    // StatusPill tests
    const pillMarkup = await renderToStaticMarkup(
      React.createElement(StatusPill, { tone: 'ready', dot: true }, 'Active'),
    )
    assert.ok(pillMarkup.includes('Active'))
    assert.ok(pillMarkup.includes('rounded-full'))
    assert.ok(pillMarkup.includes('bg-teal-soft'))

    // Card tests
    const cardMarkup = await renderToStaticMarkup(
      React.createElement(Card, { interactive: true, padding: 'md' }, 'Card Content'),
    )
    assert.ok(cardMarkup.includes('rounded-xl border border-line bg-white shadow-card'))
    assert.ok(cardMarkup.includes('hover:border-line-strong'))

    // PageHeader tests
    const headerMarkup = await renderToStaticMarkup(
      React.createElement(PageHeader, {
        eyebrow: 'Explore',
        title: 'Lab Experiments',
        description: 'Hands-on learning',
      }),
    )
    assert.ok(headerMarkup.includes('<h1'))
    assert.ok(headerMarkup.includes('Lab Experiments'))
    assert.ok(headerMarkup.includes('Explore'))
    assert.ok(headerMarkup.includes('Hands-on learning'))

    // PageContainer tests
    const containerMarkup = await renderToStaticMarkup(
      React.createElement(PageContainer, null, 'Container Content'),
    )
    assert.ok(containerMarkup.includes('max-w-[1320px]'))
    assert.ok(containerMarkup.includes('px-4'))

    const render = async (path) =>
      await renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(AppRoutes),
        ),
      )

    // Test Skip link, Landmarks and Chemistry Hero on Home
    const home = await render('/')
    assert.ok(home.includes('Skip to main content'))
    assert.ok(home.includes('href="#main-content"'))
    assert.ok(home.includes('id="main-content"'))
    assert.ok(home.includes('STEM Virtual Lab'))
    assert.ok(home.includes('Discover Chemistry'))
    assert.ok(home.includes('Get Started'))
    assert.ok(home.includes('Explore Experiments'))

    // Verify natural, simple English on Safety page
    const safety = await render('/safety')
    assert.ok(safety.includes('Laboratory safety'))
    assert.ok(safety.includes('Wear protective gear (PPE)'))
    assert.ok(safety.includes('Know your workspace'))
    assert.ok(safety.includes('Handle materials safely'))
    assert.ok(safety.includes('safety goggles'))

    // Verify natural English on Experiments catalog
    const experiments = await render('/experiments')
    assert.ok(experiments.includes('Find an experiment'))
    assert.ok(experiments.includes('Search experiments'))
    assert.ok(experiments.includes('sample experiments'))

    // Verify no Arabic text exists in page markup (checking typical Arabic Unicode range \u0600-\u06FF)
    for (const path of ['/', '/safety', '/experiments', '/grades', '/terms', '/signup', '/login']) {
      const markup = await render(path)
      assert.equal(
        /[\u0600-\u06FF]/.test(markup),
        false,
        `Path ${path} must not contain Arabic characters`,
      )
    }

    // Verify 3D lab remains isolated as an immersive full-viewport workspace without standard headers/footers
    const lab = await render('/experiments/exp-salt-water-001/lab')
    assert.ok(lab.includes('h-dvh w-full overflow-hidden'))
    assert.doesNotMatch(lab, /STEM Virtual Lab · Interactive Science Learning/)
  } finally {
    await vite.close()
  }
})
