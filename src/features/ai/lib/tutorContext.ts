import { clipLabState } from './aiTutorClient.ts'

export type TutorSurface =
  { surface: 'details' } | { surface: 'lab'; stageId?: string; completed?: boolean }

const detailsQuestions = [
  'What is the main idea of this experiment?',
  'Which safety precautions matter most here?',
  'What should I expect to observe?',
] as const

/** Keyed by simulation definition stage ids; unknown stages fall back to general questions. */
const labQuestions: Record<string, readonly string[]> = {
  setup: [
    'What is each tool on the bench used for?',
    'Why do I need eye protection for this experiment?',
    'What could go wrong in this experiment?',
  ],
  measurement: [
    'How do I read a graduated cylinder accurately?',
    'Why do we tare the balance before weighing?',
    'Why do measurements need to be precise?',
  ],
  procedure: [
    'Why does stirring help the solid dissolve?',
    'What is happening to the particles right now?',
    'Is this a physical or a chemical change?',
  ],
  observation: [
    'Why can’t I see the solid any more?',
    'How can I prove the substance is still there?',
    'What would happen if I added much more solid?',
  ],
  review: [
    'Can you summarize what this experiment showed?',
    'How is this used in everyday life?',
    'What mistakes could change the result?',
  ],
}

const labFallback = [
  'What should I do next?',
  'Why is this step important?',
  'What is happening in the beaker?',
] as const

export function getSuggestedQuestions(context: TutorSurface): readonly string[] {
  if (context.surface === 'details') return detailsQuestions
  if (context.completed) return labQuestions.review
  return (context.stageId && labQuestions[context.stageId]) || labFallback
}

export interface LabStateInput {
  stageTitle?: string
  stepTitle?: string
  stepNumber: number
  totalSteps: number
  completed: boolean
  placedEquipment: readonly string[]
  liquids: Readonly<Record<string, number>>
  substances: Readonly<Record<string, number>>
  measurements: Readonly<Record<string, number | null>>
}

function humanize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+(Ml|G)$/i, '')
    .trim()
    .toLowerCase()
}

function round(value: number) {
  return Math.round(value * 10) / 10
}

/** Short plain-text summary of the live lab, sent as data (never instructions) to the tutor. */
export function summarizeLabState(input: LabStateInput) {
  const parts: string[] = []
  parts.push(
    input.completed
      ? 'Experiment completed.'
      : `Step ${input.stepNumber} of ${input.totalSteps}${input.stepTitle ? `: ${input.stepTitle}` : ''}.`,
  )
  if (input.stageTitle && !input.completed) parts.push(`Stage: ${input.stageTitle}.`)
  parts.push(
    input.placedEquipment.length
      ? `On the bench: ${input.placedEquipment.join(', ')}.`
      : 'No equipment on the bench yet.',
  )
  const liquids = Object.entries(input.liquids).filter(([, ml]) => ml > 0)
  if (liquids.length)
    parts.push(`Water: ${liquids.map(([id, ml]) => `${humanize(id)} ${round(ml)} mL`).join(', ')}.`)
  const solids = Object.entries(input.substances).filter(([, g]) => g > 0)
  if (solids.length)
    parts.push(
      `Sodium chloride: ${solids.map(([id, g]) => `${humanize(id)} ${round(g)} g`).join(', ')}.`,
    )
  const recorded = Object.entries(input.measurements).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number',
  )
  if (recorded.length)
    parts.push(
      `Recorded: ${recorded
        .map(([id, value]) => `${humanize(id)} ${round(value)} ${/ml$/i.test(id) ? 'mL' : 'g'}`)
        .join(', ')}.`,
    )
  return clipLabState(parts.join(' ')) ?? ''
}
