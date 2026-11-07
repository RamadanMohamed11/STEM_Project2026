import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router'
import { getCurriculumLessonPath } from '@/app/paths'
import type { getCurriculumUnits } from '../lib/curriculumBrowser'

export function UnitBrowser({
  units,
  openUnitId,
}: {
  units: ReturnType<typeof getCurriculumUnits>
  openUnitId?: string
}) {
  if (!units.length)
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-navy">No Units Available</h2>
        <p className="mt-2 text-sm text-slate">
          There are no units for this grade and term yet. You can choose another term.
        </p>
      </div>
    )
  return (
    <div className="space-y-4">
      {units.map(({ unit, lessons }) => (
        <details
          key={unit.id}
          open={unit.id === openUnitId || undefined}
          className="group overflow-hidden rounded-xl border border-line bg-white shadow-xs transition-all duration-300 hover:border-teal/30 hover:shadow-md"
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 p-5 focus-visible:outline-teal sm:p-6 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="text-lg font-semibold text-navy transition-colors group-hover:text-teal-dark">{unit.title}</h2>
              <p className="mt-1 text-sm text-slate">
                {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
              </p>
              {unit.description && <p className="mt-2 text-sm text-slate">{unit.description}</p>}
            </div>
            <ChevronDown
              size={20}
              aria-hidden="true"
              className="shrink-0 text-teal transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="border-t border-line px-5 sm:px-6">
            {lessons.length ? (
              <ol className="divide-y divide-line">
                {lessons.map(({ lesson, availableCount, plannedCount }) => (
                  <li
                    key={lesson.id}
                    className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-navy">{lesson.title}</h3>
                      {lesson.description && (
                        <p className="mt-1 text-sm text-slate">{lesson.description}</p>
                      )}
                      <p className="mt-1 text-sm text-slate">
                        {availableCount} available{' '}
                        {availableCount === 1 ? 'experiment' : 'experiments'}
                        {plannedCount > 0 && ` · ${plannedCount} planned`}
                      </p>
                      {!availableCount && (
                        <p className="mt-1 text-sm text-slate">No Experiments Available</p>
                      )}
                    </div>
                    <Link
                      to={getCurriculumLessonPath(lesson.id)}
                      aria-label={`View Experiments: ${unit.title}, ${lesson.title}`}
                      className="inline-flex min-h-11 items-center self-start rounded-lg border border-teal/30 px-4 text-sm font-semibold text-teal-dark shadow-xs transition-all duration-150 hover:bg-teal-soft hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-teal sm:shrink-0"
                    >
                      View Experiments
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-6 text-sm text-slate">No Lessons Available</p>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
