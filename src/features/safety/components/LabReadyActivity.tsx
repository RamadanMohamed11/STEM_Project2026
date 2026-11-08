import { useId, useState, type DragEvent } from 'react'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  gearItems,
  getGearProgress,
  labReadyScenario,
  type GearItem,
  type GearSlot,
} from '../data/labReadiness'

const SKIN = '#e5bf9c'
const DRAG_TYPE = 'text/plain'

/** Original illustrated student; each equipped slot changes the drawing. */
function StudentFigure({ slots }: { slots: ReadonlySet<GearSlot> }) {
  const has = (slot: GearSlot) => slots.has(slot)
  const hand = has('gloves') ? '#3f86c9' : SKIN
  return (
    <svg viewBox="0 0 200 320" className="h-full w-full" aria-hidden="true">
      {/* Loose hair sits behind the head; tied hair becomes a bun. */}
      {has('hair') ? (
        <circle cx="100" cy="27" r="13" fill="#3b2a20" />
      ) : (
        <path
          d="M66 58 Q64 20 100 22 Q136 20 134 58 L140 118 L122 118 L118 70 L82 70 L78 118 L60 118 Z"
          fill="#3b2a20"
        />
      )}
      <circle cx="100" cy="60" r="30" fill={SKIN} />
      <path d="M70 52 Q74 28 100 28 Q126 28 130 52 Q116 40 100 41 Q84 40 70 52 Z" fill="#3b2a20" />
      <circle cx="89" cy="62" r="3" fill="#203342" />
      <circle cx="111" cy="62" r="3" fill="#203342" />
      <path
        d="M92 76 Q100 82 108 76"
        stroke="#203342"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {has('goggles') && (
        <g>
          <rect x="68" y="53" width="64" height="5" rx="2.5" fill="#203342" />
          <rect
            x="76"
            y="51"
            width="22"
            height="18"
            rx="7"
            fill="#76d5cb"
            fillOpacity="0.55"
            stroke="#0d6f6a"
            strokeWidth="3"
          />
          <rect
            x="102"
            y="51"
            width="22"
            height="18"
            rx="7"
            fill="#76d5cb"
            fillOpacity="0.55"
            stroke="#0d6f6a"
            strokeWidth="3"
          />
        </g>
      )}
      <rect x="92" y="88" width="16" height="12" fill={SKIN} />
      {/* Arms */}
      <rect
        x="48"
        y="102"
        width="18"
        height="86"
        rx="9"
        fill={has('coat') ? '#ffffff' : '#7d9fc8'}
        stroke={has('coat') ? '#cdd7dd' : 'none'}
        strokeWidth="2"
      />
      <rect
        x="134"
        y="102"
        width="18"
        height="86"
        rx="9"
        fill={has('coat') ? '#ffffff' : '#7d9fc8'}
        stroke={has('coat') ? '#cdd7dd' : 'none'}
        strokeWidth="2"
      />
      <circle cx="57" cy="196" r="10" fill={hand} />
      <circle cx="143" cy="196" r="10" fill={hand} />
      {/* Legs and torso */}
      <rect x="74" y="196" width="22" height="92" rx="6" fill="#162635" />
      <rect x="104" y="196" width="22" height="92" rx="6" fill="#162635" />
      <rect x="64" y="98" width="72" height="104" rx="14" fill="#7d9fc8" />
      {has('coat') && (
        <g>
          <path
            d="M62 100 Q62 96 70 96 L130 96 Q138 96 138 100 L140 236 L60 236 Z"
            fill="#ffffff"
            stroke="#cdd7dd"
            strokeWidth="2"
          />
          <path d="M84 96 L100 132 L116 96" fill="none" stroke="#cdd7dd" strokeWidth="2.5" />
          <line x1="100" y1="132" x2="100" y2="236" stroke="#cdd7dd" strokeWidth="2" />
          <circle cx="106" cy="150" r="2.5" fill="#cdd7dd" />
          <circle cx="106" cy="175" r="2.5" fill="#cdd7dd" />
          <circle cx="106" cy="200" r="2.5" fill="#cdd7dd" />
          <rect
            x="70"
            y="160"
            width="18"
            height="14"
            rx="2"
            fill="none"
            stroke="#cdd7dd"
            strokeWidth="2"
          />
        </g>
      )}
      {has('shoes') ? (
        <g fill="#203342">
          <path d="M70 284 L98 284 L98 300 L62 300 Q62 288 70 284 Z" />
          <path d="M102 284 L130 284 Q138 288 138 300 L102 300 Z" />
        </g>
      ) : (
        <g>
          <ellipse cx="82" cy="296" rx="16" ry="6" fill={SKIN} />
          <ellipse cx="118" cy="296" rx="16" ry="6" fill={SKIN} />
          <path d="M70 302 L94 302 M106 302 L130 302" stroke="#995312" strokeWidth="3" />
          <path d="M78 292 L86 300 M114 292 L122 300" stroke="#995312" strokeWidth="3" />
        </g>
      )}
    </svg>
  )
}

