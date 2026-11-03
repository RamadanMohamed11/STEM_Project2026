import { ArrowLeft, SearchX } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { usePageTitle } from '@/hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Page Not Found')

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center py-15 text-center">
      <div className="flex size-17 items-center justify-center rounded-2xl bg-teal-soft text-teal">
        <SearchX size={30} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <p className="mt-7 text-sm font-bold tracking-[0.2em] text-teal">404 / PAGE NOT FOUND</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy">
        We couldn’t find that page.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate">
        The address may have changed, or the page may not be part of this prototype yet.
      </p>
      <div className="mt-7">
        <ButtonLink to="/" icon={<ArrowLeft size={17} aria-hidden="true" />}>
          Return to overview
        </ButtonLink>
      </div>
    </section>
  )
}
