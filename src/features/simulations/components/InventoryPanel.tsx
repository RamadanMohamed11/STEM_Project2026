import { Info, Layers3, RotateCw, Undo2 } from 'lucide-react'
import { InventoryItem } from '@/features/simulations/components/InventoryItem'
import { LaboratoryEquipmentPreview } from '@/features/simulations/components/LaboratoryEquipmentPreview'
import { findInventoryItem } from '@/features/simulations/lib/workspaceSelectors'
import type { InventoryItem as InventoryItemData } from '@/types/laboratory'

interface InventoryPanelProps {
  items: readonly InventoryItemData[]
  selectedId: string | null
  placedIds: readonly string[]
  placingId: string | null
  onSelect: (id: string) => void
  onPlace: (id: string) => void
  onReturn: (id: string) => void
  onRotate: (id: string) => void
}

export function InventoryPanel({
  items,
  selectedId,
  placedIds,
  placingId,
  onSelect,
  onPlace,
  onReturn,
  onRotate,
}: InventoryPanelProps) {
  const selectedItem = findInventoryItem(items, selectedId)

  return (
    <section
      aria-labelledby="inventory-title"
      className="flex min-w-0 flex-col rounded-xl border border-line bg-white shadow-card"
    >
      <header className="flex items-center justify-between border-b border-line px-4 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
            01 / Reference library
          </p>
          <h2 id="inventory-title" className="mt-1 text-base font-semibold text-navy">
            Lab inventory
          </h2>
        </div>
        <Layers3 size={19} className="text-slate" aria-hidden="true" />
      </header>
      <div className="space-y-5 px-3 py-4">
        {(['equipment', 'materials'] as const).map((category) => {
          const group = items.filter((item) => item.category === category)
          return (
            <div key={category}>
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/70">
                {category === 'equipment' ? 'Equipment' : 'Materials'}{' '}
                <span className="ms-1 font-normal">({group.length})</span>
              </p>
              <ul className="space-y-1">
                {group.map((item) => (
                  <InventoryItem
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    placed={placedIds.includes(item.id)}
                    placing={placingId === item.id}
                    onSelect={onSelect}
                    onPlace={onPlace}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <div
        className="mt-auto border-t border-line bg-canvas/50 p-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedItem ? (
          <div>
            <div className="flex items-start gap-2">
              <LaboratoryEquipmentPreview
                visual={selectedItem.visual}
                className="size-14 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal">
                  Selected reference
                </p>
                <h3 className="mt-1 text-sm font-semibold text-navy">{selectedItem.title}</h3>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink/80">{selectedItem.description}</p>
            {selectedItem.detail && (
              <p className="mt-2 text-xs leading-relaxed text-ink/70">{selectedItem.detail}</p>
            )}
            <p className="mt-3 text-xs font-semibold text-navy">Available interactions</p>
            {placedIds.includes(selectedItem.id) ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onRotate(selectedItem.id)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 text-xs font-semibold text-navy hover:bg-teal-soft"
                >
                  <RotateCw size={15} aria-hidden="true" /> Rotate 22.5°
                </button>
                <button
                  type="button"
                  onClick={() => onReturn(selectedItem.id)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 text-xs font-semibold text-navy hover:bg-surface-muted"
                >
                  <Undo2 size={15} aria-hidden="true" /> Return to inventory
                </button>
                <p className="w-full text-xs leading-relaxed text-ink/70">
                  Drag the 3D object or use the movement buttons below the bench.
                </p>
              </div>
            ) : (
              <button
                type="button"
                disabled={placingId === selectedItem.id}
                onClick={() => onPlace(selectedItem.id)}
                className="mt-2 inline-flex min-h-11 items-center rounded-md bg-teal px-3 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
              >
                {placingId === selectedItem.id ? 'Placement preview open' : 'Place on workbench'}
              </button>
            )}
          </div>
        ) : (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink/75">
            <Info size={16} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
            Select equipment for details, then use Place to preview its position on the bench.
          </p>
        )}
      </div>
    </section>
  )
}
