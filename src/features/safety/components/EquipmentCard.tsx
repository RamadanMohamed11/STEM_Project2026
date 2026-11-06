import { ArrowRight } from 'lucide-react'
import type { EquipmentGuideItem } from '../types/equipmentGuide'
import { EquipmentVisual } from './EquipmentVisual'

interface EquipmentCardProps {
  item: EquipmentGuideItem
  isSelected: boolean
  onSelect: (item: EquipmentGuideItem) => void
}

export function EquipmentCard({ item, isSelected, onSelect }: EquipmentCardProps) {
  return (
    <article
      className={`group relative flex flex-col justify-between rounded-xl border bg-white p-5 shadow-card transition-all duration-150 sm:p-6 ${
        isSelected
          ? 'border-teal ring-2 ring-teal/20 shadow-md'
          : 'border-line hover:border-line-strong hover:shadow-md'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <EquipmentVisual visualKey={item.visualKey} className="size-20 shrink-0 sm:size-24" />
          <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[11px] font-semibold text-slate">
            {item.categoryLabel}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-bold text-navy group-hover:text-teal-dark">
          {item.name}
        </h3>

        <p className="mt-1 text-xs font-medium text-teal-dark">
          {item.shortPurpose}
        </p>

        <p className="mt-2.5 text-xs leading-relaxed text-ink/75 sm:text-sm">
          {item.description}
        </p>
      </div>

      <div className="mt-5 border-t border-line/70 pt-3">
        <button
          type="button"
          onClick={() => onSelect(item)}
          aria-expanded={isSelected}
          aria-controls={`equipment-detail-${item.id}`}
          className="inline-flex min-h-11 w-full items-center justify-between rounded-lg bg-canvas px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-teal-soft hover:text-teal-dark focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 sm:text-sm"
        >
          <span>{isSelected ? 'Viewing safety details' : 'View handling & safety'}</span>
          <ArrowRight
            size={16}
            className={`transition-transform ${isSelected ? 'rotate-90 text-teal-dark' : 'text-slate group-hover:translate-x-0.5'}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  )
}
