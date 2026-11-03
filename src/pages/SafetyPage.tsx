import { Info } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { SafetyOverview } from '@/features/safety/components/SafetyOverview'
import { usePageTitle } from '@/hooks/usePageTitle'

export function SafetyPage() {
  usePageTitle('Laboratory Safety')

  return (
    <div>
      <PageHeader
        eyebrow="Learn / Essential practices"
        title="Laboratory safety"
        description="Foundational habits for responsible learning in a science laboratory. Specific procedures must be verified for each activity."
        action={<StatusPill tone="ready">GENERAL GUIDANCE</StatusPill>}
      />
      <SafetyOverview />
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-line-strong bg-white p-5 text-sm text-slate">
        <Info size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
        <p className="leading-relaxed">
          These are introductory reminders, not a complete safety manual. Follow local laboratory
          policies, instructor directions, and the risk assessment for each experiment.
        </p>
      </div>
    </div>
  )
}
