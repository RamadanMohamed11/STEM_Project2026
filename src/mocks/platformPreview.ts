import type { LucideIcon } from 'lucide-react'
import { BookOpenCheck, BrainCircuit, FlaskConical, ShieldCheck } from 'lucide-react'

interface Capability {
  title: string
  description: string
  icon: LucideIcon
  status: string
  tone: 'ready' | 'neutral' | 'warning'
  to?: string
  linkLabel?: string
}

// Product roadmap descriptions only; no curriculum or experiment data is asserted.
export const platformCapabilities: readonly Capability[] = [
  {
    title: 'Interactive 3D Laboratory',
    description:
      'Work with real 3D tools, perform measured liquid and solid transfers, and observe chemical changes on a virtual lab bench.',
    icon: FlaskConical,
    status: 'Ready to try',
    tone: 'ready',
    to: '/experiments/preview/lab',
    linkLabel: 'Open 3D lab',
  },
  {
    title: 'Guided Experiments',
    description:
      'Follow step-by-step experiment instructions with clear guidance, safety rules, and real-time feedback.',
    icon: BookOpenCheck,
    status: 'Planned',
    tone: 'warning',
  },
  {
    title: 'Laboratory Safety',
    description:
      'Learn essential safety rules, protective equipment (PPE), and safe chemical handling before entering the lab.',
    icon: ShieldCheck,
    status: 'Available',
    tone: 'ready',
    to: '/safety',
    linkLabel: 'Read safety rules',
  },
  {
    title: 'AI-Assisted Explanations',
    description:
      'Get clear explanations and helpful hints that connect what you see in the lab with science concepts.',
    icon: BrainCircuit,
    status: 'Planned',
    tone: 'warning',
  },
]
