import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  FlaskConical,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { getExperimentPaths, routePaths } from '@/app/paths'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { useAuth } from '@/features/auth/authContext'
import { sampleCurriculum } from '@/features/curriculum/data/sampleCurriculum'
import { getActiveManagedCurriculumState } from '@/features/curriculum/lib/curriculumManagementRepository'
import {
  experimentDifficultyLabels,
  safetyLevelLabels,
} from '@/features/experiments/data/catalogDisplay'
import {
  createInitialAdminExperimentState,
  getRegisteredSimulationCatalog,
  isRegisteredSimulationForExperiment,
  normalizeExperimentSlug,
  sortManagedExperiments,
  type AdminExperimentState,
  type ExperimentPublicationStatus,
  type ExperimentReviewStatus,
  type ManagedExperiment,
} from '@/features/experiments/lib/experimentManagement'
import {
  createSupabaseExperimentRepository,
  getActiveManagedExperimentState,
  type ExperimentManagementRepository,
} from '@/features/experiments/lib/experimentManagementRepository'
import type { SupabaseLikeClient } from '@/features/curriculum/lib/curriculumManagementRepository'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getSupabaseClient } from '@/lib/supabase/client'
import type {
  ExperimentDifficulty,
  ExperimentIllustrationKey,
  ExperimentStatus,
  SafetyMetadata,
} from '@/types/experiment'

export interface AdminExperimentsPageProps {
  initialState?: AdminExperimentState
  repository?: ExperimentManagementRepository
  initialSearchQuery?: string
  initialCategoryFilter?: string
  initialStatusFilter?: 'all' | ExperimentPublicationStatus
  initialSimulationFilter?: 'all' | 'available' | 'unavailable'
}

