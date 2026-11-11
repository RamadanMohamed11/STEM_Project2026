import { useId, useState } from 'react'
import { ArrowLeftRight, Droplet, Droplets, RotateCcw } from 'lucide-react'
import { benchContainerType, canPourFrom, DROP_ML, formatMl } from '../lib/benchLiquids'
import {
  benchPh,
  benchTemperatureC,
  benchVolumeMl,
  useBenchLiquidsStore,
} from '../state/useBenchLiquidsStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import { instanceTypeId, resolveEquipment } from '../three/sceneConfig'

const labelOf = (id: string) => resolveEquipment(id)?.label ?? id
const isDropper = (id: string) => instanceTypeId(id) === 'dropper'
const DEG = 180 / Math.PI

function defaultSource(ids: readonly string[]) {
  const [a, b] = ids
  if (isDropper(a) || isDropper(b)) {
    // An empty dropper is filled from the other vessel; a filled one adds drops.
    const dropper = isDropper(a) ? a : b
    const other = dropper === a ? b : a
    const filled = benchVolumeMl(useBenchLiquidsStore.getState(), dropper) >= DROP_ML - 1e-9
    return filled ? dropper : other
  }
  if (canPourFrom(a)) return a
  return canPourFrom(b) ? b : a
}

/** Volume line for one vessel: "62.3 mL / 100 mL" (+ pH when acidic). */
function VesselLine({ id, role }: { id: string; role: string }) {
  const ml = useBenchLiquidsStore((state) => benchVolumeMl(state, id))
  const ph = useBenchLiquidsStore((state) => benchPh(state, id))
  const temperature = useBenchLiquidsStore((state) => {
    const value = benchTemperatureC(state, id)
    return value === null ? null : Math.round(value)
  })
  const capacity = benchContainerType(instanceTypeId(id))?.capacityMl ?? 0
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="truncate text-white/65">
        <span className="text-[10px] uppercase tracking-wider text-[#a8c5e0]">{role}</span>{' '}
        {labelOf(id)}
      </dt>
      <dd className="shrink-0 tabular-nums">
        {formatMl(ml)} / {capacity} mL
        {ph !== null && ph < 6.5 && <span className="ml-1 text-amber-200">pH {ph.toFixed(1)}</span>}
        {temperature !== null && temperature >= 30 && (
          <span className="ml-1 text-orange-200">{temperature} °C</span>
        )}
      </dd>
    </div>
  )
}

/**
 * L5 practice pouring between two bench vessels: a tilt control (drag or arrow keys; flow depends
 * on tilt and how full the source is), exact "Pour N mL" buttons, and the dropper.
 */
