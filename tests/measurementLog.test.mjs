import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PH_CHART,
  balanceReadingG,
  chartSeries,
  formatReading,
  formatStopwatch,
  glassMassG,
  niceTicks,
  phPaperColor,
  phPaperReading,
  seriesPath,
  toCsv,
} from '../src/features/simulations/lib/measurementLog.ts'
import {
  balanceDisplayG,
  balanceGrossG,
  isInstrument,
  isPracticeBalance,
  itemOnBalance,
} from '../src/features/simulations/state/benchInstruments.ts'
import { useBenchLiquidsStore } from '../src/features/simulations/state/useBenchLiquidsStore.ts'
import {
  logTimeS,
  stopwatchSeconds,
  useMeasurementLogStore,
} from '../src/features/simulations/state/useMeasurementLogStore.ts'
import {
  findSnapTarget,
  snapElevation,
  BALANCE_PAN_Y,
} from '../src/features/simulations/three/benchLayout.ts'

const log = () => useMeasurementLogStore.getState()
const bench = () => useBenchLiquidsStore.getState()
const T0 = 1_000_000

test('readings are formatted to each instrument’s precision', () => {
  assert.equal(formatReading('mass', 104.567), '104.57 g')
  assert.equal(formatReading('temperature', 64.25), '64.3 °C')
  assert.equal(formatReading('pH', 1.4), 'pH 1')
  assert.equal(formatReading('time', 12.34), '12.3 s')
  assert.equal(formatStopwatch(75.26), '01:15.3')
  assert.equal(formatStopwatch(-3), '00:00.0')
})

test('pH paper reads whole numbers from a 15-colour chart', () => {
  assert.equal(PH_CHART.length, 15)
  assert.equal(phPaperReading(1.04), 1)
  assert.equal(phPaperReading(6.6), 7)
  assert.equal(phPaperReading(-2), 0)
  assert.equal(phPaperReading(20), 14)
  assert.equal(phPaperColor(7), PH_CHART[7])
  assert.notEqual(phPaperColor(1), phPaperColor(13), 'acid and alkali look different')
})

test('practice balance: vessel on the pan, mass of glass + contents, tare', () => {
  assert.ok(isPracticeBalance('digital-balance~2'))
  assert.ok(!isPracticeBalance('digital-balance'), 'the salt balance keeps its own logic')
  assert.ok(isInstrument('thermometer') && isInstrument('ph-paper'))

  // Snap rule: only the practice copy holds vessels, raised to the pan.
  const state = {
    placedIds: ['digital-balance', 'digital-balance~2', 'beaker-100'],
    positions: { 'digital-balance': { x: -2, z: 0 }, 'digital-balance~2': { x: 1, z: 0 } },
    rotations: {},
    relationships: {},
  }
  const onCopy = findSnapTarget('beaker-100', { x: 1, z: -0.05 }, state)
  assert.equal(onCopy?.holderId, 'digital-balance~2')
  assert.equal(
    findSnapTarget('beaker-100', { x: -2, z: -0.05 }, state),
    null,
    'not on the salt balance',
  )
  const relationships = {
    'beaker-100': { kind: 'snapped', actorId: 'beaker-100', targetId: 'digital-balance~2' },
  }
  assert.equal(snapElevation('beaker-100', relationships), BALANCE_PAN_Y)
  assert.equal(itemOnBalance('digital-balance~2', relationships), 'beaker-100')

  bench().reset()
  bench().sync(['wash-bottle', 'beaker-100'])
  const empty = balanceGrossG('digital-balance~2', relationships, bench())
  assert.equal(empty, glassMassG(100), 'empty beaker = glass estimate')
  bench().pourAmount('wash-bottle', 'beaker-100', 40)
  for (let t = 0; t < 30_000 && bench().pour; t += 33) bench().tick(33)
  assert.equal(
    balanceReadingG(empty + 40, 0),
    balanceDisplayG('digital-balance~2', relationships, bench(), {}),
  )
  // Tare with the empty beaker → the display shows the water alone.
  const tared = balanceDisplayG('digital-balance~2', relationships, bench(), {
    'digital-balance~2': empty,
  })
  assert.equal(tared, 40)
  assert.equal(balanceDisplayG('digital-balance~2', {}, bench(), {}), 0, 'empty pan reads zero')
})

