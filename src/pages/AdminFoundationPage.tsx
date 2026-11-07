import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  FlaskConical,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { routePaths } from '@/app/paths'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { adminNavigationItems } from '@/features/admin/config/adminNavigation'
import {
  computeAdminCatalogMetrics,
  fetchAuthorizedStudentCount,
  type AdminCatalogMetrics,
  type AdminStudentCountState,
} from '@/features/admin/lib/adminMetrics'
import { assessmentCatalog } from '@/features/assessments/data/assessmentCatalog'
import { useAuth } from '@/features/auth/authContext'
import { demoCatalog } from '@/features/experiments/data/mockExperiments'
import { resolveSimulation } from '@/features/simulations/lib/simulationRegistry'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface AdminFoundationPageProps {
  catalogMetricsOverride?: AdminCatalogMetrics
  studentCountOverride?: AdminStudentCountState
}

const defaultUnavailableStudentCount: AdminStudentCountState = {
  status: 'unavailable',
  count: null,
  message:
    'Live student directory count requires an active Supabase database query.',
}

export function AdminFoundationPage({
  catalogMetricsOverride,
  studentCountOverride,
}: AdminFoundationPageProps = {}) {
  const { state } = useAuth()

  const catalogMetrics = useMemo(
    () => catalogMetricsOverride ?? computeAdminCatalogMetrics(),
    [catalogMetricsOverride],
  )

  const [fetchedStudentCount, setFetchedStudentCount] =
    useState<AdminStudentCountState>(defaultUnavailableStudentCount)

  useEffect(() => {
    if (studentCountOverride) return
    const client = getSupabaseClient()
    if (!client) return
    let active = true
    void fetchAuthorizedStudentCount(client, state).then((result) => {
      if (active) {
        setFetchedStudentCount(result)
      }
    })
    return () => {
      active = false
    }
  }, [state, studentCountOverride])

  const studentCount = studentCountOverride ?? fetchedStudentCount
  const managementSections = adminNavigationItems.filter((item) => item.id !== 'dashboard')

  return (
    <div className="space-y-8 py-6 sm:py-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Admin"
        description="Overview of laboratory experiments, post-experiment assessments, curriculum structure, and role-based governance."
        action={
          <ButtonLink to={routePaths.home} variant="secondary" size="sm">
            Back to Home
          </ButtonLink>
        }
      />

      {/* Key Metrics Overview (5 Required Cards — No Fabricated Statistics) */}
      <section aria-label="Dashboard overview statistics" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">Platform Overview</h2>
          <span className="text-xs text-ink-secondary">
            Real metrics derived from authorized catalog definitions and database records
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Total Students */}
          <Card padding="md" className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
              <span>Total Students</span>
              <Users className="h-4 w-4 text-teal" aria-hidden="true" />
            </div>
            {studentCount.status === 'available' || studentCount.status === 'empty' ? (
              <div>
                <p className="text-2xl font-extrabold text-ink">{studentCount.count}</p>
                <p className="mt-1 text-xs text-ink-secondary">{studentCount.message}</p>
              </div>
            ) : studentCount.status === 'loading' ? (
              <div>
                <p className="text-lg font-bold text-ink-secondary">Loading…</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Querying authorized student role assignments…
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-ink-secondary">Unavailable</p>
                <p className="mt-1 text-xs text-ink-secondary">{studentCount.message}</p>
              </div>
            )}
          </Card>

          {/* 2. Total Experiments */}
          <Card padding="md" className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
              <span>Total Experiments</span>
              <FlaskConical className="h-4 w-4 text-teal" aria-hidden="true" />
            </div>
            {catalogMetrics.totalExperiments !== null ? (
              <div>
                <p className="text-2xl font-extrabold text-ink">
                  {catalogMetrics.totalExperiments}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">
                  {catalogMetrics.totalExperiments === 0
                    ? 'No experiments registered in catalog yet.'
                    : 'Registered chemistry experiments in repository catalog.'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-ink-secondary">Unavailable</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Experiment catalog source is currently unavailable.
                </p>
              </div>
            )}
          </Card>

          {/* 3. Published Experiments */}
          <Card padding="md" className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
              <span>Published Experiments</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            {catalogMetrics.publishedExperiments !== null ? (
              <div>
                <p className="text-2xl font-extrabold text-ink">
                  {catalogMetrics.publishedExperiments}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Interactive 3D laboratories ready for student execution.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-ink-secondary">Unavailable</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Published experiment count is unavailable.
                </p>
              </div>
            )}
          </Card>

          {/* 4. Draft Experiments */}
          <Card padding="md" className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
              <span>Draft Experiments</span>
              <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
            </div>
            {catalogMetrics.draftExperiments !== null ? (
              <div>
                <p className="text-2xl font-extrabold text-ink">
                  {catalogMetrics.draftExperiments}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Planned or draft experiments pending 3D workbench completion.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-ink-secondary">Unavailable</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Draft experiment count is unavailable.
                </p>
              </div>
            )}
          </Card>

          {/* 5. Available Assessments */}
          <Card padding="md" className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
              <span>Available Assessments</span>
              <ClipboardCheck className="h-4 w-4 text-teal" aria-hidden="true" />
            </div>
            {catalogMetrics.availableAssessments !== null ? (
              <div>
                <p className="text-2xl font-extrabold text-ink">
                  {catalogMetrics.availableAssessments}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">
                  {catalogMetrics.totalValidatedQuestions ?? 0} validated MCQ questions across{' '}
                  {catalogMetrics.totalAssessmentDefinitions ?? 0} assessment definitions.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-ink-secondary">Unavailable</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Assessment catalog data is unavailable.
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Management Sections Directory */}
      <section aria-labelledby="admin-modules-heading" className="space-y-4">
        <div>
          <h2 id="admin-modules-heading" className="text-base font-bold text-ink">
            Management Sections
          </h2>
          <p className="text-sm text-ink-secondary">
            Navigate to dedicated administrative workspaces for curriculum, experiments, questions,
            students, and reports.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managementSections.map((section) => {
            const Icon = section.icon
            return (
              <Card
                key={section.id}
                padding="md"
                className="flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-teal-soft text-teal">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-ink">{section.label}</h3>
                        <p className="text-xs font-medium text-ink-muted">{section.eyebrow}</p>
                      </div>
                    </div>
                    <StatusPill tone="neutral">
                      Planned {section.plannedTask ? `(${section.plannedTask})` : ''}
                    </StatusPill>
                  </div>

                  <p className="text-sm leading-relaxed text-ink-secondary">
                    {section.description}
                  </p>
                </div>

                <div className="flex items-center justify-end border-t border-line pt-3">
                  <ButtonLink to={section.to} variant="secondary" size="sm">
                    <span>Open {section.label}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </ButtonLink>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Current Repository Catalog & Assessment Readiness Snapshot */}
      <section aria-labelledby="catalog-readiness-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="catalog-readiness-heading" className="text-base font-bold text-ink">
              Experiment & Assessment Readiness
            </h2>
            <p className="text-sm text-ink-secondary">
              Read-only status of current experiments and linked post-experiment assessments.
            </p>
          </div>
          <ButtonLink to={routePaths.adminExperiments} variant="secondary" size="sm">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            View Experiments Section
          </ButtonLink>
        </div>

        <Card padding="md" className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-semibold tracking-wider text-ink-muted uppercase">
                <th className="pb-3 pr-4">Experiment</th>
                <th className="pb-3 px-4">3D Lab Status</th>
                <th className="pb-3 px-4">Learning Content</th>
                <th className="pb-3 pl-4">Assessment Bank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {demoCatalog.experiments.map((exp) => {
                const isExecutable = exp.status === 'demo' && Boolean(resolveSimulation(exp))
                const assessment = assessmentCatalog.find((a) => a.experimentId === exp.id)
                const questionCount = assessment?.questions.length ?? 0
                return (
                  <tr key={exp.id} className="align-middle">
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-ink">{exp.title}</p>
                      <p className="font-mono text-xs text-ink-muted">{exp.id}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {isExecutable ? (
                        <StatusPill tone="ready" dot>
                          Published (3D Demo)
                        </StatusPill>
                      ) : (
                        <StatusPill tone="neutral" dot>
                          Draft / Planned
                        </StatusPill>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink-secondary">
                      {exp.learning?.reviewStatus === 'reviewed'
                        ? 'Reviewed'
                        : 'Draft learning stages'}
                    </td>
                    <td className="py-3.5 pl-4 text-xs text-ink-secondary">
                      {questionCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                          <FileText className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                          {questionCount} validated questions
                        </span>
                      ) : (
                        <span>Coming soon (0 questions)</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Verified Administrator Session & Permissions Summary (T30 Authorization Contract) */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft text-teal">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Verified Administrator Session</h2>
              <p className="text-xs text-ink-secondary">
                Account: {state.user?.email ?? state.user?.id ?? 'Verified Admin'}
              </p>
            </div>
          </div>
          <StatusPill tone="ready" dot>
            Role: {state.role ?? 'admin'}
          </StatusPill>
        </div>

        <p className="text-sm leading-relaxed text-ink-secondary">
          Your administrative role has been verified against the database role assignment policy.
          All administrative operations are protected by PostgreSQL Row Level Security and audited
          stored procedures.
        </p>

        <div className="rounded-xl border border-line bg-surface-muted/50 p-4">
          <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            Granted Permissions
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-md border border-line bg-white px-2.5 py-1 font-mono text-xs font-medium text-ink"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
