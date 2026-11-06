import { Atom, GraduationCap, Layers, type LucideIcon } from 'lucide-react'
import type { Grade } from '../../../types/curriculum.ts'

export interface GradeCardDetail {
  id: Grade['id']
  levelBadge: string
  subtitle: string
  description: string
  topics: readonly string[]
  icon: LucideIcon
}

export const gradeDetailsMap: Record<string, Omit<GradeCardDetail, 'id'>> = {
  'grade-secondary-1': {
    levelBadge: 'Grade 10',
    subtitle: 'Matter & Solutions',
    description:
      'Learn fundamental chemical principles, solution preparation, concentration, and laboratory measurement techniques.',
    topics: ['Chemical calculations', 'Solutions & colloids', 'Acids & bases', 'Measurement'],
    icon: Atom,
  },
  'grade-secondary-2': {
    levelBadge: 'Grade 11',
    subtitle: 'Atomic Structure & Bonding',
    description:
      'Explore electronic structure, quantum numbers, periodic table trends, and chemical bonds.',
    topics: ['Quantum numbers', 'Periodic trends', 'Ionic & covalent bonds', 'Main group elements'],
    icon: Layers,
  },
  'grade-secondary-3': {
    levelBadge: 'Grade 12',
    subtitle: 'Advanced & Organic Chemistry',
    description:
      'Master transition elements, chemical equilibrium, electrochemistry, and organic reaction mechanisms.',
    topics: ['Transition metals', 'Chemical equilibrium', 'Electrochemistry', 'Organic chemistry'],
    icon: GraduationCap,
  },
}
