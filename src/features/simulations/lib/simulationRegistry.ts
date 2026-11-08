import { saltExperimentDefinition } from '../data/saltExperimentDefinition.ts'
import { saltCoreExperiment } from '../data/saltCoreDefinition.ts'
import {
  validateExperimentDefinition,
  type CoreExperimentDefinition,
  type DefinitionIssue,
} from '../engine/core/index.ts'
import type { ExperimentWorkflowDefinition } from '../engine/workflowTypes.ts'
import { getLaboratoryPresentation } from './workspaceSelectors.ts'
import type { Experiment } from '../../../types/experiment.ts'

/**
 * L1 registry: experiments are registered as data. Each entry pairs the generic engine
 * definition (`core`) with the guided workflow and UI adapter currently used by the 3D lab.
 */
export interface SimulationRegistryEntry {
  core: CoreExperimentDefinition
  workflow: ExperimentWorkflowDefinition
}

/** UI adapters the 3D laboratory can render today. More are added with L2–L9. */
export const SUPPORTED_UI_ADAPTERS: readonly ExperimentWorkflowDefinition['chemistryEngine'][] = [
  'salt-dissolution',
]

const entries: readonly SimulationRegistryEntry[] = [
  { core: saltCoreExperiment, workflow: saltExperimentDefinition },
]

const registry = new Map(entries.map((entry) => [entry.core.experimentId, entry]))

/** Definition problems found at load; a registration with issues is never playable. */
export const registryIssues: ReadonlyMap<string, readonly DefinitionIssue[]> = new Map(
  entries.map((entry) => {
    const issues: DefinitionIssue[] = [...validateExperimentDefinition(entry.core)]
    if (entry.workflow.experimentId !== entry.core.experimentId)
      issues.push({
        path: 'workflow.experimentId',
        message: 'Workflow and core experiment ids differ.',
      })
    if (!SUPPORTED_UI_ADAPTERS.includes(entry.workflow.chemistryEngine))
      issues.push({ path: 'workflow.chemistryEngine', message: 'No UI adapter for this engine.' })
    return [entry.core.experimentId, issues]
  }),
)

export function getRegisteredExperimentIds() {
  return [...registry.keys()]
}

/** Register only implemented, valid definitions. A presentation alone is not a playable experiment. */
export function resolveSimulation(experiment: Experiment | undefined) {
  if (experiment?.status !== 'demo') return undefined
  const entry = registry.get(experiment.id)
  if (!entry || (registryIssues.get(experiment.id)?.length ?? 0) > 0) return undefined
  const presentation = getLaboratoryPresentation(experiment.id)
  if (!presentation || presentation.experimentId !== entry.workflow.experimentId) return undefined
  return { definition: entry.workflow, presentation, core: entry.core }
}

export type SimulationRegistration = NonNullable<ReturnType<typeof resolveSimulation>>

/** Stable compatibility alias, independent of catalog ordering or future available entries. */
export const previewExperimentId = saltExperimentDefinition.experimentId
