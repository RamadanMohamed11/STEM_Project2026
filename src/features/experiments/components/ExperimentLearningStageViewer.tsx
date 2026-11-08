import { useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Compass, Info } from 'lucide-react'
import { ExperimentStageNavigation } from '@/features/simulations/components/ExperimentStageNavigation'
import { getLearningStageNavigationState } from '../data/experimentLearningStages.ts'
import type { ExperimentLearningStagesData } from '../types/learningStages.ts'
import { EducationalVideoPlayer } from './EducationalVideoPlayer'
import { ToolAndMaterialVisual } from './ToolAndMaterialVisual'
import { ExplainThis } from '@/features/ai/components/ExplainThis'
import { buildExplainPrompt } from '@/features/ai/lib/tutorContext'

export interface ExperimentLearningStageViewerProps {
  data: ExperimentLearningStagesData | undefined
  initialStageIndex?: number
}

/**
 * Interactive five-stage educational viewer for understanding an experiment's
 * equipment, chemicals, procedure, measurements, and results.
 * Navigating stages is purely educational and never mutates 3D simulation progress.
 */
export function ExperimentLearningStageViewer({
  data,
  initialStageIndex = 0,
}: ExperimentLearningStageViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialStageIndex)
  const { stage, activeIndex, totalStages, progressPercent, hasPrevious, hasNext } =
    getLearningStageNavigationState(data?.stages, selectedIndex)

  return (
    <section
      aria-labelledby="experiment-learning-stages-title"
      className="space-y-6 border-t border-line pt-8"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
            Structured Walkthrough · 5 Learning Topics
          </p>
          <h2 id="experiment-learning-stages-title" className="text-xl font-semibold text-navy">
            Educational Learning Stages
          </h2>
          <p className="text-xs leading-relaxed text-slate">
            Explore the science, apparatus, measurements, and expected observations step by step.
          </p>
        </div>

        {stage && (
          <div
            className="flex items-center gap-3 self-start rounded-lg bg-canvas px-3 py-1.5 text-xs font-semibold text-navy sm:self-auto"
            aria-label="Reading position"
          >
            <span>
              Stage {activeIndex + 1} of {totalStages}
            </span>
            <span className="text-slate" aria-hidden="true">
              ·
            </span>
            <span className="text-teal-dark">{progressPercent}%</span>
          </div>
        )}
      </div>

      {!data || !stage ? (
        <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-6 text-center">
          <p className="text-sm text-slate">
            Five-stage educational explanations and demonstration videos for this planned experiment
            have not been finalized yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Separation & Reaction Classification Banner */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-teal/25 bg-teal-soft/45 p-3.5 text-xs leading-relaxed text-ink/90">
              <BookOpen size={16} className="mt-0.5 shrink-0 text-teal-dark" aria-hidden="true" />
              <p>
                <strong className="font-semibold text-navy">Scientific Classification: </strong>
                {data.reactionClassificationNote}
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/75 p-3.5 text-xs leading-relaxed text-slate">
              <Info size={16} className="mt-0.5 shrink-0 text-navy" aria-hidden="true" />
              <p>
                <strong className="font-semibold text-navy">Independent Study Guide: </strong>
                {data.simulationSeparationNote}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Sidebar: 5 Stage Navigation */}
            <aside className="space-y-4 lg:col-span-4">
              <div className="rounded-xl border border-line bg-white p-4 shadow-xs">
                <div className="mb-3 flex items-center justify-between border-b border-line/80 pb-2.5">
                  <span className="text-xs font-semibold text-navy">Five Educational Stages</span>
                  <span className="text-[11px] font-medium text-slate">Select a topic</span>
                </div>
                <ExperimentStageNavigation
                  stages={data.stages}
                  activeIndex={activeIndex}
                  onNavigate={(nextIndex) => setSelectedIndex(nextIndex)}
                />
              </div>

              {/* Linked 3D Simulation Steps Reference */}
              {stage.linkedSimulationSteps.length > 0 && (
                <div
                  className="rounded-xl border border-line bg-canvas/65 p-4"
                  aria-label="Related 3D laboratory workflow steps"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-navy">
                    <Compass size={15} className="text-teal-dark" aria-hidden="true" />
                    <span>Related 3D Workbench Steps</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate">
                    In the 3D laboratory, this educational stage connects to:
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {stage.linkedSimulationSteps.map((simStep) => (
                      <li
                        key={simStep.stepId}
                        className="flex items-center justify-between gap-2 rounded-lg border border-line/80 bg-white px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-navy">
                          Step {simStep.stepNumber}: {simStep.title}
                        </span>
                        <span className="shrink-0 rounded bg-teal-soft px-2 py-0.5 text-[10px] font-semibold text-teal-dark">
                          {simStep.stageTitle}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            {/* Main Stage Content Card */}
            <article
              aria-labelledby="active-learning-stage-title"
              className="flex flex-col justify-between space-y-6 rounded-xl border border-line bg-white p-5 shadow-xs sm:p-6 lg:col-span-8"
            >
              <div className="space-y-6">
                {/* Stage Header */}
                <header className="space-y-2 border-b border-line pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal-dark">
                      {stage.categoryLabel}
                    </span>
                    {stage.processBadgeLabel && (
                      <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-navy">
                        {stage.processBadgeLabel}
                      </span>
                    )}
                  </div>
                  <h3
                    id="active-learning-stage-title"
                    className="text-xl font-semibold tracking-tight text-navy sm:text-2xl"
                  >
                    {stage.title}
                  </h3>
                  <p className="text-xs font-medium text-slate">{stage.subtitle}</p>
                </header>

                {/* Short Explanation & Scientific Explanation */}
                <div className="space-y-3">
                  <p className="text-sm font-medium leading-relaxed text-navy">
                    {stage.introduction}
                  </p>
                  <p className="text-sm leading-relaxed text-ink/85">{stage.summary}</p>
                  <div className="rounded-xl border border-line/80 bg-canvas/55 p-4 text-xs leading-relaxed text-ink/85">
                    <strong className="font-semibold text-navy">Scientific Explanation: </strong>
                    {stage.scientificExplanation}
                  </div>
                  <ExplainThis
                    key={stage.id}
                    experimentId={data.experimentId}
                    stage={stage.title}
                    prompt={buildExplainPrompt({
                      kind: 'stage',
                      stageTitle: stage.title,
                      experimentTitle: data.experimentTitle,
                    })}
                    fallback={stage.scientificExplanation}
                  />
                </div>

                {/* Key Highlights */}
                {stage.highlights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate">
                      Key Takeaways
                    </h4>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {stage.highlights.map((item) => (
                        <li
                          key={item}
                          className="rounded-lg border border-teal/20 bg-teal-soft/30 px-3 py-2 text-xs font-medium leading-relaxed text-navy"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ordered Instructions */}
                {stage.steps.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-navy">Ordered Stage Instructions</h4>
                    <ol className="space-y-2.5">
                      {stage.steps.map((stepText, idx) => (
                        <li
                          key={stepText}
                          className="flex items-start gap-3 rounded-lg border border-line/75 bg-canvas/40 p-3 text-xs leading-relaxed text-ink/90"
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal text-[11px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">{stepText}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Relevant Tools & Materials for this Stage */}
                {stage.relatedItems.length > 0 && (
                  <div className="space-y-3 border-t border-line/80 pt-4">
                    <h4 className="text-sm font-semibold text-navy">
                      Stage Apparatus & Materials ({stage.relatedItems.length})
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {stage.relatedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-lg border border-line bg-white p-3"
                        >
                          <ToolAndMaterialVisual
                            visual={item.visual}
                            altText={`${item.title} preview`}
                            className="size-12 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-navy">
                                {item.title}
                              </span>
                              <span className="shrink-0 rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate">
                                {item.category}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supporting Scientific Note */}
                <div className="rounded-lg border-l-4 border-teal bg-teal-soft/45 p-3.5 text-xs leading-relaxed text-ink/90">
                  <strong className="font-semibold text-navy">Laboratory Note: </strong>
                  {stage.note}
                </div>

                {/* Stage Video Section */}
                <div className="border-t border-line/80 pt-4">
                  <EducationalVideoPlayer video={stage.video} stageTitle={stage.title} />
                </div>
              </div>

              {/* Previous & Next Stage Footer Controls */}
              <footer
                aria-label="Learning stage pagination"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
              >
                <button
                  type="button"
                  disabled={!hasPrevious}
                  onClick={() => setSelectedIndex((current) => Math.max(0, current - 1))}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-xs font-semibold text-navy transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Previous Stage
                </button>

                <span className="text-xs font-medium text-slate">
                  {stage.order} / {totalStages}: {stage.title}
                </span>

                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() =>
                    setSelectedIndex((current) => Math.min(totalStages - 1, current + 1))
                  }
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next Stage
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </footer>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}
