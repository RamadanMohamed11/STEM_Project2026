import assert from 'node:assert/strict'
import test from 'node:test'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'
import {
  filterExperiments,
  findExperimentById,
  getExperimentCurriculum,
  getExperimentsForCurriculum,
  getLabPath,
  groupExperimentsBySemester,
  initialCatalogFilters,
} from '../src/features/experiments/lib/catalogSelectors.ts'

test('the demonstration catalog has one available demo and two planned examples', () => {
  assert.equal(demoCatalog.experiments.length, 3)
  assert.deepEqual(
    demoCatalog.experiments.filter((item) => item.status === 'demo').map((item) => item.title),
    ['Dissolving Salt in Water'],
  )
  assert.equal(demoCatalog.experiments.filter((item) => item.status === 'planned').length, 2)
  assert.equal(demoCatalog.semesters.length, 0)
  assert.equal(demoCatalog.units.length, 0)
  assert.equal(demoCatalog.lessons.length, 0)
})

test('search trims whitespace, ignores case, and includes scientific descriptions', () => {
  assert.deepEqual(
    filterExperiments(demoCatalog, { ...initialCatalogFilters, search: '  SoDiUm ChLoRiDe  ' }).map(
      (item) => item.id,
    ),
    ['exp-salt-water-001'],
  )
  assert.deepEqual(
    filterExperiments(demoCatalog, { ...initialCatalogFilters, search: 'pH' }).map(
      (item) => item.id,
    ),
    ['exp-ph-003'],
  )
})

test('category and status filters combine without modifying source data', () => {
  const filtered = filterExperiments(demoCatalog, {
    ...initialCatalogFilters,
    categoryId: 'chemistry',
    status: 'planned',
  })
  assert.deepEqual(
    filtered.map((item) => item.id),
    ['exp-ph-003'],
  )
  assert.equal(filterExperiments(demoCatalog, initialCatalogFilters).length, 3)
  assert.equal(
    filterExperiments(demoCatalog, { ...initialCatalogFilters, search: 'no matching subject' })
      .length,
    0,
  )
})

test('lab links resolve using stable IDs; invalid identifiers do not match', () => {
  const experiment = findExperimentById(demoCatalog.experiments, 'exp-salt-water-001')
  assert.ok(experiment)
  assert.equal(experiment.slug, 'dissolving-salt-in-water')
  assert.equal(getLabPath(experiment), '/experiments/exp-salt-water-001/lab')
  assert.equal(findExperimentById(demoCatalog.experiments, 'nonexistent'), undefined)
  assert.equal(findExperimentById(demoCatalog.experiments, 'dissolving-salt-in-water'), undefined)
})

test('semester assignment can be inherited from unit and lesson, while others stay unassigned', () => {
  const semester = { id: 'example-term', slug: 'example-term', title: 'Example term', order: 1 }
  const unit = {
    id: 'example-unit',
    semesterId: semester.id,
    slug: 'example-unit',
    title: 'Example unit',
    order: 1,
  }
  const lesson = {
    id: 'example-lesson',
    unitId: unit.id,
    slug: 'example-lesson',
    title: 'Example lesson',
    order: 1,
  }
  const assigned = {
    ...demoCatalog.experiments[0],
    curriculum: { lessonId: lesson.id },
  }
  const data = {
    ...demoCatalog,
    experiments: [assigned, ...demoCatalog.experiments.slice(1)],
    semesters: [semester],
    units: [unit],
    lessons: [lesson],
  }

  assert.deepEqual(getExperimentCurriculum(assigned, data.units, data.lessons), {
    semesterId: semester.id,
    unitId: unit.id,
    lessonId: lesson.id,
  })
  assert.deepEqual(
    filterExperiments(data, { ...initialCatalogFilters, semesterId: semester.id }).map(
      (item) => item.id,
    ),
    [assigned.id],
  )
  assert.deepEqual(
    getExperimentsForCurriculum(data.experiments, data.units, data.lessons, {
      lessonId: lesson.id,
    }).map((item) => item.id),
    [assigned.id],
  )
  const groups = groupExperimentsBySemester(data)
  assert.equal(groups.get(semester.id)?.length, 1)
  assert.equal(groups.get(null)?.length, 2)
})
