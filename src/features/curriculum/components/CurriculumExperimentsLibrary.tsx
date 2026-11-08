import { ArrowRight, FlaskConical } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { getExperimentPaths, routePaths } from '@/app/paths'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { StatusPill } from '@/components/ui/StatusPill'
import {
  getAvailableGrades,
  getExperimentsForLesson,
  getLessonsForUnit,
  getTermsForGrade,
  getUnitsForTerm,
} from '@/features/curriculum/lib/curriculumSelectors'
import { getStoredGradeId } from '@/features/curriculum/state/gradeSelection'
import { getStoredTermId } from '@/features/curriculum/state/termSelection'
import { useStudentCurriculumData } from '@/features/curriculum/state/useStudentCurriculumData'
import type { CurriculumData, Grade, Term } from '@/types/curriculum'

function safeStoredContext(): { gradeId: string | null; termId: string | null } {
  try {
    return { gradeId: getStoredGradeId(), termId: getStoredTermId() }
  } catch {
    return { gradeId: null, termId: null }
  }
}

export interface CurriculumExperimentsLibraryProps {
  grade?: Grade | null
  term?: Term | null
  curriculumData?: CurriculumData
  isPartial?: boolean
}

export function CurriculumExperimentsLibrary({
  grade: propGrade,
  term: propTerm,
  curriculumData,
  isPartial: propIsPartial,
}: CurriculumExperimentsLibraryProps = {}) {
  const { data: activeCurriculum, source } = useStudentCurriculumData(curriculumData)
  const [params] = useSearchParams()
  const stored = safeStoredContext()

  const grade =
    propGrade ??
    getAvailableGrades(activeCurriculum).find(
      (item) => item.id === (params.get('grade') ?? stored.gradeId),
    ) ??
    null

  const term =
    propTerm ??
    getTermsForGrade(activeCurriculum, grade?.id).find(
      (item) => item.id === (params.get('term') ?? stored.termId),
    ) ??
    null

  const units = getUnitsForTerm(activeCurriculum, term?.id)

  const unitsWithContent = units.map((unit) => {
    const lessons = getLessonsForUnit(activeCurriculum, unit.id).map((lesson) => ({
      lesson,
      experiments: getExperimentsForLesson(activeCurriculum, lesson.id),
    }))
    return {
      unit,
      lessons,
      experimentCount: lessons.reduce((acc, l) => acc + l.experiments.length, 0),
    }
  })

  const totalExperiments = unitsWithContent.reduce((acc, u) => acc + u.experimentCount, 0)
  const hasNoUnits = units.length === 0
  const hasNoExperiments = hasNoUnits || totalExperiments === 0

  const isPartial =
    propIsPartial ??
    (activeCurriculum.contentStatus === 'sample' || source === 'sample' || units.length < 3)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Top Header matching reference image: Title = Grade name, Pill = Term */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">
            STEM Virtual Lab · Experiments Library
          </p>
          <div className="flex items-center gap-2">
            <ButtonLink
              to={
                grade
                  ? `${routePaths.terms}?${new URLSearchParams({ grade: grade.id, ...(term ? { term: term.id } : {}) })}`
                  : routePaths.terms
              }
              variant="secondary"
              size="sm"
            >
              Change Term
            </ButtonLink>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {grade?.title ?? 'Secondary Grade'}
        </h1>

        {term && (
          <div>
            <StatusPill tone="info" dot>
              {term.title}
            </StatusPill>
          </div>
        )}
      </header>

      {/* Main Content: Units and Lessons Cards OR Empty State */}
      {hasNoExperiments ? (
        <div
          role="status"
          className="rounded-2xl border border-line bg-white p-8 text-center shadow-card sm:p-12"
        >
          <FlaskConical className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-navy">
            {hasNoUnits ? 'No Units Available' : 'No experiments available for this term'}
          </h2>
          <p className="mt-1 text-sm text-slate">
            {hasNoUnits
              ? 'There are no units or experiments for this grade and term yet. You can choose another term.'
              : `There are no scheduled practical experiments for ${grade?.title ?? 'this grade'} — ${term?.title ?? 'this term'} yet.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to={routePaths.terms} variant="secondary">
              Choose Another Term
            </ButtonLink>
            <ButtonLink to={routePaths.grades} variant="secondary">
              Choose Another Grade
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {unitsWithContent.map(({ unit, lessons }, unitIndex) => {
            const staggerClass = `stagger-${Math.min((unitIndex % 6) + 1, 6)}`
            return (
              <section
                key={unit.id}
                aria-labelledby={`unit-heading-${unit.id}`}
                className={`space-y-3 animate-fade-in-up ${staggerClass}`}
              >
                {/* Unit Heading */}
                <h2
                  id={`unit-heading-${unit.id}`}
                  className="text-xl font-bold tracking-tight text-navy sm:text-2xl"
                >
                  {unit.title}
                </h2>
                {unit.description && (
                  <p className="text-sm leading-relaxed text-slate">{unit.description}</p>
                )}

                {/* One rounded card per unit containing all lessons */}
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card divide-y divide-line">
                  {lessons.length > 0 ? (
                    lessons.map(({ lesson, experiments }) => (
                      <div key={lesson.id} className="p-5 sm:p-6 space-y-3">
                        {/* Lesson Title */}
                        <h3 className="text-base font-semibold text-navy sm:text-lg">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-xs text-slate sm:text-sm">{lesson.description}</p>
                        )}

                        {/* Bulleted list of experiment links */}
                        {experiments.length > 0 ? (
                          <ul className="space-y-2.5" role="list">
                            {experiments.map((exp) => (
                              <li
                                key={exp.id}
                                className="flex items-start sm:items-center gap-2.5 text-sm"
                              >
                                <span
                                  className="mt-1.5 sm:mt-0 h-1.5 w-1.5 rounded-full bg-teal shrink-0"
                                  aria-hidden="true"
                                />
                                {exp.status === 'demo' ? (
                                  <Link
                                    to={getExperimentPaths(exp.id).details}
                                    className="group inline-flex items-center gap-1.5 font-medium text-teal hover:text-teal-dark hover:underline focus-visible:outline-teal focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1 rounded transition-colors"
                                  >
                                    <span>{exp.title}</span>
                                    <ArrowRight
                                      size={13}
                                      className="text-teal transition-transform group-hover:translate-x-0.5"
                                      aria-hidden="true"
                                    />
                                  </Link>
                                ) : (
                                  <div className="inline-flex flex-wrap items-center gap-2">
                                    <span className="text-slate">{exp.title}</span>
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                      Coming soon
                                    </span>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate italic">
                            No experiments assigned to this lesson.
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-5 sm:p-6 text-sm text-slate">No lessons in this unit.</div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Footer note: only when data is partial */}
      {isPartial && (
        <footer className="pt-4 text-center">
          <p className="text-xs text-slate sm:text-sm">
            Remaining units follow the same structure according to the curriculum.
          </p>
        </footer>
      )}
    </div>
  )
}
