import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { routePaths } from '@/app/paths'
import { getAvailableGrades, getTermsForGrade } from '@/features/curriculum/lib/curriculumSelectors'
import {
  getCurriculumUnits,
  resolveCurriculumContext,
} from '@/features/curriculum/lib/curriculumBrowser'
import { UnitBrowser } from '@/features/curriculum/components/UnitBrowser'
import { CurriculumExperimentsLibrary } from '@/features/curriculum/components/CurriculumExperimentsLibrary'
import { getStoredGradeId } from '@/features/curriculum/state/gradeSelection'
import { getStoredTermId } from '@/features/curriculum/state/termSelection'
import { useStudentCurriculumData } from '@/features/curriculum/state/useStudentCurriculumData'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { curriculumBreadcrumbs } from '@/features/curriculum/lib/curriculumBreadcrumbs'
import type { CurriculumData } from '@/types/curriculum'

function storedContext() {
  try {
    return { grade: getStoredGradeId(), term: getStoredTermId() }
  } catch {
    return { grade: null, term: null }
  }
}

export interface CurriculumPageProps {
  curriculumData?: CurriculumData
}

export function CurriculumPage({ curriculumData }: CurriculumPageProps = {}) {
  usePageTitle('Your Lessons')
  const { data: activeCurriculum, source } = useStudentCurriculumData(curriculumData)
  const [params, setParams] = useSearchParams()
  const stored = !['grade', 'term', 'unit'].some((key) => params.has(key)) ? storedContext() : null
  const { grade, term, invalid } = resolveCurriculumContext(
    activeCurriculum,
    params.get('grade') ?? stored?.grade ?? null,
    params.get('term') ?? stored?.term ?? null,
  )
  const terms = getTermsForGrade(activeCurriculum, grade?.id)
  const units = getCurriculumUnits(activeCurriculum, term?.id ?? null)
  const unitId = params.get('unit')
  const selectedUnit = units.find((item) => item.unit.id === unitId)?.unit
  const invalidUnit = params.has('unit') && !selectedUnit
  const invalidUrl =
    invalid || invalidUnit || ['grade', 'term', 'unit'].some((key) => params.getAll(key).length > 1)
  const termSelectionParams = new URLSearchParams()
  if (grade) termSelectionParams.set('grade', grade.id)
  if (term) termSelectionParams.set('term', term.id)
  const inputClass =
    'mt-2 min-h-12 w-full rounded-lg border border-line-strong bg-white px-3 text-base text-ink focus-visible:outline-teal disabled:opacity-60'
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <Breadcrumbs
        items={curriculumBreadcrumbs(
          invalidUrl ? {} : { grade, term, unit: selectedUnit },
          'Your Lessons',
        )}
      />
      <PageHeader
        eyebrow="Curriculum / Units and Lessons"
        title="Your Lessons"
        description="Explore units and lessons for your grade and term."
      />
      {source === 'sample' ? (
        <p className="rounded-xl border border-line bg-teal-soft p-4 text-sm leading-relaxed text-ink">
          <strong>Demonstration data.</strong> These examples are not the official Egyptian
          chemistry curriculum. The official units, lessons and experiment links are still under
          review.
        </p>
      ) : (
        <p className="rounded-xl border border-line bg-emerald-50/80 p-4 text-sm leading-relaxed text-ink">
          <strong>Published curriculum.</strong> Showing published units and lessons for the
          selected academic grade and term.
        </p>
      )}
      <section
        aria-label="Grade and term"
        className="grid gap-5 sm:grid-cols-2 animate-section-enter"
      >
        <div>
          <label htmlFor="curriculum-grade" className="text-sm font-semibold text-navy">
            Selected Grade
          </label>
          <select
            id="curriculum-grade"
            className={inputClass}
            value={grade?.id ?? ''}
            onChange={(event) =>
              setParams(event.target.value ? { grade: event.target.value } : { grade: '' })
            }
          >
            <option value="">Choose Your Grade</option>
            {getAvailableGrades(activeCurriculum).map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="curriculum-term" className="text-sm font-semibold text-navy">
            Selected Term
          </label>
          <select
            id="curriculum-term"
            className={inputClass}
            value={term?.id ?? ''}
            disabled={!grade}
            onChange={(event) => {
              if (grade) setParams({ grade: grade.id, term: event.target.value })
            }}
          >
            <option value="">Choose Your Term</option>
            {terms.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      </section>
      {grade && term && (
        <div>
          <label htmlFor="curriculum-unit" className="text-sm font-semibold text-navy">
            Unit
          </label>
          <select
            id="curriculum-unit"
            className={inputClass}
            value={unitId ?? 'all'}
            onChange={(event) => {
              const next = new URLSearchParams({ grade: grade.id, term: term.id })
              if (event.target.value !== 'all') next.set('unit', event.target.value)
              setParams(next)
            }}
          >
            <option value="all">All Units</option>
            {invalidUnit && <option value={unitId ?? ''}>Invalid unit</option>}
            {units.map(({ unit }) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
        </div>
      )}
      {invalidUrl && (
        <p role="alert" className="text-sm text-danger">
          These selections do not match an available grade, term and unit. Please choose them again.
        </p>
      )}
      {grade && term && !invalidUrl ? (
        params.get('view') === 'library' ? (
          <CurriculumExperimentsLibrary
            grade={grade}
            term={term}
            curriculumData={activeCurriculum}
          />
        ) : (
          <UnitBrowser
            key={`${term.id}-${unitId ?? ''}`}
            units={selectedUnit ? units.filter((item) => item.unit.id === selectedUnit.id) : units}
            openUnitId={selectedUnit?.id}
          />
        )
      ) : (
        <p role="status" className="rounded-xl border border-line bg-white p-6 text-slate">
          Choose a grade and term to see your units and lessons.
        </p>
      )}
      <nav
        aria-label="Curriculum navigation"
        className="flex flex-wrap gap-3 border-t border-line pt-5"
      >
        <ButtonLink to={routePaths.grades} variant="secondary">
          Change Grade
        </ButtonLink>
        <ButtonLink
          to={grade ? `${routePaths.terms}?${termSelectionParams}` : routePaths.terms}
          variant="secondary"
        >
          Change Term
        </ButtonLink>
        <ButtonLink to={routePaths.laboratoryPreview} variant="secondary">
          Open 3D Demo
        </ButtonLink>
        {grade && term && !invalidUrl && (
          <ButtonLink
            to={`${routePaths.experiments}?${new URLSearchParams({ grade: grade.id, term: term.id, ...(selectedUnit ? { unit: selectedUnit.id } : {}) })}`}
            variant="secondary"
          >
            Browse Experiments
          </ButtonLink>
        )}
      </nav>
      <p className="text-sm leading-relaxed text-slate">
        The salt-dissolution demo is a separate activity. It has not been assigned to a school
        lesson.
      </p>
    </div>
  )
}
