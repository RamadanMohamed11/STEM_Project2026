import { useId, useRef, useState, type FormEvent } from 'react'
import { resolveEquipment } from '../three/sceneConfig'
import { isBenchLiquidContainer } from '../lib/benchLiquids'
import { BenchPourPanel } from './BenchPourPanel'
import { BenchVesselInfo, BurnerPanel } from './BenchHeatingPanel'
import { isHeatSource } from '../lib/benchHeating'
import { BalancePanel, InstrumentReadingPanel } from './InstrumentPanels'
import { isPhPaper, isPracticeBalance, isThermometer } from '../state/benchInstruments'

/** L8: a thermometer or pH paper paired with a bench vessel. */
const isInstrumentPair = (ids: readonly string[]) =>
  ids.length === 2 &&
  ids.some((id) => isThermometer(id) || isPhPaper(id)) &&
  ids.some(isBenchLiquidContainer)
import { ArrowRight, ArrowRightLeft, CheckCircle2, Droplets, Package2, X } from 'lucide-react'
import {
  resolvePairInteractions,
  transferEquipment,
  validateTransferRequest,
  type ResolvedTransfer,
  type TransferOperation,
  type TransferRequest,
} from '../engine/materialTransfers'
import type { SaltExperimentState } from '../engine/types'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'

type Unit = TransferRequest['unit']
const unitScale: Record<Unit, number> = { mL: 1, L: 0.001, g: 1, mg: 1000 }
const unitPrecision: Record<Unit, number> = { mL: 1, L: 4, g: 3, mg: 0 }
const controlClass =
  'rounded-lg border border-white/20 bg-[#061b26] px-2.5 py-2 text-sm text-white outline-none focus-visible:border-[#69dec8] focus-visible:ring-2 focus-visible:ring-[#69dec8]/30 disabled:cursor-not-allowed disabled:opacity-50'

function inUnit(value: number, unit: Unit): number {
  return Number((value * unitScale[unit]).toFixed(unitPrecision[unit]))
}

function equipment(id: string) {
  return Object.hasOwn(transferEquipment, id) ? transferEquipment[id] : undefined
}

function name(id: string): string {
  return equipment(id)?.label ?? resolveEquipment(id)?.label ?? id.replaceAll('-', ' ')
}

function SingleObjectInfo({ id, chemistry }: { id: string; chemistry: SaltExperimentState }) {
  const item = equipment(id)
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white">{name(id)}</h3>
      <dl className="space-y-1 text-xs tabular-nums">
        {item?.liquid && (
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-white/65">
              <Droplets size={13} aria-hidden="true" /> Water
            </dt>
            <dd>
              {chemistry.waterMl[item.liquid.reservoir]} / {item.liquid.capacity} mL
            </dd>
          </div>
        )}
        {item?.solid && (
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-white/65">
              <Package2 size={13} aria-hidden="true" /> NaCl
            </dt>
            <dd>
              {chemistry[item.solid.reservoir]} / {item.solid.capacity} g
            </dd>
          </div>
        )}
      </dl>
      <p className="text-[11px] leading-relaxed text-white/65">
        {id === 'stirring-rod'
          ? 'Drag the rod inside the beaker and draw complete circles to stir.'
          : id === 'digital-balance'
            ? 'Place the loaded weighing boat on the pan to record its modelled net mass.'
            : 'Click a second object to choose a transfer direction and amount.'}
      </p>
    </div>
  )
}

