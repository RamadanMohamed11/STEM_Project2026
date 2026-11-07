import { ArrowRight, ArrowUpRight, CheckCircle2, FlaskConical, Info, Sparkles } from 'lucide-react'
import { routePaths } from '@/app/paths'
import { Link } from 'react-router'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ChemistryHeroBanner } from '@/features/home/components/ChemistryHeroBanner'
import { EverydayChemistry } from '@/features/home/components/EverydayChemistry'
import { HowItWorks } from '@/features/home/components/HowItWorks'
import { WebsiteIntroduction } from '@/features/home/components/WebsiteIntroduction'
import { WhyExperimentsMatter } from '@/features/home/components/WhyExperimentsMatter'
import { usePageTitle } from '@/hooks/usePageTitle'

export function HomePage() {
  usePageTitle('Home')

  return (
    <div className="space-y-10 pb-3 sm:space-y-12 lg:space-y-14">
      {/* Hero Section */}
      <section
        aria-labelledby="home-title"
        className="overflow-hidden rounded-2xl border border-line bg-white shadow-card lg:grid lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.94fr)]"
      >
        <div className="flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 xl:px-12 xl:py-14">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-teal/20 bg-teal-soft/80 px-3.5 py-1 text-xs font-semibold text-teal-dark sm:mb-5 animate-subtle-float">
            <Sparkles size={13} className="text-teal" aria-hidden="true" />
            <span>Welcome to STEM Virtual Lab</span>
          </div>

          <h1
            id="home-title"
            className="max-w-2xl text-3xl font-bold leading-[1.16] tracking-[-0.03em] text-navy sm:text-4xl md:text-5xl xl:text-[3.25rem]"
          >
            Discover Chemistry <span className="text-teal">Through Experiments</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80 sm:mt-5 sm:text-base sm:leading-[1.75]">
            Explore chemistry in a new way. Learn how experiments work, use lab tools in a 3D
            environment, and understand science step by step.
          </p>

          {/* Quick feature highlights for students */}
          <ul className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-navy sm:gap-3">
            <li className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1.5 transition-all duration-200 hover:border-teal/30 hover:bg-white hover:shadow-xs">
              <CheckCircle2 size={14} className="text-teal" aria-hidden="true" />
              <span>Full 3D Virtual Lab</span>
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1.5 transition-all duration-200 hover:border-teal/30 hover:bg-white hover:shadow-xs">
              <CheckCircle2 size={14} className="text-teal" aria-hidden="true" />
              <span>Step-by-Step Guidance</span>
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1.5 transition-all duration-200 hover:border-teal/30 hover:bg-white hover:shadow-xs">
              <CheckCircle2 size={14} className="text-teal" aria-hidden="true" />
              <span>Safe Chemical Practice</span>
            </li>
          </ul>

          {/* Call to action buttons */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <ButtonLink
              to={routePaths.signUp}
              size="lg"
              icon={<ArrowRight size={18} aria-hidden="true" />}
            >
              Get Started
            </ButtonLink>
            <ButtonLink
              to={routePaths.experiments}
              variant="secondary"
              size="lg"
              icon={<FlaskConical size={18} className="text-teal" aria-hidden="true" />}
            >
              Explore Experiments
            </ButtonLink>
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-line pt-4 text-xs leading-relaxed text-ink/70">
            <span className="size-2 shrink-0 rounded-full bg-teal animate-pulse-glow" aria-hidden="true" />
            <span>Interactive science education for secondary school students</span>
          </div>
        </div>

        {/* Chemistry-themed Visual Banner */}
        <ChemistryHeroBanner />
      </section>

      {/* Educational Section 1: Website Introduction */}
      <WebsiteIntroduction />

      {/* Educational Section 2: Chemistry in Everyday Life */}
      <EverydayChemistry />

      {/* Educational Section 3: Why Practical Experiments Matter */}
      <WhyExperimentsMatter />

      {/* Educational Section 4: How the Website Works (6-step student journey) */}
      <HowItWorks />

      <aside
        aria-label="Prototype status"
        className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-7"
      >
        <div className="flex max-w-2xl gap-3">
          <Info size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-navy">Interactive Learning in Progress</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/75">
              Explore our working 3D chemistry lab today. New grade levels, school terms, and quizzes
              are being added step by step.
            </p>
          </div>
        </div>
        <Link
          to="/experiments/preview/lab"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-teal-dark transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2"
        >
          Explore the 3D lab <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </aside>
    </div>
  )
}
