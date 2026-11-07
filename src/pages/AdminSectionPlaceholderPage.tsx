import { ArrowLeft, CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
import { routePaths } from '@/app/paths'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import {
  adminNavigationItems,
  type AdminSectionId,
} from '@/features/admin/config/adminNavigation'
import { computeAdminCatalogMetrics } from '@/features/admin/lib/adminMetrics'
import { sampleGrades, sampleTerms } from '@/features/curriculum/data/sampleCurriculum'

export interface AdminSectionPlaceholderPageProps {
  sectionId: Exclude<AdminSectionId, 'dashboard'>
}

export function AdminSectionPlaceholderPage({
  sectionId,
}: AdminSectionPlaceholderPageProps) {
  const section =
    adminNavigationItems.find((item) => item.id === sectionId) ?? adminNavigationItems[1]
  const Icon = section.icon
  const metrics = computeAdminCatalogMetrics()

  return (
    <div className="space-y-6 py-6 sm:py-8">
      <PageHeader
        eyebrow={section.eyebrow}
        title={section.pageTitle}
        description={section.description}
        action={
          <ButtonLink to={routePaths.admin} variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </ButtonLink>
        }
      />

      <Card padding="lg" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-teal-soft text-teal">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink">
                {section.label} Management Workspace
              </h2>
              <p className="text-xs text-ink-secondary">
                Foundation route prepared in T31 · Full workflow scheduled for{' '}
                {section.plannedTask ?? 'upcoming release'}
              </p>
            </div>
          </div>
          <StatusPill tone="neutral" dot>
            <Clock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            Scheduled Module ({section.plannedTask ?? 'Planned'})
          </StatusPill>
        </div>

        <p className="text-sm leading-relaxed text-ink-secondary">
          This protected administrative route is wired into the role-based navigation and layout
          foundation. Interactive authoring, editing, and reporting controls will be activated in{' '}
          <span className="font-semibold text-ink">{section.plannedTask ?? 'future tasks'}</span>{' '}
          without changing the URL structure or authorization boundary.
        </p>

        {section.plannedCapabilities && section.plannedCapabilities.length > 0 && (
          <div className="rounded-xl border border-line bg-surface-muted/50 p-4">
            <h3 className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
              Planned Capabilities
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {section.plannedCapabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-teal"
                    aria-hidden="true"
                  />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section-specific read-only baseline context (never fabricated) */}
        {sectionId === 'curriculum' && (
          <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-white p-3.5 text-xs">
              <span className="font-semibold text-ink-muted uppercase">Configured Grades</span>
              <p className="mt-1 text-lg font-bold text-ink">{sampleGrades.length}</p>
              <p className="mt-0.5 text-ink-secondary">
                {sampleGrades.map((g) => g.title).join(' · ')}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3.5 text-xs">
              <span className="font-semibold text-ink-muted uppercase">Configured Terms</span>
              <p className="mt-1 text-lg font-bold text-ink">{sampleTerms.length}</p>
              <p className="mt-0.5 text-ink-secondary">
                First Term and Second Term across all three secondary grades
              </p>
            </div>
          </div>
        )}

        {sectionId === 'experiments' && (
          <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-white p-3.5 text-xs">
              <span className="font-semibold text-ink-muted uppercase">Total Experiments</span>
              <p className="mt-1 text-lg font-bold text-ink">{metrics.totalExperiments ?? 0}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3.5 text-xs">
              <span className="font-semibold text-ink-muted uppercase">Published 3D Labs</span>
              <p className="mt-1 text-lg font-bold text-ink">
                {metrics.publishedExperiments ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3.5 text-xs">
              <span className="font-semibold text-ink-muted uppercase">Draft / Planned</span>
              <p className="mt-1 text-lg font-bold text-ink">{metrics.draftExperiments ?? 0}</p>
            </div>
          </div>
        )}

        {sectionId === 'questions' && (
          <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-white p-3.5 text-xs">
              <span className="font-semibold text-ink-muted uppercase">Available Assessments</span>
              <p className="mt-1 text-lg font-bold text-ink">
                {metrics.availableAssessments ?? 0} of {metrics.totalAssessmentDefinitions ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-white p-3.5 text-xs">
              <span className="font-semibold text-ink-muted uppercase">Validated Questions</span>
              <p className="mt-1 text-lg font-bold text-ink">
                {metrics.totalValidatedQuestions ?? 0}
              </p>
            </div>
          </div>
        )}

        {(sectionId === 'students' || sectionId === 'reports') && (
          <div className="flex items-start gap-3 rounded-xl border border-teal/25 bg-teal-soft/35 p-4 text-xs text-ink">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            <div>
              <p className="font-semibold">Row Level Security & Privacy Enforcement</p>
              <p className="mt-0.5 text-ink-secondary">
                No fabricated student records or synthetic reports are displayed. Live student role
                queries and aggregated progress reports operate strictly through authorized Supabase
                RLS policies.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
