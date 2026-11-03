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
    title: 'Interactive Laboratory',
    description:
      'Inspect and reposition six 3D laboratory items in a real-time chemistry workbench. Chemical experiments are planned.',
    icon: FlaskConical,
    status: '3D demo available',
    tone: 'ready',
    to: '/experiments/preview/lab',
    linkLabel: 'Explore 3D laboratory',
  },
  {
    title: 'Guided Experiments',
    description:
      'Follow approved procedures with clear materials, steps, and supporting explanations once content is reviewed.',
    icon: BookOpenCheck,
    status: 'Planned',
    tone: 'warning',
  },
  {
    title: 'Laboratory Safety',
    description:
      'Review introductory safety habits and the essential responsibilities of working in a laboratory.',
    icon: ShieldCheck,
    status: 'Overview available',
    tone: 'ready',
    to: '/safety',
    linkLabel: 'Read safety overview',
  },
  {
    title: 'AI-Assisted Learning',
    description:
      'Receive contextual explanations and help interpreting observations in a future release.',
    icon: BrainCircuit,
    status: 'Planned',
    tone: 'warning',
  },
]
