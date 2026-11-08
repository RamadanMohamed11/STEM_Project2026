import { useEffect, useState } from 'react'
import {
  ClipboardCopy,
  ClipboardList,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trash2,
  X,
} from 'lucide-react'
import {
  INSTRUMENT_LABELS,
  chartSeries,
  formatReading,
  formatStopwatch,
  niceTicks,
  seriesPath,
  toCsv,
  type ChartLayout,
  type MeasurementRow,
} from '../lib/measurementLog'
import { benchTemperatureC, useBenchLiquidsStore } from '../state/useBenchLiquidsStore'
import { stopwatchSeconds, useMeasurementLogStore } from '../state/useMeasurementLogStore'
import { resolveEquipment } from '../three/sceneConfig'

const SERIES_COLORS = ['#e4572e', '#2e86ab', '#7a5195', '#3b9c5a', '#d4a017', '#c2185b']

/** Simple SVG line chart of temperature and pH over time (no chart library). */
export function MeasurementChart({
  rows,
  theme = 'dark',
}: {
  rows: readonly MeasurementRow[]
  theme?: 'dark' | 'light'
}) {
  const series = chartSeries(rows)
  if (!series.length)
    return (
      <p className={theme === 'dark' ? 'text-[11px] text-white/55' : 'text-xs text-ink/70'}>
        Record temperature or pH readings to see them plotted over time.
      </p>
    )
  const ink = theme === 'dark' ? 'rgba(255,255,255,0.65)' : '#33475b'
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.12)' : '#dfe6ec'
  const charts = (['temperature', 'pH'] as const)
    .map((quantity) => ({ quantity, list: series.filter((s) => s.quantity === quantity) }))
    .filter((chart) => chart.list.length)
  const layout: ChartLayout = {
    width: 320,
    height: 150,
    padding: { left: 34, right: 8, top: 8, bottom: 24 },
  }
  const allTimes = rows.map((row) => row.timeS)
  const tTicks = niceTicks(Math.min(0, ...allTimes), Math.max(...allTimes, 1), 4)
  const tDomain: [number, number] = [tTicks[0], tTicks[tTicks.length - 1]]
  const x = (t: number) =>
    layout.padding.left +
    ((t - tDomain[0]) / (tDomain[1] - tDomain[0] || 1)) *
      (layout.width - layout.padding.left - layout.padding.right)

  return (
    <div className="space-y-3">
      {charts.map(({ quantity, list }) => {
        const values = list.flatMap((s) => s.points.map((p) => p.v))
        const vTicks =
          quantity === 'pH'
            ? [0, 2, 4, 6, 8, 10, 12, 14]
            : niceTicks(Math.min(...values), Math.max(...values), 4)
        const vDomain: [number, number] = [vTicks[0], vTicks[vTicks.length - 1]]
        const innerH = layout.height - layout.padding.top - layout.padding.bottom
        const y = (v: number) =>
          layout.padding.top + (1 - (v - vDomain[0]) / (vDomain[1] - vDomain[0] || 1)) * innerH
        const title = quantity === 'pH' ? 'pH over time' : 'Temperature (°C) over time'
        return (
          <figure key={quantity}>
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="w-full"
              role="img"
              aria-label={`${title}: ${list
                .map((s) => `${s.label}, ${s.points.map((p) => `${p.v} at ${p.t} s`).join('; ')}`)
                .join('. ')}`}
            >
              {vTicks.map((v) => (
                <g key={`v${v}`}>
                  <line
                    x1={layout.padding.left}
                    x2={layout.width - layout.padding.right}
                    y1={y(v)}
                    y2={y(v)}
                    stroke={grid}
                  />
                  <text
                    x={layout.padding.left - 4}
                    y={y(v) + 3}
                    fontSize="9"
                    textAnchor="end"
                    fill={ink}
                  >
                    {v}
                  </text>
                </g>
              ))}
              {tTicks.map((t) => (
                <text
                  key={`t${t}`}
                  x={x(t)}
                  y={layout.height - 10}
                  fontSize="9"
                  textAnchor="middle"
                  fill={ink}
                >
                  {t}
                </text>
              ))}
              <text
                x={layout.width - layout.padding.right}
                y={layout.height - 1}
                fontSize="9"
                textAnchor="end"
                fill={ink}
              >
                time (s)
              </text>
              {list.map((s, i) => (
                <g key={s.key}>
                  <polyline
                    points={seriesPath(s.points, { t: tDomain, v: vDomain }, layout)}
                    fill="none"
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth="2"
                  />
                  {s.points.map((p) => (
                    <circle
                      key={`${p.t}-${p.v}`}
                      cx={x(p.t)}
                      cy={y(p.v)}
                      r="2.5"
                      fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                    />
                  ))}
                </g>
              ))}
            </svg>
            <figcaption
              className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]"
              style={{ color: ink }}
            >
              {list.map((s, i) => (
                <span key={s.key} className="flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="inline-block h-0.5 w-3"
                    style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
                  />
                  {s.label}
                </span>
              ))}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

/** Table of recorded rows (time, instrument, item, value). */
export function MeasurementTable({
  rows,
  theme = 'dark',
  onRemove,
}: {
  rows: readonly MeasurementRow[]
  theme?: 'dark' | 'light'
  onRemove?: (id: string) => void
}) {
  const head = theme === 'dark' ? 'text-white/55' : 'text-ink/65'
  const line = theme === 'dark' ? 'border-white/10' : 'border-line'
  if (!rows.length)
    return (
      <p className={`text-[11px] ${head}`}>
        No measurements yet. Select an instrument and a vessel, then press Record measurement.
      </p>
    )
  return (
    <table className="w-full text-left text-[11px] tabular-nums">
      <caption className="sr-only">Recorded measurements</caption>
      <thead>
        <tr className={head}>
          <th scope="col" className="py-1 pr-2 font-medium">
            Time
          </th>
          <th scope="col" className="py-1 pr-2 font-medium">
            Instrument
          </th>
          <th scope="col" className="py-1 pr-2 font-medium">
            Item
          </th>
          <th scope="col" className="py-1 text-right font-medium">
            Value
          </th>
          {onRemove && (
            <th scope="col" className="w-6">
              <span className="sr-only">Remove</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className={`border-t ${line}`}>
            <td className="py-1 pr-2">{row.timeS.toFixed(1)} s</td>
            <td className="py-1 pr-2">{INSTRUMENT_LABELS[row.instrument]}</td>
            <td className="max-w-[90px] truncate py-1 pr-2">{row.targetLabel}</td>
            <td className="py-1 text-right font-semibold">
              {formatReading(row.quantity, row.value)}
            </td>
            {onRemove && (
              <td className="py-1 text-right">
                <button
                  type="button"
                  aria-label={`Remove measurement at ${row.timeS.toFixed(1)} s`}
                  onClick={() => onRemove(row.id)}
                  className="rounded p-0.5 opacity-60 hover:bg-white/10 hover:opacity-100"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function useNow(active: boolean, everyMs = 100) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(Date.now()), everyMs)
    return () => window.clearInterval(timer)
  }, [active, everyMs])
  return now
}

function Stopwatch() {
  const stopwatch = useMeasurementLogStore((state) => state.stopwatch)
  const now = useNow(stopwatch.running)
  const seconds = stopwatch.running ? stopwatchSeconds(stopwatch, now) : stopwatch.accumulatedS
  const log = useMeasurementLogStore.getState
  const small =
    'flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-[11px] hover:bg-white/10 disabled:opacity-40'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Timer size={14} aria-hidden="true" className="text-[#69dec8]" />
      <span className="min-w-[64px] font-mono text-sm tabular-nums" aria-label="Stopwatch">
        {formatStopwatch(seconds)}
      </span>
      {stopwatch.running ? (
        <button type="button" className={small} onClick={() => log().stopStopwatch(Date.now())}>
          <Pause size={11} aria-hidden="true" /> Stop
        </button>
      ) : (
        <button type="button" className={small} onClick={() => log().startStopwatch(Date.now())}>
          <Play size={11} aria-hidden="true" /> Start
        </button>
      )}
      <button
        type="button"
        className={small}
        disabled={seconds === 0}
        onClick={() =>
          log().record(
            {
              instrument: 'stopwatch',
              quantity: 'time',
              targetId: '',
              targetLabel: '—',
              value: stopwatchSeconds(log().stopwatch, Date.now()),
            },
            Date.now(),
          )
        }
      >
        Record
      </button>
      <button
        type="button"
        className={small}
        aria-label="Reset stopwatch"
        onClick={() => log().resetStopwatch()}
      >
        <RotateCcw size={11} aria-hidden="true" />
      </button>
    </div>
  )
}

function AutoRecordControl() {
  const ids = useBenchLiquidsStore((state) => state.ids)
  const auto = useMeasurementLogStore((state) => state.autoRecord)
  const [target, setTarget] = useState('')
  const chosen = auto?.targetId ?? (ids.includes(target) ? target : (ids[0] ?? ''))
  if (!ids.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={!!auto}
          onChange={(event) =>
            useMeasurementLogStore
              .getState()
              .setAutoRecord(
                event.target.checked && chosen ? { targetId: chosen, everyS: 5 } : null,
              )
          }
        />
        Record temperature every 5 s of
      </label>
      <select
        aria-label="Vessel to record automatically"
        value={chosen}
        disabled={!!auto}
        onChange={(event) => setTarget(event.target.value)}
        className="rounded border border-white/20 bg-[#061b26] px-1 py-0.5"
      >
        {ids.map((id) => (
          <option key={id} value={id}>
            {resolveEquipment(id)?.label ?? id}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Records the chosen vessel's temperature every few seconds while enabled (thermometer left in). */
export function MeasurementAutoRecorder() {
  const auto = useMeasurementLogStore((state) => state.autoRecord)
  useEffect(() => {
    if (!auto) return
    const sample = () => {
      const bench = useBenchLiquidsStore.getState()
      const value = benchTemperatureC(bench, auto.targetId)
      if (value === null) {
        useMeasurementLogStore.getState().setAutoRecord(null)
        return
      }
      useMeasurementLogStore.getState().record(
        {
          instrument: 'thermometer',
          quantity: 'temperature',
          targetId: auto.targetId,
          targetLabel: resolveEquipment(auto.targetId)?.label ?? auto.targetId,
          value,
        },
        Date.now(),
      )
    }
    sample()
    const timer = window.setInterval(sample, auto.everyS * 1000)
    return () => window.clearInterval(timer)
  }, [auto])
  return null
}

/** L8 lab data log: stopwatch, auto-record, recorded table and chart. */
export function MeasurementLogPanel() {
  const open = useMeasurementLogStore((state) => state.open)
  const rows = useMeasurementLogStore((state) => state.rows)
  const [copied, setCopied] = useState(false)
  if (!open) return null
  const log = useMeasurementLogStore.getState
  return (
    <section
      aria-label="Data log"
      className="pointer-events-auto absolute right-3 top-16 z-20 flex max-h-[calc(100%-8rem)] w-[min(92vw,340px)] flex-col gap-2.5 overflow-y-auto rounded-2xl border border-white/20 bg-[#071d29]/95 p-3 text-white shadow-2xl backdrop-blur-xl"
    >
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#69dec8]">
          <ClipboardList size={13} aria-hidden="true" /> Data log · {rows.length}
        </h2>
        <button
          type="button"
          aria-label="Close data log"
          onClick={() => log().setOpen(false)}
          className="flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </header>
      <Stopwatch />
      <AutoRecordControl />
      <MeasurementChart rows={rows} />
      <MeasurementTable rows={rows} onRemove={(id) => log().removeRow(id)} />
      {rows.length > 0 && (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(toCsv(rows)).then(
                () => setCopied(true),
                () => setCopied(false),
              )
            }}
            className="flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-[11px] hover:bg-white/10"
          >
            <ClipboardCopy size={11} aria-hidden="true" /> {copied ? 'Copied CSV' : 'Copy as CSV'}
          </button>
          <button
            type="button"
            onClick={() => log().clear()}
            className="flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-[11px] hover:bg-white/10"
          >
            <Trash2 size={11} aria-hidden="true" /> Clear log
          </button>
        </div>
      )}
      <p className="text-[10px] text-white/45">
        Readings come from the simulation model. Instruments: practice balance (select it), and a
        thermometer or pH paper selected with a vessel.
      </p>
    </section>
  )
}

/** Compact summary for the measurements card and the results page (light theme). */
export function RecordedMeasurements({ experimentId }: { experimentId?: string }) {
  const rows = useMeasurementLogStore((state) =>
    !experimentId || state.experimentId === experimentId ? state.rows : [],
  )
  if (!rows.length) return null
  return (
    <section
      aria-labelledby="recorded-measurements-title"
      className="rounded-xl border border-line bg-white p-4 shadow-card sm:p-5"
    >
      <h2 id="recorded-measurements-title" className="text-base font-semibold text-navy">
        Recorded measurements ({rows.length})
      </h2>
      <div className="mt-3 grid items-start gap-4 lg:grid-cols-2">
        <MeasurementTable rows={rows} theme="light" />
        <MeasurementChart rows={rows} theme="light" />
      </div>
    </section>
  )
}
