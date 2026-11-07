import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'
import { sampleCurriculum } from '../src/features/curriculum/data/sampleCurriculum.ts'
import {
  filterExperiments,
  initialCatalogFilters,
} from '../src/features/experiments/lib/catalogSelectors.ts'
import {
  catalogSearchParams,
  readCatalogFilters,
  resolveResultsReturn,
} from '../src/features/experiments/lib/catalogUrlState.ts'
import { resolveAcademicFilters } from '../src/features/curriculum/lib/curriculumDiscovery.ts'

const catalog = { ...demoCatalog, curriculum: sampleCurriculum }
const scope = {
  ...initialCatalogFilters,
  gradeId: 'grade-secondary-1',
  termId: 'term-secondary-1-1',
  unitId: 'sample-unit-1',
  lessonId: 'sample-lesson-1-1',
}
const ids = (items) => items.map((item) => item.id)

test('one catalog filter engine combines text, category, availability and real academic associations', () => {
  const before = JSON.stringify(catalog)
  assert.equal(filterExperiments(catalog, initialCatalogFilters).length, 3)
  assert.deepEqual(
    ids(filterExperiments(catalog, { ...initialCatalogFilters, gradeId: scope.gradeId })),
    ['exp-volume-002', 'exp-ph-003'],
  )
  assert.deepEqual(
    ids(
      filterExperiments(catalog, {
        ...scope,
        search: '  PH  ',
        categoryId: 'chemistry',
        status: 'planned',
      }),
    ),
    ['exp-ph-003'],
  )
  assert.deepEqual(filterExperiments(catalog, { ...scope, status: 'demo' }), [])
  assert.deepEqual(filterExperiments(catalog, { ...scope, search: 'salt' }), [])
  assert.deepEqual(filterExperiments(catalog, { ...scope, gradeId: 'grade-secondary-2' }), [])
  assert.deepEqual(
    filterExperiments(catalog, { ...initialCatalogFilters, lessonId: scope.lessonId }),
    [],
  )
  assert.deepEqual(
    filterExperiments(catalog, {
      ...initialCatalogFilters,
      gradeId: scope.gradeId,
      termId: 'term-secondary-1-2',
    }),
    [],
  )
  assert.deepEqual(
    filterExperiments(
      { ...catalog, curriculum: { ...sampleCurriculum, lessonExperiments: [] } },
      scope,
    ),
    [],
  )
  assert.deepEqual(
    filterExperiments({ ...catalog, curriculum: { ...sampleCurriculum, lessons: [] } }, scope),
    [],
  )
  assert.deepEqual(filterExperiments(demoCatalog, scope), [])
  assert.equal(JSON.stringify(catalog), before)
})

test('URL filters round-trip, reject bad parents/duplicates, and validate local result return paths', () => {
  const filters = { ...scope, search: 'pH & water', status: 'planned', categoryId: 'chemistry' }
  const params = catalogSearchParams(filters)
  assert.deepEqual(readCatalogFilters(params, catalog), { filters, invalid: false })
  assert.equal(catalogSearchParams(initialCatalogFilters).toString(), '')
  for (const query of [
    'grade=missing',
    'grade=',
    'term=term-secondary-1-1',
    'grade=grade-secondary-2&term=term-secondary-1-1',
    'grade=grade-secondary-1&term=term-secondary-1-1&unit=missing',
    'category=missing',
    'status=unknown',
    'semester=missing',
    'q=one&q=two',
    'grade=grade-secondary-1&grade=grade-secondary-2',
  ])
    assert.equal(readCatalogFilters(new URLSearchParams(query), catalog).invalid, true, query)
  assert.equal(resolveAcademicFilters(sampleCurriculum, scope).lesson.id, scope.lessonId)
  assert.equal(
    resolveResultsReturn('/experiments?q=volume&status=planned', 'exp-volume-002', catalog),
    '/experiments?q=volume&status=planned',
  )
  assert.equal(
    resolveResultsReturn('/curriculum/lessons/sample-lesson-1-1?q=pH', 'exp-ph-003', catalog),
    '/curriculum/lessons/sample-lesson-1-1?q=pH',
  )
  for (const target of [
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/profile',
    '/experiments#bad',
    '/experiments?status=bad',
    '/experiments?q=salt',
    '/curriculum/lessons/unknown',
    '/curriculum/lessons/sample-lesson-1-2',
    '/curriculum/lessons/%ZZ',
  ])
    assert.equal(resolveResultsReturn(target, 'exp-ph-003', catalog), null, target)
})

test('direct discovery routes render accurate breadcrumbs, scoped search, empty states and result return links', async () => {
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
    const query = catalogSearchParams({ ...scope, search: 'pH', status: 'planned' }).toString()
    const html = render(`/experiments?${query}`)
    assert.match(html, /aria-label="Breadcrumb"/)
    assert.match(html, /aria-current="page">Experiments/)
    assert.match(html, /First Secondary Grade/)
    assert.match(html, /First Term/)
    assert.match(html, /Unit 1/)
    assert.match(html, /Lesson 1/)
    assert.match(html, /1 experiment found/)
    assert.match(html, /aria-live="polite"/)
    assert.match(html, /value="pH"/)
    assert.equal((html.match(/<article /g) ?? []).length, 1)
    assert.match(html, /Exploring pH Indicators/)
    assert.doesNotMatch(html, /Measuring Liquid Volume/)
    assert.match(html, /Coming Soon/)
    assert.match(html, /returnTo=/)
    const invalid = render('/experiments?grade=grade-secondary-2&term=term-secondary-1-1')
    assert.match(invalid, /role="alert"/)
    assert.match(invalid, /No Results Found/)
    assert.doesNotMatch(invalid, /<article /)
    assert.match(render('/experiments?q=no-such-result'), /No Results Found/)
    assert.match(
      render('/experiments?grade=grade-secondary-1&term=term-secondary-1-2'),
      /No Units Available/,
    )
    const gradeOnly = render('/experiments?grade=grade-secondary-1')
    assert.match(gradeOnly, /All Terms/)
    assert.doesNotMatch(gradeOnly, /id="experiment-unitId"|id="experiment-lessonId"/)
    const lesson = render('/curriculum/lessons/sample-lesson-1-1?q=pH&status=planned')
    assert.equal((lesson.match(/<article /g) ?? []).length, 1)
    assert.doesNotMatch(lesson, /id="experiment-gradeId"/)
    assert.match(lesson, /aria-label="Breadcrumb"/)
    assert.match(render('/curriculum/lessons/sample-lesson-1-1?q=absent'), /No Results Found/)
    const unit = render(
      '/curriculum?grade=grade-secondary-1&term=term-secondary-1-1&unit=sample-unit-1',
    )
    assert.equal((unit.match(/<details/g) ?? []).length, 1)
    assert.match(unit, /<details[^>]*open=""/)
    assert.doesNotMatch(
      render('/curriculum?grade=grade-secondary-1&term=term-secondary-1-2&unit=sample-unit-1'),
      /<details/,
    )
    assert.doesNotMatch(render('/curriculum?unit=sample-unit-1'), /<details/)
    const returnTo = `/experiments?${query}`
    const details = render(`/experiments/exp-ph-003?${new URLSearchParams({ returnTo })}`)
    assert.match(details, /Back to Search Results/)
    assert.match(details, /About This Experiment/)
    assert.doesNotMatch(
      render('/experiments/exp-ph-003?returnTo=https://example.com'),
      /Back to Search Results/,
    )
    assert.match(render('/experiments/exp-salt-water-001/lab'), /Immersive laboratory workspace/)
  } finally {
    await vite.close()
  }
})
