import type { SafetySourceId } from './safetyContent'

/**
 * T43 interactive safety activities: "Get Lab Ready", emergency scenarios and a short
 * understanding check. General draft guidance only; it never replaces teacher instructions.
 */

export type GearSlot = 'coat' | 'goggles' | 'gloves' | 'shoes' | 'hair'

export interface GearItem {
  id: string
  label: string
  /** Body area the item is shown on when equipped. Wrong items have no slot. */
  slot?: GearSlot
  correct: boolean
  feedback: string
}

/** Scenario framing used by the activity so the glove choice follows a risk assessment. */
export const labReadyScenario =
  'Today’s practical uses a dilute acid. Your teacher’s risk assessment asks for a lab coat, safety goggles, protective gloves, closed shoes and tied-back hair.'

export const gearItems: readonly GearItem[] = [
  {
    id: 'lab-coat',
    label: 'Lab coat',
    slot: 'coat',
    correct: true,
    feedback: 'A fastened lab coat helps protect your skin and clothes from splashes.',
  },
  {
    id: 'safety-goggles',
    label: 'Safety goggles',
    slot: 'goggles',
    correct: true,
    feedback: 'Goggles protect your eyes. Ordinary glasses are not splash protection.',
  },
  {
    id: 'gloves',
    label: 'Protective gloves',
    slot: 'gloves',
    correct: true,
    feedback: 'The risk assessment for this practical asks for gloves, so you wear them today.',
  },
  {
    id: 'closed-shoes',
    label: 'Closed-toe shoes',
    slot: 'shoes',
    correct: true,
    feedback: 'Closed shoes protect your feet from spills and broken glass.',
  },
  {
    id: 'tied-hair',
    label: 'Tie back long hair',
    slot: 'hair',
    correct: true,
    feedback: 'Tied hair stays away from flames, chemicals and equipment.',
  },
  {
    id: 'sandals',
    label: 'Open sandals',
    correct: false,
    feedback: 'Sandals leave your feet exposed to spills and broken glass. Wear closed shoes.',
  },
  {
    id: 'snack',
    label: 'Snack and drink',
    correct: false,
    feedback: 'Food and drinks stay outside the lab. They can pick up chemicals.',
  },
  {
    id: 'jewellery',
    label: 'Dangling jewellery',
    correct: false,
    feedback: 'Dangling items can catch on equipment or fall into materials. Remove them.',
  },
]

export const requiredGearIds = gearItems.filter((item) => item.correct).map((item) => item.id)

export function getGearProgress(equipped: ReadonlySet<string>) {
  const total = requiredGearIds.length
  const count = requiredGearIds.filter((id) => equipped.has(id)).length
  return { count, total, complete: total > 0 && count === total }
}

export interface ChoiceOption {
  id: string
  text: string
}

export interface SafetyChoiceQuestion {
  id: string
  title: string
  prompt: string
  options: readonly ChoiceOption[]
  correctOptionId: string
  explanation: string
  sourceIds: readonly SafetySourceId[]
}