function TransferProgress({ operation }: { operation: TransferOperation }) {
  const phase = operation.cancelled
    ? 'Cancelled · returning safely'
    : operation.elapsedMs < operation.approachMs
      ? 'Positioning equipment'
      : operation.elapsedMs < operation.approachMs + operation.flowMs
        ? 'Transferring material'
        : 'Returning safely'
  const progress = (operation.transferred / operation.amount) * 100
  return (
    <div className="rounded-lg border border-[#69dec8]/25 bg-[#69dec8]/10 p-2.5">
      <div role="status" aria-live="polite" className="text-[11px] font-semibold text-[#a6f3df]">
        {phase}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2 text-xs tabular-nums">
        <span className="text-white/65">Delivered / requested</span>
        <strong>
          {operation.transferred} / {operation.amount} {operation.unit}
        </strong>
      </div>
      <div
        role="progressbar"
        aria-label="Material delivered"
        aria-valuemin={0}
        aria-valuemax={operation.amount}
        aria-valuenow={operation.transferred}
        aria-valuetext={`${operation.transferred} of ${operation.amount} ${operation.unit} delivered`}
        className="mt-2 h-1 overflow-hidden rounded-full bg-white/15"
      >
        <div className="h-full rounded-full bg-[#69dec8]" style={{ width: `${progress}%` }} />
      </div>
      <button
        type="button"
        disabled={operation.cancelled}
        aria-label={`Cancel transfer from ${name(operation.sourceId)} to ${name(operation.targetId)}`}
        onClick={() => {
          const session = useSaltSimulationStore.getState()
          if (session.transfer?.operationId === operation.operationId)
            session.cancelTransfer(operation.operationId)
        }}
        className="mt-2 min-h-9 w-full rounded-lg border border-white/20 text-xs font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#69dec8] disabled:cursor-wait disabled:text-white/50"
      >
        {operation.cancelled ? 'Waiting for safe return…' : 'Cancel transfer'}
      </button>
      <p className="mt-1.5 text-[10px] leading-relaxed text-white/60">
        Delivered material stays in the receiver. Equipment unlocks after safe return.
      </p>
    </div>
  )
}

function TransferForm({ resolved, active }: { resolved: ResolvedTransfer; active: boolean }) {
  const amountId = useId()
  const unitId = useId()
  const helpId = useId()
  const errorId = useId()
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<Unit>(resolved.canonicalUnit)
  const [edited, setEdited] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submitting = useRef(false)
  const chemistry = useSaltSimulationStore((state) => state.experiment)
  const workflow = useSaltSimulationStore((state) => state.workflow)
  const activeExperimentId = useSaltSimulationStore((state) => state.activeExperimentId)
  const resetRevision = useSaltSimulationStore((state) => state.resetRevision)
  const placedIds = useLabSceneStore((state) => state.placedIds)
  const request = {
    requestId: 'quantity-preview',
    sourceId: resolved.sourceId,
    targetId: resolved.targetId,
    materialId: resolved.materialId,
    amount: amount.trim() === '' ? Number.NaN : Number(amount),
    unit,
  }
  const validation = validateTransferRequest(request, chemistry, workflow, placedIds)
  const invalidAmount = edited && !validation.ok && resolved.enabled && !active
  const error = !active ? (submitError ?? (invalidAmount ? validation.message : null)) : null
  const step = inUnit(10 ** -resolved.precision, unit)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const session = useSaltSimulationStore.getState()
    // React may not have committed the disabled controls yet after a rapid second click.
    if (submitting.current || session.transfer) return
    if (
      session.activeExperimentId !== activeExperimentId ||
      session.resetRevision !== resetRevision
    )
      return
    submitting.current = true
    setEdited(true)
    setSubmitError(null)
    try {
      const currentRequest = { ...request, requestId: crypto.randomUUID() }
      const currentValidation = validateTransferRequest(
        currentRequest,
        session.experiment,
        session.workflow,
        useLabSceneStore.getState().placedIds,
      )
      if (!currentValidation.ok) {
        setSubmitError(currentValidation.message)
        return
      }
      const result = session.beginTransfer(currentRequest)
      if (!result.ok) setSubmitError(result.message)
    } catch {
      setSubmitError('Unable to start the transfer. Use a secure connection and try again.')
    } finally {
      submitting.current = false
    }
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-2.5">
      <dl
        id={helpId}
        className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 px-2 py-2 text-[10px]"
      >
        {[
          ['Available', resolved.available],
          ['Free capacity', resolved.freeCapacity],
          ['Max now', resolved.maxAmount],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-white/55">{label}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-white/95">
              {inUnit(Number(value), unit)} {unit}
            </dd>
          </div>
        ))}
      </dl>
      <fieldset disabled={active || !resolved.enabled} className="space-y-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_76px] gap-2">
          <div className="min-w-0">
            <label htmlFor={amountId} className="mb-1 block text-[11px] font-medium text-white/80">
              Transfer amount
            </label>
            <input
              id={amountId}
              aria-label="Transfer amount"
              aria-describedby={`${helpId}${error ? ` ${errorId}` : ''}`}
              aria-invalid={Boolean(error)}
              type="number"
              inputMode="decimal"
              required
              min={step}
              step={step}
              max={inUnit(resolved.maxAmount, unit)}
              value={amount}
              placeholder={`Up to ${inUnit(resolved.maxAmount, unit)}`}
              onChange={(event) => {
                setAmount(event.target.value)
                setEdited(true)
                setSubmitError(null)
              }}
              className={`${controlClass} w-full tabular-nums`}
            />
          </div>
          <div>
            <label htmlFor={unitId} className="mb-1 block text-[11px] font-medium text-white/80">
              Unit
            </label>
            <select
              id={unitId}
              aria-label="Transfer unit"
              value={unit}
              onChange={(event) => {
                const nextUnit = event.target.value as Unit
                if (validation.ok) setAmount(String(inUnit(validation.amount, nextUnit)))
                setUnit(nextUnit)
                setSubmitError(null)
              }}
              className={`${controlClass} w-full`}
            >
              {(resolved.kind === 'liquid' ? ['mL', 'L'] : ['g', 'mg']).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          aria-label={`${resolved.method} ${resolved.materialId} from ${resolved.sourceLabel} to ${resolved.targetLabel}`}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#62dfca] px-3 py-2 text-xs font-bold text-[#062b30] hover:bg-[#a6f3df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69dec8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowRight size={14} aria-hidden="true" />
          {resolved.method === 'scoop'
            ? 'Scoop'
            : resolved.method === 'deposit'
              ? 'Deposit'
              : 'Transfer'}{' '}
          {resolved.materialId === 'water' ? 'water' : 'NaCl'}
        </button>
      </fieldset>
      {error && (
        <p id={errorId} role="alert" className="text-[11px] leading-relaxed text-amber-200">
          {error}
        </p>
      )}
    </form>
  )
}

