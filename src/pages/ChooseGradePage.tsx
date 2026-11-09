import { useState } from 'react'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { routePaths } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { useAuth } from '@/features/auth/authContext'
import { GradeSelectionGrid } from '@/features/curriculum/components/GradeSelectionGrid'
import { sampleGrades } from '@/features/curriculum/data/sampleCurriculum'
import {
  getGradeById,
  getStoredGradeId,
  setStoredGradeId,
} from '@/features/curriculum/state/gradeSelection'
import { getOwnStudentProfile } from '@/features/profile/profile'
import { usePageTitle } from '@/hooks/usePageTitle'

export function ChooseGradePage() {
  usePageTitle('Choose Your Grade')
  const navigate = useNavigate()
  const { auth, state: authState } = useAuth()
  const profile = getOwnStudentProfile(authState)

  // Explicit user selection overrides profile or stored grade
  const [userSelectedGradeId, setUserSelectedGradeId] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // Compute the effective selected grade
  const selectedGradeId =
    userSelectedGradeId ??
    (profile?.grade && sampleGrades.some((g) => g.id === profile.grade)
      ? profile.grade
      : getStoredGradeId())

  const selectedGrade = getGradeById(selectedGradeId)

  function handleSelectGrade(gradeId: string) {
    setUserSelectedGradeId(gradeId)
    setStoredGradeId(gradeId)
  }

  async function handleContinue() {
    if (!selectedGradeId) return

    setStoredGradeId(selectedGradeId)

    // If authenticated, persist the grade selection to student profile
    if (profile && profile.grade !== selectedGradeId) {
      setSavingProfile(true)
      try {
        await auth.updateProfile(profile.full_name, selectedGradeId)
      } catch {
        // Non-blocking: student can still proceed to term selection even if network fails
      } finally {
        setSavingProfile(false)
      }
    }

    navigate(routePaths.terms)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">
            STEM Virtual Lab · Curriculum
          </p>
          <StatusPill tone="info" dot>
            Curriculum preview · Term details coming soon
          </StatusPill>
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Choose Your Grade
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/75 sm:text-base">
          Select your school grade to find the right chemistry experiments. You can change your
          selection at any time.
        </p>
      </div>

      {/* Selected Grade Feedback Banner */}
      {selectedGrade && (
        <div
          role="status"
          className="animate-slide-in-right flex items-center gap-3 rounded-xl border border-teal/20 bg-teal-soft/80 p-4 text-xs text-teal-dark shadow-xs sm:text-sm"
        >
          <CheckCircle2 size={18} className="shrink-0 text-teal animate-scale-in" aria-hidden="true" />
          <span>
            You have selected <strong className="text-navy">{selectedGrade.title}</strong>. Click
            below to continue to your academic terms.
          </span>
        </div>
      )}

      {/* 3-Grade Options Grid */}
      <section aria-label="Available grades">
        <GradeSelectionGrid
          grades={sampleGrades}
          selectedGradeId={selectedGradeId}
          onSelectGrade={handleSelectGrade}
        />
      </section>

      {/* Action Footer & Navigation */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:p-7">
        <div>
          <p className="text-sm font-semibold text-navy">
            {selectedGrade ? `Ready to explore ${selectedGrade.title}` : 'Please choose a grade'}
          </p>
          <p className="mt-0.5 text-xs text-slate">
            {selectedGrade
              ? 'Proceed to view first and second term topics for this grade.'
              : 'Select one of the three secondary grades above to continue.'}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {selectedGradeId ? (
            <Button
              type="button"
              size="lg"
              disabled={savingProfile}
              onClick={handleContinue}
              icon={<ArrowRight size={18} aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              {savingProfile ? 'Saving...' : 'Continue to Term Selection'}
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              size="lg"
              icon={<ArrowRight size={18} aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              Continue to Term Selection
            </Button>
          )}
        </div>
      </div>

      {/* Secondary Helper Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-xs text-slate">
        <p>
          Looking for a specific term?{' '}
          <Link
            to={routePaths.terms}
            className="inline-flex min-h-11 items-center font-semibold text-teal-dark transition-colors hover:underline focus-visible:outline-teal"
          >
            Browse all terms directly
          </Link>
        </p>

        <Link
          to={routePaths.safety}
          className="inline-flex min-h-11 items-center font-semibold text-teal-dark transition-colors hover:underline focus-visible:outline-teal"
        >
          Review Laboratory Safety
        </Link>
      </div>

      {/* Educational Context Note */}
      <div className="rounded-xl border border-line bg-canvas p-4 text-xs leading-relaxed text-ink/70">
        <div className="flex items-start gap-2.5">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
          <p>
            <strong className="text-navy">Flexible Learning:</strong> You are not locked into one
            grade. Students can freely switch grades and revisit earlier laboratory activities
            whenever needed.
          </p>
        </div>
      </div>
    </div>
  )
}
