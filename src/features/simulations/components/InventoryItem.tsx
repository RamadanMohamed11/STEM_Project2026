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
        className={`flex min-h-17 min-w-0 flex-1 items-center gap-2 rounded-lg border p-2 text-start transition-colors ${
          selected
            ? 'border-teal bg-teal-soft shadow-sm'
            : 'border-transparent bg-white hover:border-line-strong hover:bg-surface-muted/70'
        }`}
      >
        <span className="flex size-13 shrink-0 items-center justify-center rounded-md border border-line bg-[#eaf1f1]">
          <LaboratoryEquipmentPreview visual={item.visual} className="h-12 w-12" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold leading-5 text-navy">{item.title}</span>
          <span className="mt-0.5 block text-[11px] text-ink/65">
            {placed ? 'On workbench' : placing ? 'Placing…' : 'In inventory'}
          </span>
        </span>
        <ChevronRight
          size={15}
          className={`shrink-0 ${selected ? 'text-teal-dark' : 'text-ink/40'}`}
          aria-hidden="true"
        />
      </button>
      {!placed && (
        <button
          type="button"
          onClick={() => onPlace(item.id)}
          disabled={placing}
          aria-label={`Place ${item.title} on workbench`}
          className="min-h-11 shrink-0 rounded-lg border border-line-strong bg-white px-2 text-xs font-semibold text-teal-dark hover:bg-teal-soft disabled:opacity-50"
        >
          {placing ? 'Placing' : 'Place'}
        </button>
      )}
    </li>
  )
}