function PairActions({
  ids,
  operation,
}: {
  ids: readonly string[]
  operation: TransferOperation | null
}) {
  const chemistry = useSaltSimulationStore((state) => state.experiment)
  const workflow = useSaltSimulationStore((state) => state.workflow)
  const placedIds = useLabSceneStore((state) => state.placedIds)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const interactions = resolvePairInteractions(ids, chemistry, workflow, placedIds)
  const resolved =
    interactions.find((item) =>
      operation
        ? item.sourceId === operation.sourceId &&
          item.targetId === operation.targetId &&
          item.materialId === operation.materialId
        : item.id === chosenId,
    ) ??
    interactions.find((item) => item.enabled) ??
    interactions[0]

  return (
    <div className="space-y-2.5">
      {operation && <TransferProgress operation={operation} />}
      {resolved ? (
        <>
          <div role="group" aria-label="Transfer direction" className="space-y-1.5">
            {interactions.map((item) => (
              <div key={item.id}>
                <button
                  type="button"
                  aria-label={`Transfer ${item.materialId} from ${item.sourceLabel} to ${item.targetLabel}`}
                  aria-pressed={item.id === resolved.id}
                  aria-describedby={item.reason && !operation ? `${item.id}-reason` : undefined}
                  disabled={Boolean(operation) || !item.enabled}
                  onClick={() => setChosenId(item.id)}
                  className={`flex min-h-10 w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] leading-snug focus-visible:outline-2 focus-visible:outline-[#69dec8] disabled:cursor-not-allowed ${item.id === resolved.id ? 'border-[#69dec8]/60 bg-[#69dec8]/10 text-[#bcfff0]' : 'border-white/15 text-white/75 hover:bg-white/5'} ${!item.enabled && !operation ? 'opacity-60' : ''}`}
                >
                  <span className="min-w-0 flex-1">{item.sourceLabel}</span>
                  <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">{item.targetLabel}</span>
                  {item.id === resolved.id && (
                    <CheckCircle2 size={13} className="shrink-0" aria-hidden="true" />
                  )}
                </button>
                {item.reason && !operation && (
                  <p
                    id={`${item.id}-reason`}
                    className="mt-1 px-0.5 text-[10px] leading-relaxed text-amber-200/90"
                  >
                    {item.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
          <TransferForm key={resolved.id} resolved={resolved} active={Boolean(operation)} />
        </>
      ) : !operation ? (
        <>
          <h3 className="text-sm font-semibold">{ids.map(name).join(' + ')}</h3>
          <p role="status" className="text-xs leading-relaxed text-white/70">
            No material transfer is supported between these objects. Read the current step and
            select a source and receiver.
          </p>
          {ids.includes('stirring-rod') && (
            <p className="text-[11px] leading-relaxed text-[#a6e9df]">
              To stir, drag the rod inside the beaker and draw complete circles with the mouse.
            </p>
          )}
        </>
      ) : null}
    </div>
  )
}

/** A contextual bench overlay. Selection and all scientific decisions remain in their stores. */
export function PairInteractionPanel({ inventoryOpen = false }: { inventoryOpen?: boolean } = {}) {
  const selectedIds = useLabSceneStore((state) => state.selectedIds)
  const clearSelection = useLabSceneStore((state) => state.clearSelection)
  const chemistry = useSaltSimulationStore((state) => state.experiment)
  const operation = useSaltSimulationStore((state) => state.transfer)
  const activeExperimentId = useSaltSimulationStore((state) => state.activeExperimentId)
  const resetRevision = useSaltSimulationStore((state) => state.resetRevision)
  const ids = operation ? [operation.sourceId, operation.targetId] : selectedIds
  if (!ids?.length || (inventoryOpen && !operation)) return null
  const contextKey = `${activeExperimentId}:${resetRevision}:${[...ids].sort().join('|')}`

  return (
    <section
      aria-label="Object interaction"
      aria-busy={Boolean(operation)}
      className="pointer-events-auto absolute bottom-14 left-3 right-3 z-20 max-h-[calc(100%-5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/20 bg-[#071d29]/95 p-3 text-white shadow-2xl backdrop-blur-xl sm:bottom-16 sm:left-4 sm:right-auto sm:w-[300px]"
    >
      <header className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#69dec8]">
          <ArrowRightLeft size={13} aria-hidden="true" />
          {ids.length === 1
            ? 'Selected object'
            : isInstrumentPair(ids)
              ? 'Measure'
              : ids.every(isBenchLiquidContainer)
                ? 'Practice pour'
                : 'Smart transfer'}
        </h2>
        <button
          type="button"
          aria-label="Dismiss object interaction and clear selection"
          disabled={Boolean(operation)}
          onClick={() => {
            if (!useSaltSimulationStore.getState().transfer) clearSelection()
          }}
          className="-mr-1 -mt-1 flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#69dec8] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </header>
      {ids.length === 1 && isPracticeBalance(ids[0]) ? (
        <BalancePanel id={ids[0]} />
      ) : !operation && isInstrumentPair(ids) ? (
        <InstrumentReadingPanel key={contextKey} ids={ids} />
      ) : ids.length === 1 && isHeatSource(ids[0]) ? (
        <BurnerPanel id={ids[0]} />
      ) : ids.length === 1 && isBenchLiquidContainer(ids[0]) ? (
        <BenchVesselInfo id={ids[0]} />
      ) : ids.length === 1 ? (
        <SingleObjectInfo id={ids[0]} chemistry={chemistry} />
      ) : ids.length === 2 && !operation && ids.every(isBenchLiquidContainer) ? (
        <BenchPourPanel key={contextKey} ids={ids} />
      ) : ids.length === 2 ? (
        <PairActions key={contextKey} ids={ids} operation={operation} />
      ) : (
        <p role="status" className="text-xs text-white/70">
          Select exactly two objects to transfer material.
        </p>
      )}
    </section>
  )
}