test('the log records rows with time, rounding and unit; restarts per experiment', () => {
  log().begin('exp-setup', T0)
  log().begin('exp-a', T0)
  const a = log().record(
    {
      instrument: 'thermometer',
      quantity: 'temperature',
      targetId: 'beaker-100',
      targetLabel: 'Beaker 100 mL',
      value: 64.237,
    },
    T0 + 12_340,
  )
  assert.equal(a.id, 'm1')
  assert.equal(a.value, 64.2)
  assert.equal(a.unit, '°C')
  assert.equal(a.timeS, 12.3)
  const b = log().record(
    {
      instrument: 'ph-paper',
      quantity: 'pH',
      targetId: 'beaker-100',
      targetLabel: 'Beaker 100 mL',
      value: 1,
    },
    T0 + 20_000,
  )
  assert.equal(b.id, 'm2')
  assert.equal(log().rows.length, 2)
  log().removeRow('m1')
  assert.deepEqual(
    log().rows.map((r) => r.id),
    ['m2'],
  )
  assert.match(toCsv(log().rows), /^time_s,instrument,item,value,unit\n.*pH paper,Beaker 100 mL,1,/)
  log().begin('exp-a', T0 + 99_000)
  assert.equal(log().rows.length, 1, 'same experiment keeps its log')
  log().begin('exp-b', T0 + 99_000)
  assert.equal(log().rows.length, 0, 'another experiment starts a fresh log')
  assert.equal(logTimeS(log(), T0 + 101_000), 2)
})

test('stopwatch starts, stops, accumulates and resets', () => {
  log().resetStopwatch()
  log().startStopwatch(T0)
  assert.equal(stopwatchSeconds(log().stopwatch, T0 + 2500), 2.5)
  log().stopStopwatch(T0 + 3000)
  assert.equal(stopwatchSeconds(log().stopwatch, T0 + 9000), 3, 'stopped time does not run')
  log().startStopwatch(T0 + 10_000)
  assert.equal(stopwatchSeconds(log().stopwatch, T0 + 11_000), 4)
  log().resetStopwatch()
  assert.equal(stopwatchSeconds(log().stopwatch, T0 + 20_000), 0)
})

test('chart series and geometry: temperature and pH per vessel, in time order', () => {
  const rows = [
    {
      id: 'm1',
      timeS: 10,
      instrument: 'thermometer',
      quantity: 'temperature',
      targetId: 'b',
      targetLabel: 'Beaker',
      value: 40,
      unit: '°C',
    },
    {
      id: 'm2',
      timeS: 0,
      instrument: 'thermometer',
      quantity: 'temperature',
      targetId: 'b',
      targetLabel: 'Beaker',
      value: 22,
      unit: '°C',
    },
    {
      id: 'm3',
      timeS: 5,
      instrument: 'ph-paper',
      quantity: 'pH',
      targetId: 'b',
      targetLabel: 'Beaker',
      value: 1,
      unit: '',
    },
    {
      id: 'm4',
      timeS: 6,
      instrument: 'balance',
      quantity: 'mass',
      targetId: 'b',
      targetLabel: 'Beaker',
      value: 80,
      unit: 'g',
    },
  ]
  const series = chartSeries(rows)
  assert.equal(series.length, 2, 'mass is tabulated, not plotted')
  const temperature = series.find((s) => s.quantity === 'temperature')
  assert.deepEqual(
    temperature.points.map((p) => p.t),
    [0, 10],
  )
  const ticks = niceTicks(22, 40, 4)
  assert.ok(ticks[0] <= 22 && ticks[ticks.length - 1] >= 40)
  const layout = { width: 100, height: 50, padding: { left: 0, right: 0, top: 0, bottom: 0 } }
  assert.equal(seriesPath(temperature.points, { t: [0, 10], v: [22, 40] }, layout), '0,50 100,0')
})