function renderPublicationPill(status: ExperimentPublicationStatus) {
  if (status === 'published') {
    return (
      <StatusPill tone="ready" dot>
        Published
      </StatusPill>
    )
  }
  if (status === 'archived') {
    return (
      <StatusPill tone="warning" dot>
        Archived
      </StatusPill>
    )
  }
  return (
    <StatusPill tone="neutral" dot>
      Draft
    </StatusPill>
  )
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitList(text: string): string[] {
  return text
    .split(/[\r\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function AdminExperimentsPage({
  initialState,
  repository,
  initialSearchQuery = '',
  initialCategoryFilter = 'all',
  initialStatusFilter = 'all',
  initialSimulationFilter = 'all',
}: AdminExperimentsPageProps = {}) {
  usePageTitle('Experiment Management')
  const { state: authState } = useAuth()

  const activeRepo = useMemo<ExperimentManagementRepository>(() => {
    if (repository) return repository
    const client = getSupabaseClient() as unknown as SupabaseLikeClient | null
    return createSupabaseExperimentRepository(client)
  }, [repository])

  const [experimentState, setExperimentState] = useState<AdminExperimentState>(() => {
    if (initialState) return initialState
    const shared = getActiveManagedExperimentState()
    if (shared) return shared
    return createInitialAdminExperimentState()
  })

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery)
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter)
  const [statusFilter, setStatusFilter] = useState<'all' | ExperimentPublicationStatus>(
    initialStatusFilter,
  )
  const [simulationFilter, setSimulationFilter] = useState<
    'all' | 'available' | 'unavailable'
  >(initialSimulationFilter)

  // Archive confirmation state
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null)

  // Form state (Add Experiment / Edit Experiment)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingExperimentId, setEditingExperimentId] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('chemistry')
  const [difficulty, setDifficulty] = useState<ExperimentDifficulty>('beginner')
  const [estimatedDuration, setEstimatedDuration] = useState<string>('15')
  const [shortDescription, setShortDescription] = useState<string>('')
  const [aboutText, setAboutText] = useState<string>('')
  const [objectivesText, setObjectivesText] = useState<string>('')
  const [requiredToolsText, setRequiredToolsText] = useState<string>('')
  const [requiredMaterialsText, setRequiredMaterialsText] = useState<string>('')
  const [safetyLevel, setSafetyLevel] = useState<'none' | 'low' | 'moderate' | 'medium' | 'high'>('low')
  const [requiresSupervision, setRequiresSupervision] = useState<boolean>(true)
  const [safetyNote, setSafetyNote] = useState<string>('')
  const [safetyReviewStatus, setSafetyReviewStatus] =
    useState<ExperimentReviewStatus>('draft')
  const [contentReviewStatus, setContentReviewStatus] =
    useState<ExperimentReviewStatus>('draft')
  const [illustration, setIllustration] =
    useState<ExperimentIllustrationKey>('salt-dissolution')
  const [lessonId, setLessonId] = useState<string>('')
  const [simulationStatus, setSimulationStatus] = useState<ExperimentStatus>('planned')

  useEffect(() => {
    if (initialState) return
    const client = getSupabaseClient()
    if (!client && !repository) return
    let mounted = true
    void activeRepo.loadAdminState(authState).then((res) => {
      if (!mounted) return
      if (res.ok) {
        setExperimentState(res.state)
      }
    })
    return () => {
      mounted = false
    }
  }, [activeRepo, authState, initialState, repository])

  const categoryById = useMemo(
    () => new Map(experimentState.categories.map((cat) => [cat.id, cat])),
    [experimentState.categories],
  )

  const availableLessons = useMemo(() => {
    const managedCurriculum = getActiveManagedCurriculumState()
    if (managedCurriculum && managedCurriculum.lessons.length > 0) {
      return managedCurriculum.lessons
    }
    return sampleCurriculum.lessons
  }, [])

  const lessonById = useMemo(
    () => new Map(availableLessons.map((lesson) => [lesson.id, lesson])),
    [availableLessons],
  )

  const registeredSimulations = useMemo(() => getRegisteredSimulationCatalog(), [])

  const filteredExperiments = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return sortManagedExperiments(experimentState.experiments).filter((exp) => {
      if (categoryFilter !== 'all' && exp.categoryId !== categoryFilter) return false
      if (statusFilter !== 'all' && exp.publicationStatus !== statusFilter) return false
      const has3D =
        exp.status === 'demo' &&
        isRegisteredSimulationForExperiment(exp.id, exp.simulationId ?? exp.id)
      if (simulationFilter === 'available' && !has3D) return false
      if (simulationFilter === 'unavailable' && has3D) return false
      if (!normalizedSearch) return true
      const catLabel = categoryById.get(exp.categoryId)?.label.toLowerCase() ?? ''
      return (
        exp.title.toLowerCase().includes(normalizedSearch) ||
        exp.slug.toLowerCase().includes(normalizedSearch) ||
        exp.shortDescription.toLowerCase().includes(normalizedSearch) ||
        catLabel.includes(normalizedSearch)
      )
    })
  }, [
    categoryById,
    categoryFilter,
    experimentState.experiments,
    searchQuery,
    simulationFilter,
    statusFilter,
  ])

  const summaryCounts = useMemo(() => {
    const total = experimentState.experiments.length
    const published = experimentState.experiments.filter(
      (e) => e.publicationStatus === 'published',
    ).length
    const draft = experimentState.experiments.filter(
      (e) => e.publicationStatus === 'draft',
    ).length
    const archived = experimentState.experiments.filter(
      (e) => e.publicationStatus === 'archived',
    ).length
    const labAvailable = experimentState.experiments.filter(
      (e) =>
        e.status === 'demo' &&
        isRegisteredSimulationForExperiment(e.id, e.simulationId ?? e.id),
    ).length
    return { total, published, draft, archived, labAvailable }
  }, [experimentState.experiments])

  const resetForm = () => {
    setFormMode('create')
    setEditingExperimentId(null)
    setTitle('')
    setSlug('')
    setCategoryId(experimentState.categories[0]?.id ?? 'chemistry')
    setDifficulty('beginner')
    setEstimatedDuration('15')
    setShortDescription('')
    setAboutText('')
    setObjectivesText('')
    setRequiredToolsText('')
    setRequiredMaterialsText('')
    setSafetyLevel('low')
    setRequiresSupervision(true)
    setSafetyNote('')
    setSafetyReviewStatus('draft')
    setContentReviewStatus('draft')
    setIllustration('salt-dissolution')
    setLessonId('')
    setSimulationStatus('planned')
  }

  const startEditExperiment = (exp: ManagedExperiment) => {
    setFormMode('edit')
    setEditingExperimentId(exp.id)
    setTitle(exp.title)
    setSlug(exp.slug)
    setCategoryId(exp.categoryId)
    setDifficulty(exp.difficulty)
    setEstimatedDuration(String(exp.estimatedDurationMinutes))
    setShortDescription(exp.shortDescription)
    setAboutText(exp.about.join('\n'))
    setObjectivesText(exp.objectives.map((o) => o.text).join('\n'))
    setRequiredToolsText(exp.requiredTools.join(', '))
    setRequiredMaterialsText(exp.requiredMaterials.join(', '))
    setSafetyLevel(exp.safety?.level ?? 'low')
    setRequiresSupervision(exp.safety?.requiresSupervision ?? true)
    setSafetyNote(exp.safety?.note ?? '')
    setSafetyReviewStatus(exp.safetyReviewStatus)
    setContentReviewStatus(exp.contentReviewStatus)
    setIllustration(exp.illustration)
    setLessonId(exp.lessonId ?? '')
    setSimulationStatus(exp.status)
    setFeedback(null)
  }

  const submitExperimentForm = async (
    targetPublicationStatus: ExperimentPublicationStatus,
  ) => {
    setLoading(true)
    setFeedback(null)

    const parsedDuration = Number.parseInt(estimatedDuration, 10)
    const aboutLines = splitLines(aboutText)
    const objectiveLines = splitLines(objectivesText).map((text, idx) => ({
      id: `obj-${idx + 1}`,
      text,
    }))
    const toolsList = splitList(requiredToolsText)
    const materialsList = splitList(requiredMaterialsText)
    const safetyPayload: SafetyMetadata | undefined = safetyNote.trim()
      ? {
          level: safetyLevel,
          requiresSupervision,
          note: safetyNote.trim(),
        }
      : undefined

    if (formMode === 'edit' && editingExperimentId) {
      const updateRes = await activeRepo.updateExperiment(
        experimentState,
        {
          experimentId: editingExperimentId,
          title,
          slug: slug || normalizeExperimentSlug(title),
          shortDescription,
          categoryId,
          difficulty,
          estimatedDurationMinutes: Number.isNaN(parsedDuration) ? 0 : parsedDuration,
          status: simulationStatus,
          simulationId: simulationStatus === 'demo' ? editingExperimentId : null,
          illustration,
          contentReviewStatus,
          about: aboutLines,
          objectives: objectiveLines,
          requiredTools: toolsList,
          requiredMaterials: materialsList,
          safety: safetyPayload ?? null,
          safetyReviewStatus,
          mediaReferences: [illustration],
          lessonId: lessonId || null,
        },
        authState,
      )

      if (!updateRes.ok) {
        setLoading(false)
        setFeedback({ tone: 'error', message: updateRes.message })
        return
      }

      if (updateRes.data.publicationStatus !== targetPublicationStatus) {
        const pubRes = await activeRepo.setPublicationStatus(
          updateRes.state,
          editingExperimentId,
          targetPublicationStatus,
          authState,
        )
        setLoading(false)
        if (!pubRes.ok) {
          setExperimentState(updateRes.state)
          setFeedback({ tone: 'error', message: pubRes.message })
          return
        }
        setExperimentState(pubRes.state)
        setFeedback({ tone: 'success', message: pubRes.message })
        resetForm()
        return
      }

      setLoading(false)
      setExperimentState(updateRes.state)
      setFeedback({ tone: 'success', message: updateRes.message })
      resetForm()
      return
    }

    const createRes = await activeRepo.createExperiment(
      experimentState,
      {
        title,
        slug: slug || normalizeExperimentSlug(title),
        shortDescription,
        categoryId,
        difficulty,
        estimatedDurationMinutes: Number.isNaN(parsedDuration) ? 0 : parsedDuration,
        status: simulationStatus,
        simulationId: simulationStatus === 'demo' ? slug : null,
        illustration,
        contentReviewStatus,
        publicationStatus: targetPublicationStatus,
        about: aboutLines,
        objectives: objectiveLines,
        requiredTools: toolsList,
        requiredMaterials: materialsList,
        safety: safetyPayload,
        safetyReviewStatus,
        mediaReferences: [illustration],
        lessonId: lessonId || null,
      },
      authState,
    )

    setLoading(false)
    if (!createRes.ok) {
      setFeedback({ tone: 'error', message: createRes.message })
      return
    }

    setExperimentState(createRes.state)
    setFeedback({ tone: 'success', message: createRes.message })
    resetForm()
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitExperimentForm('draft')
  }

  const handleQuickStatusChange = async (
    experimentId: string,
    nextStatus: ExperimentPublicationStatus,
  ) => {
    setLoading(true)
    setFeedback(null)
    const res = await activeRepo.setPublicationStatus(
      experimentState,
      experimentId,
      nextStatus,
      authState,
    )
    setLoading(false)
    setPendingArchiveId(null)
    if (!res.ok) {
      setFeedback({ tone: 'error', message: res.message })
      return
    }
    setExperimentState(res.state)
    setFeedback({ tone: 'success', message: res.message })
  }

  const inputClass =
    'mt-1.5 min-h-10 w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm text-ink focus-visible:outline-teal disabled:opacity-60'

  const canEnable3DInEditor =
    formMode === 'edit' &&
    editingExperimentId !== null &&
    isRegisteredSimulationForExperiment(editingExperimentId, editingExperimentId)

  return (
    <div className="space-y-8 py-6 sm:py-8">
      <PageHeader
        eyebrow="Experiments"
        title="Experiments Management Workspace"
        description="Create, edit, organize, publish, and archive chemistry experiment metadata while preserving the registered 3D simulation architecture."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <ButtonLink to={routePaths.experiments} variant="secondary" size="sm">
              View Public Catalog
            </ButtonLink>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => resetForm()}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Experiment
            </Button>
          </div>
        }
      />

      {feedback && (
        <div
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-medium ${
            feedback.tone === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-900'
              : 'border-emerald-300 bg-emerald-50 text-emerald-900'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section
        aria-label="Experiment catalog metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Total Experiments</span>
            <FlaskConical className="h-4 w-4 text-teal" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{summaryCounts.total}</p>
          <p className="text-xs text-ink-secondary">
            {summaryCounts.published} published · {summaryCounts.draft} draft ·{' '}
            {summaryCounts.archived} archived
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Published Catalog</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{summaryCounts.published}</p>
          <p className="text-xs text-ink-secondary">
            Visible in the public student experiment catalog
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>3D Lab Available</span>
            <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{summaryCounts.labAvailable}</p>
          <p className="text-xs text-ink-secondary">
            Backed by verified 3D simulation engine definitions
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>3D Lab Not Available</span>
            <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">
            {summaryCounts.total - summaryCounts.labAvailable}
          </p>
          <p className="text-xs text-ink-secondary">
            Educational metadata only (3D workbench planned)
          </p>
        </Card>
      </section>

      {/* Search & Filters */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">Search & Filter Experiments</h2>
          <span className="text-xs text-ink-secondary">
            Filter by category, publication status, or 3D simulation availability
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="exp-search-input" className="block text-xs font-semibold text-ink">
              Search Experiments
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="exp-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, slug, or description..."
                className="min-h-10 w-full rounded-lg border border-line-strong bg-white py-2 pr-3 pl-9 text-sm text-ink focus-visible:outline-teal"
              />
            </div>
          </div>

          <div>
            <label htmlFor="exp-filter-category" className="block text-xs font-semibold text-ink">
              Category
            </label>
            <select
              id="exp-filter-category"
              className={inputClass}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {experimentState.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exp-filter-status" className="block text-xs font-semibold text-ink">
              Publication Status
            </label>
            <select
              id="exp-filter-status"
              className={inputClass}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | ExperimentPublicationStatus)
              }
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label htmlFor="exp-filter-sim" className="block text-xs font-semibold text-ink">
              Simulation Availability
            </label>
            <select
              id="exp-filter-sim"
              className={inputClass}
              value={simulationFilter}
              onChange={(e) =>
                setSimulationFilter(e.target.value as 'all' | 'available' | 'unavailable')
              }
            >
              <option value="all">All Experiments</option>
              <option value="available">3D Lab Available</option>
              <option value="unavailable">3D Lab Not Available</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Archive Confirmation Dialog */}
      {pendingArchiveId && (
        <Card
          padding="md"
          role="alertdialog"
          aria-labelledby="confirm-archive-heading"
          className="border-amber-300 bg-amber-50/90"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <h2 id="confirm-archive-heading" className="text-sm font-bold text-amber-950">
                  Archive Experiment
                </h2>
                <p className="text-xs leading-relaxed text-amber-900">
                  Archiving hides{' '}
                  <strong>
                    {experimentState.experiments.find((e) => e.id === pendingArchiveId)?.title ??
                      pendingArchiveId}
                  </strong>{' '}
                  from the public student catalog while preserving existing student progress
                  records and stable IDs.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPendingArchiveId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={loading}
                onClick={() => void handleQuickStatusChange(pendingArchiveId, 'archived')}
              >
                Archive
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Searchable Experiment List Table */}
      <section aria-labelledby="admin-experiments-table-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="admin-experiments-table-heading" className="text-base font-bold text-ink">
              Experiment Records ({filteredExperiments.length})
            </h2>
            <p className="text-sm text-ink-secondary">
              Content publication is separate from 3D simulation availability. Only registered
              simulations offer a playable 3D laboratory.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => resetForm()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Experiment
          </Button>
        </div>

        <Card padding="md" className="overflow-x-auto">
          {filteredExperiments.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-ink">
                No experiments match the selected filters.
              </p>
              <p className="mt-1 text-xs text-ink-secondary">
                Clear the search filters or use the Add Experiment form below to create a draft
                experiment.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold tracking-wider text-ink-muted uppercase">
                  <th className="pb-3 pr-3">Experiment</th>
                  <th className="pb-3 px-3">Category & Difficulty</th>
                  <th className="pb-3 px-3">Duration</th>
                  <th className="pb-3 px-3">Curriculum Assignment</th>
                  <th className="pb-3 px-3">Content Review</th>
                  <th className="pb-3 px-3">Publication</th>
                  <th className="pb-3 px-3">Simulation Availability</th>
                  <th className="pb-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredExperiments.map((exp) => {
                  const category = categoryById.get(exp.categoryId)
                  const assignedLesson = exp.lessonId ? lessonById.get(exp.lessonId) : undefined
                  const has3DLab =
                    exp.status === 'demo' &&
                    isRegisteredSimulationForExperiment(exp.id, exp.simulationId ?? exp.id)

                  return (
                    <tr key={exp.id} className="align-middle">
                      <td className="py-3.5 pr-3">
                        <p className="font-semibold text-ink">{exp.title}</p>
                        <p className="font-mono text-xs text-ink-muted">
                          {exp.id} · {exp.slug}
                        </p>
                        <p className="mt-1 line-clamp-2 max-w-xs text-xs text-ink-secondary">
                          {exp.shortDescription}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 text-xs">
                        <p className="font-semibold text-ink">
                          {category?.label ?? exp.categoryId}
                        </p>
                        <p className="text-ink-secondary">
                          {experimentDifficultyLabels[exp.difficulty]}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 text-xs font-medium text-ink">
                        ~{exp.estimatedDurationMinutes} min
                      </td>

                      <td className="py-3.5 px-3 text-xs text-ink-secondary">
                        {assignedLesson ? (
                          <span className="font-medium text-ink">{assignedLesson.title}</span>
                        ) : exp.lessonId ? (
                          <span className="font-mono text-ink">{exp.lessonId}</span>
                        ) : (
                          <span>Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-xs">
                        <StatusPill
                          tone={exp.contentReviewStatus === 'reviewed' ? 'ready' : 'neutral'}
                        >
                          {exp.contentReviewStatus === 'reviewed' ? 'Reviewed' : 'Draft Review'}
                        </StatusPill>
                      </td>

                      <td className="py-3.5 px-3">
                        {renderPublicationPill(exp.publicationStatus)}
                      </td>

                      <td className="py-3.5 px-3">
                        {has3DLab ? (
                          <StatusPill tone="ready" dot>
                            3D Lab Available
                          </StatusPill>
                        ) : (
                          <StatusPill tone="neutral" dot>
                            3D Lab Not Available
                          </StatusPill>
                        )}
                      </td>

                      <td className="py-3.5 pl-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditExperiment(exp)}
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit Experiment
                          </Button>

                          {exp.publicationStatus !== 'published' ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={loading}
                              onClick={() => void handleQuickStatusChange(exp.id, 'published')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Publish Experiment
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={loading}
                              onClick={() => void handleQuickStatusChange(exp.id, 'draft')}
                            >
                              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                              Save Draft
                            </Button>
                          )}

                          {exp.publicationStatus !== 'archived' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                              onClick={() => setPendingArchiveId(exp.id)}
                            >
                              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                              Archive
                            </Button>
                          )}

                          <ButtonLink
                            to={getExperimentPaths(exp.id).details}
                            variant="ghost"
                            size="sm"
                          >
                            Preview
                          </ButtonLink>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      {/* Create / Edit Experiment Form */}
      <section aria-labelledby="experiment-editor-heading">
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 id="experiment-editor-heading" className="text-base font-bold text-ink">
                {formMode === 'edit' ? 'Edit Experiment' : 'Add Experiment'}
              </h2>
              <p className="text-xs text-ink-secondary">
                {formMode === 'edit'
                  ? `Editing stable experiment ID: ${editingExperimentId}`
                  : 'Create a new experiment metadata record. New experiments default to Draft and 3D Lab Not Available.'}
              </p>
            </div>
            <StatusPill tone={canEnable3DInEditor ? 'ready' : 'neutral'} dot>
              {canEnable3DInEditor ? '3D Lab Available' : '3D Lab Not Available'}
            </StatusPill>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label htmlFor="exp-title-input" className="block text-xs font-semibold text-ink">
                  Experiment Name
                </label>
                <input
                  id="exp-title-input"
                  type="text"
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Separating Mixtures by Filtration"
                  required
                />
              </div>

              <div>
                <label htmlFor="exp-slug-input" className="block text-xs font-semibold text-ink">
                  Experiment Slug
                </label>
                <input
                  id="exp-slug-input"
                  type="text"
                  className={inputClass}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div>
                <label
                  htmlFor="exp-duration-input"
                  className="block text-xs font-semibold text-ink"
                >
                  Estimated Duration (minutes)
                </label>
                <input
                  id="exp-duration-input"
                  type="number"
                  min={1}
                  max={240}
                  className={inputClass}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="exp-category-select"
                  className="block text-xs font-semibold text-ink"
                >
                  Category
                </label>
                <select
                  id="exp-category-select"
                  className={inputClass}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {experimentState.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="exp-difficulty-select"
                  className="block text-xs font-semibold text-ink"
                >
                  Difficulty
                </label>
                <select
                  id="exp-difficulty-select"
                  className={inputClass}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as ExperimentDifficulty)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="exp-illustration-select"
                  className="block text-xs font-semibold text-ink"
                >
                  Approved Illustration Reference
                </label>
                <select
                  id="exp-illustration-select"
                  className={inputClass}
                  value={illustration}
                  onChange={(e) =>
                    setIllustration(e.target.value as ExperimentIllustrationKey)
                  }
                >
                  <option value="salt-dissolution">Salt Dissolution Illustration</option>
                  <option value="liquid-volume">Liquid Volume Illustration</option>
                  <option value="ph-indicators">pH Indicators Illustration</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="exp-lesson-select"
                  className="block text-xs font-semibold text-ink"
                >
                  Associated Curriculum Lesson
                </label>
                <select
                  id="exp-lesson-select"
                  className={inputClass}
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {availableLessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title} ({lesson.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="exp-short-desc-input"
                className="block text-xs font-semibold text-ink"
              >
                Short Description
              </label>
              <textarea
                id="exp-short-desc-input"
                rows={2}
                className={inputClass}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Concise summary displayed on catalog cards and the experiment header..."
                required
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="exp-about-input" className="block text-xs font-semibold text-ink">
                  Educational Explanation (one paragraph per line)
                </label>
                <textarea
                  id="exp-about-input"
                  rows={4}
                  className={inputClass}
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder="Enter educational explanation paragraphs..."
                />
              </div>

              <div>
                <label
                  htmlFor="exp-objectives-input"
                  className="block text-xs font-semibold text-ink"
                >
                  Learning Objectives (one objective per line)
                </label>
                <textarea
                  id="exp-objectives-input"
                  rows={4}
                  className={inputClass}
                  value={objectivesText}
                  onChange={(e) => setObjectivesText(e.target.value)}
                  placeholder="Enter student learning objectives..."
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="exp-tools-input" className="block text-xs font-semibold text-ink">
                  Required Tools (comma-separated)
                </label>
                <input
                  id="exp-tools-input"
                  type="text"
                  className={inputClass}
                  value={requiredToolsText}
                  onChange={(e) => setRequiredToolsText(e.target.value)}
                  placeholder="e.g., Beaker, Graduated Cylinder, Glass Stirring Rod"
                />
              </div>

              <div>
                <label
                  htmlFor="exp-materials-input"
                  className="block text-xs font-semibold text-ink"
                >
                  Required Materials (comma-separated)
                </label>
                <input
                  id="exp-materials-input"
                  type="text"
                  className={inputClass}
                  value={requiredMaterialsText}
                  onChange={(e) => setRequiredMaterialsText(e.target.value)}
                  placeholder="e.g., Water (H₂O), Sodium Chloride (NaCl)"
                />
              </div>
            </div>

            {/* Safety & Review Controls */}
            <div className="grid gap-4 rounded-xl border border-line bg-surface-muted/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="exp-safety-level-select"
                  className="block text-xs font-semibold text-ink"
                >
                  Safety Precaution Level
                </label>
                <select
                  id="exp-safety-level-select"
                  className={inputClass}
                  value={safetyLevel}
                  onChange={(e) =>
                    setSafetyLevel(
                      e.target.value as 'none' | 'low' | 'moderate' | 'medium' | 'high',
                    )
                  }
                >
                  <option value="none">{safetyLevelLabels.none}</option>
                  <option value="low">{safetyLevelLabels.low}</option>
                  <option value="medium">{safetyLevelLabels.medium}</option>
                  <option value="moderate">{safetyLevelLabels.moderate}</option>
                  <option value="high">{safetyLevelLabels.high}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="exp-content-review-select"
                  className="block text-xs font-semibold text-ink"
                >
                  Content Review Status
                </label>
                <select
                  id="exp-content-review-select"
                  className={inputClass}
                  value={contentReviewStatus}
                  onChange={(e) =>
                    setContentReviewStatus(e.target.value as ExperimentReviewStatus)
                  }
                >
                  <option value="draft">Draft (Under Review)</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="exp-safety-review-select"
                  className="block text-xs font-semibold text-ink"
                >
                  Safety Guidance Review
                </label>
                <select
                  id="exp-safety-review-select"
                  className={inputClass}
                  value={safetyReviewStatus}
                  onChange={(e) =>
                    setSafetyReviewStatus(e.target.value as ExperimentReviewStatus)
                  }
                >
                  <option value="draft">Draft Safety Notes</option>
                  <option value="reviewed">Reviewed Safety Guidance</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="exp-simulation-select"
                  className="block text-xs font-semibold text-ink"
                >
                  Registered 3D Simulation
                </label>
                <select
                  id="exp-simulation-select"
                  className={inputClass}
                  value={simulationStatus}
                  onChange={(e) =>
                    setSimulationStatus(e.target.value as ExperimentStatus)
                  }
                  disabled={!canEnable3DInEditor}
                >
                  <option value="planned">3D Lab Not Available (Planned)</option>
                  {canEnable3DInEditor && (
                    <option value="demo">
                      3D Lab Available ({registeredSimulations[0]?.label})
                    </option>
                  )}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label
                  htmlFor="exp-safety-note-input"
                  className="block text-xs font-semibold text-ink"
                >
                  Safety Information & Handling Note
                </label>
                <input
                  id="exp-safety-note-input"
                  type="text"
                  className={inputClass}
                  value={safetyNote}
                  onChange={(e) => setSafetyNote(e.target.value)}
                  placeholder="Enter verified laboratory safety precautions (do not invent unverified hazards)..."
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={requiresSupervision}
                    onChange={(e) => setRequiresSupervision(e.target.checked)}
                    className="rounded border-line-strong text-teal focus:ring-teal"
                  />
                  Requires instructor supervision in physical laboratory settings
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line pt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => resetForm()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={loading}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={loading}
                onClick={() => void submitExperimentForm('published')}
              >
                Publish Experiment
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  )
}
