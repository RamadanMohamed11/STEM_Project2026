# L8 — Measurement Instruments & Data Log

Students can measure bench vessels with real instruments, record the readings, and see them as a table and a chart, both in the lab and on the results page. All readings come from the L1 engine state, so they are not invented sensor values.

## Instruments

| Instrument                                 | How                                                                                                                                 | Reads                                                                                                                                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Practice balance** (`digital-balance~2`) | Add a second digital balance from the inventory, drag a vessel onto its pan (it snaps), and select the balance. **Tare** zeroes it. | 0.01 g: an empty-glass estimate (`8 + 0.38 × capacity` g) plus the engine mass of the contents, minus the tare. Its 3D display shows the same value. The salt experiment's own balance is unchanged and does not hold practice vessels (`extraHolderOnly` snap rule). |
| **Thermometer**                            | Select the thermometer and a vessel ("Measure" panel).                                                                              | 0.1 °C from the engine temperature (L7 heating).                                                                                                                                                                                                                      |
| **pH paper**                               | Select the pH paper and a vessel, then **Dip a fresh strip**.                                                                       | The strip colour on a 15-colour universal-indicator chart (our own colours), read to a whole pH number.                                                                                                                                                               |
| **Stopwatch**                              | In the data log: Start / Stop / Reset / Record.                                                                                     | 0.1 s.                                                                                                                                                                                                                                                                |

Each instrument has **Record measurement**, which adds a row: time since the log started, instrument, item, value and unit.

## Data log

- The toolbar button (clipboard icon) opens the **Data log** panel. It has:
  - the stopwatch;
  - **Record temperature every 5 s** of a chosen vessel (a thermometer left in while heating);
  - an SVG line chart of temperature, and one of pH, per vessel over time;
  - the table, with a remove button on each row;
  - **Copy as CSV** and **Clear log**.
- The lab's **Current measurements** card (`ExperimentInteractionPanel`) and the **results page** show the recorded table and chart (`RecordedMeasurements`).
- The log is kept in memory for the experiment session, like the simulation stores. Restarting the experiment clears it, and another experiment starts a fresh log.

## Code

| Piece                   | Where                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pure helpers            | `lib/measurementLog.ts`: precision and formatting, glass-mass estimate, tare, the pH chart, rows, chart series, nice ticks, SVG path, CSV.                                                                                           |
| Store                   | `state/useMeasurementLogStore.ts`: rows, tare, stopwatch, auto-record, `begin(experimentId)`.                                                                                                                                        |
| Readings from the bench | `state/benchInstruments.ts`: the item on a balance pan, gross mass and displayed mass.                                                                                                                                               |
| Snap                    | `three/benchLayout.ts`: the `balance-holds-vessel` rule (pan height `BALANCE_PAN_Y`), practice copy only.                                                                                                                            |
| UI                      | `components/InstrumentPanels.tsx` (`BalancePanel`, `InstrumentReadingPanel`) and `components/MeasurementLog.tsx` (`MeasurementLogPanel`, `MeasurementChart`, `MeasurementTable`, `MeasurementAutoRecorder`, `RecordedMeasurements`). |

## Verification

- `tests/measurementLog.test.mjs` (6 tests) covers:
  - precision and formatting;
  - the pH chart;
  - the balance snap (practice copy only), mass, tare and empty pan;
  - log rows, removal, CSV and per-experiment restart;
  - the stopwatch;
  - chart series, ticks and path.
- **Browser**, with real clicks:
  - The practice balance read 46.00 g for the empty 100 mL beaker. After **Tare** and pouring 40 mL of water it read 40.00 g, which was recorded.
  - The thermometer read 22.0 °C, which was recorded.
  - After adding 10 mL of 1 M HCl, the pH paper strip turned red, read "pH 1" (engine value 0.7), and was recorded.
  - The data log opened from the toolbar. The stopwatch ran, and the chart and table appeared.
  - The results page listed the six measurements with both charts. Three later temperature rows were added from JS to fill the chart.
