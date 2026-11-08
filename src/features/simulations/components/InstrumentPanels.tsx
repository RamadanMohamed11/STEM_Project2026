import { useState } from 'react'
import { ClipboardPlus, Scale, TestTube, Thermometer } from 'lucide-react'
import {
  INSTRUMENT_LABELS,
  PH_CHART,
  formatReading,
  phPaperColor,
  phPaperReading,
  type Instrument,
  type Quantity,
} from '../lib/measurementLog'
import {
  balanceDisplayG,
  balanceGrossG,
  isPhPaper,
  isThermometer,
  itemOnBalance,
} from '../state/benchInstruments'
import {
  benchPh,
  benchTemperatureC,
  benchVolumeMl,
  useBenchLiquidsStore,
} from '../state/useBenchLiquidsStore'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useMeasurementLogStore } from '../state/useMeasurementLogStore'
import { resolveEquipment } from '../three/sceneConfig'

const labelOf = (id: string) => resolveEquipment(id)?.label ?? id

function RecordButton({
  instrument,
  quantity,
  targetId,
  value,
  disabled,
}: {
  instrument: Instrument
  quantity: Quantity
  targetId: string
  value: number | null
  disabled?: boolean
}) {
  const [saved, setSaved] = useState<string | null>(null)
  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={disabled || value === null}
        onClick={() => {
          if (value === null) return
          const row = useMeasurementLogStore.getState().record(
            {
              instrument,
              quantity,
              targetId,
              targetLabel: targetId ? labelOf(targetId) : '—',
              value,
            },
            Date.now(),
          )
          setSaved(`Recorded ${formatReading(quantity, row.value)} at ${row.timeS.toFixed(1)} s.`)
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#13a593] px-3 py-2 text-xs font-semibold text-white hover:bg-[#119384] disabled:opacity-40"
      >
        <ClipboardPlus size={14} aria-hidden="true" /> Record measurement
      </button>
      {saved && (
        <p role="status" className="text-[11px] text-[#9ff0e1]">
          {saved}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => useMeasurementLogStore.getState().setOpen(true)}
          >
            Open data log
          </button>
        </p>
      )}
    </div>
  )
}

/** L8: practice balance — reading of the vessel on the pan, tare and record. */
export function BalancePanel({ id }: { id: string }) {
  const relationships = useLabSceneStore((state) => state.relationships)
  const tare = useMeasurementLogStore((state) => state.tare)
  const reading = useBenchLiquidsStore((state) => balanceDisplayG(id, relationships, state, tare))
  const item = itemOnBalance(id, relationships)
  return (
    <div className="space-y-2.5 text-xs">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        <Scale size={14} aria-hidden="true" /> {labelOf(id)} (practice)
      </h3>
      <p
        role="status"
        aria-live="polite"
        className="rounded-lg bg-[#c9e7d4] px-3 py-2 text-right font-mono text-lg tabular-nums text-[#203e31]"
      >
        {reading.toFixed(2)} g
      </p>
      <p className="text-white/65">
        {item ? `On the pan: ${labelOf(item)}` : 'The pan is empty. Drag a vessel onto it.'}
        {(tare[id] ?? 0) !== 0 && ` · tare ${tare[id].toFixed(2)} g`}
      </p>
      <button
        type="button"
        onClick={() =>
          useMeasurementLogStore
            .getState()
            .setTare(id, balanceGrossG(id, relationships, useBenchLiquidsStore.getState()))
        }
        className="w-full rounded-lg border border-white/25 px-3 py-1.5 font-semibold text-white hover:bg-white/10"
      >
        Tare (zero the balance)
      </button>
      <RecordButton instrument="balance" quantity="mass" targetId={item ?? ''} value={reading} />
      <p className="text-[10px] leading-relaxed text-white/45">
        Tare with the empty vessel on the pan, then add liquid to read its mass alone.
      </p>
    </div>
  )
}

/** L8: thermometer or pH paper used on a bench vessel. */
export function InstrumentReadingPanel({ ids }: { ids: readonly string[] }) {
  const instrumentId = ids.find((id) => isThermometer(id) || isPhPaper(id))!
  const vesselId = ids.find((id) => id !== instrumentId)!
  const thermometer = isThermometer(instrumentId)
  const temperature = useBenchLiquidsStore((state) => benchTemperatureC(state, vesselId))
  const ph = useBenchLiquidsStore((state) => benchPh(state, vesselId))
  const volume = useBenchLiquidsStore((state) => benchVolumeMl(state, vesselId))
  const [dippedPh, setDippedPh] = useState<number | null>(null)
  const empty = volume <= 1e-9

  return (
    <div className="space-y-2.5 text-xs">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
        {thermometer ? (
          <Thermometer size={14} aria-hidden="true" />
        ) : (
          <TestTube size={14} aria-hidden="true" />
        )}
        {INSTRUMENT_LABELS[thermometer ? 'thermometer' : 'ph-paper']} · {labelOf(vesselId)}
      </h3>
      {thermometer ? (
        <>
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg bg-white/10 px-3 py-2 text-right font-mono text-lg tabular-nums"
          >
            {temperature === null ? '—' : `${temperature.toFixed(1)} °C`}
          </p>
          <p className="text-white/60">
            {empty
              ? 'Measuring the air in the empty vessel.'
              : 'Bulb in the liquid; reads to 0.1 °C.'}
          </p>
          <RecordButton
            instrument="thermometer"
            quantity="temperature"
            targetId={vesselId}
            value={temperature}
          />
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={empty || ph === null}
            onClick={() => setDippedPh(ph)}
            className="w-full rounded-lg border border-white/25 px-3 py-1.5 font-semibold hover:bg-white/10 disabled:opacity-40"
          >
            {dippedPh === null ? 'Dip a fresh strip' : 'Dip a new strip'}
          </button>
          {empty && <p className="text-white/60">The vessel is empty — nothing to test.</p>}
          {dippedPh !== null && (
            <div className="space-y-1.5" role="status" aria-live="polite">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-8 w-5 rounded-sm border border-white/40"
                  style={{ background: phPaperColor(dippedPh) }}
                />
                <span>
                  Strip colour matches <strong>pH {phPaperReading(dippedPh)}</strong> on the chart.
                </span>
              </div>
              <ol className="flex" aria-label="pH colour chart">
                {PH_CHART.map((color, value) => (
                  <li key={value} className="flex-1 text-center text-[9px] text-white/70">
                    <span
                      className={`block h-3 ${value === phPaperReading(dippedPh) ? 'ring-2 ring-white' : ''}`}
                      style={{ background: color }}
                    />
                    {value}
                  </li>
                ))}
              </ol>
              <RecordButton
                instrument="ph-paper"
                quantity="pH"
                targetId={vesselId}
                value={phPaperReading(dippedPh)}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
