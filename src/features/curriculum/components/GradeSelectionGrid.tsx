import type { Grade } from '@/types/curriculum'
import { gradeDetailsMap } from '../data/gradeMetadata'
import { GradeOptionCard } from './GradeOptionCard'

interface GradeSelectionGridProps {
  grades: readonly Grade[]
  selectedGradeId: string | null
  onSelectGrade: (gradeId: string) => void
}

export function GradeSelectionGrid({
  grades,
  selectedGradeId,
  onSelectGrade,
}: GradeSelectionGridProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (grades.length === 0) return

    const currentIndex = grades.findIndex((g) => g.id === selectedGradeId)
    let nextIndex = -1

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      nextIndex = currentIndex === -1 || currentIndex === grades.length - 1 ? 0 : currentIndex + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      nextIndex = currentIndex === -1 || currentIndex === 0 ? grades.length - 1 : currentIndex - 1
    }

    if (nextIndex >= 0 && nextIndex < grades.length) {
      onSelectGrade(grades[nextIndex].id)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Secondary school grades"
      onKeyDown={handleKeyDown}
      className="grid gap-5 md:grid-cols-3 lg:gap-6"
    >
      {grades.map((grade, index) => (
        <GradeOptionCard
          key={grade.id}
          grade={grade}
          detail={gradeDetailsMap[grade.id]}
          isSelected={selectedGradeId === grade.id}
          onSelect={onSelectGrade}
          index={index}
        />
      ))}
    </div>
  )
}
