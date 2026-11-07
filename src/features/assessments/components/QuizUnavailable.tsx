import { HelpCircle } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'

interface QuizUnavailableProps {
  experimentTitle: string
  detailsPath: string
  resultsPath: string
}

export function QuizUnavailable({
  experimentTitle,
  detailsPath,
  resultsPath,
}: QuizUnavailableProps) {
  return (
    <div className="space-y-6">
      <section
        aria-labelledby="quiz-unavailable-heading"
        className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
            <HelpCircle size={22} aria-hidden="true" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
              Assessment Notice
            </span>
            <h2
              id="quiz-unavailable-heading"
              className="text-xl font-semibold text-navy sm:text-2xl"
            >
              Quiz questions are coming soon
            </h2>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate">
          Multiple-choice review questions for <strong className="text-navy">{experimentTitle}</strong> are
          currently in preparation. When the assessment is ready, you will be able to review what you
          learned after completing the experiment.
        </p>

        <div className="flex flex-wrap gap-3 border-t border-line pt-4">
          <ButtonLink to={detailsPath} variant="primary">
            Back to Experiment
          </ButtonLink>
          <ButtonLink to={resultsPath} variant="secondary">
            View Quiz Results
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}
