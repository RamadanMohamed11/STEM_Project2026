export interface SafetyChecklistItem {
  id: string
  statement: string
  reviewSection: 'ppe-guide' | 'before-lab' | 'equipment-guide' | 'lab-behavior'
}

/** Acknowledgements of the draft lessons, not a test of practical competence. */
export const safetyChecklist: readonly SafetyChecklistItem[] = [
  {
    id: 'protective-equipment',
    statement: 'I will use the protective equipment chosen for the activity by my teacher.',
    reviewSection: 'ppe-guide',
  },
  {
    id: 'instructions',
    statement: 'I will read the experiment instructions and ask about anything unclear.',
    reviewSection: 'before-lab',
  },
  {
    id: 'tools',
    statement: 'I will handle laboratory tools carefully and use them as shown.',
    reviewSection: 'equipment-guide',
  },
  {
    id: 'workspace',
    statement: 'I will keep my workspace organized and exits clear.',
    reviewSection: 'before-lab',
  },
  {
    id: 'reporting',
    statement: 'I will report spills, damage and unsafe situations to my teacher.',
    reviewSection: 'lab-behavior',
  },
  {
    id: 'no-tasting',
    statement: 'I will never taste laboratory chemicals.',
    reviewSection: 'lab-behavior',
  },
]

export function getChecklistProgress(
  items: readonly SafetyChecklistItem[],
  confirmed: ReadonlySet<string>,
) {
  const total = items.length
  const count = items.filter((item) => confirmed.has(item.id)).length
  return { count, total, complete: total > 0 && count === total }
}