export const emergencyScenarios: readonly SafetyChoiceQuestion[] = [
  {
    id: 'small-fire',
    title: 'Small fire',
    prompt: 'Liquid in a beaker near your burner catches fire. What do you do first?',
    options: [
      { id: 'water', text: 'Throw water on it straight away.' },
      { id: 'alert', text: 'Step back, turn off the gas if safe, and alert your teacher.' },
      { id: 'carry', text: 'Pick up the beaker and carry it to the sink.' },
    ],
    correctOptionId: 'alert',
    explanation:
      'Move away and tell your teacher at once. Water can spread some burning liquids, and carrying a burning container can spill it.',
    sourceIds: ['acs-guidelines'],
  },
  {
    id: 'eye-splash',
    title: 'Splash in the eyes',
    prompt: 'A chemical splashes into your classmate’s eye. What is the right action?',
    options: [
      { id: 'rub', text: 'Rub the eye gently to remove the chemical.' },
      { id: 'wait', text: 'Wait to see whether it starts to hurt.' },
      {
        id: 'eyewash',
        text: 'Help them to the eyewash and tell the teacher; rinse for at least 15 minutes.',
      },
    ],
    correctOptionId: 'eyewash',
    explanation:
      'Rinse right away with plenty of clean water at the eyewash for at least 15 minutes while the teacher is informed. Never rub the eye.',
    sourceIds: ['acs-guidelines'],
  },
  {
    id: 'skin-splash',
    title: 'Chemical on skin',
    prompt: 'You spill a solution on your hand and sleeve. What should you do?',
    options: [
      { id: 'wipe', text: 'Wipe it off with a paper towel and keep working.' },
      {
        id: 'rinse',
        text: 'Rinse the skin under running water, tell your teacher, and remove the wet clothing.',
      },
      { id: 'cover', text: 'Cover it with your other sleeve so nobody notices.' },
    ],
    correctOptionId: 'rinse',
    explanation:
      'Rinse with plenty of running water, report it at once and do not keep wearing contaminated clothing.',
    sourceIds: ['acs-guidelines', 'acs-conduct'],
  },
  {
    id: 'gas-smell',
    title: 'Strange gas smell',
    prompt: 'You notice a strong, unusual smell near the gas taps. What do you do?',
    options: [
      { id: 'light', text: 'Light a match to check where it comes from.' },
      {
        id: 'move',
        text: 'Stop work, keep flames away, move back and tell your teacher.',
      },
      { id: 'sniff', text: 'Lean closer and sniff to identify the gas.' },
    ],
    correctOptionId: 'move',
    explanation:
      'Never add a flame or deliberately smell a gas. Stop, move away and let your teacher deal with it.',
    sourceIds: ['acs-guidelines', 'unsw-safety'],
  },
  {
    id: 'broken-glass',
    title: 'Broken glassware',
    prompt: 'A test tube falls and breaks on the bench. How should it be cleaned up?',
    options: [
      { id: 'hands', text: 'Collect the pieces quickly with your hands.' },
      { id: 'bin', text: 'Sweep it into the normal rubbish bin.' },
      {
        id: 'report',
        text: 'Tell your teacher; use a brush and dustpan and the broken-glass container.',
      },
    ],
    correctOptionId: 'report',
    explanation:
      'Report breakages. Never pick up broken glass with your hands; it goes into the special broken-glass container.',
    sourceIds: ['acs-conduct'],
  },
]

export const safetyCheckQuestions: readonly SafetyChoiceQuestion[] = [
  {
    id: 'check-ppe',
    title: 'Question 1',
    prompt: 'Who decides which protective equipment you need for a practical?',
    options: [
      { id: 'student', text: 'Each student chooses what feels comfortable.' },
      { id: 'teacher', text: 'Your teacher, based on the activity’s risk assessment.' },
      { id: 'always', text: 'Nobody — you always wear every item for every activity.' },
    ],
    correctOptionId: 'teacher',
    explanation: 'PPE is chosen for each activity by your teacher’s risk assessment.',
    sourceIds: ['cde-ppe'],
  },
  {
    id: 'check-taste',
    title: 'Question 2',
    prompt: 'Which of these is never allowed in the laboratory?',
    options: [
      { id: 'label', text: 'Reading the label before using a chemical.' },
      { id: 'taste', text: 'Tasting a chemical to identify it.' },
      { id: 'ask', text: 'Asking the teacher about an unclear step.' },
    ],
    correctOptionId: 'taste',
    explanation: 'Never taste laboratory chemicals, even ones that look harmless.',
    sourceIds: ['unsw-safety', 'acs-conduct'],
  },
  {
    id: 'check-accident',
    title: 'Question 3',
    prompt: 'What is the first thing to do after any spill, breakage or accident?',
    options: [
      { id: 'tell', text: 'Tell your teacher straight away.' },
      { id: 'hide', text: 'Clean it up quietly yourself.' },
      { id: 'finish', text: 'Finish the experiment first, then report it.' },
    ],
    correctOptionId: 'tell',
    explanation: 'Always report spills, damage and accidents to your teacher immediately.',
    sourceIds: ['acs-conduct'],
  },
]

export function isCorrectChoice(question: SafetyChoiceQuestion, optionId: string | undefined) {
  return optionId !== undefined && optionId === question.correctOptionId
}

/** Passing requires every question correct; safety facts are not partially credited. */
export function scoreChoices(
  questions: readonly SafetyChoiceQuestion[],
  answers: Readonly<Record<string, string | undefined>>,
) {
  const total = questions.length
  const correct = questions.filter((q) => isCorrectChoice(q, answers[q.id])).length
  const answered = questions.filter((q) => answers[q.id] !== undefined).length
  return { correct, answered, total, passed: total > 0 && correct === total }
}
