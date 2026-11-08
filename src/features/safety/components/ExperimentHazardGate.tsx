import { useState, type ReactNode } from 'react'
import type { Experiment } from '@/types/experiment'
import { getExperimentPaths } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { getExperimentToolsAndMaterials } from '@/features/experiments/data/experimentToolsAndMaterials'
import {
  getExperimentHazardIds,
  hazardAcknowledgementKey,
  requiresHazardAcknowledgement,
} from '../lib/experimentHazards'
import { acknowledgeHazards, useHazardAcknowledgement } from '../state/hazardAcknowledgement'
import { HazardAlert } from './HazardAlert'

export function ExperimentHazardGate({
  experiment,
  children,
}: {
  experiment: Experiment
  children: ReactNode
}) {
  const ids = getExperimentHazardIds(
    experiment,
    getExperimentToolsAndMaterials(experiment.id)?.materials,
  )
  const identity = hazardAcknowledgementKey(experiment, ids)
  const acknowledged = useHazardAcknowledgement(identity)
  const [checkedKey, setCheckedKey] = useState<string | null>(null)
  if (!requiresHazardAcknowledgement(experiment, ids) || acknowledged) return children
  const checked = checkedKey === identity
  return (
    <section
      className="h-dvh overflow-y-auto bg-canvas p-4 text-ink sm:p-8"
      aria-label="Review experiment hazards"
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-semibold text-navy">Before You Enter the Lab</h1>
        <p>{experiment.title}</p>
        <HazardAlert hazardIds={ids} />
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setCheckedKey(event.target.checked ? identity : null)}
            className="size-5 accent-teal"
          />
          I have read the safety precautions
        </label>
        <p className="text-sm">
          Confirm the statement to continue. This choice lasts only while the app is open.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!checked}
            onClick={() => {
              if (checked) acknowledgeHazards(identity)
            }}
          >
            Continue to Laboratory
          </Button>
          <ButtonLink to={getExperimentPaths(experiment.id).details} variant="secondary">
            Back to Details
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
