import { routePaths } from '@/app/paths'
import { JourneyPlaceholder } from '@/components/layout/JourneyPlaceholder'

export function ChooseGradePage() {
  return (
    <JourneyPlaceholder
      title="Choose Your Grade"
      description="Find science activities for your grade."
      heading="Grade choices are coming soon"
      message="Grade choices are not available yet. You can keep exploring without choosing a grade."
      actions={[
        { label: 'Continue to Terms', to: routePaths.terms },
        { label: 'Review Safety', to: routePaths.safety, variant: 'secondary' },
      ]}
    />
  )
}
