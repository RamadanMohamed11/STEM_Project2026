import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { StatusPill } from '@/components/ui/StatusPill'
import { platformCapabilities } from '@/mocks/platformPreview'

export function LearningFeatures() {
  return (
    <section aria-labelledby="capabilities-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal">
            The learning environment
          </p>
          <h2
            id="capabilities-heading"
            className="max-w-xl text-2xl font-semibold tracking-tight text-navy sm:text-3xl"
          >
            Built around the way science is learned.
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-ink/70">
          Each capability is marked with its current stage of development.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-2">
        {platformCapabilities.map(
          ({ title, description, status, tone, icon: Icon, to, linkLabel }) => (
            <article
              key={title}
              className="flex min-w-0 flex-col border-b border-line p-6 last:border-b-0 sm:min-h-[229px] sm:p-7 sm:odd:border-e sm:[&:nth-last-child(2)]:border-b-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-teal-soft text-teal">
                  <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <StatusPill tone={tone}>{status}</StatusPill>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/75">{description}</p>
              {to && linkLabel && (
                <Link
                  to={to}
                  className="mt-3 inline-flex min-h-10 w-fit items-center gap-1.5 text-sm font-semibold text-teal-dark hover:underline sm:mt-auto sm:pt-2"
                >
                  {linkLabel}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              )}
            </article>
          ),
        )}
      </div>
    </section>
  )
}
