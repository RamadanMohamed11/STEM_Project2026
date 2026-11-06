import { routePaths } from '@/app/paths'
import { JourneyPlaceholder } from '@/components/layout/JourneyPlaceholder'

export function SignUpPage() {
  return (
    <JourneyPlaceholder
      title="Sign Up"
      description="Your learning journey starts here."
      heading="Sign-up is coming soon"
      message="You cannot create an account yet. You can still read the safety guide and explore the lab."
      actions={[
        { label: 'Review Safety', to: routePaths.safety },
        { label: 'Login', to: routePaths.login, variant: 'secondary' },
      ]}
    />
  )
}
