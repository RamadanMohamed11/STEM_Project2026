import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useStudentCurriculumData } from '@/features/curriculum/state/useStudentCurriculumData'
import type { SupabaseLikeClient } from '@/features/curriculum/lib/curriculumManagementRepository'
import { demoCatalog } from '@/features/experiments/data/mockExperiments'
import type { CatalogData } from '@/features/experiments/lib/catalogSelectors'
import { buildPublishedExperimentCatalog } from '@/features/experiments/lib/experimentManagement'
import {
  createSupabaseExperimentRepository,
  getActiveManagedExperimentState,
  subscribeManagedExperimentState,
} from '@/features/experiments/lib/experimentManagementRepository'
import { getSupabaseClient } from '@/lib/supabase/client'

export function useStudentExperimentCatalog(overrideCatalog?: CatalogData): {
  catalog: CatalogData
  source: 'published' | 'sample'
} {
  const { data: activeCurriculum } = useStudentCurriculumData()
  const managedState = useSyncExternalStore(
    subscribeManagedExperimentState,
    getActiveManagedExperimentState,
    getActiveManagedExperimentState,
  )

  useEffect(() => {
    if (overrideCatalog || managedState !== null) return
    const client = getSupabaseClient() as unknown as SupabaseLikeClient | null
    if (!client) return
    const repo = createSupabaseExperimentRepository(client)
    void repo.loadPublishedStudentState()
  }, [managedState, overrideCatalog])

  return useMemo(() => {
    if (overrideCatalog) {
      return {
        catalog: overrideCatalog,
        source: 'published',
      }
    }
    if (!managedState) {
      return {
        catalog: {
          ...demoCatalog,
          curriculum: activeCurriculum,
        },
        source: 'sample',
      }
    }
    return {
      catalog: buildPublishedExperimentCatalog(managedState, activeCurriculum),
      source: 'published',
    }
  }, [activeCurriculum, managedState, overrideCatalog])
}
