import { Atom, X } from 'lucide-react'
import { useParticleScene } from '../state/useParticleScene'
import { useParticleViewStore } from '../state/useParticleViewStore'
import { resolveEquipment } from '../three/sceneConfig'

/** L10: zoomed particle view of the selected container, driven by the engine state. */
export function ParticleViewPanel() {
  const containerId = useParticleViewStore((state) => state.containerId)
  const setSurface = useParticleViewStore((state) => state.setSurface)
  const scene = useParticleScene(containerId)
  if (!containerId) return null
  const label = resolveEquipment(containerId)?.label ?? containerId
  return (
    <section
      aria-label={`Particle view of ${label}`}
      className="pointer-events-auto absolute bottom-16 right-3 z-20 max-h-[calc(100%-5rem)] w-[min(92vw,300px)] overflow-y-auto overscroll-contain rounded-2xl border border-white/20 bg-[#0d1b2a]/95 p-3 text-white shadow-2xl backdrop-blur-xl"
    >
      <header className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a8c5e0]">
          <Atom size={13} aria-hidden="true" /> Particle view · {label}
        </h2>
        <button
          type="button"
          aria-label="Close particle view"
          onClick={() => useParticleViewStore.getState().close()}
          className="flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </header>
      {!scene ? (
        <p className="text-xs text-white/65">This item holds no chemicals to show.</p>
      ) : (
        <>
          <div
            className="aspect-square w-full overflow-hidden rounded-xl border border-white/15"
            aria-hidden="true"
          >
            <canvas ref={setSurface} className="block size-full" />
          </div>
          <p
            role="status"
            aria-live="polite"
            className="mt-2 text-[11px] leading-relaxed text-white/80"
          >
            {scene.description}
          </p>
          <ul className="mt-2 space-y-1 text-[11px]" aria-label="Particle legend">
            {scene.species.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block size-3 shrink-0 rounded-full"
                  style={{ background: s.color, opacity: s.role === 'solvent' ? 0.6 : 1 }}
                />
                <span className="font-semibold">{s.formula}</span>
                <span className="truncate text-white/60">{s.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-white/60">
                  {s.role === 'solvent'
                    ? 'sample'
                    : [
                        s.bound && `${s.bound} in solid`,
                        s.free && `${s.free} free`,
                        s.gas && `${s.gas} gas`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] leading-relaxed text-white/45">
            Not to scale: the solvent is a small sample; dissolved particles keep their ratio. Speed
            follows the temperature ({Math.round(scene.temperatureC)} °C).
          </p>
        </>
      )}
    </section>
  )
}
