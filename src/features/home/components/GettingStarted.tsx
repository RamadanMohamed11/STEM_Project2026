const learningJourney = [
  {
    title: 'Review safety',
    description: 'Understand the precautions and expectations of laboratory work.',
  },
  {
    title: 'Explore experiments',
    description: 'Browse activities once course content has been approved.',
  },
  {
    title: 'Enter the lab',
    description: 'Open the workspace associated with an experiment.',
  },
  {
    title: 'Follow the method',
    description: 'Work through the instructions and record what happens.',
  },
  {
    title: 'Review results',
    description: 'Reflect on observations and connect them to scientific ideas.',
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
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
          A preview of the five stages that will guide students through a practical learning
          experience.
        </p>
      </div>

      <ol className="grid overflow-hidden rounded-xl border border-line bg-white sm:grid-cols-2 xl:grid-cols-5">
        {learningJourney.map(({ title, description }, index) => (
          <li
            key={title}
            className="relative min-w-0 border-b border-line p-5 last:border-b-0 sm:p-6 sm:odd:border-e sm:[&:nth-last-child(2)]:border-b-0 xl:min-h-[204px] xl:border-b-0 xl:border-e xl:last:border-e-0 xl:[&:nth-last-child(2)]:border-e"
          >
            <span className="text-[12px] font-bold tracking-widest text-teal">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className="ms-3 inline-block h-px w-8 align-middle bg-line-strong xl:hidden"
              aria-hidden="true"
            />
            <h3 className="mt-5 text-sm font-semibold text-navy">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
