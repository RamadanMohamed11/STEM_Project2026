import { ArrowLeft, SearchX } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { usePageTitle } from '@/hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Page Not Found')

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-12 text-center sm:py-16">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-soft text-teal sm:size-18">
        <SearchX size={32} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <p className="mt-6 text-xs font-bold tracking-[0.2em] text-teal sm:text-sm">404 / PAGE NOT FOUND</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
        We couldn’t find that page.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate sm:text-base">
        The link may be outdated, or this page is not ready yet. You can always go back to the home page.
      </p>
      <div className="mt-7">
        <ButtonLink to="/" icon={<ArrowLeft size={17} aria-hidden="true" />}>
          Return to overview
        </ButtonLink>
      </div>
    </section>
  )
}
