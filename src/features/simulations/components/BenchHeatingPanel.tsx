import { useEffect } from 'react'
import { Flame, FlameKindling, Thermometer, X } from 'lucide-react'
import { getHazard } from '@/features/safety/data/hazards'
import { burnerUnder, heatSourceOf, HOT_TOUCH_C, vesselOver } from '../lib/benchHeating'
import { benchContainerType, formatMl } from '../lib/benchLiquids'
import {
  benchTemperatureC,
  benchVolumeMl,
  useBenchLiquidsStore,
} from '../state/useBenchLiquidsStore'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { instanceTypeId, resolveEquipment } from '../three/sceneConfig'

const labelOf = (id: string) => resolveEquipment(id)?.label ?? id

/** L7: light / put out a burner and see what it heats. */
export function BurnerPanel({ id }: { id: string }) {
  const lit = useBenchLiquidsStore((state) => state.lit.includes(id))
  const ids = useBenchLiquidsStore((state) => state.ids)
  const relationships = useLabSceneStore((state) => state.relationships)
  const message = useBenchLiquidsStore((state) => state.message)
  const source = heatSourceOf(id)
  const underTripod = relationships[id]?.kind === 'snapped'
  const vessel = vesselOver(id, relationships, ids)
  return (
    <div className="space-y-2.5 text-xs">
      <h3 className="text-sm font-semibold text-white">{labelOf(id)}</h3>
      <p className="flex items-center gap-1.5 text-white/75" role="status">
        <Flame size={13} aria-hidden="true" className={lit ? 'text-orange-300' : 'text-white/40'} />
        {lit ? 'Lit' : 'Off'}
        {lit && vessel && ` · heating ${labelOf(vessel)}`}
      </p>
      <button
        type="button"
        aria-pressed={lit}
        onClick={() =>
          useBenchLiquidsStore
            .getState()
            .setLit(id, !lit, useLabSceneStore.getState().relationships)
        }
        className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-white ${
          lit ? 'border border-white/25 hover:bg-white/10' : 'bg-[#c4561c] hover:bg-[#ad4b17]'
        }`}
      >
        <FlameKindling size={14} aria-hidden="true" />{' '}
        {lit ? 'Turn off' : `Light ${source?.label.toLowerCase() ?? 'burner'}`}
      </button>
      {!underTripod ? (
        <p className="text-[11px] leading-relaxed text-white/60">
          Drag it under a tripod, then put a vessel on the tripod to heat it.
        </p>
      ) : !vessel ? (
        <p className="text-[11px] leading-relaxed text-white/60">
          Place a beaker, flask or evaporating dish on the tripod above it.
        </p>
      ) : null}
      {message && <p className="text-white/60">{message}</p>}
      <p className="text-[10px] text-white/45">
        Never leave a flame unattended. Hot items cannot be picked up.
      </p>
    </div>
  )
}

/** L7: a bench vessel's contents and temperature (a thermometer reading in the model). */
export function BenchVesselInfo({ id }: { id: string }) {
  const ml = useBenchLiquidsStore((state) => benchVolumeMl(state, id))
  const temperature = useBenchLiquidsStore((state) => benchTemperatureC(state, id))
  const lit = useBenchLiquidsStore((state) => state.lit)
  const burner = useLabSceneStore((state) => burnerUnder(id, state.relationships))
  const capacity = benchContainerType(instanceTypeId(id))?.capacityMl ?? 0
  const heated = !!burner && lit.includes(burner)
  return (
    <div className="space-y-2 text-xs">
      <h3 className="text-sm font-semibold text-white">{labelOf(id)}</h3>
      <dl className="space-y-1 tabular-nums">
        <div className="flex justify-between gap-2">
          <dt className="text-white/65">Volume</dt>
          <dd>
            {formatMl(ml)} / {capacity} mL
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="flex items-center gap-1 text-white/65">
            <Thermometer size={12} aria-hidden="true" /> Temperature
          </dt>
          <dd
            className={temperature !== null && temperature >= HOT_TOUCH_C ? 'text-orange-200' : ''}
          >
            {temperature === null ? '—' : `${temperature.toFixed(1)} °C`}
          </dd>
        </div>
      </dl>
      <p className="text-[11px] leading-relaxed text-white/65">
        {heated
          ? temperature !== null && temperature >= 99.9 && ml > 0
            ? 'Boiling — the liquid is evaporating.'
            : `Heating over the ${labelOf(burner!).toLowerCase()}.`
          : burner
            ? 'Over a burner that is off. Select the burner to light it.'
            : 'Put it on a tripod over a burner to heat it. Click a second vessel to pour.'}
      </p>
    </div>
  )
}

/** L7: hot-surface warning when the student tries to handle a hot item (T41 hazard text). */
export function HotTouchWarning() {
  const hotTouch = useBenchLiquidsStore((state) => state.hotTouch)
  const seq = hotTouch?.seq
  useEffect(() => {
    if (seq === undefined) return
    const timer = window.setTimeout(() => useBenchLiquidsStore.getState().dismissHotTouch(), 7000)
    return () => window.clearTimeout(timer)
  }, [seq])
  if (!hotTouch) return null
  const hazard = getHazard('hot-surface')
  return (
    <div
      role="alert"
      className="pointer-events-auto absolute left-1/2 top-16 z-30 w-[min(92%,380px)] -translate-x-1/2 rounded-xl border border-orange-300/60 bg-[#4a1f0c]/95 p-3 text-xs text-orange-50 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Thermometer size={15} aria-hidden="true" /> {hazard?.label ?? 'Hot surface'}
        </p>
        <button
          type="button"
          aria-label="Dismiss hot surface warning"
          onClick={() => useBenchLiquidsStore.getState().dismissHotTouch()}
          className="-mr-1 -mt-1 flex size-8 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1">{hotTouch.message}</p>
      {hazard && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-orange-100/85">
          {hazard.precautions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
