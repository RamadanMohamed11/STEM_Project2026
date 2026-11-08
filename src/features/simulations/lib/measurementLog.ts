/**
 * L8 measurement instruments & data log — pure helpers (no React/Three).
 * Instruments read the L1 engine state of bench vessels; the student records readings into a
 * log (time, instrument, value, unit) that feeds the chart, the lab panel and the results page.
 */

export type Instrument = 'balance' | 'thermometer' | 'ph-paper' | 'stopwatch'
export type Quantity = 'mass' | 'temperature' | 'pH' | 'time'

export interface MeasurementRow {
  id: string
  /** Seconds since the log started. */
  timeS: number
  instrument: Instrument
  quantity: Quantity
  /** Bench item measured (vessel id), or '' for the stopwatch. */
  targetId: string
  targetLabel: string
  value: number
  unit: string
}

export const INSTRUMENT_LABELS: Readonly<Record<Instrument, string>> = {
  balance: 'Balance',
  thermometer: 'Thermometer',
  'ph-paper': 'pH paper',
  stopwatch: 'Stopwatch',
}

export const QUANTITY_UNITS: Readonly<Record<Quantity, string>> = {
  mass: 'g',
  temperature: '°C',
  pH: '',
  time: 's',
}

/** Display precision per quantity (balance 0.01 g, thermometer 0.1 °C, pH paper whole numbers). */
export const QUANTITY_DECIMALS: Readonly<Record<Quantity, number>> = {
  mass: 2,
  temperature: 1,
  pH: 0,
  time: 1,
}

export function roundTo(value: number, decimals: number) {
  const k = 10 ** decimals
  const rounded = Math.round((Number.isFinite(value) ? value : 0) * k + 1e-9) / k
  return Object.is(rounded, -0) ? 0 : rounded
}

export function formatReading(quantity: Quantity, value: number) {
  const text = roundTo(value, QUANTITY_DECIMALS[quantity]).toFixed(QUANTITY_DECIMALS[quantity])
  const unit = QUANTITY_UNITS[quantity]
  return quantity === 'pH' ? `pH ${text}` : `${text} ${unit}`
}

/** mm:ss.t for the stopwatch. */
export function formatStopwatch(seconds: number) {
  const s = Math.max(0, Number.isFinite(seconds) ? seconds : 0)
  const minutes = Math.floor(s / 60)
  const rest = s - minutes * 60
  return `${String(minutes).padStart(2, '0')}:${rest.toFixed(1).padStart(4, '0')}`
}

// ---------------------------------------------------------------------------
// Balance
// ---------------------------------------------------------------------------

/** Empty glassware mass (g) from its capacity — a teaching estimate, not a catalogue value. */
export function glassMassG(capacityMl: number) {
  return roundTo(8 + 0.38 * Math.max(0, capacityMl), 1)
}

/** Balance display: gross mass on the pan minus the tare, to 0.01 g. */
export function balanceReadingG(grossG: number, tareG: number) {
  return roundTo(grossG - tareG, 2)
}

// ---------------------------------------------------------------------------
// pH paper (universal indicator colour chart)
// ---------------------------------------------------------------------------

/** Universal-indicator chart, pH 0 … 14 (our own colour set). */
export const PH_CHART: readonly string[] = [
  '#c8102e', // 0
  '#e0362b', // 1
  '#ee5a24', // 2
  '#f38b1f', // 3
  '#f6b21b', // 4
  '#f5d31d', // 5
  '#c9d92b', // 6
  '#7cc242', // 7
  '#2fa84f', // 8
  '#1f9a8a', // 9
  '#1f7fb5', // 10
  '#2a5fb0', // 11
  '#3d47a3', // 12
  '#4b3591', // 13
  '#552a7e', // 14
]

/** pH paper reads to the nearest whole number. */
export function phPaperReading(ph: number) {
  return Math.max(0, Math.min(14, Math.round(Number.isFinite(ph) ? ph : 7)))
}

export const phPaperColor = (ph: number) => PH_CHART[phPaperReading(ph)]

// ---------------------------------------------------------------------------
// Log
// ---------------------------------------------------------------------------

export function makeRow(
  rows: readonly MeasurementRow[],
  entry: Omit<MeasurementRow, 'id' | 'value' | 'unit'> & { value: number },
): MeasurementRow {
  const n = rows.reduce((max, row) => Math.max(max, Number(row.id.slice(1)) || 0), 0) + 1
  return {
    ...entry,
    id: `m${n}`,
    timeS: roundTo(entry.timeS, 1),
    value: roundTo(entry.value, QUANTITY_DECIMALS[entry.quantity]),
    unit: QUANTITY_UNITS[entry.quantity],
  }
}

export interface Series {
  key: string
  quantity: Quantity
  label: string
  points: readonly { t: number; v: number }[]
}

/** Chartable series: temperature and pH per measured vessel, in time order. */
export function chartSeries(rows: readonly MeasurementRow[]): Series[] {
  const map = new Map<string, Series & { points: { t: number; v: number }[] }>()
  for (const row of rows) {
    if (row.quantity !== 'temperature' && row.quantity !== 'pH') continue
    const key = `${row.quantity}:${row.targetId}`
    const series = map.get(key) ?? {
      key,
      quantity: row.quantity,
      label: `${row.quantity === 'pH' ? 'pH' : 'Temperature'} · ${row.targetLabel}`,
      points: [],
    }
    series.points.push({ t: row.timeS, v: row.value })
    map.set(key, series)
  }
  return [...map.values()].map((series) => ({
    ...series,
    points: [...series.points].sort((a, b) => a.t - b.t),
  }))
}

/** "Nice" axis ticks between min and max (about `count` of them). */
export function niceTicks(min: number, max: number, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0]
  if (max - min < 1e-9) {
    min -= 1
    max += 1
  }
  const raw = (max - min) / Math.max(1, count)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? 10 * magnitude
  const ticks: number[] = []
  for (let v = Math.floor(min / step) * step; v <= max + step * 1e-6; v += step)
    ticks.push(roundTo(v, 6))
  if (ticks[ticks.length - 1] < max) ticks.push(roundTo(ticks[ticks.length - 1] + step, 6))
  return ticks
}

export interface ChartLayout {
  width: number
  height: number
  padding: { left: number; right: number; top: number; bottom: number }
}

/** SVG polyline points for a series in a chart box with the given value range. */
export function seriesPath(
  points: readonly { t: number; v: number }[],
  domain: { t: [number, number]; v: [number, number] },
  layout: ChartLayout,
) {
  const { width, height, padding } = layout
  const w = width - padding.left - padding.right
  const h = height - padding.top - padding.bottom
  const [t0, t1] = domain.t
  const [v0, v1] = domain.v
  const x = (t: number) => padding.left + (t1 > t0 ? ((t - t0) / (t1 - t0)) * w : w / 2)
  const y = (v: number) => padding.top + (v1 > v0 ? (1 - (v - v0) / (v1 - v0)) * h : h / 2)
  return points.map((p) => `${roundTo(x(p.t), 1)},${roundTo(y(p.v), 1)}`).join(' ')
}

/** CSV text of the log (for copying into a spreadsheet). */
export function toCsv(rows: readonly MeasurementRow[]) {
  const escape = (text: string) => (/[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text)
  return [
    'time_s,instrument,item,value,unit',
    ...rows.map((row) =>
      [row.timeS, INSTRUMENT_LABELS[row.instrument], row.targetLabel, row.value, row.unit]
        .map((cell) => escape(String(cell)))
        .join(','),
    ),
  ].join('\n')
}
