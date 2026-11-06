import type { CurriculumData } from '../../../types/curriculum.ts'

export interface CurriculumIssue {
  readonly code:
    'duplicate-id' | 'missing-parent' | 'duplicate-relationship' | 'invalid-order' | 'empty-id'
  readonly collection:
    'grades' | 'terms' | 'units' | 'lessons' | 'experiments' | 'lessonExperiments'
  readonly recordId: string
  readonly message: string
}

/**
 * Check references in an already typed snapshot before accepting future content.
 * This is an integrity check, not a JSON parser or a scientific-content review.
 * An absent dataset is treated as empty, matching the read utilities.
 */
export function validateCurriculum(data: CurriculumData | null | undefined): CurriculumIssue[] {
  if (!data) return []
  const issues: CurriculumIssue[] = []
  const collections = ['grades', 'terms', 'units', 'lessons', 'experiments'] as const
  const ids = new Map<string, Set<string>>()
  for (const collection of collections) {
    const seen = new Set<string>()
    ids.set(collection, seen)
    for (const record of data[collection]) {
      if (!record.id.trim())
        issues.push({
          code: 'empty-id',
          collection,
          recordId: record.id,
          message: 'A stable ID is required.',
        })
      if (seen.has(record.id))
        issues.push({
          code: 'duplicate-id',
          collection,
          recordId: record.id,
          message: 'IDs must be unique within each collection.',
        })
      seen.add(record.id)
      if ('order' in record && (!Number.isSafeInteger(record.order) || record.order < 1)) {
        issues.push({
          code: 'invalid-order',
          collection,
          recordId: record.id,
          message: 'Order must be a positive integer.',
        })
      }
    }
  }

  for (const [collection, parentCollection, records] of [
    ['terms', 'grades', data.terms.map((term) => ({ id: term.id, parentId: term.gradeId }))],
    ['units', 'terms', data.units.map((unit) => ({ id: unit.id, parentId: unit.termId }))],
    [
      'lessons',
      'units',
      data.lessons.map((lesson) => ({ id: lesson.id, parentId: lesson.unitId })),
    ],
  ] as const) {
    for (const record of records) {
      if (!ids.get(parentCollection)?.has(record.parentId)) {
        issues.push({
          code: 'missing-parent',
          collection,
          recordId: record.id,
          message: `Parent ${parentCollection} ID "${record.parentId}" was not found.`,
        })
      }
    }
  }

  const pairs = new Set<string>()
  for (const link of data.lessonExperiments) {
    const recordId = JSON.stringify([link.lessonId, link.experimentId])
    const collection = 'lessonExperiments'
    if (pairs.has(recordId))
      issues.push({
        code: 'duplicate-relationship',
        collection,
        recordId,
        message: 'An experiment may only be linked once per lesson.',
      })
    pairs.add(recordId)
    if (
      !ids.get('lessons')?.has(link.lessonId) ||
      !ids.get('experiments')?.has(link.experimentId)
    ) {
      issues.push({
        code: 'missing-parent',
        collection,
        recordId,
        message: 'The linked lesson and experiment must both exist.',
      })
    }
    if (!Number.isSafeInteger(link.order) || link.order < 1) {
      issues.push({
        code: 'invalid-order',
        collection,
        recordId,
        message: 'Order must be a positive integer.',
      })
    }
  }
  return issues
}
