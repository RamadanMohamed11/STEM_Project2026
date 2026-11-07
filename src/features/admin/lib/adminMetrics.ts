import type { SupabaseClient } from '@supabase/supabase-js'
import { assessmentCatalog } from '../../assessments/data/assessmentCatalog.ts'
import { canAccessAdminPortal, type RoleAwareSnapshotFields } from '../../auth/permissions.ts'
import { demoCatalog } from '../../experiments/data/mockExperiments.ts'
import { resolveSimulation } from '../../simulations/lib/simulationRegistry.ts'
import type { ExperimentAssessmentDefinition } from '../../../types/assessment.ts'
import type { Experiment } from '../../../types/experiment.ts'

export type AdminMetricAvailability = 'available' | 'empty' | 'unavailable' | 'loading'

export interface AdminStudentCountState {
  status: AdminMetricAvailability
  count: number | null
  message: string
}

export interface AdminCatalogMetrics {
  status: 'available' | 'empty' | 'unavailable'
  totalExperiments: number | null
  publishedExperiments: number | null
  draftExperiments: number | null
  availableAssessments: number | null
  totalAssessmentDefinitions: number | null
  totalValidatedQuestions: number | null
}

/**
 * Computes real experiment and assessment metrics from the repository catalogs.
 * Never fabricates statistics; returns null counts if catalog sources are unavailable.
 */
export function computeAdminCatalogMetrics(
  experiments: readonly Experiment[] | null | undefined = demoCatalog.experiments,
  assessments:
    | readonly ExperimentAssessmentDefinition[]
    | null
    | undefined = assessmentCatalog,
): AdminCatalogMetrics {
  if (!Array.isArray(experiments) || !Array.isArray(assessments)) {
    return {
      status: 'unavailable',
      totalExperiments: null,
      publishedExperiments: null,
      draftExperiments: null,
      availableAssessments: null,
      totalAssessmentDefinitions: null,
      totalValidatedQuestions: null,
    }
  }

  const totalExperiments = experiments.length
  const publishedExperiments = experiments.filter(
    (exp) => exp.status === 'demo' && Boolean(resolveSimulation(exp)),
  ).length
  const draftExperiments = totalExperiments - publishedExperiments

  const availableAssessments = assessments.filter(
    (assessment) =>
      (assessment.availabilityStatus === 'available' ||
        assessment.availabilityStatus === 'draft-demo') &&
      assessment.questions.length > 0,
  ).length

  const totalAssessmentDefinitions = assessments.length
  const totalValidatedQuestions = assessments.reduce(
    (sum, item) => sum + item.questions.length,
    0,
  )

  return {
    status: totalExperiments === 0 && totalAssessmentDefinitions === 0 ? 'empty' : 'available',
    totalExperiments,
    publishedExperiments,
    draftExperiments,
    availableAssessments,
    totalAssessmentDefinitions,
    totalValidatedQuestions,
  }
}

/**
 * Queries the real count of accounts assigned the `'student'` role from
 * `public.user_role_assignments` when an authorized admin session and Supabase client exist.
 * Never fabricates a fallback student count when the backend is unconfigured or unreachable.
 */
export async function fetchAuthorizedStudentCount(
  client: Pick<SupabaseClient, 'from'> | null | undefined,
  authState: RoleAwareSnapshotFields | null | undefined,
): Promise<AdminStudentCountState> {
  if (!canAccessAdminPortal(authState)) {
    return {
      status: 'unavailable',
      count: null,
      message: 'Verified administrator permission is required to view student counts.',
    }
  }

  if (!client) {
    return {
      status: 'unavailable',
      count: null,
      message: 'Supabase database connection is not configured in this environment.',
    }
  }

  try {
    const query = client
      .from('user_role_assignments')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'student')

    const result = await query
    if (
      result.error ||
      typeof result.count !== 'number' ||
      !Number.isFinite(result.count) ||
      result.count < 0
    ) {
      return {
        status: 'unavailable',
        count: null,
        message: 'Student count could not be retrieved from the database.',
      }
    }

    return {
      status: result.count === 0 ? 'empty' : 'available',
      count: result.count,
      message:
        result.count === 0
          ? 'No registered student accounts recorded yet.'
          : 'Verified student role assignments in Supabase.',
    }
  } catch {
    return {
      status: 'unavailable',
      count: null,
      message: 'Database service could not be reached to load student count.',
    }
  }
}
