import { Atom } from 'lucide-react'
import { useBenchLiquidsStore } from '../state/useBenchLiquidsStore'
import { hasParticleView } from '../state/useParticleScene'
import { useParticleViewStore } from '../state/useParticleViewStore'

/** L10: opens (or closes) the particle view for a container. */
export function ParticleViewButton({ id }: { id: string }) {
  const benchIds = useBenchLiquidsStore((state) => state.ids)
  const open = useParticleViewStore((state) => state.containerId === id)
  if (!hasParticleView(id, benchIds)) return null
  return (
    <button
      type="button"
      aria-pressed={open}
      onClick={() => {
        const view = useParticleViewStore.getState()
        if (open) view.close()
        else view.open(id)
      }}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#6b8cae]/50 px-3 py-1.5 text-xs font-semibold text-[#cde1f2] hover:bg-[#6b8cae]/15"
    >
      <Atom size={13} aria-hidden="true" /> {open ? 'Hide particle view' : 'Particle view'}
    </button>
  )
}
