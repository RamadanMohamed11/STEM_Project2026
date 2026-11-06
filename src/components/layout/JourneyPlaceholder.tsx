import { PageHeader } from './PageHeader'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { StatusPill } from '@/components/ui/StatusPill'
import { usePageTitle } from '@/hooks/usePageTitle'

interface JourneyAction {
  label: string
  to: string
  variant?: 'primary' | 'secondary'
}

interface JourneyPlaceholderProps {
  title: string
  description: string
  heading: string
  message: string
  actions: readonly JourneyAction[]
  eyebrow?: string
  pageTitle?: string
  status?: string
}

/** Shared presentation only; these pages never create student or quiz state. */
export function JourneyPlaceholder({
  title,
  description,
  heading,
  message,
  actions,
  eyebrow = 'Your learning journey',
  pageTitle = title,
  status = 'Coming soon',
}: JourneyPlaceholderProps) {
  usePageTitle(pageTitle)

  return (
    <section className="max-w-3xl">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-7 md:p-8">
        <StatusPill tone="info" dot>{status}</StatusPill>
        <h2 className="mt-4 text-xl font-semibold text-navy sm:text-2xl">{heading}</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/80 sm:text-base">{message}</p>
        <nav aria-label="Next steps" className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {actions.map(({ label, to, variant = 'primary' }) => (
            <ButtonLink key={to} to={to} variant={variant}>
              {label}
            </ButtonLink>
          ))}
        </nav>
      </div>
    </section>
  )
}
