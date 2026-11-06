import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { routePaths } from '@/app/paths'
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill'

interface JourneyStep {
  step: string
  title: string
  description: string
  route: string
  actionLabel: string
  status: string
  statusTone: StatusTone
  isAvailable: boolean
}

const journeySteps: JourneyStep[] = [
  {
    step: '01',
    title: 'Create an Account',
    description:
      'Set up your student profile to track completed experiments, review test scores, and save your progress across lessons.',
    route: routePaths.signUp,
    actionLabel: 'Preview Account Page',
    status: 'Coming Soon',
    statusTone: 'neutral',
    isAvailable: false,
  },
  {
    step: '02',
    title: 'Learn Laboratory Safety',
    description:
      'Review essential protective equipment (PPE), safety symbols, hazard warnings, and emergency laboratory procedures.',
    route: routePaths.safety,
    actionLabel: 'Read Safety Rules',
    status: 'Available',
    statusTone: 'ready',
    isAvailable: true,
  },
  {
    step: '03',
    title: 'Choose Grade and Term',
    description:
      'Select your secondary grade level (Grades 10–12) and current semester to find experiments matching your school curriculum.',
    route: routePaths.grades,
    actionLabel: 'Browse Curriculum',
    status: 'Coming Soon',
    statusTone: 'neutral',
    isAvailable: false,
  },
  {
    step: '04',
    title: 'Explore Chemistry Experiments',
    description:
      'Browse our catalog of interactive chemistry experiments. Read learning goals, required equipment, and reaction overviews.',
    route: routePaths.experiments,
    actionLabel: 'Explore Experiments',
    status: 'Available Demo',
    statusTone: 'ready',
    isAvailable: true,
  },
  {
    step: '05',
    title: 'Use the Virtual Laboratory',
    description:
      'Enter our full 3D simulation. Measure liquids, weigh reagents, transfer chemicals, and stir solutions with live feedback.',
    route: '/experiments/preview/lab',
    actionLabel: 'Launch 3D Lab',
    status: '3D Lab Ready',
    statusTone: 'ready',
    isAvailable: true,
  },
  {
    step: '06',
    title: 'Test Your Knowledge',
    description:
      'Complete post-experiment check-for-understanding quizzes to test what you learned and prepare for school science tests.',
    route: '/experiments/exp-salt-water-001/quiz',
    actionLabel: 'Preview Quiz',
    status: 'Coming Soon',
    statusTone: 'neutral',
    isAvailable: false,
  },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal">
            Student Journey
          </p>
          <h2
            id="how-it-works-heading"
            className="text-2xl font-bold tracking-tight text-navy sm:text-3xl"
          >
            How the Website Works
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ink/75">
          Follow these simple steps from learning basic safety to carrying out experiments in the 3D
          lab and testing your knowledge.
        </p>
      </div>

      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {journeySteps.map((step) => (
          <li
            key={step.step}
            className="flex flex-col justify-between rounded-xl border border-line bg-white p-5 shadow-card transition-all hover:border-line-strong hover:shadow-md sm:p-6"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl font-black tracking-tight text-teal">
                  {step.step}
                </span>
                <StatusPill tone={step.statusTone} dot>
                  {step.status}
                </StatusPill>
              </div>

              <h3 className="mt-4 text-base font-bold text-navy sm:text-lg">
                {step.title}
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-ink/75 sm:text-sm">
                {step.description}
              </p>
            </div>

            <div className="mt-5 border-t border-line/70 pt-3">
              <Link
                to={step.route}
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-teal-dark transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 sm:text-sm"
              >
                <span>{step.actionLabel}</span>
                {step.isAvailable ? (
                  <ArrowRight size={15} aria-hidden="true" />
                ) : (
                  <ArrowUpRight size={15} aria-hidden="true" />
                )}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
