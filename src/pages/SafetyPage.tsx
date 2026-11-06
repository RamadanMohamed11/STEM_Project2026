import { PageHeader } from '@/components/layout/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { EquipmentGuideExplorer } from '@/features/safety/components/EquipmentGuideExplorer'
import { PPEGuide } from '@/features/safety/components/PPEGuide'
import {
  SafetyLessonSection,
  SafetyTipList,
} from '@/features/safety/components/SafetyLessonSection'
import { SafetyOverview } from '@/features/safety/components/SafetyOverview'
import { SafetyChecklist } from '@/features/safety/components/SafetyChecklist'
import {
  beforeLab,
  labBehavior,
  safetyReviewStatus,
  safetySources,
} from '@/features/safety/data/safetyContent'
import { usePageTitle } from '@/hooks/usePageTitle'

export function SafetyPage() {
  usePageTitle('Laboratory Safety')

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Safety / Best Practices"
        title="Laboratory safety"
        description="Essential safety rules for working in a science lab. Always read the instructions carefully before starting an experiment."
        action={
          <StatusPill tone="ready" dot>
            General Safety Rules
          </StatusPill>
        }
      />
      <nav aria-label="Safety topics" className="mb-9 flex flex-wrap gap-2 text-sm">
        {[
          ['why-safety', 'Why safety matters'],
          ['ppe-guide', 'Protective equipment'],
          ['before-lab', 'Before you start'],
          ['lab-behavior', 'In the lab'],
          ['equipment-guide', 'Equipment safety'],
          ['safety-checklist', 'Safety checklist'],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 font-medium text-teal-dark hover:border-teal focus-visible:outline-teal"
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="space-y-10 sm:space-y-14">
        <SafetyLessonSection
          id="why-safety"
          number="01"
          title="Why safety matters"
          introduction="Safety habits help protect you and the people around you. Following each step helps avoid unexpected reactions. Before you start, ask what could go wrong and how to reduce the risk."
        >
          <SafetyOverview />
        </SafetyLessonSection>
        <SafetyLessonSection
          id="ppe-guide"
          number="02"
          title="Your protective equipment"
          introduction="Your teacher’s risk assessment checks what could cause harm in this activity. It guides the choice of PPE. Equipment must fit the task and the person; gloves are not needed for every activity."
        >
          <PPEGuide />
        </SafetyLessonSection>
        <SafetyLessonSection
          id="before-lab"
          number="03"
          title="Before entering the laboratory"
          introduction="Prepare before handling any tools or materials. If you are unsure, stop and ask your teacher."
        >
          <SafetyTipList items={beforeLab} />
        </SafetyLessonSection>
        <SafetyLessonSection
          id="lab-behavior"
          number="04"
          title="Good habits in the lab"
          introduction="Work calmly, pay attention and look out for others. These habits matter during setup, experiments and cleanup."
        >
          <SafetyTipList items={labBehavior} />
        </SafetyLessonSection>
        <SafetyLessonSection
          id="equipment-guide"
          number="05"
          title="Laboratory equipment safety guide"
          introduction="Learn about common chemistry tools, how they are used, and safe handling practices to prevent accidents and protect equipment."
        >
          <EquipmentGuideExplorer />
        </SafetyLessonSection>
      </div>
      <aside
        aria-labelledby="safety-scope"
        className="mt-10 border-t border-line pt-6 text-sm leading-relaxed text-slate"
      >
        <h2 id="safety-scope" className="font-semibold text-navy">
          General guidance, not experiment instructions
        </h2>
        <p className="mt-2">
          Always follow your school lab rules, teacher instructions, and the safety steps for each
          experiment. A virtual activity does not replace supervised practical training.
        </p>
        <p className="mt-2">
          <span className="font-semibold text-navy">{safetyReviewStatus}.</span> This learning guide
          needs academic review before use as official school or university guidance.
        </p>
        <details className="mt-4">
          <summary className="w-fit cursor-pointer py-2 font-semibold text-teal-dark focus-visible:outline-teal">
            Safety references
          </summary>
          <ul className="mt-2 space-y-2">
            {safetySources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  className="inline-block py-1 text-teal-dark underline underline-offset-4 focus-visible:outline-teal"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </aside>
      <SafetyChecklist />
    </div>
  )
}
