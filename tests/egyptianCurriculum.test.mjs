import assert from 'node:assert/strict'
import test from 'node:test'
import {
  egyptianCurriculum,
  egyptianGrades,
  egyptianTerms,
  egyptianUnits,
  egyptianLessons,
  egyptianExperiments,
  egyptianLessonExperiments,
} from '../src/features/curriculum/data/egyptianCurriculum.ts'
import {
  getAvailableGrades,
  getTermsForGrade,
  getUnitsForTerm,
  getLessonsForUnit,
  getExperimentsForLesson,
  findExperimentById,
} from '../src/features/curriculum/lib/curriculumSelectors.ts'
import { validateCurriculum } from '../src/features/curriculum/lib/validateCurriculum.ts'

test('egyptianCurriculum passes full relational and integrity validation', () => {
  assert.equal(egyptianCurriculum.contentStatus, 'reviewed')
  assert.deepEqual(validateCurriculum(egyptianCurriculum), [])
})

test('egyptianCurriculum covers 3 secondary grades with 2 terms each', () => {
  const grades = getAvailableGrades(egyptianCurriculum)
  assert.equal(grades.length, 3)
  assert.deepEqual(
    grades.map((g) => g.id),
    ['grade-secondary-1', 'grade-secondary-2', 'grade-secondary-3'],
  )

  for (const grade of grades) {
    const terms = getTermsForGrade(egyptianCurriculum, grade.id)
    assert.equal(terms.length, 2)
    assert.deepEqual(
      terms.map((t) => t.title),
      ['First Term', 'Second Term'],
    )
  }
})

test('every grade and term has practical chemistry units and lessons', () => {
  for (const term of egyptianTerms) {
    const units = getUnitsForTerm(egyptianCurriculum, term.id)
    assert.ok(units.length >= 1, `Term ${term.id} must have at least one unit`)

    for (const unit of units) {
      const lessons = getLessonsForUnit(egyptianCurriculum, unit.id)
      assert.ok(lessons.length >= 1, `Unit ${unit.id} must have at least one lesson`)

      for (const lesson of lessons) {
        const experiments = getExperimentsForLesson(egyptianCurriculum, lesson.id)
        assert.ok(
          experiments.length >= 1,
          `Lesson ${lesson.id} must have at least one assigned experiment`,
        )
      }
    }
  }
})

test('all 23 experiments have valid titles, short descriptions, categories, and hazard levels', () => {
  assert.equal(egyptianExperiments.length, 23)
  const allowedCategories = new Set(['chemistry', 'measurement'])
  const allowedHazardLevels = new Set(['none', 'low', 'medium', 'moderate', 'high'])

  for (const exp of egyptianExperiments) {
    assert.ok(exp.id.startsWith('exp-'), `ID must start with exp-: ${exp.id}`)
    assert.ok(exp.slug.length >= 3, `Slug must be valid: ${exp.slug}`)
    assert.ok(exp.title.length >= 3, `Title must be descriptive: ${exp.title}`)
    assert.ok(
      exp.shortDescription.length >= 20,
      `Short description must be at least 1-2 sentences: ${exp.shortDescription}`,
    )
    assert.ok(allowedCategories.has(exp.categoryId), `Invalid category: ${exp.categoryId}`)
    assert.ok(exp.estimatedDurationMinutes >= 10 && exp.estimatedDurationMinutes <= 45)
    assert.ok(exp.safety, `Experiment ${exp.id} must have safety metadata`)
    assert.ok(
      allowedHazardLevels.has(exp.safety.level),
      `Invalid hazard level on ${exp.id}: ${exp.safety.level}`,
    )
  }
})

test('playable experiments match registered simulations while unbuilt experiments remain planned', () => {
  const playableIds = new Set([
    'exp-salt-water-001',
    'exp-titration-005',
    'exp-heat-dissolution-006',
    'exp-flame-tests-008',
    'exp-oxides-009',
    'exp-sodium-water-012',
    'exp-anions-015',
  ])

  for (const exp of egyptianExperiments) {
    if (playableIds.has(exp.id)) {
      assert.equal(exp.status, 'demo', `Experiment ${exp.id} should be playable (demo)`)
    } else {
      assert.equal(
        exp.status,
        'planned',
        `Experiment ${exp.id} should have planned status until simulation engine is built`,
      )
    }
  }
})
