import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Droplets,
  Expand,
  FlaskConical,
  HelpCircle,
  Layers3,
  Minimize2,
  RotateCcw,
  Scale,
  Sparkles,
  X,
} from 'lucide-react'
import { Link } from 'react-router'
import { LaboratoryCanvas } from './LaboratoryCanvas'
import { PairInteractionPanel } from './PairInteractionPanel'
import { HotTouchWarning } from './BenchHeatingPanel'
import { MeasurementAutoRecorder, MeasurementLogPanel } from './MeasurementLog'
import { ParticleViewPanel } from './ParticleViewPanel'
import { ParticleViewButton } from './ParticleViewButton'
import { LabOptionsMenu } from './LabOptionsMenu'
import { useMeasurementLogStore } from '../state/useMeasurementLogStore'
import { useLabSafetyStore } from '../state/useLabSafetyStore'
import {
  GogglesToggle,
  GuidedMistakeRecorder,
  GuidedWorkflowNotice,
  LabModeToggle,
  SafetyAlertToast,
} from './LabSafetyPanels'
import { MaterialTransferController } from '../three/MaterialTransferController'
import { BenchLiquidsController } from '../three/BenchLiquidsController'
import { ContextualInstruction } from './ContextualInstruction'
import { LabInventoryPanel } from './LabInventoryPanel'
import { AccessibleBenchControls, BenchDescription } from './AccessibleBenchControls'
import { BenchToolbar } from './BenchToolbar'
import { ExperimentGuide } from './ExperimentGuide'
import { ExperimentResults } from './ExperimentResults'
import { undissolvedSaltG } from '../engine/saltExperiment'
import { semanticEventLabels } from '../lib/semanticFeedback'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { restartExperimentSession, suspendLaboratoryInteractions } from '../state/sessionActions'
import { sessionLifetimeMessage } from '../state/simulationSession'
import type { SimulationRegistration } from '../lib/simulationRegistry'
import { getExperimentPaths } from '@/app/paths'
import type { Experiment } from '@/types/experiment'
import { LaboratoryHazards } from '@/features/safety/components/LaboratoryHazards'
import { AiTutorPanel } from '@/features/ai/components/AiTutorPanel'
import { getSuggestedQuestions, summarizeLabState } from '@/features/ai/lib/tutorContext'
import { getExperimentSessionSnapshot } from '../state/sessionSelectors'

