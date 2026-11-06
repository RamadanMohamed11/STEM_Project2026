import assert from 'node:assert/strict'
import test from 'node:test'
import { sampleCurriculum } from '../src/features/curriculum/data/sampleCurriculum.ts'
import {
  getAvailableGrades,
  getTermsForGrade,
  getUnitsForTerm,
  getLessonsForUnit,
  getExperimentsForLesson,
  findExperimentById,
  getUnassignedExperiments,
} from '../src/features/curriculum/lib/curriculumSelectors.ts'
import { validateCurriculum } from '../src/features/curriculum/lib/validateCurriculum.ts'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'
import { getLabPath } from '../src/features/experiments/lib/catalogSelectors.ts'
import { saltExperimentDefinition } from '../src/features/simulations/data/saltExperimentDefinition.ts'

const ids = (items) => items.map((item) => item.id)
const clone = () => structuredClone(sampleCurriculum)

function freezeDeep(value) {
  Object.freeze(value)
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object' && !Object.isFrozen(child)) freezeDeep(child)
  }
  return value
}

test('sample curriculum declares three secondary grades, each with two separate terms', () => {
  assert.equal(sampleCurriculum.contentStatus, 'sample')
  assert.match(sampleCurriculum.description, /not the official Egyptian chemistry curriculum/)
  assert.deepEqual(validateCurriculum(sampleCurriculum), [])
  const grades = getAvailableGrades(sampleCurriculum)
  assert.deepEqual(
    grades.map((grade) => grade.title),
    ['First Secondary Grade', 'Second Secondary Grade', 'Third Secondary Grade'],
  )
  const terms = grades.flatMap((grade) => {
    const children = getTermsForGrade(sampleCurriculum, grade.id)
    assert.deepEqual(
      children.map((term) => term.title),
      ['First Term', 'Second Term'],
    )
    assert.ok(children.every((term) => term.gradeId === grade.id))
    return children
  })
  assert.equal(new Set(ids(terms)).size, 6)
})

test('sample relationships traverse grade → term → unit → lesson → existing experiments', () => {
  const grade = getAvailableGrades(sampleCurriculum)[0]
  const term = getTermsForGrade(sampleCurriculum, grade.id)[0]
  const units = getUnitsForTerm(sampleCurriculum, term.id)
  assert.deepEqual(
    units.map((unit) => unit.title),
    ['Unit 1', 'Unit 2'],
  )
  const firstLessons = getLessonsForUnit(sampleCurriculum, units[0].id)
  assert.deepEqual(
    firstLessons.map((lesson) => lesson.title),
    ['Lesson 1', 'Lesson 2'],
  )
  const secondLessons = getLessonsForUnit(sampleCurriculum, units[1].id)
  assert.equal(secondLessons.length, 1)
  assert.deepEqual(ids(getExperimentsForLesson(sampleCurriculum, firstLessons[0].id)), [
    'exp-volume-002',
    'exp-ph-003',
  ])
  assert.deepEqual(ids(getExperimentsForLesson(sampleCurriculum, firstLessons[1].id)), [
    'exp-volume-002',
  ])
  assert.deepEqual(ids(getExperimentsForLesson(sampleCurriculum, secondLessons[0].id)), [
    'exp-ph-003',
  ])
  // Reuse across lessons is supported without copying the experiment record.
  assert.equal(
    getExperimentsForLesson(sampleCurriculum, firstLessons[0].id)[0],
    getExperimentsForLesson(sampleCurriculum, firstLessons[1].id)[0],
  )
})

test('the salt demonstration stays unassigned and opens through its original stable ID', () => {
  assert.equal(sampleCurriculum.experiments, demoCatalog.experiments)
  assert.deepEqual(ids(getUnassignedExperiments(sampleCurriculum)), ['exp-salt-water-001'])
  const salt = findExperimentById(sampleCurriculum, saltExperimentDefinition.experimentId)
  assert.equal(salt, demoCatalog.experiments[0])
  assert.equal(salt.curriculum, undefined)
  assert.equal(getLabPath(salt), '/experiments/exp-salt-water-001/lab')
  assert.ok(sampleCurriculum.lessonExperiments.every((link) => link.experimentId !== salt.id))
  assert.ok(
    sampleCurriculum.lessonExperiments.every(
      (link) => findExperimentById(sampleCurriculum, link.experimentId).status === 'planned',
    ),
  )
  assert.deepEqual(demoCatalog.semesters, [])
  assert.deepEqual(demoCatalog.units, [])
  assert.deepEqual(demoCatalog.lessons, [])
})

