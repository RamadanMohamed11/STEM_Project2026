import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { sampleGrades } from '../src/features/curriculum/data/sampleCurriculum.ts'
import {
  clearStoredGradeId,
  getGradeById,
  getStoredGradeId,
  setStoredGradeId,
} from '../src/features/curriculum/state/gradeSelection.ts'

test('gradeSelection state utilities manage storage safely and reject invalid IDs', () => {
  clearStoredGradeId()
  assert.equal(getStoredGradeId(), null, 'Initially null')

  // Setting valid grades
  setStoredGradeId('grade-secondary-1')
  assert.equal(getStoredGradeId(), 'grade-secondary-1')

  const grade1 = getGradeById('grade-secondary-1')
  assert.ok(grade1)
  assert.equal(grade1?.title, 'First Secondary Grade')

  // Switching grade
  setStoredGradeId('grade-secondary-2')
  assert.equal(getStoredGradeId(), 'grade-secondary-2')

  // Setting invalid grade ID returns null
  setStoredGradeId('invalid-grade-id')
  assert.equal(getStoredGradeId(), null, 'Must reject invalid grade IDs')

  // Clear works
  setStoredGradeId('grade-secondary-3')
  assert.equal(getStoredGradeId(), 'grade-secondary-3')
  clearStoredGradeId()
  assert.equal(getStoredGradeId(), null, 'Cleared successfully')
})

test('choose grade page renders all three secondary grades with accessible selection landmarks and navigation', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const markup = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/grades'] },
        React.createElement(AppRoutes),
      ),
    )

    // Page Heading & Eyebrow
    assert.ok(markup.includes('Choose Your Grade'), 'Page title Choose Your Grade')
    assert.ok(markup.includes('STEM Virtual Lab · Curriculum'), 'Curriculum eyebrow')
    assert.ok(
      markup.includes('Select your school grade to find the right chemistry experiments'),
      'Introductory description',
    )

    // The shared grade selection works; academic content remains draft.
    assert.ok(markup.includes('Curriculum preview · Term details coming soon'), 'Preview status pill')

    // Radiogroup landmark
    assert.ok(markup.includes('role="radiogroup"'), 'Radiogroup role')
    assert.ok(markup.includes('aria-label="Secondary school grades"'), 'Radiogroup accessible label')

    // All three grade options must be present
    assert.ok(markup.includes('First Secondary Grade'), 'First secondary grade option')
    assert.ok(markup.includes('Second Secondary Grade'), 'Second secondary grade option')
    assert.ok(markup.includes('Third Secondary Grade'), 'Third secondary grade option')

    // Grade level badges & subtitles
    assert.ok(markup.includes('Grade 10'), 'Grade 10 badge')
    assert.ok(markup.includes('Grade 11'), 'Grade 11 badge')
    assert.ok(markup.includes('Grade 12'), 'Grade 12 badge')
    assert.ok(markup.includes('Matter &amp; Solutions') || markup.includes('Matter & Solutions'), 'Grade 1 subtitle')
    assert.ok(markup.includes('Atomic Structure &amp; Bonding') || markup.includes('Atomic Structure & Bonding'), 'Grade 2 subtitle')
    assert.ok(markup.includes('Advanced &amp; Organic Chemistry') || markup.includes('Advanced & Organic Chemistry'), 'Grade 3 subtitle')

    // Curriculum topics preview
    assert.ok(markup.includes('Chemical calculations'), 'Topic pill for grade 1')
    assert.ok(markup.includes('Quantum numbers'), 'Topic pill for grade 2')
    assert.ok(markup.includes('Organic chemistry'), 'Topic pill for grade 3')

    // Navigation and Action links
    assert.ok(markup.includes('Continue to Term Selection'), 'Action button text')
    assert.ok(markup.includes('href="/terms"'), 'Next link to terms')
    assert.ok(markup.includes('href="/safety"'), 'Link to review safety')

    // Strict English check: no Arabic characters
    assert.equal(
      /[\u0600-\u06FF]/.test(markup),
      false,
      'Choose Grade page must not contain Arabic characters',
    )
  } finally {
    clearStoredGradeId()
    await vite.close()
  }
})

test('sampleGrades contains exactly 3 secondary grades with ascending order and unique slugs', () => {
  assert.equal(sampleGrades.length, 3)
  assert.deepEqual(
    sampleGrades.map((g) => g.order),
    [1, 2, 3],
  )
  const slugs = new Set(sampleGrades.map((g) => g.slug))
  assert.equal(slugs.size, 3)
})
