import { FocusDialog } from '@/components/ui/FocusDialog'
import { useState, useRef, useEffect } from 'react'
import { Info, X, ShieldAlert, Sparkles, Wrench } from 'lucide-react'
import {
  getEquipmentCatalogItem,
  getToolVisualKey,
  type EquipmentCatalogItem,
} from '../data/equipmentCatalog.ts'
import { ToolAndMaterialVisual } from './ToolAndMaterialVisual.tsx'

export interface ToolNotePopoverProps {
  toolId: string
  children?: React.ReactNode
  className?: string
  triggerAriaLabel?: string
  initialOpen?: boolean
}

/**
 * Universal popover for laboratory tools and apparatus.
 * Displays authoritative equipment name, primary use, safe handling, and safety precautions.
 */
export function ToolNotePopover({
  toolId,
  children,
  className = '',
  triggerAriaLabel,
  initialOpen = false,
}: ToolNotePopoverProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const tool: EquipmentCatalogItem | undefined = getEquipmentCatalogItem(toolId)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!tool) {
    // If tool not found in catalog, render children or fallback
    return <>{children}</>
  }

  const visualKey = getToolVisualKey(tool.id)

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {children ? (
        <div
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={triggerAriaLabel ?? `View tool note for ${tool.name}`}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen((prev) => !prev)
            }
          }}
          className="cursor-pointer focus-visible:outline-teal"
        >
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={triggerAriaLabel ?? `View tool note for ${tool.name}`}
          className="inline-flex min-h-11 min-w-11 size-11 items-center justify-center rounded-full border border-line bg-canvas text-slate transition-colors hover:border-teal hover:bg-teal-soft hover:text-teal-dark focus-visible:outline-teal"
        >
          <Info size={16} aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <FocusDialog onClose={() => setIsOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${tool.name} note`}
            className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-2xl border border-line bg-white p-5 shadow-xl transition-all sm:w-96"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-line/75 pb-3">
              <div className="flex items-center gap-3">
                <ToolAndMaterialVisual
                  visual={visualKey}
                  altText={`${tool.name} illustration`}
                  className="size-12 shrink-0 rounded-lg border border-line/60 bg-canvas/80 p-1"
                />
                <div>
                  <span className="inline-block rounded-md bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-dark">
                    {tool.category.replace('-', ' ')}
                  </span>
                  <p className="text-sm font-bold text-navy">{tool.name}</p>
                  {tool.specification && (
                    <p className="text-[11px] font-medium text-slate">{tool.specification}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close tool note"
                className="rounded-lg p-1 text-slate hover:bg-canvas hover:text-navy focus-visible:outline-teal"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Body Content */}
            <div className="mt-3.5 space-y-3 text-xs leading-relaxed text-ink/85">
              {/* Primary Use */}
              <div className="space-y-1 rounded-xl bg-canvas/60 p-3">
                <div className="flex items-center gap-1.5 font-semibold text-navy">
                  <Sparkles size={13} className="text-teal-dark" aria-hidden="true" />
                  <span>Primary Use</span>
                </div>
                <p className="text-slate">{tool.use}</p>
              </div>

              {/* Safe Handling */}
              <div className="space-y-1 rounded-xl bg-canvas/60 p-3">
                <div className="flex items-center gap-1.5 font-semibold text-navy">
                  <Wrench size={13} className="text-teal-dark" aria-hidden="true" />
                  <span>How to Handle Safely</span>
                </div>
                <p className="text-slate">{tool.handling}</p>
              </div>

              {/* Safety Precaution */}
              {tool.safetyNote && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-amber-900">
                  <ShieldAlert
                    size={15}
                    className="mt-0.5 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-semibold">Safety Precaution: </span>
                    <span>{tool.safetyNote}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FocusDialog>
      )}
    </div>
  )
}
