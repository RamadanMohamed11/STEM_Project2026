import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { getExperimentPaths } from '../src/app/paths.ts'
import { sampleCurriculum } from '../src/features/curriculum/data/sampleCurriculum.ts'
import { egyptianCurriculum } from '../src/features/curriculum/data/egyptianCurriculum.ts'

test('experiments library layout matches reference image with title, pill badge, unit cards, lesson dividers and coming soon tags', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { CurriculumExperimentsLibrary } = await vite.ssrLoadModule(
      '/src/features/curriculum/components/CurriculumExperimentsLibrary.tsx',
    )

    const render = async (path) =>
      await renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(AppRoutes),
        ),
      )

    // 1. Render /experiments with grade and term query parameters
    const html = await render('/experiments?grade=grade-secondary-1&term=term-secondary-1-1')

    // Top: Page title = grade name
    assert.match(html, /<h1[^>]*>First Secondary Grade<\/h1>/, 'Page title must be Grade name (h1)')

    // Small pill badge = term
    assert.match(html, /First Term/, 'Term pill badge must be displayed')

    // For each unit: unit heading
    assert.match(html, /Unit 1/, 'Unit heading must be displayed')

    // Rounded cards with divide-y dividers
    assert.match(
      html,
      /rounded-2xl border border-line bg-white shadow-card/,
      'Each unit must have a rounded card',
    )
    assert.match(
      html,
      /divide-y divide-line/,
      'Lessons within a unit card must be separated by thin dividers',
    )

    // Lessons inside unit cards
    assert.match(
      html,
      /<h3[^>]*>Lesson 1<\/h3>/,
      'Lesson titles must be rendered inside unit cards',
    )

    // Draft/planned experiments must show "Coming soon" tag and MUST NOT be clickable links
    assert.match(
      html,
      /Coming soon/,
      'Non-playable draft experiments must display a Coming soon badge',
    )
    assert.doesNotMatch(
      html,
      /href="\/experiments\/exp-volume-002"/,
      'Draft experiments must not be clickable links',
    )

    // Footer note when partial data:
    assert.match(
      html,
      /Remaining units follow the same structure according to the curriculum\./,
      'Footer note must be rendered when curriculum data is partial/sample',
    )

    // 2. Direct rendering of CurriculumExperimentsLibrary with official Egyptian curriculum
    const egyptianHtml = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/'] },
        React.createElement(CurriculumExperimentsLibrary, {
          grade: egyptianCurriculum.grades[0],
          term: egyptianCurriculum.terms[0],
          curriculumData: egyptianCurriculum,
          isPartial: true,
        }),
      ),
    )

    assert.match(egyptianHtml, /First Secondary Grade/)
    assert.match(egyptianHtml, /First Term/)
    assert.match(egyptianHtml, /Unit 1: Chemistry: The Central Science/)
    assert.match(
      egyptianHtml,
      /Unit 3: Solutions, Colloids, and Acids &amp; Bases|Unit 3: Solutions, Colloids, and Acids & Bases/,
    )
    assert.match(egyptianHtml, /Lesson 1: Solutions and Solubility/)

    // In Egyptian curriculum, salt dissolution (exp-salt-water-001) is playable (status='demo')
    const saltPaths = getExperimentPaths('exp-salt-water-001')
    assert.ok(
      egyptianHtml.includes(`href="${saltPaths.details}"`),
      'Playable salt experiment must link to Experiment Details route',
    )
    assert.match(
      egyptianHtml,
      /focus-visible:outline-teal/,
      'Playable experiment link must have accessible keyboard focus styling',
    )

    // Draft experiment in Unit 1 is not clickable and has Coming soon
    assert.match(egyptianHtml, /Measuring Liquid Volume/, 'Draft experiment title is shown')
    assert.doesNotMatch(
      egyptianHtml,
      /href="\/experiments\/exp-sec1-t1-glassware-001"/,
      'Draft experiment must not be clickable link',
    )
    assert.match(
      egyptianHtml,
      /Remaining units follow the same structure according to the curriculum\./,
    )

    // Strict English check: no Arabic characters in rendered markup
    assert.equal(
      /[\u0600-\u06FF]/.test(html),
      false,
      'Experiments Library page (SSR route) must not contain Arabic characters',
    )
    assert.equal(
      /[\u0600-\u06FF]/.test(egyptianHtml),
      false,
      'CurriculumExperimentsLibrary component must not contain Arabic characters',
    )
  } finally {
    await vite.close()
  }
})

test('curriculum experiments library renders empty state when term has no experiments', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  try {
    const { CurriculumExperimentsLibrary } = await vite.ssrLoadModule(
      '/src/features/curriculum/components/CurriculumExperimentsLibrary.tsx',
    )

    // Custom dataset with zero experiments in a term
    const emptyCurriculum = {
      ...sampleCurriculum,
      units: [],
      lessons: [],
      experiments: [],
      lessonExperiments: [],
    }

    const html = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/'] },
        React.createElement(CurriculumExperimentsLibrary, {
          grade: sampleCurriculum.grades[0],
          term: sampleCurriculum.terms[0],
          curriculumData: emptyCurriculum,
        }),
      ),
    )

    assert.match(html, /role="status"/, 'Empty state must have role="status"')
    assert.match(
      html,
      /No Units Available|No experiments available for this term/,
      'Empty state must inform user that no experiments are available',
    )
    assert.match(html, /Choose Another Term/, 'Empty state provides alternative term action')
    assert.match(html, /Choose Another Grade/, 'Empty state provides alternative grade action')
  } finally {
    await vite.close()
  }
})

test('experiments page defaults to catalog when no grade and term parameters are provided', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')

    const html = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/experiments'] },
        React.createElement(AppRoutes),
      ),
    )

    assert.match(html, /Experiment catalog/, 'Default /experiments renders Experiment catalog')
    assert.ok(
      html.includes(`href="${getExperimentPaths('exp-salt-water-001').details}"`),
      'Catalog includes experiment details links',
    )
  } finally {
    await vite.close()
  }
})
