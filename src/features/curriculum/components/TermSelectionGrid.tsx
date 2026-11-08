import type { Term } from '@/types/curriculum'
import { termDetailsBySlug } from '../data/termMetadata'
import { TermOptionCard } from './TermOptionCard'

interface TermSelectionGridProps {
  terms: readonly Term[]
  selectedTermId: string | null
  onSelectTerm: (termId: string) => void
}

export function TermSelectionGrid({
  terms,
  selectedTermId,
  onSelectTerm,
}: TermSelectionGridProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (terms.length === 0) return

    const currentIndex = terms.findIndex((t) => t.id === selectedTermId)
    let nextIndex = -1

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      nextIndex = currentIndex === -1 || currentIndex === terms.length - 1 ? 0 : currentIndex + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      nextIndex = currentIndex === -1 || currentIndex === 0 ? terms.length - 1 : currentIndex - 1
    }

    if (nextIndex >= 0 && nextIndex < terms.length) {
      onSelectTerm(terms[nextIndex].id)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Academic terms"
      onKeyDown={handleKeyDown}
      className="grid gap-5 md:grid-cols-2 lg:gap-6"
    >
      {terms.map((term, index) => (
        <TermOptionCard
          key={term.id}
          term={term}
          detail={termDetailsBySlug[term.slug]}
          isSelected={selectedTermId === term.id}
          onSelect={onSelectTerm}
          index={index}
        />
      ))}
    </div>
  )
}
