import { ArrowRight, ArrowUpRight, Info } from 'lucide-react'
import { routePaths } from '@/app/paths'
import { Link } from 'react-router'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { GettingStarted } from '@/features/home/components/GettingStarted'
import { LaboratoryIllustration } from '@/features/home/components/LaboratoryIllustration'
import { LearningFeatures } from '@/features/home/components/LearningFeatures'
import { usePageTitle } from '@/hooks/usePageTitle'

export function HomePage() {
  usePageTitle('Home')

  return (
    <div className="space-y-12 pb-3 lg:space-y-14">
      <section
        aria-labelledby="home-title"
        className="overflow-hidden rounded-xl border border-line bg-white shadow-card lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]"
      >
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-13 xl:px-12 xl:py-15">
          <p className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-teal">
            <span className="h-px w-8 bg-teal" aria-hidden="true" />
            Explore / Experiment / Understand
          </p>
          <h1
            id="home-title"
            className="max-w-2xl text-4xl leading-[1.14] font-semibold tracking-[-0.035em] text-navy sm:text-5xl xl:text-[3.45rem]"
          >
            A better way to <span className="text-teal">explore science.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-[1.8] text-ink/75">
            STEM Virtual Lab brings practical science learning into one clear space. Begin with
            safety, discover how experiments are structured, and see where hands-on virtual learning
            is headed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/experiments" icon={<ArrowRight size={17} aria-hidden="true" />}>
              Explore experiments
            </ButtonLink>
            <ButtonLink to="/safety" variant="secondary">
              Review safety
            </ButtonLink>
            <ButtonLink to={routePaths.signUp} variant="secondary">
              Sign Up
            </ButtonLink>
          </div>
          <div className="mt-10 flex items-center gap-3 border-t border-line pt-5 text-xs leading-relaxed text-ink/65">
            <span className="size-2 shrink-0 rounded-full bg-teal" aria-hidden="true" />
            An early learning prototype for STEM students
          </div>
        </div>
        <LaboratoryIllustration />
      </section>

      <LearningFeatures />
      <GettingStarted />

      <aside
        aria-label="Prototype status"
        className="flex flex-wrap items-start justify-between gap-5 border-t border-line pt-7"
      >
        <div className="flex max-w-2xl gap-3">
          <Info size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-navy">Currently an educational prototype</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">
              Curriculum materials, chemical simulations, and AI explanations are being planned. A
              navigable 3D workbench with basic equipment repositioning is available now.
            </p>
          </div>
        </div>
        <Link
          to="/experiments/preview/lab"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-teal-dark hover:underline"
        >
          Explore the 3D lab <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </aside>
    </div>
  )
}