type Feedback = { item: GearItem; kind: 'added' | 'removed' | 'rejected' }

export function LabReadyActivity({ onComplete }: { onComplete?: (complete: boolean) => void }) {
  const [equipped, setEquipped] = useState<ReadonlySet<string>>(() => new Set())
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const prefix = useId()
  const { count, total, complete } = getGearProgress(equipped)
  const slots = new Set(
    gearItems.filter((item) => item.slot && equipped.has(item.id)).map((item) => item.slot!),
  )

  function update(next: ReadonlySet<string>) {
    setEquipped(next)
    onComplete?.(getGearProgress(next).complete)
  }

  function choose(item: GearItem, fromDrop = false) {
    if (!item.correct) {
      setFeedback({ item, kind: 'rejected' })
      return
    }
    const next = new Set(equipped)
    if (next.has(item.id) && !fromDrop) {
      next.delete(item.id)
      setFeedback({ item, kind: 'removed' })
    } else {
      next.add(item.id)
      setFeedback({ item, kind: 'added' })
    }
    update(next)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)
    const item = gearItems.find((g) => g.id === event.dataTransfer.getData(DRAG_TYPE))
    if (item) choose(item, true)
  }

  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-7">
      <p className="rounded-lg bg-teal-soft px-4 py-3 text-sm leading-relaxed text-navy">
        <span className="font-semibold">Scenario: </span>
        {labReadyScenario}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,240px)_1fr] md:items-start">
        <div
          role="img"
          aria-label={`Student illustration wearing ${count} of ${total} required items`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mx-auto h-72 w-full max-w-60 rounded-2xl border-2 border-dashed p-3 transition-colors ${
            complete
              ? 'border-success bg-teal-soft'
              : dragOver
                ? 'border-teal bg-teal-soft'
                : 'border-line-strong bg-surface-muted'
          }`}
        >
          <StudentFigure slots={slots} />
        </div>
        <div>
          <p id={`${prefix}-help`} className="text-sm leading-relaxed text-slate">
            Drag items onto the student, or press an item to put it on or take it off. Choose only
            what belongs in the lab.
          </p>
          <div className="mt-4">
            <p id={`${prefix}-progress`} className="mb-2 text-sm font-medium text-teal-dark">
              {count} of {total} required items on
            </p>
            <progress
              aria-labelledby={`${prefix}-progress`}
              value={count}
              max={total}
              className="block h-2 w-full overflow-hidden rounded-full accent-teal"
            />
          </div>
          <ul
            aria-describedby={`${prefix}-help`}
            className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {gearItems.map((item) => {
              const on = equipped.has(item.id)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    draggable
                    aria-pressed={item.correct ? on : false}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(DRAG_TYPE, item.id)
                      event.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => choose(item)}
                    className={`flex min-h-11 w-full cursor-grab items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal ${
                      on
                        ? 'border-teal bg-teal-soft text-teal-dark'
                        : 'border-line bg-white text-ink hover:border-teal'
                    }`}
                  >
                    {item.label}
                    {on && <CheckCircle2 size={17} aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <div role="status" aria-live="polite" className="mt-4 min-h-12 text-sm leading-relaxed">
            {feedback && (
              <p
                className={`flex items-start gap-2 ${
                  feedback.kind === 'rejected' ? 'text-danger' : 'text-ink'
                }`}
              >
                {feedback.kind === 'rejected' ? (
                  <XCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                )}
                <span>
                  <span className="font-semibold">
                    {feedback.kind === 'rejected'
                      ? `Not in the lab: ${feedback.item.label}. `
                      : feedback.kind === 'removed'
                        ? `Removed: ${feedback.item.label}. `
                        : `${feedback.item.label} on. `}
                  </span>
                  {feedback.item.feedback}
                </span>
              </p>
            )}
          </div>
          {complete && (
            <p className="mt-2 rounded-lg border border-success/30 bg-teal-soft px-4 py-3 text-sm font-semibold text-success">
              Ready for the lab! Every required item is on.
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            icon={<RotateCcw size={15} aria-hidden="true" />}
            onClick={() => {
              setFeedback(null)
              update(new Set())
            }}
          >
            Start again
          </Button>
        </div>
      </div>
    </div>
  )
}
