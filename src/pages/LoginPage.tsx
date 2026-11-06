import { routePaths } from '@/app/paths'
import { JourneyPlaceholder } from '@/components/layout/JourneyPlaceholder'

export function LoginPage() {
  return (
    <JourneyPlaceholder
      title="Login"
      description="Return to your learning journey."
      heading="Login is coming soon"
      message="Login is not available yet. You can explore the safety guide and lab without an account."
      actions={[
        { label: 'Review Safety', to: routePaths.safety },
        { label: 'Sign Up', to: routePaths.signUp, variant: 'secondary' },
      ]}
    />
  )
}
