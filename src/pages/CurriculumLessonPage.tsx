import { useParams } from 'react-router'
import { LessonExperiments } from '@/features/curriculum/components/LessonExperiments'
import { useStudentCurriculumData } from '@/features/curriculum/state/useStudentCurriculumData'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { CurriculumData } from '@/types/curriculum'

export interface CurriculumLessonPageProps {
  curriculumData?: CurriculumData
}

export function CurriculumLessonPage({ curriculumData }: CurriculumLessonPageProps = {}) {
  usePageTitle('Lesson Experiments')
  const { lessonId } = useParams()
  const { data: activeCurriculum } = useStudentCurriculumData(curriculumData)
  return <LessonExperiments data={activeCurriculum} lessonId={lessonId} />
}
