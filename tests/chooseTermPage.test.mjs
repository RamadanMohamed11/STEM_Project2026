import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { sampleTerms } from '../src/features/curriculum/data/sampleCurriculum.ts'
import {
  clearStoredGradeId,
  setStoredGradeId,
} from '../src/features/curriculum/state/gradeSelection.ts'
import {
  clearStoredTermId,
  getStoredTermId,
  getTermById,
  getTermsForGrade,
  setStoredTermId,
} from '../src/features/curriculum/state/termSelection.ts'

test('termSelection state utilities manage storage safely and resolve terms per grade', () => {
  clearStoredTermId()
  assert.equal(getStoredTermId(), null, 'Initially null')

  // Setting valid terms
  setStoredTermId('term-secondary-1-1')
  assert.equal(getStoredTermId(), 'term-secondary-1-1')

  const term1 = getTermById('term-secondary-1-1')
  assert.ok(term1)
  assert.equal(term1?.title, 'First Term')
  assert.equal(term1?.gradeId, 'grade-secondary-1')

  // Reject invalid term ID
  setStoredTermId('invalid-term-id')
  assert.equal(getStoredTermId(), null, 'Must reject invalid term IDs')

  // Clear works
  setStoredTermId('term-secondary-1-2')
  assert.equal(getStoredTermId(), 'term-secondary-1-2')
  clearStoredTermId()
  assert.equal(getStoredTermId(), null, 'Cleared successfully')

  // Terms per grade
  const g1Terms = getTermsForGrade('grade-secondary-1')
  assert.equal(g1Terms.length, 2, 'Grade 1 has 2 terms')
  assert.equal(g1Terms[0].title, 'First Term')
  assert.equal(g1Terms[1].title, 'Second Term')

  const g2Terms = getTermsForGrade('grade-secondary-2')
  assert.equal(g2Terms.length, 2, 'Grade 2 has 2 terms')

  const nullTerms = getTermsForGrade(null)
  assert.equal(nullTerms.length, 0, 'Null grade returns empty list')
})

test('choose term page renders both term options when grade is selected', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const {
      setStoredGradeId: viteSetStoredGradeId,
      clearStoredGradeId: viteClearStoredGradeId,
    } = await vite.ssrLoadModule('/src/features/curriculum/state/gradeSelection.ts')
    viteSetStoredGradeId('grade-secondary-1')

    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/terms'] },
        React.createElement(AppRoutes),
      ),
    )

    // Heading & Eyebrow
    assert.ok(markup.includes('Choose Your Term'), 'Page title Choose Your Term')
    assert.ok(markup.includes('STEM Virtual Lab · Curriculum'), 'Eyebrow')

    // Grade context
    assert.ok(markup.includes('First Secondary Grade'), 'Active grade title')
    assert.ok(markup.includes('Current Grade'), 'Current grade indicator')
    assert.ok(markup.includes('href="/grades"'), 'Change grade link')

    // Both term options present
    assert.ok(markup.includes('First Term'), 'First term card')
    assert.ok(markup.includes('Second Term'), 'Second term card')
    assert.ok(markup.includes('Semester 1 · Autumn / Winter'), 'Term 1 subtitle')
    assert.ok(markup.includes('Semester 2 · Spring'), 'Term 2 subtitle')

    // Radiogroup landmark
    assert.ok(markup.includes('role="radiogroup"'), 'Radiogroup role')
    assert.ok(markup.includes('aria-label="Academic terms"'), 'Radiogroup accessible label')

    // Topics preview
    assert.ok(markup.includes('Chemistry &amp; Measurement') || markup.includes('Chemistry & Measurement'), 'Term 1 topics')
    assert.ok(markup.includes('Thermochemistry &amp; Heat') || markup.includes('Thermochemistry & Heat'), 'Term 2 topics')

    // Navigation buttons and links
    assert.ok(markup.includes('Continue'), 'Continue button')
    assert.ok(markup.includes('href="/experiments"'), 'Next link to experiments')

    // Strict English check: no Arabic characters
    assert.equal(
      /[\u0600-\u06FF]/.test(markup),
      false,
      'Choose Term page must not contain Arabic characters',
    )
    viteClearStoredGradeId()
  } finally {
    clearStoredGradeId()
    clearStoredTermId()
    await vite.close()
  }
})

test('choose term page handles direct access without selected grade gracefully', async () => {
  clearStoredGradeId()
  clearStoredTermId()
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { clearStoredGradeId: viteClearStoredGradeId } = await vite.ssrLoadModule(
      '/src/features/curriculum/state/gradeSelection.ts',
    )
    viteClearStoredGradeId()

    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/terms'] },
        React.createElement(AppRoutes),
      ),
    )

    // Heading remains visible
    assert.ok(markup.includes('Choose Your Term'), 'Page title Choose Your Term')

    // Alert notice for missing grade
    assert.ok(markup.includes('No Grade Selected'), 'No grade selected alert')
    assert.ok(
      markup.includes('Please choose your secondary school grade first'),
      'Clear prompt to choose grade',
    )
    assert.ok(markup.includes('href="/grades"'), 'Link to choose grade')

    // Fallback link to experiments
    assert.ok(markup.includes('href="/experiments"'), 'Link to explore sample experiments')

    // Strict English check: no Arabic characters
    assert.equal(
      /[\u0600-\u06FF]/.test(markup),
      false,
      'Direct access markup must not contain Arabic characters',
    )
  } finally {
    await vite.close()
  }
})

test('sampleTerms covers 3 grades with 2 terms each, maintaining order and unique slugs per grade', () => {
  assert.equal(sampleTerms.length, 6, 'Must have 6 terms total (2 per grade)')
  for (const gradeId of ['grade-secondary-1', 'grade-secondary-2', 'grade-secondary-3']) {
    const terms = sampleTerms.filter((t) => t.gradeId === gradeId)
    assert.equal(terms.length, 2, `${gradeId} must have exactly 2 terms`)
    assert.deepEqual(
      terms.map((t) => t.order),
      [1, 2],
      `${gradeId} terms must have orders [1, 2]`,
    )
  }
})
