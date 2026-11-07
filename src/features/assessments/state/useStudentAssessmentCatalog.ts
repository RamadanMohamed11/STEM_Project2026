import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { ExperimentAssessmentDefinition } from '@/types/assessment'
import type { SupabaseLikeClient } from '@/features/curriculum/lib/curriculumManagementRepository'
import { assessmentCatalog } from '@/features/assessments/data/assessmentCatalog'
import { toStudentAssessmentCatalog } from '@/features/assessments/lib/questionBankManagement'
import {
  createQuestionBankRepository,
  getActiveManagedQuestionBankState,
  subscribeManagedQuestionBankState,
} from '@/features/assessments/lib/questionBankRepository'
import { getSupabaseClient } from '@/lib/supabase/client'

export function useStudentAssessmentCatalog(
  overrideCatalog?: readonly ExperimentAssessmentDefinition[],
): {
  assessments: readonly ExperimentAssessmentDefinition[]
  source: 'published' | 'sample'
} {
  const managedState = useSyncExternalStore(
    subscribeManagedQuestionBankState,
    getActiveManagedQuestionBankState,
    getActiveManagedQuestionBankState,
  )

  useEffect(() => {
    if (overrideCatalog || managedState !== null) return
    const client = getSupabaseClient() as unknown as SupabaseLikeClient | null
    if (!client) return
    const repo = createQuestionBankRepository(client)
    void repo.loadPublishedStudentCatalog()
  }, [managedState, overrideCatalog])

  return useMemo(() => {
    if (overrideCatalog) {
      return {
        assessments: overrideCatalog,
        source: 'published',
      }
    }
    if (!managedState) {
      return {
        assessments: assessmentCatalog,
        source: 'sample',
      }
    }
    return {
      assessments: toStudentAssessmentCatalog(managedState),
      source: 'published',
    }
  }, [managedState, overrideCatalog])
}
