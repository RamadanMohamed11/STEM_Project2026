import { Eye, FlaskConical, Globe, Lightbulb, Wrench } from 'lucide-react'

interface BenefitItem {
  id: string
  title: string
  icon: typeof Lightbulb
  iconTone: string
  focusBadge: string
  description: string
  studentTakeaway: string
}

const benefits: BenefitItem[] = [
  {
    id: 'understand-ideas',
    title: 'Understand Scientific Ideas',
    icon: Lightbulb,
    iconTone: 'bg-warning-soft text-warning-dark',
    focusBadge: 'From Abstract to Concrete',
    description:
      'Chemical equations and definitions can feel difficult to memorize from a page. When you carry out an experiment, you see scientific laws in action. This turns abstract concepts into clear, unforgettable understanding.',
    studentTakeaway: 'You remember what you see and do much better than what you only read.',
  },
  {
    id: 'see-changes',
    title: 'See How Materials Change',
    icon: Eye,
    iconTone: 'bg-teal-soft text-teal-dark',
    focusBadge: 'Observable Evidence',
    description:
      'Observe how materials change and compare your observations with measurements. Dissolving salt is a physical change: the salt is still present in the water. A visible change alone does not prove that a new substance has formed.',
    studentTakeaway: 'Learn to make accurate scientific observations with your own senses.',
  },
  {
    id: 'master-tools',
    title: 'Learn Laboratory Tools',
    icon: Wrench,
    iconTone: 'bg-teal-soft text-teal',
    focusBadge: 'Practical Skills',
    description:
      'Learn how to measure liquid volumes with graduated cylinders, weigh solids with digital precision balances, transfer reagents with spatulas, and stir solutions properly. Practice builds muscle memory and lab confidence.',
    studentTakeaway: 'Master standard laboratory equipment before stepping into a real school lab.',
  },
  {
    id: 'real-world-connection',
    title: 'Connect Lessons to Real Situations',
    icon: Globe,
    iconTone: 'bg-surface-muted text-navy',
    focusBadge: 'Classroom to Life',
    description:
      'Every classroom topic connects to real problems in our world—such as clean drinking water, medical treatments, renewable energy, and environmental protection. Science becomes meaningful when you see how it impacts life.',
    studentTakeaway: 'Discover how the chemistry you study in school shapes real technology and health.',
  },
]

export function WhyExperimentsMatter() {
  return (
    <section
      aria-labelledby="why-experiments-heading"
      className="overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8 lg:p-10 animate-section-enter"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:pb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal-soft px-3 py-0.5 text-xs font-semibold text-teal-dark">
            <FlaskConical size={13} className="text-teal" aria-hidden="true" />
            <span>Practical Learning</span>
          </div>
          <h2
            id="why-experiments-heading"
            className="mt-2.5 text-2xl font-bold tracking-tight text-navy sm:text-3xl"
          >
            Why Practical Experiments Matter
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ink/75 sm:text-base">
          Science is not just a collection of facts to memorize—it is a method of asking questions,
          testing ideas, and discovering how our world works.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:gap-8">
        {benefits.map((item, index) => {
          const Icon = item.icon
          const staggerClass = `stagger-${(index % 4) + 1}`
          return (
            <div
              key={item.id}
              className={`group flex flex-col justify-between rounded-xl border border-line bg-canvas/60 p-5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-teal/40 hover:bg-white hover:shadow-lg sm:p-6 animate-card-reveal ${staggerClass}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex size-11 items-center justify-center rounded-xl shadow-xs transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 ${item.iconTone}`}
                  >
                    <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate transition-colors duration-200 group-hover:border-teal/30 group-hover:bg-teal-soft/60 group-hover:text-teal-dark">
                    {item.focusBadge}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-navy transition-colors duration-200 group-hover:text-teal-dark">{item.title}</h3>

                <p className="mt-2 text-sm leading-relaxed text-ink/80">{item.description}</p>
              </div>

              <div className="mt-4 border-t border-line/70 pt-3">
                <p className="text-xs font-medium text-teal-dark">
                  <span className="font-semibold text-navy">Why it matters: </span>
                  {item.studentTakeaway}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
