import { useMemo } from 'react'
import { LayoutGrid, Library } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { routePaths } from '@/app/paths'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { StatusPill } from '@/components/ui/StatusPill'
import { CurriculumExperimentsLibrary } from '@/features/curriculum/components/CurriculumExperimentsLibrary'
import { resolveCurriculumContext } from '@/features/curriculum/lib/curriculumBrowser'
import { getStoredGradeId } from '@/features/curriculum/state/gradeSelection'
import { getStoredTermId } from '@/features/curriculum/state/termSelection'
import { useStudentCurriculumData } from '@/features/curriculum/state/useStudentCurriculumData'
import { ExperimentCatalog } from '@/features/experiments/components/ExperimentCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { CurriculumData } from '@/types/curriculum'

function safeStoredContext(): { gradeId: string | null; termId: string | null } {
  try {
    return { gradeId: getStoredGradeId(), termId: getStoredTermId() }
  } catch {
    return { gradeId: null, termId: null }
  }
}

export interface ExperimentsPageProps {
  curriculumData?: CurriculumData
}

export function ExperimentsPage({ curriculumData }: ExperimentsPageProps = {}) {
  const [params] = useSearchParams()
  const { data: activeCurriculum } = useStudentCurriculumData(curriculumData)
  const stored = safeStoredContext()

  const gradeParam = params.get('grade')
  const termParam = params.get('term')
  const viewParam = params.get('view')

  // Detect whether specific catalog filter parameters are active (search, category, status, specific unit, specific lesson)
  const hasCatalogFilters =
    params.has('search') ||
    params.has('q') ||
    params.has('category') ||
    params.has('status') ||
    params.has('unit') ||
    params.has('lesson') ||
    viewParam === 'catalog'

  // When grade and term query parameters are provided, resolve curriculum context
  const activeContext = useMemo(() => {
    if (!gradeParam) return null
    const resolved = resolveCurriculumContext(activeCurriculum, gradeParam, termParam)
    return resolved.grade && resolved.term && !resolved.invalid ? resolved : null
  }, [activeCurriculum, gradeParam, termParam])

  // Resolve stored curriculum context for quick jump helper when visiting catalog directly
  const storedContext = useMemo(() => {
    if (!stored.gradeId || !stored.termId) return null
    const resolved = resolveCurriculumContext(activeCurriculum, stored.gradeId, stored.termId)
    return resolved.grade && resolved.term && !resolved.invalid ? resolved : null
  }, [activeCurriculum, stored.gradeId, stored.termId])

  // Show the curriculum library layout if grade and term are selected and no granular catalog search filters are engaged
  const showCurriculumLibrary = Boolean(activeContext && !hasCatalogFilters)

  usePageTitle(
    showCurriculumLibrary
      ? `${activeContext?.grade?.title ?? 'Experiments Library'}`
      : 'Experiments',
  )

  if (showCurriculumLibrary && activeContext?.grade && activeContext?.term) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate">
            Curriculum Structure View
          </p>
          <div className="flex items-center gap-2">
            <Link
              to={`${routePaths.experiments}?${new URLSearchParams({
                grade: activeContext.grade.id,
                term: activeContext.term.id,
                view: 'catalog',
              })}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-xs font-semibold text-navy shadow-xs transition-colors hover:bg-slate-50 focus-visible:outline-teal"
            >
              <LayoutGrid size={14} aria-hidden="true" />
              <span>Catalog View</span>
            </Link>
          </div>
        </div>

        <CurriculumExperimentsLibrary
          grade={activeContext.grade}
          term={activeContext.term}
          curriculumData={activeCurriculum}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Explore / Science Experiments"
        title="Experiment catalog"
        description="Browse science experiments, search by topic, and try our interactive 3D virtual laboratory."
        action={
          <StatusPill tone="info" dot>
            Sample Collection
          </StatusPill>
        }
      />

      {/* Helper prompt when an active curriculum grade and term are stored */}
      {storedContext && !gradeParam && (
        <aside
          aria-label="Active curriculum context"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal/20 bg-teal-soft/60 p-4 text-sm text-navy"
        >
          <div className="flex items-center gap-2">
            <Library size={18} className="text-teal shrink-0" aria-hidden="true" />
            <span>
              Organized for your syllabus:{' '}
              <strong>
                {storedContext.grade?.title} · {storedContext.term?.title}
              </strong>
            </span>
          </div>
          <ButtonLink
            to={`${routePaths.experiments}?${new URLSearchParams({
              grade: storedContext.grade?.id ?? '',
              term: storedContext.term?.id ?? '',
            })}`}
            variant="secondary"
            size="sm"
          >
            Open Curriculum Library
          </ButtonLink>
        </aside>
      )}

      {/* Return to curriculum library link when grade/term are present but catalog view was toggled */}
      {activeContext && viewParam === 'catalog' && (
        <aside
          aria-label="Return to curriculum library"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal/20 bg-teal-soft/60 p-4 text-sm text-navy"
        >
          <div className="flex items-center gap-2">
            <Library size={18} className="text-teal shrink-0" aria-hidden="true" />
            <span>
              Viewing catalog for{' '}
              <strong>
                {activeContext.grade?.title} · {activeContext.term?.title}
              </strong>
            </span>
          </div>
          <ButtonLink
            to={`${routePaths.experiments}?${new URLSearchParams({
              grade: activeContext.grade?.id ?? '',
              term: activeContext.term?.id ?? '',
            })}`}
            variant="secondary"
            size="sm"
          >
            Back to Curriculum Library
          </ButtonLink>
        </aside>
      )}

      <ExperimentCatalog />
    </div>
  )
}
