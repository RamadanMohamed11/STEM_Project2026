import { useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { EquipmentGuideItem } from '../types/equipmentGuide'
import { EquipmentVisual } from './EquipmentVisual'

interface EquipmentDetailViewProps {
  item: EquipmentGuideItem
  onClose: () => void
  onSelectPrev?: () => void
  onSelectNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

export function EquipmentDetailView({
  item,
  onClose,
  onSelectPrev,
  onSelectNext,
  hasPrev = false,
  hasNext = false,
}: EquipmentDetailViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Listen for Escape key to close the detail view
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && onSelectPrev && hasPrev) {
        onSelectPrev()
      } else if (event.key === 'ArrowRight' && onSelectNext && hasNext) {
        onSelectNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onSelectPrev, onSelectNext, hasPrev, hasNext])

  return (
    <div
      id={`equipment-detail-${item.id}`}
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby={`detail-heading-${item.id}`}
      className="rounded-2xl border-2 border-teal/40 bg-white p-5 shadow-elevated focus:outline-none sm:p-8"
    >
      {/* Navigation and Close Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-canvas px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-teal-soft hover:text-teal-dark focus-visible:outline-2 focus-visible:outline-teal sm:text-sm"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Return to all equipment</span>
        </button>

        <div className="flex items-center gap-2">
          {onSelectPrev && (
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onSelectPrev}
              aria-label="Previous equipment item"
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </button>
          )}

          {onSelectNext && (
            <button
              type="button"
              disabled={!hasNext}
              onClick={onSelectNext}
              aria-label="Next equipment item"
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close equipment details"
            className="flex size-11 items-center justify-center rounded-lg text-slate transition-colors hover:bg-canvas hover:text-navy focus-visible:outline-2 focus-visible:outline-teal"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Left Column: Visual & Overview */}
        <div className="lg:col-span-5">
          <div className="flex flex-col items-center rounded-xl border border-line bg-canvas p-6 text-center">
            <EquipmentVisual visualKey={item.visualKey} className="size-36 sm:size-44" />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-teal/25 bg-teal-soft px-3 py-0.5 text-xs font-semibold text-teal-dark">
                {item.categoryLabel}
              </span>
              <span className="rounded-full border border-line bg-white px-3 py-0.5 text-xs font-medium text-slate">
                {item.materialType}
              </span>
            </div>
            <h3 id={`detail-heading-${item.id}`} className="mt-3 text-2xl font-bold text-navy">
              {item.name}
            </h3>
            <p className="mt-1 text-xs font-semibold text-teal-dark sm:text-sm">
              {item.shortPurpose}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-teal/20 bg-teal-soft/60 p-4 text-xs leading-relaxed text-ink/80 sm:text-sm">
            <div className="flex items-start gap-2.5">
              <Info size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
              <div>
                <span className="font-semibold text-navy">Educational Reminder: </span>
                Laboratory tools must be handled with appropriate care. Always verify that
                glassware is undamaged and clean before starting your experiment.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Safe Handling & Mistakes */}
        <div className="space-y-6 lg:col-span-7">
          {/* Description */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate">
              Overview & Function
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-ink/85 sm:text-base">
              {item.description}
            </p>
          </div>

          {/* Intended Use */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy">
              <CheckCircle2 size={16} className="text-teal" aria-hidden="true" />
              <span>How It Is Used</span>
            </h4>
            <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-ink/80 sm:text-sm">
              {item.intendedUse.map((use, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                  <span>{use}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety Notes */}
          <div className="rounded-xl border border-teal/20 bg-teal-soft/30 p-4 sm:p-5">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-teal-dark">
              <ShieldCheck size={18} className="text-teal" aria-hidden="true" />
              <span>Safe Handling Practices</span>
            </h4>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-ink/80 sm:text-sm">
              {item.safetyNotes.map((note, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-dark" aria-hidden="true" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Mistakes */}
          <div className="rounded-xl border border-warning/30 bg-warning-soft/40 p-4 sm:p-5">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-warning-dark">
              <AlertTriangle size={18} className="text-warning" aria-hidden="true" />
              <span>Common Mistakes to Avoid</span>
            </h4>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-ink/80 sm:text-sm">
              {item.commonMistakes.map((mistake, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning-dark" aria-hidden="true" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