test('missing datasets, missing IDs and empty collections return useful empty results', () => {
  const empty = {
    ...sampleCurriculum,
    grades: [],
    terms: [],
    units: [],
    lessons: [],
    experiments: [],
    lessonExperiments: [],
  }
  for (const data of [undefined, null, empty]) {
    assert.deepEqual(getAvailableGrades(data), [])
    assert.deepEqual(getUnassignedExperiments(data), [])
    assert.deepEqual(validateCurriculum(data), [])
    for (const id of [undefined, null, '', 'unknown']) {
      assert.deepEqual(getTermsForGrade(data, id), [])
      assert.deepEqual(getUnitsForTerm(data, id), [])
      assert.deepEqual(getLessonsForUnit(data, id), [])
      assert.deepEqual(getExperimentsForLesson(data, id), [])
      assert.equal(findExperimentById(data, id), undefined)
    }
  }
  for (const id of [undefined, null, '', 'unknown']) {
    assert.deepEqual(getTermsForGrade(sampleCurriculum, id), [])
    assert.deepEqual(getUnitsForTerm(sampleCurriculum, id), [])
    assert.deepEqual(getLessonsForUnit(sampleCurriculum, id), [])
    assert.deepEqual(getExperimentsForLesson(sampleCurriculum, id), [])
    assert.equal(findExperimentById(sampleCurriculum, id), undefined)
  }
  assert.equal(findExperimentById(sampleCurriculum, 'dissolving-salt-in-water'), undefined)
})

test('valid grades, terms, units and lessons may have no children yet', () => {
  const data = clone()
  data.units.push({
    id: 'empty-unit',
    termId: 'term-secondary-1-1',
    slug: 'empty-unit',
    title: 'Unit 3',
    order: 3,
  })
  data.lessons.push({
    id: 'empty-lesson',
    unitId: 'sample-unit-1',
    slug: 'empty-lesson',
    title: 'Lesson 3',
    order: 3,
  })
  assert.deepEqual(getUnitsForTerm(data, 'term-secondary-1-2'), [])
  assert.deepEqual(getUnitsForTerm(data, 'term-secondary-2-1'), [])
  assert.deepEqual(getLessonsForUnit(data, 'empty-unit'), [])
  assert.deepEqual(getExperimentsForLesson(data, 'empty-lesson'), [])
  assert.equal(getAvailableGrades(data).length, 3)
  assert.deepEqual(validateCurriculum(data), [])
})

test('lookups sort a copy, preserve inputs, and break order ties by stable ID', () => {
  const data = clone()
  for (const collection of ['grades', 'terms', 'units', 'lessons', 'lessonExperiments'])
    data[collection].reverse()
  freezeDeep(data)
  const before = JSON.stringify(data)
  assert.deepEqual(ids(getAvailableGrades(data)), [
    'grade-secondary-1',
    'grade-secondary-2',
    'grade-secondary-3',
  ])
  assert.deepEqual(ids(getTermsForGrade(data, 'grade-secondary-1')), [
    'term-secondary-1-1',
    'term-secondary-1-2',
  ])
  assert.deepEqual(ids(getUnitsForTerm(data, 'term-secondary-1-1')), [
    'sample-unit-1',
    'sample-unit-2',
  ])
  assert.deepEqual(ids(getLessonsForUnit(data, 'sample-unit-1')), [
    'sample-lesson-1-1',
    'sample-lesson-1-2',
  ])
  assert.deepEqual(ids(getExperimentsForLesson(data, 'sample-lesson-1-1')), [
    'exp-volume-002',
    'exp-ph-003',
  ])
  assert.deepEqual(validateCurriculum(data), [])
  assert.equal(JSON.stringify(data), before)
  assert.notEqual(getAvailableGrades(data), data.grades)
  const tied = { ...data, grades: data.grades.map((grade) => ({ ...grade, order: 1 })) }
  assert.deepEqual(ids(getAvailableGrades(tied)), [
    'grade-secondary-1',
    'grade-secondary-2',
    'grade-secondary-3',
  ])
})

