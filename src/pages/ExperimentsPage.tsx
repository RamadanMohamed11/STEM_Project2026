import { PageHeader } from '@/components/layout/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { ExperimentCatalog } from '@/features/experiments/components/ExperimentCatalog'
import { usePageTitle } from '@/hooks/usePageTitle'

export function ExperimentsPage() {
  usePageTitle('Experiments')

  return (
    <div>
      <PageHeader
        eyebrow="Explore / Science Experiments"
        title="Experiment catalog"
        description="Browse science experiments, search by topic, and try our interactive 3D virtual laboratory."
        action={<StatusPill tone="info" dot>Sample Collection</StatusPill>}
      />
      <ExperimentCatalog />
    </div>
  )
}
