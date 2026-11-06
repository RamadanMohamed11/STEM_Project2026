import { BookOpen, Sparkles, type LucideIcon } from 'lucide-react'

export interface TermCardDetail {
  slug: string
  subtitle: string
  period: string
  description: string
  topics: readonly string[]
  icon: LucideIcon
}

export const termDetailsBySlug: Record<string, TermCardDetail> = {
  'first-term': {
    slug: 'first-term',
    subtitle: 'Semester 1 · Autumn / Winter',
    period: 'Term 1',
    description:
      'Core foundations of chemistry, laboratory apparatus, matter, solutions, and quantitative chemical calculations.',
    topics: ['Chemistry & Measurement', 'Matter & Solutions', 'Chemical Calculations', 'Acids & Bases'],
    icon: BookOpen,
  },
  'second-term': {
    slug: 'second-term',
    subtitle: 'Semester 2 · Spring',
    period: 'Term 2',
    description:
      'Advanced study of energy changes, reaction rates, chemical equilibrium, and specialized chemistry branches.',
    topics: ['Thermochemistry & Heat', 'Chemical Equilibrium', 'Electrochemistry', 'Organic Reactions'],
    icon: Sparkles,
  },
}
