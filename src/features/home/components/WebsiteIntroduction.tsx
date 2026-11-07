import { CheckCircle2, FlaskConical, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'
import { routePaths } from '@/app/paths'
import { ButtonLink } from '@/components/ui/ButtonLink'

export function WebsiteIntroduction() {
  return (
    <section
      aria-labelledby="intro-heading"
      className="overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
        {/* Left column: Overview narrative */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">
            <Sparkles size={13} className="text-teal" aria-hidden="true" />
            <span>About STEM Virtual Lab</span>
          </div>

          <h2
            id="intro-heading"
            className="mt-3 text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl"
          >
            Practical Chemistry Designed for Secondary School Students
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base sm:leading-relaxed">
            STEM Virtual Lab is an interactive educational platform created to help secondary school
            students master chemistry through direct practical experience. Instead of only
            memorizing formulas from a textbook, you can explore realistic 3D experiments, observe how
            substances interact, and understand the science behind every reaction step by step.
          </p>

          <div className="mt-6 space-y-4">
            <div className="group flex items-start gap-3 rounded-xl p-2.5 -mx-2.5 transition-all duration-200 hover:bg-canvas/60 hover:-translate-y-0.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal shadow-xs transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-teal group-hover:text-white">
                <GraduationCap size={18} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-navy">Built for Secondary School Science</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">
                  Designed specifically for secondary students preparing for classroom lessons, school
                  exams, and practical lab tests.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-3 rounded-xl p-2.5 -mx-2.5 transition-all duration-200 hover:bg-canvas/60 hover:-translate-y-0.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal shadow-xs transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-teal group-hover:text-white">
                <FlaskConical size={18} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-navy">Learn by Doing, Not Just Reading</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">
                  Pick up beakers, weigh chemicals on a digital balance, and stir solutions. Real
                  hands-on practice helps scientific concepts make sense.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-3 rounded-xl p-2.5 -mx-2.5 transition-all duration-200 hover:bg-canvas/60 hover:-translate-y-0.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal shadow-xs transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-teal group-hover:text-white">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-navy">Safe and Unlimited Practice</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">
                  Explore experiments freely without toxic fumes, broken glassware, or costly
                  supplies. You can make mistakes, reset anytime, and learn at your own pace.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink to={routePaths.safety} variant="secondary" size="md">
              Learn Lab Safety
            </ButtonLink>
            <ButtonLink to="/experiments/preview/lab" variant="primary" size="md">
              Try the 3D Lab
            </ButtonLink>
          </div>
        </div>

        {/* Right column: Highlights preview card */}
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-xl border border-line bg-canvas p-6 sm:p-7 shadow-xs transition-all duration-300 hover:border-teal/30 hover:shadow-md">
            {/* Ambient decorative blur */}
            <div className="pointer-events-none absolute -bottom-10 -right-10 size-44 rounded-full bg-teal-soft/70 blur-2xl animate-pulse-glow" aria-hidden="true" />

            <div className="relative mb-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal">
                At a Glance
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal-dark shadow-xs transition-all duration-200 hover:scale-105">
                Interactive Learning
              </span>
            </div>

            <h3 className="relative text-lg font-bold text-navy">
              How the Virtual Lab Helps You Learn
            </h3>

            <p className="relative mt-2 text-xs leading-relaxed text-ink/75 sm:text-sm">
              Physical school laboratories can be limited by time, equipment, and safety concerns.
              Our virtual lab gives every student equal access to high-quality science tools.
            </p>

            <ul className="relative mt-5 space-y-3 text-xs sm:text-sm">
              <li className="flex items-center gap-2.5 text-navy transition-transform duration-200 hover:translate-x-1">
                <CheckCircle2 size={16} className="shrink-0 text-teal" aria-hidden="true" />
                <span>Interactive 3D simulation with realistic physics</span>
              </li>
              <li className="flex items-center gap-2.5 text-navy transition-transform duration-200 hover:translate-x-1">
                <CheckCircle2 size={16} className="shrink-0 text-teal" aria-hidden="true" />
                <span>Guided step-by-step instructions at every stage</span>
              </li>
              <li className="flex items-center gap-2.5 text-navy transition-transform duration-200 hover:translate-x-1">
                <CheckCircle2 size={16} className="shrink-0 text-teal" aria-hidden="true" />
                <span>Immediate visual feedback on measurements</span>
              </li>
              <li className="flex items-center gap-2.5 text-navy transition-transform duration-200 hover:translate-x-1">
                <CheckCircle2 size={16} className="shrink-0 text-teal" aria-hidden="true" />
                <span>Sample chemistry content awaiting academic review</span>
              </li>
              <li className="flex items-center gap-2.5 text-navy transition-transform duration-200 hover:translate-x-1">
                <CheckCircle2 size={16} className="shrink-0 text-teal" aria-hidden="true" />
                <span>Completely safe for home and classroom use</span>
              </li>
            </ul>

            <div className="relative mt-6 rounded-lg border border-teal/20 bg-white p-3.5 text-xs text-ink/80 transition-all duration-200 hover:border-teal/40 hover:shadow-xs">
              <span className="font-semibold text-navy">Student tip:</span> You can rotate the 3D
              camera to inspect your tools and chemical containers from any angle.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
