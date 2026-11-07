import { getCurriculumLessonPath, getCurriculumPath, routePaths } from '../../../app/paths.ts'
import type { BreadcrumbItem } from '../../../components/ui/Breadcrumbs'
import type { Grade, Term, Unit, Lesson } from '../../../types/curriculum.ts'

export function curriculumBreadcrumbs(
  context: { grade?: Grade | null; term?: Term | null; unit?: Unit | null; lesson?: Lesson | null },
  current: string,
): BreadcrumbItem[] {
  const { grade, term, unit, lesson } = context
  const items: BreadcrumbItem[] = [{ label: 'Home', to: routePaths.home }]
  if (grade)
    items.push({
      label: grade.title,
      to: `${routePaths.curriculum}?${new URLSearchParams({ grade: grade.id })}`,
    })
  if (grade && term) items.push({ label: term.title, to: getCurriculumPath(grade.id, term.id) })
  if (grade && term && unit)
    items.push({
      label: unit.title,
      to: `${getCurriculumPath(grade.id, term.id)}&${new URLSearchParams({ unit: unit.id })}`,
    })
  if (lesson) items.push({ label: lesson.title, to: getCurriculumLessonPath(lesson.id) })
  items.push({ label: current })
  return items
}
