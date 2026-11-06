import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { routePaths } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { safetyChecklist, getChecklistProgress } from '../data/safetyChecklist'

function SafetyAcknowledgement({ complete }: { complete: boolean }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <p role="status" className="font-semibold text-teal-dark">
        {complete
          ? 'All statements confirmed. You can continue.'
          : 'Confirm each statement before continuing from this checklist.'}
      </p>
      <p className="text-slate">
        This is your acknowledgement, not proof of practical lab skills or a safety certificate.
      </p>
      <p className="text-slate">
        Your choices stay only while this page is open. They are not saved to your account.
      </p>
    </div>
  )
}

export function SafetyChecklist() {
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(() => new Set())
  const [attempted, setAttempted] = useState(false)
  const navigate = useNavigate()
  const prefix = useId()
  const { count, total, complete } = getChecklistProgress(safetyChecklist, confirmed)
  const errorId = `${prefix}-error`

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!complete) {
      setAttempted(true)
      event.currentTarget
        .querySelector<HTMLInputElement>('input[type="checkbox"]:not(:checked)')
        ?.focus()
      return
    }
    navigate(routePaths.grades)
  }

  return (
    <section
      id="safety-checklist"
      aria-labelledby={`${prefix}-title`}
      className="mt-10 scroll-mt-24 rounded-xl border border-line bg-white p-5 shadow-card sm:p-7"
    >
      <h2 id={`${prefix}-title`} className="text-xl font-semibold text-navy sm:text-2xl">
        Safety Checklist
      </h2>
      <p id={`${prefix}-help`} className="mt-2 text-sm leading-relaxed text-slate">
        Read the safety guide first. Check each statement when you have read and understood it.
      </p>
      <form noValidate onSubmit={submit} className="mt-6">
        <fieldset aria-describedby={`${prefix}-help${attempted && !complete ? ` ${errorId}` : ''}`}>
          <legend className="mb-4 text-base font-semibold text-navy">Before You Continue</legend>
          <div className="mb-5">
            <p
              id={`${prefix}-progress`}
              role="status"
              className="mb-2 text-sm font-medium text-teal-dark"
            >
              {count} of {total} confirmed
            </p>
            <progress
              aria-labelledby={`${prefix}-progress`}
              value={count}
              max={total}
              className="block h-2 w-full overflow-hidden rounded-full accent-teal"
            />
          </div>
          {attempted && !complete && (
            <p id={errorId} role="alert" className="mb-4 text-sm font-medium text-danger">
              Please confirm the remaining {total - count}{' '}
              {total - count === 1 ? 'statement' : 'statements'} before continuing.
            </p>
          )}
          <ul className="space-y-3">
            {safetyChecklist.map((item) => (
              <li key={item.id} className="rounded-lg border border-line p-3 sm:p-4">
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
                  <input
                    type="checkbox"
                    name={item.id}
                    checked={confirmed.has(item.id)}
                    aria-describedby={
                      attempted && !complete && !confirmed.has(item.id) ? errorId : undefined
                    }
                    onChange={(event) => {
                      const checked = event.target.checked
                      setConfirmed((previous) => {
                        const next = new Set(previous)
                        if (checked) next.add(item.id)
                        else next.delete(item.id)
                        return next
                      })
                    }}
                    className="mt-0.5 size-5 shrink-0 cursor-pointer accent-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                  />
                  <span>{item.statement}</span>
                </label>
                <a
                  href={`#${item.reviewSection}`}
                  aria-label={`Review safety rules: ${item.statement}`}
                  className="ml-8 inline-flex min-h-11 items-center text-sm font-semibold text-teal-dark underline underline-offset-4 focus-visible:outline-teal"
                >
                  Review Safety Rules
                </a>
              </li>
            ))}
          </ul>
        </fieldset>
        <div className="mt-6 border-t border-line pt-5">
          <SafetyAcknowledgement complete={complete} />
        </div>
        <Button
          type="submit"
          icon={<ArrowRight size={17} aria-hidden="true" />}
          className="mt-5 w-full sm:w-auto"
        >
          Continue to Grade Selection
        </Button>
      </form>
    </section>
  )
}