test('dangling and repeated lesson links are reported without producing duplicate experiments', () => {
  const data = clone()
  data.lessonExperiments.push({ ...data.lessonExperiments[0], order: 3 })
  data.lessonExperiments.push({
    lessonId: 'sample-lesson-1-1',
    experimentId: 'missing-experiment',
    order: 4,
  })
  data.lessonExperiments.push({
    lessonId: 'missing-lesson',
    experimentId: 'exp-salt-water-001',
    order: 1,
  })
  assert.deepEqual(ids(getExperimentsForLesson(data, 'sample-lesson-1-1')), [
    'exp-volume-002',
    'exp-ph-003',
  ])
  assert.deepEqual(ids(getExperimentsForLesson(data, 'missing-lesson')), [])
  assert.deepEqual(ids(getUnassignedExperiments(data)), ['exp-salt-water-001'])
  assert.equal(
    validateCurriculum(data).filter((issue) => issue.code === 'duplicate-relationship').length,
    1,
  )
  assert.equal(
    validateCurriculum(data).filter((issue) => issue.code === 'missing-parent').length,
    2,
  )
})

test('orphaned parent chains are not offered as reachable curriculum', () => {
  for (const [collection, parentField, downstreamLookup, id] of [
    ['terms', 'gradeId', getUnitsForTerm, 'term-secondary-1-1'],
    ['units', 'termId', getLessonsForUnit, 'sample-unit-1'],
    ['lessons', 'unitId', getExperimentsForLesson, 'sample-lesson-1-1'],
  ]) {
    const data = clone()
    data[collection][0][parentField] = 'missing-parent'
    assert.deepEqual(downstreamLookup(data, id), [])
    assert.ok(
      validateCurriculum(data).some(
        (issue) => issue.code === 'missing-parent' && issue.collection === collection,
      ),
    )
  }
  const data = { ...sampleCurriculum, grades: [] }
  assert.deepEqual(getExperimentsForLesson(data, 'sample-lesson-1-1'), [])
  assert.deepEqual(ids(getUnassignedExperiments(data)), ids(sampleCurriculum.experiments))
})

test('integrity checks reject duplicate entity IDs, empty IDs and invalid display orders', () => {
  for (const collection of ['grades', 'terms', 'units', 'lessons', 'experiments']) {
    const data = clone()
    data[collection].push({ ...data[collection][0] })
    assert.ok(
      validateCurriculum(data).some(
        (issue) => issue.code === 'duplicate-id' && issue.collection === collection,
      ),
    )
    data[collection][0].id = ' '
    assert.ok(
      validateCurriculum(data).some(
        (issue) => issue.code === 'empty-id' && issue.collection === collection,
      ),
    )
  }
  for (const order of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    for (const collection of ['grades', 'terms', 'units', 'lessons', 'lessonExperiments']) {
      const data = clone()
      data[collection][0].order = order
      assert.ok(
        validateCurriculum(data).some(
          (issue) => issue.code === 'invalid-order' && issue.collection === collection,
        ),
      )
    }
  }
})

test('plain JSON snapshots and edited curriculum placement keep experiment identity unchanged', () => {
  const data = JSON.parse(JSON.stringify(sampleCurriculum))
  assert.deepEqual(validateCurriculum(data), [])
  data.lessons.find((lesson) => lesson.id === 'sample-lesson-1-2').unitId = 'sample-unit-2'
  data.grades[0].title = 'Updated grade title'
  data.units[0].slug = 'updated-unit-slug'
  assert.deepEqual(ids(getLessonsForUnit(data, 'sample-unit-1')), ['sample-lesson-1-1'])
  assert.deepEqual(ids(getLessonsForUnit(data, 'sample-unit-2')), [
    'sample-lesson-2-1',
    'sample-lesson-1-2',
  ])
  assert.deepEqual(ids(getExperimentsForLesson(data, 'sample-lesson-1-2')), ['exp-volume-002'])
  assert.deepEqual(validateCurriculum(data), [])
  const salt = findExperimentById(data, 'exp-salt-water-001')
  assert.equal(getLabPath(salt), '/experiments/exp-salt-water-001/lab')
  assert.equal(salt.curriculum, undefined)
})