export function LaboratoryLayout({
  experiment,
  simulation,
}: {
  experiment: Experiment
  simulation: SimulationRegistration
}) {
  const { definition, presentation } = simulation
  const paths = getExperimentPaths(experiment.id)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [tutorOpen, setTutorOpen] = useState(false)
  const [measurementsExpanded, setMeasurementsExpanded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const resetRevision = useSaltSimulationStore((state) => state.resetRevision)
  const workflow = useSaltSimulationStore((state) => state.workflow)
  const chemistry = useSaltSimulationStore((state) => state.experiment)
  const effect = useSaltSimulationStore((state) => state.effect)
  const livePour = useSaltSimulationStore((state) => state.livePour)
  const transferActive = useSaltSimulationStore((state) => state.transfer !== null)
  const validation = useSaltSimulationStore((state) => state.validation)
  const guidedResumeIssue = useSaltSimulationStore((state) => state.guidedResumeIssue)
  const latestSemanticEvent = useSaltSimulationStore(
    (state) => state.events[state.events.length - 1]?.type ?? null,
  )
  const stopEffect = useSaltSimulationStore((state) => state.stopEffect)
  const placedIds = useLabSceneStore((state) => state.placedIds)
  const placement = useLabSceneStore((state) => state.placement)
  const selectedId = useLabSceneStore((state) => state.selectedId)
  const boatOnBalance = useLabSceneStore(
    (state) => state.relationships['weighing-boat']?.targetId === 'digital-balance',
  )
  const select = useLabSceneStore((state) => state.select)
  const beginPlacement = useLabSceneStore((state) => state.beginPlacement)
  const cancelPlacement = useLabSceneStore((state) => state.cancelPlacement)
  const resetCamera = useLabSceneStore((state) => state.resetCamera)
  const validatedSteps = workflow.completed ? definition.steps.length : workflow.stepIndex
  const progress = Math.round((validatedSteps / definition.steps.length) * 100)
  useEffect(() => () => suspendLaboratoryInteractions(), [])
  // L8/L9: one measurement log and one mistakes record per experiment session.
  useEffect(() => {
    useMeasurementLogStore.getState().begin(definition.experimentId, Date.now())
    useLabSafetyStore.getState().begin(definition.experimentId)
  }, [definition.experimentId])
  const logOpen = useMeasurementLogStore((state) => state.open)
  const logCount = useMeasurementLogStore((state) => state.rows.length)
  const mode = useLabSafetyStore((state) => state.mode)
  const guided = mode === 'guided'

  // Effects are presentation-only. Stopping an animation cannot validate or
  // advance a scientific step: only state-verified semantic events can.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (effect) stopEffect(effect.id)
    }, effect?.durationMs ?? 0)
    return () => window.clearTimeout(timer)
  }, [effect, stopEffect])

  useEffect(() => {
    const handler = () => setFullscreen(document.fullscreenElement === viewportRef.current)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await viewportRef.current?.requestFullscreen()
    } catch {
      setHelpOpen(true)
    }
  }

  const onRestart = () => {
    restartExperimentSession()
    setGuideOpen(false)
    setHelpOpen(false)
    setMeasurementsExpanded(false)
  }

  const onInventoryClick = (id: string) => {
    if (useSaltSimulationStore.getState().transfer) return
    if (placedIds.includes(id)) {
      select(id)
      return
    }
    if (placement?.id === id) {
      cancelPlacement()
      return
    }
    beginPlacement(id)
  }

  const tutorStage = definition.stages[workflow.stageIndex]
  // Read lazily at send time so the tutor sees the latest bench state.
  const getTutorLabState = () => {
    const snapshot = getExperimentSessionSnapshot()
    const titleOf = (id: string) =>
      presentation.inventory.find((item) => item.id === id)?.title ?? id
    return summarizeLabState({
      stageTitle: definition.stages[snapshot.currentStageIndex]?.title,
      stepTitle: definition.steps[snapshot.currentStepIndex]?.title,
      stepNumber: Math.min(snapshot.currentStepIndex + 1, definition.steps.length),
      totalSteps: definition.steps.length,
      completed: snapshot.experimentCompleted,
      placedEquipment: snapshot.equipmentInstances
        .filter((item) => item.placed)
        .map((item) => titleOf(item.id)),
      liquids: snapshot.containers,
      substances: snapshot.substances,
      measurements: snapshot.measurements,
    })
  }

  return (
    <div
      ref={viewportRef}
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#071d29] text-white"
      aria-label="Immersive laboratory workspace"
      data-lab-workspace
    >
      <LaboratoryHazards experiment={experiment} workflow={workflow} />
      <header className="relative z-[25] flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#071d29] px-3 sm:z-30 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to={paths.details}
            aria-label="Back to Details"
            title="Back to Details"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/80 hover:bg-white/10"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-[#55d6c4]">
              STEM Virtual Lab · Live simulation
            </p>
            <h1 className="truncate text-sm font-semibold sm:text-base">{experiment.title}</h1>
          </div>
        </div>
        {guided ? (
          <div
            className="hidden w-[min(23vw,270px)] flex-col gap-1.5 lg:flex"
            aria-label="Experiment progress"
          >
            <div className="flex justify-between text-[10px] font-semibold text-white/70">
              <span>
                Validated steps {validatedSteps} / {definition.steps.length}
              </span>
              <span>{progress}% validated</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#31c7b3] transition-[width]"
                style={{ width: progress + '%' }}
              />
            </div>
          </div>
        ) : (
          <p className="hidden text-[11px] font-semibold text-white/70 lg:block">
            Free mode · no steps — safety rules still apply
          </p>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex">
            <LabModeToggle />
            <GogglesToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              setInventoryOpen(!inventoryOpen)
              setGuideOpen(false)
              setHelpOpen(false)
              setTutorOpen(false)
            }}
            title="Toggle equipment inventory"
            aria-label="Toggle equipment inventory"
            aria-expanded={inventoryOpen}
            className="flex size-11 items-center justify-center rounded-xl text-white/85 hover:bg-white/10 sm:size-10"
          >
            <Layers3 size={19} />
          </button>
          <button
            type="button"
            onClick={() => {
              setGuideOpen(!guideOpen)
              setInventoryOpen(false)
              setHelpOpen(false)
              setTutorOpen(false)
            }}
            title="Experiment guide and scientific reference"
            aria-label="Experiment guide"
            aria-expanded={guideOpen}
            className="hidden size-10 items-center justify-center rounded-xl text-white/85 hover:bg-white/10 sm:flex"
          >
            <BookOpen size={19} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTutorOpen(!tutorOpen)
              setGuideOpen(false)
              setInventoryOpen(false)
              setHelpOpen(false)
            }}
            title="Ask the AI tutor"
            aria-label="Ask the AI tutor"
            aria-expanded={tutorOpen}
            aria-controls="lab-ai-tutor"
            className="hidden size-10 items-center justify-center rounded-xl text-white/85 hover:bg-white/10 sm:flex"
          >
            <Sparkles size={19} />
          </button>
          <button
            type="button"
            onClick={resetCamera}
            title="Reset camera"
            aria-label="Reset camera"
            className="hidden size-10 items-center justify-center rounded-xl text-white/85 hover:bg-white/10 sm:flex"
          >
            <RotateCcw size={19} />
          </button>
          <button
            type="button"
            onClick={() => {
              setHelpOpen(!helpOpen)
              setGuideOpen(false)
              setInventoryOpen(false)
              setTutorOpen(false)
            }}
            title="Help"
            aria-label="Help"
            className="hidden size-10 items-center justify-center rounded-xl text-white/85 hover:bg-white/10 sm:flex"
          >
            <HelpCircle size={19} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="hidden size-10 items-center justify-center rounded-xl text-white/85 hover:bg-white/10 sm:flex"
          >
            {fullscreen ? <Minimize2 size={19} /> : <Expand size={19} />}
          </button>
          <button
            type="button"
            onClick={onRestart}
            title="Restart experiment"
            aria-label="Restart experiment"
            className="hidden size-10 items-center justify-center rounded-xl border border-white/15 text-white/85 hover:bg-white/10 sm:flex"
          >
            <RotateCcw size={19} />
          </button>
          <LabOptionsMenu
            open={optionsOpen}
            onOpenChange={setOptionsOpen}
            controls={
              <>
                <LabModeToggle touch />
                <GogglesToggle touch />
                {selectedId && <ParticleViewButton id={selectedId} />}
              </>
            }
            actions={[
              {
                id: 'guide',
                label: 'Experiment guide',
                icon: <BookOpen size={18} />,
                expanded: guideOpen,
                onSelect: () => {
                  setGuideOpen(!guideOpen)
                  setInventoryOpen(false)
                  setHelpOpen(false)
                  setTutorOpen(false)
                },
              },
              {
                id: 'tutor',
                label: 'Ask the AI tutor',
                icon: <Sparkles size={18} />,
                expanded: tutorOpen,
                onSelect: () => {
                  setTutorOpen(!tutorOpen)
                  setGuideOpen(false)
                  setInventoryOpen(false)
                  setHelpOpen(false)
                },
              },
              {
                id: 'data-log',
                label: `${logOpen ? 'Close' : 'Open'} data log (${logCount} measurements)`,
                icon: <ClipboardList size={18} />,
                pressed: logOpen,
                onSelect: () => useMeasurementLogStore.getState().setOpen(!logOpen),
              },
              {
                id: 'help',
                label: 'Help',
                icon: <HelpCircle size={18} />,
                expanded: helpOpen,
                onSelect: () => {
                  setHelpOpen(!helpOpen)
                  setGuideOpen(false)
                  setInventoryOpen(false)
                  setTutorOpen(false)
                },
              },
              {
                id: 'camera',
                label: 'Reset camera',
                icon: <RotateCcw size={18} />,
                onSelect: resetCamera,
              },
              {
                id: 'fullscreen',
                label: fullscreen ? 'Exit fullscreen' : 'Enter fullscreen',
                icon: fullscreen ? <Minimize2 size={18} /> : <Expand size={18} />,
                onSelect: toggleFullscreen,
              },
              {
                id: 'restart',
                label: 'Restart experiment',
                icon: <RotateCcw size={18} />,
                onSelect: onRestart,
              },
            ]}
          />
        </div>
      </header>

      <GuidedWorkflowNotice onReset={onRestart} />

      <div className="relative min-h-0 flex-1">
        <MaterialTransferController />
        <BenchLiquidsController />
        <LaboratoryCanvas />
        <PairInteractionPanel inventoryOpen={inventoryOpen || helpOpen} />
        <HotTouchWarning />
        <SafetyAlertToast />
        <ParticleViewPanel />
        <GuidedMistakeRecorder />
        <MeasurementLogPanel />
        <MeasurementAutoRecorder />

        {/* Collapsible inventory is overlaid, not stacked under the scene. */}
        <LabInventoryPanel
          open={inventoryOpen}
          items={presentation.inventory}
          core={simulation.core}
          mode={mode}
          placedIds={placedIds}
          selectedId={selectedId}
          placingId={placement?.id ?? null}
          disabled={transferActive}
          onItemClick={onInventoryClick}
          onAddToBench={(typeId) => useLabSceneStore.getState().addToBench(typeId)}
          onCollapse={() => setInventoryOpen(false)}
        />
        {!inventoryOpen && (
          <button
            type="button"
            onClick={() => setInventoryOpen(true)}
            className="absolute left-3 top-4 z-20 flex items-center gap-1.5 rounded-xl border border-white/25 bg-[#082a37]/90 px-3 py-2 text-xs font-semibold text-white shadow-lg sm:left-4"
          >
            <ChevronRight size={15} /> Inventory
          </button>
        )}

        <div
          className={`pointer-events-none absolute right-3 top-3 z-10 flex w-[min(185px,43vw)] flex-col gap-2 sm:right-4 sm:top-4 sm:w-[195px] ${helpOpen ? 'max-sm:hidden' : ''}`}
        >
          <div
            className="pointer-events-auto rounded-xl border border-white/25 bg-[#071d29]/88 p-2.5 shadow-xl backdrop-blur-md"
            aria-label="Live measurements"
          >
            <button
              type="button"
              onClick={() => setMeasurementsExpanded((open) => !open)}
              aria-label={measurementsExpanded ? 'Collapse measurements' : 'Expand measurements'}
              aria-expanded={measurementsExpanded}
              className="mb-2 flex w-full items-center justify-between gap-2 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-[#68d5c4]"
            >
              <span>Live measurements</span>
              {measurementsExpanded ? (
                <ChevronLeft size={13} className="-rotate-90" />
              ) : (
                <ChevronRight size={13} className="rotate-90" />
              )}
            </button>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px]">
              <div>
                <dt className="flex items-center gap-1 text-white/60">
                  <Droplets size={12} /> Beaker
                </dt>
                <dd className="mt-0.5 text-sm font-bold tabular-nums">
                  {chemistry.waterMl.beaker} mL
                </dd>
              </div>
              <div>
                <dt className="text-white/60">Cylinder</dt>
                <dd className="mt-0.5 text-sm font-bold tabular-nums">
                  {chemistry.waterMl['graduated-cylinder']} mL
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-white/60">
                  <Scale size={12} /> NaCl added
                </dt>
                <dd className="mt-0.5 text-sm font-bold tabular-nums">
                  {chemistry.saltInBeakerG} g
                </dd>
              </div>
              <div>
                <dt className="text-white/60">Solid remains</dt>
                <dd className="mt-0.5 text-sm font-bold tabular-nums">
                  {undissolvedSaltG(chemistry)} g
                </dd>
              </div>
              {measurementsExpanded && (
                <div>
                  <dt className="text-white/60">Spatula</dt>
                  <dd className="mt-0.5 text-sm font-bold tabular-nums">
                    {chemistry.saltOnSpatulaG} g
                  </dd>
                </div>
              )}
              {measurementsExpanded && (
                <div>
                  <dt className="text-white/60">Boat</dt>
                  <dd className="mt-0.5 text-sm font-bold tabular-nums">
                    {chemistry.saltOnBoatG} g
                  </dd>
                </div>
              )}
            </dl>
            {measurementsExpanded && (
              <p className="mt-2 border-t border-white/15 pt-2 text-[10px] text-white/65">
                Balance:{' '}
                {boatOnBalance ? `${chemistry.saltOnBoatG.toFixed(1)} g (tared)` : '— (no boat)'} ·
                recorded {workflow.measurements.saltG ?? '—'} g · modelled values
              </p>
            )}
            {measurementsExpanded && (
              <p className="mt-1 text-[10px] font-medium text-[#8ddfcb]" aria-live="polite">
                {latestSemanticEvent
                  ? `Verified · ${semanticEventLabels[latestSemanticEvent]}`
                  : 'Awaiting verified physical action'}
              </p>
            )}
          </div>
          {livePour && (
            <p
              role="status"
              className="rounded-lg bg-[#073845]/90 px-3 py-2 text-[11px] font-semibold text-[#b2f3e4]"
            >
              Flowing: {livePour.sourceId} → {livePour.targetId} · straighten or move away to stop
            </p>
          )}
          {effect && (
            <p
              role="status"
              className="rounded-lg bg-[#073845]/90 px-3 py-2 text-[11px] font-semibold text-[#b2f3e4]"
            >
              Visualizing {effect.kind.replaceAll('-', ' ')}…
            </p>
          )}
        </div>

        {guided && !guidedResumeIssue && (
          <ContextualInstruction
            key={resetRevision}
            inventoryOpen={inventoryOpen}
            presentation={presentation}
          />
        )}
        <BenchToolbar />
        <BenchDescription />
        {!optionsOpen &&
          !inventoryOpen &&
          !guideOpen &&
          !helpOpen &&
          !tutorOpen &&
          !workflow.completed && <AccessibleBenchControls />}

        {guideOpen && (
          <aside
            aria-label="Scientific instructions"
            className="absolute inset-y-3 right-3 z-30 w-[min(350px,calc(100vw-24px))] overflow-y-auto overscroll-contain rounded-xl bg-white text-[#102b3a] shadow-2xl sm:inset-y-4 sm:right-4"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dce6e7] bg-white px-3 py-2">
              <span className="text-xs font-bold">Detailed scientific guide</span>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="Close guide"
                className="rounded-md p-2 hover:bg-[#e8efef]"
              >
                <X size={17} />
              </button>
            </div>
            <ExperimentGuide
              definition={definition}
              workflow={workflow}
              experiment={chemistry}
              placedIds={placedIds}
              items={presentation.inventory}
              referenceStages={presentation.stages}
              validation={validation}
            />
          </aside>
        )}

        {/* Kept mounted while hidden so the conversation survives closing the panel. */}
        <aside
          id="lab-ai-tutor"
          aria-label="AI tutor"
          hidden={!tutorOpen}
          className="absolute inset-y-3 right-3 z-30 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl bg-white text-[#102b3a] shadow-2xl sm:inset-y-4 sm:right-4"
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-[#dce6e7] bg-white px-3 py-2">
              <span className="text-xs font-bold">AI tutor</span>
              <button
                type="button"
                onClick={() => setTutorOpen(false)}
                aria-label="Close AI tutor"
                className="rounded-md p-2 hover:bg-[#e8efef]"
              >
                <X size={17} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <AiTutorPanel
                variant="overlay"
                experimentId={experiment.id}
                experimentTitle={experiment.title}
                stage={tutorStage?.title}
                suggestions={getSuggestedQuestions({
                  surface: 'lab',
                  stageId: tutorStage?.id,
                  completed: workflow.completed,
                })}
                getLabState={getTutorLabState}
              />
            </div>
          </div>
        </aside>

        {helpOpen && (
          <div className="absolute left-3 top-16 z-40 w-[min(340px,calc(100vw-24px))] sm:left-4">
            <section
              aria-label="Laboratory controls help"
              className="max-h-[min(76dvh,520px)] overflow-y-auto overscroll-contain rounded-xl border border-[#cee7e4] bg-white/97 p-3 text-[#102b3a] shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Selection & direct manipulation</h2>
                <button
                  onClick={() => setHelpOpen(false)}
                  aria-label="Close help"
                  className="rounded-md p-2 hover:bg-[#e9f3f2]"
                >
                  <X size={18} />
                </button>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed">
                <li>
                  <strong>Click, then click a second object:</strong> select a pair. Ctrl / Command
                  + click is optional. Click a selected object again to deselect it.
                </li>
                <li>
                  <strong>Object interaction:</strong> choose a source → receiver direction, type a
                  quantity and confirm. Transfers position and return equipment automatically; no
                  tilt gesture is needed.
                </li>
                <li>
                  <strong>Salt:</strong> select jar + spatula to scoop a precise mass, then spatula
                  + boat to deposit it. Drag the loaded boat beside the balance pan to record its
                  modelled net mass.
                </li>
                <li>
                  <strong>Weighed boat + beaker:</strong> select both to transfer measured solids in
                  the contextual panel. Sources and receivers need not be positioned precisely.
                </li>
                <li>
                  <strong>Drag stirring rod inside beaker:</strong> make repeated circular strokes,
                  not stationary movements. The water ripple follows the controlled movement.
                </li>
                <li>
                  <strong>Drag from inventory:</strong> drop onto a clear space on the workbench.
                </li>
                <li>
                  <strong>Empty-space drag:</strong> left-drag rotates camera; right-drag pans;
                  wheel zooms.
                </li>
                <li>
                  <strong>Drag apparatus:</strong> hold and move more than 5 pixels to grab; release
                  to place. Esc cancels a grab, selection, placement or transfer. Material already
                  delivered is retained. Reset camera and Restart experiment are in the toolbar.
                </li>
              </ul>
              <p className="mt-3 rounded-lg bg-[#e7f7f4] p-2 text-[11px] leading-relaxed">
                The simulator conserves modelled quantities. The tared digital balance display is
                derived from the actual virtual mass deposited in the boat; no calibrated hardware
                or computational fluid dynamics are simulated.
              </p>
              <p className="mt-3 text-xs leading-relaxed">
                {sessionLifetimeMessage} Leaving the lab stops active movements and keeps material
                already transferred. The camera returns to its starting view when you return.
              </p>
            </section>
          </div>
        )}

        {workflow.completed && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#031521]/75 p-3 sm:p-6">
            <div className="max-h-full w-full max-w-[870px] overflow-y-auto overscroll-contain rounded-2xl text-[#102b3a] shadow-2xl">
              <nav
                aria-label="Completed experiment navigation"
                className="flex flex-wrap gap-4 bg-white px-5 py-3 text-sm font-semibold text-teal-dark"
              >
                <Link
                  className="inline-flex min-h-11 items-center rounded px-1 hover:underline focus-visible:outline-teal"
                  to={paths.details}
                >
                  Back to Details
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center rounded px-1 hover:underline focus-visible:outline-teal"
                  to={paths.experimentResults}
                >
                  View Results
                </Link>
              </nav>
              <ExperimentResults
                definition={definition}
                experiment={chemistry}
                workflow={workflow}
                onRestart={onRestart}
              />
            </div>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 z-10 hidden items-center gap-1.5 text-[10px] font-medium text-[#092733]/55 sm:flex">
        <FlaskConical size={12} /> Independent educational simulation · physical dissolution
      </div>
    </div>
  )
}
