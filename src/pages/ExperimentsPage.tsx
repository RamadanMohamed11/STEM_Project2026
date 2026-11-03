import { PageHeader } from '@/components/layout/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { ExperimentCatalog } from '@/features/experiments/components/ExperimentCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'

export function ExperimentsPage() {
  usePageTitle('Experiments')

  return (
    <div>
      <PageHeader
        eyebrow="Explore / Experiments"
        title="Experiment catalog"
        description="Browse illustrative science experiments, search by topic, and open the available laboratory preview. Curriculum associations will follow academic review."
        action={<StatusPill>DEMONSTRATION DATA</StatusPill>}
      />
      <ExperimentCatalog />
    </div>
  )
}
