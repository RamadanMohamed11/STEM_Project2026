import { routePaths } from '@/app/paths'
import { JourneyPlaceholder } from '@/components/layout/JourneyPlaceholder'

export function ChooseTermPage() {
  return (
    <JourneyPlaceholder
      title="Choose Your Term"
      description="Find experiments for your school term."
      heading="Term choices are coming soon"
      message="Term choices are not available yet. You can explore the sample experiments without choosing a term."
      actions={[
        { label: 'Explore Experiments', to: routePaths.experiments },
        { label: 'Choose Your Grade', to: routePaths.grades, variant: 'secondary' },
      ]}
    />
  )
}
