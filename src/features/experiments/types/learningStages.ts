import type { ExperimentGuideStage, GuideStageKind, InventoryItem } from '@/types/laboratory'

/** WebVTT subtitle or caption track metadata for accessible educational videos. */
export interface EducationalVideoTrack {
  readonly id: string
  readonly src: string
  readonly srclang: string
  readonly label: string
  readonly kind?: 'captions' | 'subtitles'
  readonly default?: boolean
}

/** Source file entry for native HTML5 video playback. */
export interface EducationalVideoSource {
  readonly src: string
  readonly type?: string
}

/** Video configuration for an educational learning stage. */
export interface EducationalStageVideo {
  readonly status: 'available' | 'coming-soon'
  readonly title: string
  readonly description: string
  readonly durationLabel?: string
  readonly posterUrl?: string
  readonly sources?: readonly EducationalVideoSource[]
  readonly tracks?: readonly EducationalVideoTrack[]
}

/** Mapping to an executable 3D simulation step for conceptual reference only. */
export interface LinkedSimulationStep {
  readonly stepId: string
  readonly stepNumber: number
  readonly title: string
  readonly stageTitle: string
}

/** Prepared metadata for future instructor-reviewed or AI-assisted explanations (no live AI calls). */
export interface StageExtensionMetadata {
  readonly reviewStatus: 'draft' | 'reviewed'
  readonly illustrationKey?: string
  readonly keyConcepts: readonly string[]
  readonly futureAiPromptContext?: {
    readonly focusTopic: string
    readonly scientificGuardrails: readonly string[]
  }
}

/** Enriched educational learning stage combining base guide stage with media, tools, and step mappings. */
export interface EducationalLearningStage extends ExperimentGuideStage {
  readonly order: number
  readonly kind: GuideStageKind
  readonly categoryLabel: string
  readonly subtitle: string
  readonly summary: string
  readonly scientificExplanation: string
  readonly processClassification?:
    | 'physical-dissolution'
    | 'chemical-reaction'
    | 'measurement-technique'
  readonly processBadgeLabel?: string
  readonly relatedInventoryIds: readonly string[]
  readonly relatedItems: readonly InventoryItem[]
  readonly linkedSimulationSteps: readonly LinkedSimulationStep[]
  readonly highlights: readonly string[]
  readonly video: EducationalStageVideo
  readonly extension: StageExtensionMetadata
}

/** Complete 5-stage educational learning package for an experiment. */
export interface ExperimentLearningStagesData {
  readonly experimentId: string
  readonly experimentTitle: string
  readonly reviewStatus: 'draft' | 'reviewed'
  readonly reactionClassificationNote: string
  readonly simulationSeparationNote: string
  readonly stages: readonly EducationalLearningStage[]
}
