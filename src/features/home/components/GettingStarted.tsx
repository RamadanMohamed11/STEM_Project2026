const learningJourney = [
  {
    title: 'Learn safety rules',
    description: 'Understand essential precautions before starting any experiment.',
  },
  {
    title: 'Pick an experiment',
    description: 'Choose an activity from the library for your grade and term.',
  },
  {
    title: 'Enter the 3D lab',
    description: 'Open your virtual workspace and inspect your tools in 3D.',
  },
  {
    title: 'Follow the steps',
    description: 'Work through each step using interactive tools and live feedback.',
  },
  {
    title: 'Review results',
    description: 'Check your measurements and review what you discovered.',
  },
] as const

export function GettingStarted() {
  return (
    <section aria-labelledby="journey-heading">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal">
          Getting started
        </p>
        <h2
          id="journey-heading"
          className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl"
        >
          Your path from question to conclusion.
        </h2>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink/75 sm:text-base">
          Five simple steps that guide you through an interactive science experiment.
        </p>
      </div>

      <ol className="grid overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 shadow-card">
        {learningJourney.map(({ title, description }, index) => (
          <li
            key={title}
            className="relative min-w-0 border-b border-line p-5 transition-colors hover:bg-surface-muted/30 last:border-b-0 sm:p-6 sm:odd:border-e sm:[&:nth-last-child(2)]:border-b-0 xl:min-h-[204px] xl:border-b-0 xl:border-e xl:last:border-e-0 xl:[&:nth-last-child(2)]:border-e"
          >
            <span className="text-[12px] font-bold tracking-widest text-teal">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className="ms-3 inline-block h-px w-8 align-middle bg-line-strong xl:hidden"
              aria-hidden="true"
            />
            <h3 className="mt-4 text-sm font-semibold text-navy">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/75">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