export function BenchPourPanel({ ids }: { ids: readonly string[] }) {
  const [sourceId, setSourceId] = useState(() => defaultSource(ids))
  const targetId = ids.find((id) => id !== sourceId) ?? ids[1]
  const [customMl, setCustomMl] = useState('25')
  const tiltId = useId()
  const pour = useBenchLiquidsStore((state) => state.pour)
  const spill = useBenchLiquidsStore((state) => state.spill)
  const message = useBenchLiquidsStore((state) => state.message)
  const saltBusy = useSaltSimulationStore((state) => !!state.transfer || !!state.effect)
  const thisPour = pour?.sourceId === sourceId && pour.targetId === targetId ? pour : null
  const otherPour = !!pour && !thisPour
  const liquids = useBenchLiquidsStore.getState
  const dropperSource = isDropper(sourceId)
  const dropperTarget = isDropper(targetId)
  const pourable = canPourFrom(sourceId)
  const disabled = saltBusy || otherPour
  const tiltDeg = Math.round((thisPour?.requestedAngle ?? 0) * DEG)

  return (
    <div className="space-y-2.5 text-xs">
      <dl className="space-y-1">
        <VesselLine id={sourceId} role="From" />
        <VesselLine id={targetId} role="Into" />
      </dl>
      <button
        type="button"
        disabled={disabled || !!thisPour}
        onClick={() => setSourceId(targetId)}
        className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 disabled:opacity-40"
      >
        <ArrowLeftRight size={12} aria-hidden="true" /> Swap direction
      </button>

      {dropperSource ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => liquids().addDrop(sourceId, targetId)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1b3a6b] px-3 py-2 font-semibold text-[#e8f1fa] hover:bg-[#3d5a80] disabled:opacity-40"
        >
          <Droplet size={14} aria-hidden="true" /> Add 1 drop ({DROP_ML} mL)
        </button>
      ) : dropperTarget ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => liquids().fillDropper(sourceId, targetId)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1b3a6b] px-3 py-2 font-semibold text-[#e8f1fa] hover:bg-[#3d5a80] disabled:opacity-40"
        >
          <Droplets size={14} aria-hidden="true" /> Fill dropper (up to 1 mL)
        </button>
      ) : !pourable ? (
        <p className="text-white/65">
          {labelOf(sourceId)} cannot be poured from yet. Swap direction.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor={tiltId} className="mb-1 flex justify-between text-white/75">
              <span>Tilt {labelOf(sourceId)}</span>
              <span className="tabular-nums">
                {tiltDeg}°
                {thisPour && thisPour.rateMlPerS > 0 && ` · ${thisPour.rateMlPerS.toFixed(1)} mL/s`}
              </span>
            </label>
            <input
              id={tiltId}
              type="range"
              min={0}
              max={90}
              step={1}
              value={tiltDeg}
              disabled={disabled}
              onChange={(event) =>
                liquids().setTilt(sourceId, targetId, Number(event.target.value) / DEG)
              }
              aria-valuetext={`${tiltDeg} degrees`}
              className="w-full accent-[#1b3a6b]"
            />
            <p className="mt-0.5 text-[10px] text-white/50">
              Tip further to pour faster. A fuller vessel starts pouring sooner.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[1, 10].map((ml) => (
              <button
                key={ml}
                type="button"
                disabled={disabled || !!thisPour}
                onClick={() => liquids().pourAmount(sourceId, targetId, ml)}
                className="rounded-lg bg-[#1b3a6b] px-2.5 py-1.5 font-semibold text-[#e8f1fa] hover:bg-[#3d5a80] disabled:opacity-40"
              >
                Pour {ml} mL
              </button>
            ))}
            <form
              className="flex items-center gap-1"
              onSubmit={(event) => {
                event.preventDefault()
                const ml = Number(customMl)
                if (Number.isFinite(ml) && ml > 0) liquids().pourAmount(sourceId, targetId, ml)
              }}
            >
              <input
                aria-label="Amount to pour in mL"
                inputMode="decimal"
                value={customMl}
                onChange={(event) => setCustomMl(event.target.value)}
                className="w-14 rounded-md border border-white/20 bg-white/10 px-1.5 py-1 text-right tabular-nums text-white"
              />
              <button
                type="submit"
                disabled={disabled || !!thisPour}
                className="rounded-lg border border-[#3d5a80] px-2 py-1.5 font-semibold text-[#cde1f2] hover:bg-[#3d5a80]/30 disabled:opacity-40"
              >
                mL
              </button>
            </form>
            {thisPour && (
              <button
                type="button"
                onClick={() => liquids().straighten()}
                className="flex items-center gap-1 rounded-lg border border-white/20 px-2.5 py-1.5 text-white/85 hover:bg-white/10"
              >
                <RotateCcw size={12} aria-hidden="true" /> Straighten
              </button>
            )}
          </div>
        </>
      )}

      {spill && (spill.containerId === targetId || spill.containerId === sourceId) && (
        <p
          role="alert"
          className="rounded-lg border border-red-300/50 bg-[#5b2324]/80 px-2 py-1.5 text-red-50"
        >
          {spill.message}
        </p>
      )}
      {message && (
        <p role="status" className="text-white/70">
          {message}
        </p>
      )}
      {otherPour && <p className="text-white/60">Another vessel is still tilted.</p>}
      <p className="text-[10px] text-white/45">Practice liquids · Esc straightens</p>
    </div>
  )
}
