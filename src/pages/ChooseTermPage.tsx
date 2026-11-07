import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { getCurriculumPath, routePaths } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { TermSelectionGrid } from '@/features/curriculum/components/TermSelectionGrid'
import {
  getGradeById,
  getStoredGradeId,
  setStoredGradeId,
} from '@/features/curriculum/state/gradeSelection'
import {
  getStoredTermId,
  getTermById,
  getTermsForGrade,
  setStoredTermId,
} from '@/features/curriculum/state/termSelection'
import { usePageTitle } from '@/hooks/usePageTitle'

export function ChooseTermPage() {
  usePageTitle('Choose Your Term')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // Read currently active grade
  let storedGradeId: string | null = params.get('grade')
  if (!params.has('grade')) {
    try {
      storedGradeId = getStoredGradeId()
    } catch {
      storedGradeId = null
    }
  }
  const activeGrade = getGradeById(storedGradeId)

  // Get terms matching the selected grade
  const availableTerms = getTermsForGrade(storedGradeId)

  // Initialize selected term from storage if it belongs to current grade
  let candidateTerm: string | null = params.get('term')
  if (!params.has('term')) {
    try {
      candidateTerm = getStoredTermId()
    } catch {
      candidateTerm = null
    }
  }
  const selectedTermId = availableTerms.some((term) => term.id === candidateTerm)
    ? candidateTerm
    : null

  const selectedTerm = getTermById(selectedTermId)

  function handleSelectTerm(termId: string) {
    if (!activeGrade || !availableTerms.some((term) => term.id === termId)) return
    setParams({ grade: activeGrade.id, term: termId })
    try {
      setStoredTermId(termId)
    } catch {
      /* URL selection still works if storage is blocked. */
    }
  }

  function handleContinue() {
    if (!selectedTermId || !activeGrade) return
    try {
      setStoredGradeId(activeGrade.id)
    } catch {
      /* Browsing does not require storage. */
    }
    try {
      setStoredTermId(selectedTermId)
    } catch {
      /* The next route carries the term. */
    }
    navigate(getCurriculumPath(activeGrade.id, selectedTermId))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10">
      {/* Page Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">
            STEM Virtual Lab · Curriculum
          </p>
          <StatusPill tone="info" dot>
            Demonstration curriculum
          </StatusPill>
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Choose Your Term
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/75 sm:text-base">
          Choose a term to explore sample units and lessons. Official curriculum content is still
          under review.
        </p>
      </div>

      {/* Grade Context Banner */}
      {activeGrade ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-teal/25 bg-teal-soft/60 p-4 shadow-xs transition-all duration-300 hover:border-teal/40 hover:shadow-sm sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal text-white shadow-xs transition-transform duration-300 hover:scale-105">
              <GraduationCap size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
                Current Grade
              </p>
              <h2 className="text-base font-bold text-navy sm:text-lg">{activeGrade.title}</h2>
            </div>
          </div>

          <Link
            to={routePaths.grades}
            className="group/btn inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-teal/30 bg-white px-3.5 py-1.5 text-xs font-semibold text-teal-dark shadow-xs transition-all duration-150 hover:bg-teal-soft hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-teal"
          >
            <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-200 group-hover/btn:-translate-x-0.5" />
            <span>Change Grade</span>
          </Link>
        </div>
      ) : (
        /* Notice when student lands on /terms without having chosen a grade */
        <div
          role="alert"
          className="flex flex-col items-start justify-between gap-4 rounded-xl border border-warning/40 bg-warning-soft/70 p-5 sm:flex-row sm:items-center sm:p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0 text-warning-dark"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-base font-bold text-navy">No Grade Selected</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink/80 sm:text-sm">
                Please choose your secondary school grade first so we can display the correct
                curriculum terms.
              </p>
            </div>
          </div>

          <Link
            to={routePaths.grades}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal px-4 text-xs font-semibold text-white transition-colors hover:bg-teal-dark focus-visible:outline-teal sm:text-sm"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Choose Your Grade</span>
          </Link>
        </div>
      )}

      {/* Selected Term Feedback Banner */}
      {selectedTerm && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-teal/20 bg-teal-soft/80 p-4 text-xs text-teal-dark sm:text-sm"
        >
          <CheckCircle2 size={18} className="shrink-0 text-teal" aria-hidden="true" />
          <span>
            You have selected <strong className="text-navy">{selectedTerm.title}</strong>. Click
            Continue to explore your lessons.
          </span>
        </div>
      )}

      {/* 2-Term Options Grid */}
      {availableTerms.length > 0 ? (
        <section aria-label="Available academic terms">
          <TermSelectionGrid
            terms={availableTerms}
            selectedTermId={selectedTermId}
            onSelectTerm={handleSelectTerm}
          />
        </section>
      ) : (
        /* Fallback prompt if no grade is selected */
        <div className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center sm:p-12">
          <p className="text-base font-semibold text-navy">
            Academic terms will appear after you select a grade.
          </p>
          <p className="mt-2 text-xs text-slate sm:text-sm">
            Each secondary school grade has two distinct terms: First Term and Second Term.
          </p>
          <div className="mt-5">
            <Link
              to={routePaths.grades}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark focus-visible:outline-teal"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Select Your Grade Now</span>
            </Link>
          </div>
        </div>
      )}

      {/* Action Footer & Navigation */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:p-7">
        <div>
          <p className="text-sm font-semibold text-navy">
            {selectedTerm ? `Ready to explore ${selectedTerm.title}` : 'Please choose a term'}
          </p>
          <p className="mt-0.5 text-xs text-slate">
            {selectedTerm
              ? 'Proceed to view units and lessons for this term.'
              : 'Select either First Term or Second Term above to continue.'}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {selectedTermId ? (
            <Button
              type="button"
              size="lg"
              onClick={handleContinue}
              icon={<ArrowRight size={18} aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              size="lg"
              icon={<ArrowRight size={18} aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              Continue
            </Button>
          )}
        </div>
      </div>

      {/* Secondary Helper Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs text-slate">
        <p>
          Want to explore all activities directly?{' '}
          <Link
            to={routePaths.experiments}
            className="font-semibold text-teal-dark transition-colors hover:underline focus-visible:outline-teal"
          >
            Explore sample experiments
          </Link>
        </p>

        <Link
          to={routePaths.grades}
          className="inline-flex min-h-11 items-center font-semibold text-teal-dark transition-colors hover:underline focus-visible:outline-teal"
        >
          Back to Grade Selection
        </Link>
      </div>

      {/* Educational Context Note */}
      <div className="rounded-xl border border-line bg-canvas p-4 text-xs leading-relaxed text-ink/70">
        <div className="flex items-start gap-2.5">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
          <p>
            <strong className="text-navy">Curriculum Note:</strong> This is demonstration data, not
            the official Egyptian chemistry curriculum. You can change your term at any time.
          </p>
        </div>
      </div>
    </div>
  )
}
