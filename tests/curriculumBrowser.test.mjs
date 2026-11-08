import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { sampleCurriculum } from '../src/features/curriculum/data/sampleCurriculum.ts'
import {
  getCurriculumUnits,
  resolveCurriculumContext,
  getCurriculumLessonContext,
} from '../src/features/curriculum/lib/curriculumBrowser.ts'
import { getCurriculumPath, getCurriculumLessonPath } from '../src/app/paths.ts'

test('browser orders units and lessons without mutating data and separates planned experiments from available ones', () => {
  const data = {
    ...sampleCurriculum,
    units: [...sampleCurriculum.units].reverse(),
    lessons: [...sampleCurriculum.lessons].reverse(),
  }
  const before = JSON.stringify(data)
  const units = getCurriculumUnits(data, 'term-secondary-1-1')
  assert.deepEqual(
    units.map((entry) => entry.unit.title),
    ['Unit 1', 'Unit 2'],
  )
  assert.deepEqual(
    units[0].lessons.map((entry) => entry.lesson.title),
    ['Lesson 1', 'Lesson 2'],
  )
  assert.equal(units[0].lessons[0].availableCount, 0)
  assert.equal(units[0].lessons[0].plannedCount, 2)
  assert.equal(JSON.stringify(data), before)
  assert.equal(
    data.lessonExperiments.some((link) => link.experimentId === 'exp-salt-water-001'),
    false,
  )
})

test('context validates grade/term relationships, all six terms and missing datasets', () => {
  for (const term of sampleCurriculum.terms) {
    const context = resolveCurriculumContext(sampleCurriculum, term.gradeId, term.id)
    assert.equal(context.term.id, term.id)
    assert.equal(context.invalid, false)
  }
  const mismatch = resolveCurriculumContext(
    sampleCurriculum,
    'grade-secondary-2',
    'term-secondary-1-1',
  )
  assert.equal(mismatch.grade.id, 'grade-secondary-2')
  assert.equal(mismatch.term, null)
  assert.equal(mismatch.invalid, true)
  assert.equal(
    resolveCurriculumContext(sampleCurriculum, 'unknown', 'term-secondary-1-1').grade,
    null,
  )
  assert.deepEqual(getCurriculumUnits(null, 'term-secondary-1-1'), [])
  assert.deepEqual(getCurriculumUnits(sampleCurriculum, 'term-secondary-3-2'), [])
  assert.equal(getCurriculumLessonContext(sampleCurriculum, 'missing'), null)
  const lesson = getCurriculumLessonContext(sampleCurriculum, 'sample-lesson-2-1')
  assert.equal(lesson.grade.id, 'grade-secondary-1')
  assert.equal(lesson.unit.id, 'sample-unit-2')
  assert.equal(getCurriculumLessonPath(lesson.lesson.id), '/curriculum/lessons/sample-lesson-2-1')
})

test('direct routes, empty units/lessons, explicit context and the future lesson destination render honestly', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { UnitBrowser } = await vite.ssrLoadModule(
      '/src/features/curriculum/components/UnitBrowser.tsx',
    )
    const storage = await vite.ssrLoadModule('/src/features/curriculum/state/gradeSelection.ts')
    const terms = await vite.ssrLoadModule('/src/features/curriculum/state/termSelection.ts')
    storage.setStoredGradeId('grade-secondary-3')
    terms.setStoredTermId('term-secondary-3-2')
    const render = async (path, element = React.createElement(AppRoutes)) =>
      await renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] }, element))
    const html = await render(getCurriculumPath('grade-secondary-1', 'term-secondary-1-1'))
    assert.match(html, /Your Lessons/)
    assert.match(html, /not the official Egyptian chemistry curriculum/)
    assert.ok(html.indexOf('>Unit 1<') < html.indexOf('>Unit 2<'))
    assert.equal((html.match(/<details/g) ?? []).length, 2)
    assert.doesNotMatch(html, /<details[^>]* open/)
    assert.match(html, /View Experiments/)
    assert.match(html, /0 available experiments/)
    assert.ok(html.includes('href="/terms?grade=grade-secondary-1&amp;term=term-secondary-1-1"'))
    assert.match(await render('/curriculum'), /No Units Available/)
    assert.match(
      await render('/curriculum?grade=grade-secondary-2&term=term-secondary-1-1'),
      /do not match/,
    )
    assert.match(await render('/curriculum?grade='), /Choose a grade and term/)
    const fixture = {
      ...sampleCurriculum,
      units: [{ ...sampleCurriculum.units[0], description: 'Example unit description' }],
      lessons: [{ ...sampleCurriculum.lessons[0], description: 'Example lesson description' }],
      lessonExperiments: [],
    }
    const emptyExperiments = await render(
      '/curriculum',
      React.createElement(UnitBrowser, {
        units: getCurriculumUnits(fixture, 'term-secondary-1-1'),
      }),
    )
    assert.match(emptyExperiments, /No Experiments Available/)
    assert.match(emptyExperiments, /Example lesson description/)
    assert.match(emptyExperiments, /Example unit description/)
    const emptyUnit = await render(
      '/curriculum',
      React.createElement(UnitBrowser, {
        units: getCurriculumUnits({ ...fixture, lessons: [] }, 'term-secondary-1-1'),
      }),
    )
    assert.match(emptyUnit, /No Lessons Available/)
    const destination = await render('/curriculum/lessons/sample-lesson-1-1')
    assert.match(destination, /Experiments in This Lesson/)
    assert.match(destination, /First Secondary Grade/)
    assert.match(destination, /First Term/)
    assert.match(destination, /Unit 1/)
    assert.doesNotMatch(destination, /Immersive laboratory workspace|>Start Experiment</)
    assert.match(await render('/curriculum/lessons/unknown'), /Lesson Not Found/)
    assert.match(await render('/terms?grade=grade-secondary-2'), /Second Secondary Grade/)
    assert.match(await render('/experiments/preview/lab'), /Immersive laboratory workspace/)
    storage.clearStoredGradeId()
    terms.clearStoredTermId()
  } finally {
    await vite.close()
  }
})
