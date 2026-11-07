import { useParams } from 'react-router'
import { LessonExperiments } from '@/features/curriculum/components/LessonExperiments'
import { sampleCurriculum } from '@/features/curriculum/data/sampleCurriculum'
import { usePageTitle } from '@/hooks/usePageTitle'

export function CurriculumLessonPage() {
  usePageTitle('Lesson Experiments')
  const { lessonId } = useParams()
  return <LessonExperiments data={sampleCurriculum} lessonId={lessonId} />
}
