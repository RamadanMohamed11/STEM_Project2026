import type { Experiment } from '@/types/experiment'
import type { WorkflowState } from '@/features/simulations/engine/workflowTypes'
import { getContextualSafetyState } from '@/features/simulations/lib/contextualSafety'
import { ContextualSafetyAlert } from '@/features/simulations/components/SafetyNotice'
import { getExperimentToolsAndMaterials } from '@/features/experiments/data/experimentToolsAndMaterials'
import { getExperimentHazardIds } from '../lib/experimentHazards'
import { HazardAlert } from './HazardAlert'

export function LaboratoryHazards({
  experiment,
  workflow,
}: {
  experiment: Experiment
  workflow: WorkflowState
}) {
  const ids = getExperimentHazardIds(
    experiment,
    getExperimentToolsAndMaterials(experiment.id)?.materials,
  )
  if (!ids.length) return null
  const contextual = getContextualSafetyState({ experiment, workflow }).stepPrecaution
  return (
    <aside
      aria-label="Laboratory hazard warnings"
      className="absolute left-3 right-3 top-16 z-30 max-h-[30dvh] overflow-y-auto rounded-xl sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2"
    >
      <HazardAlert hazardIds={ids} dismissible />
      {contextual?.id.startsWith('hazards-') && (
        <ContextualSafetyAlert notice={contextual} compact />
      )}
    </aside>
  )
}
