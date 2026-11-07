import { ChevronRight } from 'lucide-react'
import { LaboratoryEquipmentPreview } from '@/features/simulations/components/LaboratoryEquipmentPreview'
import type { InventoryItem as InventoryItemData } from '@/types/laboratory'

interface InventoryItemProps {
  item: InventoryItemData
  selected: boolean
  placed: boolean
  placing: boolean
  onSelect: (id: string) => void
  onPlace: (id: string) => void
}

export function InventoryItem({
  item,
  selected,
  placed,
  placing,
  onSelect,
  onPlace,
}: InventoryItemProps) {
  return (
    <li className="flex items-center gap-1.5">
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(item.id)}
        className={`group flex min-h-17 min-w-0 flex-1 items-center gap-2 rounded-lg border p-2 text-start transition-all duration-200 active:scale-[0.99] ${
          selected
            ? 'border-teal bg-teal-soft shadow-sm ring-1 ring-teal/20 scale-[1.01]'
            : 'border-transparent bg-white hover:border-line-strong hover:bg-surface-muted/70 hover:shadow-xs'
        }`}
      >
        <span className="flex size-13 shrink-0 items-center justify-center rounded-md border border-line bg-[#eaf1f1] transition-transform duration-200 group-hover:scale-105">
          <LaboratoryEquipmentPreview visual={item.visual} className="h-12 w-12" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold leading-5 text-navy transition-colors group-hover:text-teal-dark">{item.title}</span>
          <span className="mt-0.5 block text-[11px] text-ink/65">
            {placed ? 'On workbench' : placing ? 'Placing…' : 'In inventory'}
          </span>
        </span>
        <ChevronRight
          size={15}
          className={`shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${selected ? 'text-teal-dark' : 'text-ink/40'}`}
          aria-hidden="true"
        />
      </button>
      {!placed && (
        <button
          type="button"
          onClick={() => onPlace(item.id)}
          disabled={placing}
          aria-label={`Place ${item.title} on workbench`}
          className="min-h-11 shrink-0 rounded-lg border border-line-strong bg-white px-2.5 text-xs font-semibold text-teal-dark shadow-xs transition-all duration-150 hover:bg-teal-soft hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
        >
          {placing ? 'Placing' : 'Place'}
        </button>
      )}
    </li>
  )
}
