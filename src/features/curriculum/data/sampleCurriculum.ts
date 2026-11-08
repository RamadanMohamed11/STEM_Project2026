import { mockExperiments } from '../../experiments/data/mockExperiments.ts'
import type { CurriculumData, Grade, Term } from '../../../types/curriculum.ts'

export const sampleGrades: readonly Grade[] = [
  { id: 'grade-secondary-1', slug: 'first-secondary', title: 'First Secondary Grade', order: 1 },
  { id: 'grade-secondary-2', slug: 'second-secondary', title: 'Second Secondary Grade', order: 2 },
  { id: 'grade-secondary-3', slug: 'third-secondary', title: 'Third Secondary Grade', order: 3 },
]

export const sampleTerms: readonly Term[] = [
  {
    id: 'term-secondary-1-1',
    gradeId: 'grade-secondary-1',
    slug: 'first-term',
    title: 'First Term',
    order: 1,
  },
  {
    id: 'term-secondary-1-2',
    gradeId: 'grade-secondary-1',
    slug: 'second-term',
    title: 'Second Term',
    order: 2,
  },
  {
    id: 'term-secondary-2-1',
    gradeId: 'grade-secondary-2',
    slug: 'first-term',
    title: 'First Term',
    order: 1,
  },
  {
    id: 'term-secondary-2-2',
    gradeId: 'grade-secondary-2',
    slug: 'second-term',
    title: 'Second Term',
    order: 2,
  },
  {
    id: 'term-secondary-3-1',
    gradeId: 'grade-secondary-3',
    slug: 'first-term',
    title: 'First Term',
    order: 1,
  },
  {
    id: 'term-secondary-3-2',
    gradeId: 'grade-secondary-3',
    slug: 'second-term',
    title: 'Second Term',
    order: 2,
  },
]

/**
 * Examples only — NOT the official Egyptian chemistry curriculum.
 * Generic unit/lesson names demonstrate organization, not invented academic content.
 * All lesson links are sample relationships to existing planned catalog entries.
 * The playable salt experiment stays unassigned; no catalog metadata is changed.
 * This fixture is not mounted in the student UI by T03.
 */
export const sampleCurriculum: CurriculumData = {
  id: 'curriculum-secondary-sample',
  title: 'Sample Curriculum',
  description: 'Examples only. This is not the official Egyptian chemistry curriculum.',
  contentStatus: 'sample',
  grades: sampleGrades,
  terms: sampleTerms,
  units: [
    {
      id: 'sample-unit-1',
      termId: 'term-secondary-1-1',
      slug: 'unit-1',
      title: 'Unit 1',
      order: 1,
    },
    {
      id: 'sample-unit-2',
      termId: 'term-secondary-1-1',
      slug: 'unit-2',
      title: 'Unit 2',
      order: 2,
    },
  ],
  lessons: [
    {
      id: 'sample-lesson-1-1',
      unitId: 'sample-unit-1',
      slug: 'lesson-1',
      title: 'Lesson 1',
      order: 1,
    },
    {
      id: 'sample-lesson-1-2',
      unitId: 'sample-unit-1',
      slug: 'lesson-2',
      title: 'Lesson 2',
      order: 2,
    },
    {
      id: 'sample-lesson-2-1',
      unitId: 'sample-unit-2',
      slug: 'lesson-1',
      title: 'Lesson 1',
      order: 1,
    },
  ],
  // Same metadata objects and IDs as the existing library; no copied scientific definitions.
  experiments: mockExperiments,
  lessonExperiments: [
    { lessonId: 'sample-lesson-1-1', experimentId: 'exp-volume-002', order: 1 },
    { lessonId: 'sample-lesson-1-1', experimentId: 'exp-ph-003', order: 2 },
    { lessonId: 'sample-lesson-1-2', experimentId: 'exp-volume-002', order: 1 },
    { lessonId: 'sample-lesson-2-1', experimentId: 'exp-ph-003', order: 1 },
  ],
}

export {
  egyptianCurriculum,
  egyptianGrades,
  egyptianTerms,
  egyptianUnits,
  egyptianLessons,
  egyptianExperiments,
  egyptianLessonExperiments,
} from './egyptianCurriculum.ts'
