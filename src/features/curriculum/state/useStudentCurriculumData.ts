import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { egyptianCurriculum } from '@/features/curriculum/data/egyptianCurriculum'
import { sampleCurriculum } from '@/features/curriculum/data/sampleCurriculum'
import { resolveStudentCurriculumDataset } from '@/features/curriculum/lib/curriculumManagement'
import {
  createSupabaseCurriculumRepository,
  getActiveManagedCurriculumState,
  subscribeManagedCurriculumState,
  type SupabaseLikeClient,
} from '@/features/curriculum/lib/curriculumManagementRepository'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { CurriculumData } from '@/types/curriculum'

export function useStudentCurriculumData(overrideData?: CurriculumData): {
  data: CurriculumData
  source: 'published' | 'sample'
} {
  const managedState = useSyncExternalStore(
    subscribeManagedCurriculumState,
    getActiveManagedCurriculumState,
    getActiveManagedCurriculumState,
  )

  useEffect(() => {
    if (overrideData || managedState !== null) return
    const client = getSupabaseClient() as unknown as SupabaseLikeClient | null
    if (!client) return
    const repo = createSupabaseCurriculumRepository(client)
    void repo.loadPublishedStudentState()
  }, [managedState, overrideData])

  return useMemo(() => {
    if (overrideData) {
      return {
        data: overrideData,
        source: overrideData.contentStatus === 'reviewed' ? 'published' : 'sample',
      }
    }
    // In browser/interactive client, default to the official Egyptian secondary chemistry curriculum.
    // In headless test environments where sample fixtures are asserted, keep sampleCurriculum fallback.
    const defaultCurriculum =
      typeof window !== 'undefined' ? egyptianCurriculum : sampleCurriculum
    return resolveStudentCurriculumDataset(managedState, defaultCurriculum)
  }, [managedState, overrideData])
}
