import type { ExperimentLearningContent } from '@/types/experiment'

/** Additional reviewed sections can be composed after these without coupling them to the engine. */
export function ExperimentLearningSections({
  content,
}: {
  content: ExperimentLearningContent | undefined
}) {
  return (
    <div className="grid gap-8 border-t border-line pt-8 lg:grid-cols-2 lg:gap-12">
      <section aria-labelledby="experiment-about-title" className="space-y-4">
        <h2 id="experiment-about-title" className="text-xl font-semibold text-navy">
          About This Experiment
        </h2>
        {content?.about.length ? (
          content.about.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-ink/80">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-sm leading-relaxed text-slate">
            An introduction for this experiment is still being reviewed.
          </p>
        )}
        {content?.modelNote && (
          <p className="border-l-2 border-teal pl-4 text-sm leading-relaxed text-slate">
            {content.modelNote}
          </p>
        )}
      </section>
      <section aria-labelledby="experiment-objectives-title" className="space-y-4">
        <h2 id="experiment-objectives-title" className="text-xl font-semibold text-navy">
          What You Will Learn
        </h2>
        {content?.reviewStatus === 'draft' && (
          <p className="rounded-lg bg-teal-soft p-4 text-sm leading-relaxed text-ink">
            <strong>Demonstration learning objectives.</strong> These are draft goals and need
            academic review.
          </p>
        )}
        {content?.objectives.length ? (
          <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-ink/80 marker:text-teal">
            {content.objectives.map((objective) => (
              <li key={objective.id}>{objective.text}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-slate">
            Learning objectives are still being reviewed.
          </p>
        )}
      </section>
    </div>
  )
}
