import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Edit3,
  FileText,
  FlaskConical,
  Layers,
  Plus,
  Search,
  Trash2,
  Undo2,
} from 'lucide-react'
import { routePaths } from '@/app/paths'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { useAuth } from '@/features/auth/authContext'
import {
  createInitialAdminCurriculumState,
  normalizeCurriculumSlug,
  sortManagedLessons,
  sortManagedUnits,
  type AdminCurriculumState,
  type CurriculumPublicationStatus,
  type ManagedCurriculumLesson,
  type ManagedCurriculumUnit,
} from '@/features/curriculum/lib/curriculumManagement'
import {
  createSupabaseCurriculumRepository,
  getActiveManagedCurriculumState,
  type CurriculumManagementRepository,
  type SupabaseLikeClient,
} from '@/features/curriculum/lib/curriculumManagementRepository'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface AdminCurriculumPageProps {
  initialState?: AdminCurriculumState
  repository?: CurriculumManagementRepository
  initialSelectedGradeId?: string
  initialSelectedTermId?: string
  initialSelectedUnitId?: string
  initialSearchQuery?: string
  initialStatusFilter?: 'all' | CurriculumPublicationStatus
  initialPendingDelete?: { type: 'unit' | 'lesson'; id: string } | null
}

function renderPublicationPill(status: CurriculumPublicationStatus) {
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

export function AdminCurriculumPage({
  initialState,
  repository,
  initialSelectedGradeId = 'grade-secondary-1',
  initialSelectedTermId = 'term-secondary-1-1',
  initialSelectedUnitId = 'all',
  initialSearchQuery = '',
  initialStatusFilter = 'all',
  initialPendingDelete = null,
}: AdminCurriculumPageProps = {}) {
  usePageTitle('Curriculum Management')
  const { state: authState } = useAuth()

  const activeRepo = useMemo<CurriculumManagementRepository>(() => {
    if (repository) return repository
    const client = getSupabaseClient() as unknown as SupabaseLikeClient | null
    return createSupabaseCurriculumRepository(client)
  }, [repository])

  const [curriculumState, setCurriculumState] = useState<AdminCurriculumState>(() => {
    if (initialState) return initialState
    const shared = getActiveManagedCurriculumState()
    if (shared) return shared
    return createInitialAdminCurriculumState()
  })

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  const [selectedGradeId, setSelectedGradeId] = useState<string>(initialSelectedGradeId)
  const [selectedTermId, setSelectedTermId] = useState<string>(initialSelectedTermId)
  const [selectedUnitId, setSelectedUnitId] = useState<string>(initialSelectedUnitId)
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery)
  const [statusFilter, setStatusFilter] = useState<'all' | CurriculumPublicationStatus>(
    initialStatusFilter,
  )

  // Unit form state (Add Unit / Edit Unit)
  const [unitFormMode, setUnitFormMode] = useState<'create' | 'edit'>('create')
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [unitTermId, setUnitTermId] = useState<string>(
    initialSelectedTermId === 'all' ? 'term-secondary-1-1' : initialSelectedTermId,
  )
  const [unitTitle, setUnitTitle] = useState<string>('')
  const [unitSlug, setUnitSlug] = useState<string>('')
  const [unitDescription, setUnitDescription] = useState<string>('')
  const [unitOrder, setUnitOrder] = useState<string>('1')

  // Lesson form state (Add Lesson / Edit Lesson)
  const [lessonFormMode, setLessonFormMode] = useState<'create' | 'edit'>('create')
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [lessonUnitId, setLessonUnitId] = useState<string>('')
  const [lessonTitle, setLessonTitle] = useState<string>('')
  const [lessonSlug, setLessonSlug] = useState<string>('')
  const [lessonDescription, setLessonDescription] = useState<string>('')
  const [lessonOrder, setLessonOrder] = useState<string>('1')

  // Confirmation dialog state for Delete operations
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'unit' | 'lesson'
    id: string
  } | null>(initialPendingDelete)

  useEffect(() => {
    if (initialState) return
    const client = getSupabaseClient()
    if (!client && !repository) return
    let mounted = true
    void activeRepo.loadAdminState(authState).then((res) => {
      if (!mounted) return
      if (res.ok) {
        setCurriculumState(res.state)
      }
    })
    return () => {
      mounted = false
    }
  }, [activeRepo, authState, initialState, repository])

  const grades = curriculumState.grades
  const termsForSelectedGrade = useMemo(() => {
    if (!selectedGradeId || selectedGradeId === 'all') {
      return curriculumState.terms
    }
    return curriculumState.terms.filter((term) => term.gradeId === selectedGradeId)
  }, [curriculumState.terms, selectedGradeId])

  const termById = useMemo(
    () => new Map(curriculumState.terms.map((term) => [term.id, term])),
    [curriculumState.terms],
  )
  const gradeById = useMemo(
    () => new Map(curriculumState.grades.map((grade) => [grade.id, grade])),
    [curriculumState.grades],
  )
  const unitById = useMemo(
    () => new Map(curriculumState.units.map((unit) => [unit.id, unit])),
    [curriculumState.units],
  )

  const filteredUnits = useMemo(() => {
    const allowedTermIds = new Set(
      selectedTermId && selectedTermId !== 'all'
        ? [selectedTermId]
        : termsForSelectedGrade.map((term) => term.id),
    )
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return sortManagedUnits(curriculumState.units).filter((unit) => {
      if (!allowedTermIds.has(unit.termId)) return false
      if (statusFilter !== 'all' && unit.publicationStatus !== statusFilter) return false
      if (!normalizedSearch) return true
      return (
        unit.title.toLowerCase().includes(normalizedSearch) ||
        unit.slug.toLowerCase().includes(normalizedSearch) ||
        (unit.description ?? '').toLowerCase().includes(normalizedSearch)
      )
    })
  }, [curriculumState.units, searchQuery, selectedTermId, statusFilter, termsForSelectedGrade])

  const filteredLessons = useMemo(() => {
    const visibleUnitIds = new Set(
      selectedUnitId && selectedUnitId !== 'all'
        ? [selectedUnitId]
        : filteredUnits.map((unit) => unit.id),
    )
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return sortManagedLessons(curriculumState.lessons).filter((lesson) => {
      if (!visibleUnitIds.has(lesson.unitId)) return false
      if (statusFilter !== 'all' && lesson.publicationStatus !== statusFilter) return false
      if (!normalizedSearch) return true
      return (
        lesson.title.toLowerCase().includes(normalizedSearch) ||
        lesson.slug.toLowerCase().includes(normalizedSearch) ||
        (lesson.description ?? '').toLowerCase().includes(normalizedSearch)
      )
    })
  }, [curriculumState.lessons, filteredUnits, searchQuery, selectedUnitId, statusFilter])

  const summaryCounts = useMemo(() => {
    const publishedUnits = curriculumState.units.filter(
      (unit) => unit.publicationStatus === 'published',
    ).length
    const draftUnits = curriculumState.units.filter(
      (unit) => unit.publicationStatus === 'draft',
    ).length
    const publishedLessons = curriculumState.lessons.filter(
      (lesson) => lesson.publicationStatus === 'published',
    ).length
    const draftLessons = curriculumState.lessons.filter(
      (lesson) => lesson.publicationStatus === 'draft',
    ).length
    return {
      totalGrades: curriculumState.grades.length,
      totalTerms: curriculumState.terms.length,
      totalUnits: curriculumState.units.length,
      publishedUnits,
      draftUnits,
      totalLessons: curriculumState.lessons.length,
      publishedLessons,
      draftLessons,
    }
  }, [curriculumState])

  const resetUnitForm = (defaultTermId?: string) => {
    const targetTerm =
      defaultTermId ||
      (selectedTermId !== 'all' ? selectedTermId : termsForSelectedGrade[0]?.id ?? 'term-secondary-1-1')
    const existingTermUnits = curriculumState.units.filter((u) => u.termId === targetTerm)
    const nextOrder = existingTermUnits.reduce((max, u) => Math.max(max, u.order), 0) + 1
    setUnitFormMode('create')
    setEditingUnitId(null)
    setUnitTermId(targetTerm)
    setUnitTitle('')
    setUnitSlug('')
    setUnitDescription('')
    setUnitOrder(String(nextOrder))
  }

  const startEditUnit = (unit: ManagedCurriculumUnit) => {
    setUnitFormMode('edit')
    setEditingUnitId(unit.id)
    setUnitTermId(unit.termId)
    setUnitTitle(unit.title)
    setUnitSlug(unit.slug)
    setUnitDescription(unit.description ?? '')
    setUnitOrder(String(unit.order))
    setFeedback(null)
  }

  const resetLessonForm = (defaultUnitId?: string) => {
    const targetUnit =
      defaultUnitId ||
      (selectedUnitId !== 'all' ? selectedUnitId : filteredUnits[0]?.id ?? curriculumState.units[0]?.id ?? '')
    const existingLessons = curriculumState.lessons.filter((l) => l.unitId === targetUnit)
    const nextOrder = existingLessons.reduce((max, l) => Math.max(max, l.order), 0) + 1
    setLessonFormMode('create')
    setEditingLessonId(null)
    setLessonUnitId(targetUnit)
    setLessonTitle('')
    setLessonSlug('')
    setLessonDescription('')
    setLessonOrder(String(nextOrder))
  }

  const startEditLesson = (lesson: ManagedCurriculumLesson) => {
    setLessonFormMode('edit')
    setEditingLessonId(lesson.id)
    setLessonUnitId(lesson.unitId)
    setLessonTitle(lesson.title)
    setLessonSlug(lesson.slug)
    setLessonDescription(lesson.description ?? '')
    setLessonOrder(String(lesson.order))
    setFeedback(null)
  }

  const handleSaveUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    const parsedOrder = Number.parseInt(unitOrder, 10)
    const result =
      unitFormMode === 'edit' && editingUnitId
        ? await activeRepo.updateUnit(
            curriculumState,
            {
              unitId: editingUnitId,
              termId: unitTermId,
              title: unitTitle,
              slug: unitSlug || normalizeCurriculumSlug(unitTitle),
              description: unitDescription,
              order: Number.isNaN(parsedOrder) ? 0 : parsedOrder,
            },
            authState,
          )
        : await activeRepo.createUnit(
            curriculumState,
            {
              termId: unitTermId,
              title: unitTitle,
              slug: unitSlug || normalizeCurriculumSlug(unitTitle),
              description: unitDescription,
              order: Number.isNaN(parsedOrder) ? undefined : parsedOrder,
            },
            authState,
          )

    setLoading(false)
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message })
      return
    }

    setCurriculumState(result.state)
    setFeedback({ tone: 'success', message: result.message })
    if (!lessonUnitId) {
      setLessonUnitId(result.data.id)
    }
    resetUnitForm(unitTermId)
  }

  const handleSaveLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    const targetUnitId =
      lessonUnitId ||
      (selectedUnitId !== 'all' ? selectedUnitId : filteredUnits[0]?.id ?? curriculumState.units[0]?.id ?? '')

    const parsedOrder = Number.parseInt(lessonOrder, 10)
    const result =
      lessonFormMode === 'edit' && editingLessonId
        ? await activeRepo.updateLesson(
            curriculumState,
            {
              lessonId: editingLessonId,
              unitId: targetUnitId,
              title: lessonTitle,
              slug: lessonSlug || normalizeCurriculumSlug(lessonTitle),
              description: lessonDescription,
              order: Number.isNaN(parsedOrder) ? 0 : parsedOrder,
            },
            authState,
          )
        : await activeRepo.createLesson(
            curriculumState,
            {
              unitId: targetUnitId,
              title: lessonTitle,
              slug: lessonSlug || normalizeCurriculumSlug(lessonTitle),
              description: lessonDescription,
              order: Number.isNaN(parsedOrder) ? undefined : parsedOrder,
            },
            authState,
          )

    setLoading(false)
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message })
      return
    }

    setCurriculumState(result.state)
    setFeedback({ tone: 'success', message: result.message })
    resetLessonForm(targetUnitId)
  }

  const handleUnitPublication = async (
    unitId: string,
    nextStatus: CurriculumPublicationStatus,
  ) => {
    setLoading(true)
    setFeedback(null)
    const result = await activeRepo.setUnitPublicationStatus(
      curriculumState,
      unitId,
      nextStatus,
      authState,
    )
    setLoading(false)
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message })
      return
    }
    setCurriculumState(result.state)
    setFeedback({ tone: 'success', message: result.message })
  }

  const handleLessonPublication = async (
    lessonId: string,
    nextStatus: CurriculumPublicationStatus,
  ) => {
    setLoading(true)
    setFeedback(null)
    const result = await activeRepo.setLessonPublicationStatus(
      curriculumState,
      lessonId,
      nextStatus,
      authState,
    )
    setLoading(false)
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message })
      return
    }
    setCurriculumState(result.state)
    setFeedback({ tone: 'success', message: result.message })
  }

  const handleMoveUnit = async (unitId: string, direction: 'up' | 'down') => {
    setLoading(true)
    setFeedback(null)
    const result = await activeRepo.moveUnitOrder(
      curriculumState,
      unitId,
      direction,
      authState,
    )
    setLoading(false)
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message })
      return
    }
    setCurriculumState(result.state)
    setFeedback({ tone: 'success', message: result.message })
  }

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    setLoading(true)
    setFeedback(null)
    const result = await activeRepo.moveLessonOrder(
      curriculumState,
      lessonId,
      direction,
      authState,
    )
    setLoading(false)
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message })
      return
    }
    setCurriculumState(result.state)
    setFeedback({ tone: 'success', message: result.message })
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setLoading(true)
    setFeedback(null)
    const result =
      pendingDelete.type === 'unit'
        ? await activeRepo.deleteUnit(curriculumState, pendingDelete.id, authState)
        : await activeRepo.deleteLesson(curriculumState, pendingDelete.id, authState)
    setLoading(false)
    setPendingDelete(null)

    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message })
      return
    }
    setCurriculumState(result.state)
    setFeedback({ tone: 'success', message: result.message })
  }

  const inputClass =
    'mt-1.5 min-h-10 w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm text-ink focus-visible:outline-teal disabled:opacity-60'

  return (
    <div className="space-y-8 py-6 sm:py-8">
      <PageHeader
        eyebrow="Curriculum"
        title="Curriculum Management Workspace"
        description="Organize secondary school grades, academic terms, chemistry units, and lesson publication state. Newly created units and lessons default to Draft until explicitly published."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <ButtonLink to={routePaths.curriculum} variant="secondary" size="sm">
              Back to Curriculum
            </ButtonLink>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => resetUnitForm()}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Unit
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

      {/* Hierarchy Summary Metrics */}
      <section aria-label="Curriculum hierarchy summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Secondary Grades</span>
            <Layers className="h-4 w-4 text-teal" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{summaryCounts.totalGrades}</p>
          <p className="text-xs text-ink-secondary">
            First, Second, and Third Secondary Grade structure
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Academic Terms</span>
            <BookOpen className="h-4 w-4 text-teal" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{summaryCounts.totalTerms}</p>
          <p className="text-xs text-ink-secondary">
            First Term and Second Term per secondary grade
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Managed Units</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{summaryCounts.totalUnits}</p>
          <p className="text-xs text-ink-secondary">
            {summaryCounts.publishedUnits} published · {summaryCounts.draftUnits} draft
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Managed Lessons</span>
            <FileText className="h-4 w-4 text-teal" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{summaryCounts.totalLessons}</p>
          <p className="text-xs text-ink-secondary">
            {summaryCounts.publishedLessons} published · {summaryCounts.draftLessons} draft
          </p>
        </Card>
      </section>

      {/* Filter & Search Controls */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">Filter Academic Hierarchy</h2>
          <span className="text-xs text-ink-secondary">
            Select a grade, term, unit, or publication status to inspect and reorder content
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="admin-filter-grade" className="block text-xs font-semibold text-ink">
              Secondary Grade
            </label>
            <select
              id="admin-filter-grade"
              className={inputClass}
              value={selectedGradeId}
              onChange={(event) => {
                const nextGradeId = event.target.value
                setSelectedGradeId(nextGradeId)
                const matchingTerms =
                  nextGradeId === 'all'
                    ? curriculumState.terms
                    : curriculumState.terms.filter((t) => t.gradeId === nextGradeId)
                const nextTermId = matchingTerms[0]?.id ?? 'all'
                setSelectedTermId(nextTermId)
                setSelectedUnitId('all')
                if (nextTermId !== 'all') {
                  setUnitTermId(nextTermId)
                }
              }}
            >
              <option value="all">All Secondary Grades</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-filter-term" className="block text-xs font-semibold text-ink">
              Academic Term
            </label>
            <select
              id="admin-filter-term"
              className={inputClass}
              value={selectedTermId}
              onChange={(event) => {
                const nextTermId = event.target.value
                setSelectedTermId(nextTermId)
                setSelectedUnitId('all')
                if (nextTermId !== 'all') {
                  setUnitTermId(nextTermId)
                }
              }}
            >
              <option value="all">All Terms</option>
              {termsForSelectedGrade.map((term) => {
                const parentGrade = gradeById.get(term.gradeId)
                return (
                  <option key={term.id} value={term.id}>
                    {parentGrade ? `${parentGrade.title} — ${term.title}` : term.title}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label htmlFor="admin-filter-status" className="block text-xs font-semibold text-ink">
              Publication Status
            </label>
            <select
              id="admin-filter-status"
              className={inputClass}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | CurriculumPublicationStatus)
              }
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-filter-search" className="block text-xs font-semibold text-ink">
              Search Units & Lessons
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="admin-filter-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search title or slug..."
                className="min-h-10 w-full rounded-lg border border-line-strong bg-white py-2 pr-3 pl-9 text-sm text-ink focus-visible:outline-teal"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <Card
          padding="md"
          role="alertdialog"
          aria-labelledby="confirm-delete-heading"
          className="border-rose-300 bg-rose-50/90"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
              <div className="space-y-1">
                <h2 id="confirm-delete-heading" className="text-sm font-bold text-rose-950">
                  Confirm Delete {pendingDelete.type === 'unit' ? 'Unit' : 'Lesson'}
                </h2>
                <p className="text-xs leading-relaxed text-rose-900">
                  Are you sure you want to permanently delete{' '}
                  <strong>
                    {pendingDelete.type === 'unit'
                      ? unitById.get(pendingDelete.id)?.title ?? pendingDelete.id
                      : curriculumState.lessons.find((l) => l.id === pendingDelete.id)?.title ??
                        pendingDelete.id}
                  </strong>
                  ? Referenced units with lessons or lessons with linked experiments cannot be
                  deleted and should be archived or unpublished instead.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={loading}
                onClick={() => void handleConfirmDelete()}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Units Table Section */}
      <section aria-labelledby="admin-units-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="admin-units-heading" className="text-base font-bold text-ink">
              Curriculum Units ({filteredUnits.length})
            </h2>
            <p className="text-sm text-ink-secondary">
              Units belong to an academic term. Only published units appear in the student
              curriculum browser.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => resetUnitForm()}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Unit
          </Button>
        </div>

        <Card padding="md" className="overflow-x-auto">
          {filteredUnits.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-ink">
                No curriculum units match the current filter.
              </p>
              <p className="mt-1 text-xs text-ink-secondary">
                Use the Add Unit form below to create a draft unit for this academic term.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold tracking-wider text-ink-muted uppercase">
                  <th className="pb-3 pr-3">Order</th>
                  <th className="pb-3 px-3">Unit Title & Slug</th>
                  <th className="pb-3 px-3">Grade / Term</th>
                  <th className="pb-3 px-3">Lessons</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUnits.map((unit) => {
                  const term = termById.get(unit.termId)
                  const grade = term ? gradeById.get(term.gradeId) : undefined
                  const childLessonCount = curriculumState.lessons.filter(
                    (lesson) => lesson.unitId === unit.id,
                  ).length
                  return (
                    <tr key={unit.id} className="align-middle">
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-surface-muted px-1.5 font-mono text-xs font-bold text-ink">
                            #{unit.order}
                          </span>
                          <button
                            type="button"
                            aria-label={`Move ${unit.title} up`}
                            disabled={loading}
                            onClick={() => void handleMoveUnit(unit.id, 'up')}
                            className="rounded p-1 text-ink-secondary hover:bg-surface-muted hover:text-ink"
                          >
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${unit.title} down`}
                            disabled={loading}
                            onClick={() => void handleMoveUnit(unit.id, 'down')}
                            className="rounded p-1 text-ink-secondary hover:bg-surface-muted hover:text-ink"
                          >
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-ink">{unit.title}</p>
                        <p className="font-mono text-xs text-ink-muted">
                          {unit.slug} · <span className="text-[11px]">{unit.id}</span>
                        </p>
                        {unit.description && (
                          <p className="mt-1 text-xs text-ink-secondary">{unit.description}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-xs text-ink-secondary">
                        <p className="font-medium text-ink">{grade?.title ?? 'Secondary Grade'}</p>
                        <p>{term?.title ?? unit.termId}</p>
                      </td>

                      <td className="py-3.5 px-3 text-xs text-ink-secondary">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUnitId(unit.id)
                            setLessonUnitId(unit.id)
                          }}
                          className="font-semibold text-teal underline-offset-2 hover:underline"
                        >
                          {childLessonCount} {childLessonCount === 1 ? 'lesson' : 'lessons'}
                        </button>
                      </td>

                      <td className="py-3.5 px-3">
                        {renderPublicationPill(unit.publicationStatus)}
                      </td>

                      <td className="py-3.5 pl-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {unit.publicationStatus === 'published' ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={loading}
                              onClick={() => void handleUnitPublication(unit.id, 'draft')}
                            >
                              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Unpublish
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={loading}
                              onClick={() => void handleUnitPublication(unit.id, 'published')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Publish
                            </Button>
                          )}

                          {unit.publicationStatus !== 'archived' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                              onClick={() => void handleUnitPublication(unit.id, 'archived')}
                            >
                              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                              Archive
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditUnit(unit)}
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit Unit
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDelete({ type: 'unit', id: unit.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                            Delete
                          </Button>
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

      {/* Lessons Table Section */}
      <section aria-labelledby="admin-lessons-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="admin-lessons-heading" className="text-base font-bold text-ink">
              Curriculum Lessons ({filteredLessons.length})
            </h2>
            <p className="text-sm text-ink-secondary">
              Lessons belong to a unit and preserve experiment relationships. Only published lessons
              inside published units appear to students.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter lessons by unit"
              className="min-h-9 rounded-lg border border-line-strong bg-white px-3 text-xs font-medium text-ink"
              value={selectedUnitId}
              onChange={(event) => {
                setSelectedUnitId(event.target.value)
                if (event.target.value !== 'all') {
                  setLessonUnitId(event.target.value)
                }
              }}
            >
              <option value="all">All Units in View</option>
              {filteredUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Card padding="md" className="overflow-x-auto">
          {filteredLessons.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-ink">
                No lessons match the selected unit and filters.
              </p>
              <p className="mt-1 text-xs text-ink-secondary">
                Create a unit first, then add or edit lessons using the Lesson editor below.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold tracking-wider text-ink-muted uppercase">
                  <th className="pb-3 pr-3">Order</th>
                  <th className="pb-3 px-3">Lesson Title & Slug</th>
                  <th className="pb-3 px-3">Parent Unit</th>
                  <th className="pb-3 px-3">Experiments</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredLessons.map((lesson) => {
                  const parentUnit = unitById.get(lesson.unitId)
                  const linkedCount = curriculumState.lessonExperiments.filter(
                    (link) => link.lessonId === lesson.id,
                  ).length
                  return (
                    <tr key={lesson.id} className="align-middle">
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-surface-muted px-1.5 font-mono text-xs font-bold text-ink">
                            #{lesson.order}
                          </span>
                          <button
                            type="button"
                            aria-label={`Move ${lesson.title} up`}
                            disabled={loading}
                            onClick={() => void handleMoveLesson(lesson.id, 'up')}
                            className="rounded p-1 text-ink-secondary hover:bg-surface-muted hover:text-ink"
                          >
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${lesson.title} down`}
                            disabled={loading}
                            onClick={() => void handleMoveLesson(lesson.id, 'down')}
                            className="rounded p-1 text-ink-secondary hover:bg-surface-muted hover:text-ink"
                          >
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-ink">{lesson.title}</p>
                        <p className="font-mono text-xs text-ink-muted">
                          {lesson.slug} · <span className="text-[11px]">{lesson.id}</span>
                        </p>
                        {lesson.description && (
                          <p className="mt-1 text-xs text-ink-secondary">{lesson.description}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-xs text-ink-secondary">
                        <p className="font-medium text-ink">
                          {parentUnit?.title ?? lesson.unitId}
                        </p>
                        {parentUnit && parentUnit.publicationStatus !== 'published' && (
                          <p className="text-amber-700">
                            Parent unit is {parentUnit.publicationStatus}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-xs text-ink-secondary">
                        <span className="inline-flex items-center gap-1 font-medium text-ink">
                          <FlaskConical className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                          {linkedCount} linked
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {renderPublicationPill(lesson.publicationStatus)}
                      </td>

                      <td className="py-3.5 pl-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {lesson.publicationStatus === 'published' ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={loading}
                              onClick={() => void handleLessonPublication(lesson.id, 'draft')}
                            >
                              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Unpublish
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={loading}
                              onClick={() => void handleLessonPublication(lesson.id, 'published')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Publish
                            </Button>
                          )}

                          {lesson.publicationStatus !== 'archived' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={loading}
                              onClick={() => void handleLessonPublication(lesson.id, 'archived')}
                            >
                              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                              Archive
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditLesson(lesson)}
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit Lesson
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDelete({ type: 'lesson', id: lesson.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                            Delete
                          </Button>
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

      {/* Unit & Lesson Editor Forms */}
      <section
        aria-label="Curriculum unit and lesson editors"
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* 1. Unit Form (Add Unit / Edit Unit) */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h2 className="text-base font-bold text-ink">
                {unitFormMode === 'edit' ? 'Edit Unit' : 'Add Unit'}
              </h2>
              <p className="text-xs text-ink-secondary">
                {unitFormMode === 'edit'
                  ? `Editing unit ID: ${editingUnitId}`
                  : 'New units are saved in Draft status until published.'}
              </p>
            </div>
            <StatusPill tone="neutral">
              {unitFormMode === 'edit' ? 'Editing' : 'Draft Default'}
            </StatusPill>
          </div>

          <form onSubmit={(e) => void handleSaveUnit(e)} className="space-y-4">
            <div>
              <label htmlFor="unit-term-select" className="block text-xs font-semibold text-ink">
                Parent Academic Term
              </label>
              <select
                id="unit-term-select"
                className={inputClass}
                value={unitTermId}
                onChange={(e) => setUnitTermId(e.target.value)}
                required
              >
                {curriculumState.terms.map((term) => {
                  const grade = gradeById.get(term.gradeId)
                  return (
                    <option key={term.id} value={term.id}>
                      {grade ? `${grade.title} — ${term.title}` : term.title}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="unit-title-input" className="block text-xs font-semibold text-ink">
                  Unit Title
                </label>
                <input
                  id="unit-title-input"
                  type="text"
                  className={inputClass}
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  placeholder="e.g., Unit 1: Chemical Basis of Life"
                  required
                />
              </div>

              <div>
                <label htmlFor="unit-order-input" className="block text-xs font-semibold text-ink">
                  Display Order
                </label>
                <input
                  id="unit-order-input"
                  type="number"
                  min={1}
                  className={inputClass}
                  value={unitOrder}
                  onChange={(e) => setUnitOrder(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="unit-slug-input" className="block text-xs font-semibold text-ink">
                Unit Slug (URL-safe identifier)
              </label>
              <input
                id="unit-slug-input"
                type="text"
                className={inputClass}
                value={unitSlug}
                onChange={(e) => setUnitSlug(e.target.value)}
                placeholder="Auto-generated from title if left empty"
              />
            </div>

            <div>
              <label
                htmlFor="unit-description-input"
                className="block text-xs font-semibold text-ink"
              >
                Unit Description
              </label>
              <textarea
                id="unit-description-input"
                rows={3}
                className={inputClass}
                value={unitDescription}
                onChange={(e) => setUnitDescription(e.target.value)}
                placeholder="Short summary of the unit scope and learning focus..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => resetUnitForm()}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading}>
                {unitFormMode === 'edit' ? 'Save Changes' : 'Add Unit'}
              </Button>
            </div>
          </form>
        </Card>

        {/* 2. Lesson Form (Add Lesson / Edit Lesson) */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h2 className="text-base font-bold text-ink">
                {lessonFormMode === 'edit' ? 'Edit Lesson' : 'Add / Edit Lesson'}
              </h2>
              <p className="text-xs text-ink-secondary">
                {lessonFormMode === 'edit'
                  ? `Editing lesson ID: ${editingLessonId}`
                  : 'New lessons are saved in Draft status until published.'}
              </p>
            </div>
            <StatusPill tone="neutral">
              {lessonFormMode === 'edit' ? 'Edit Lesson' : 'Draft Default'}
            </StatusPill>
          </div>

          <form onSubmit={(e) => void handleSaveLesson(e)} className="space-y-4">
            <div>
              <label htmlFor="lesson-unit-select" className="block text-xs font-semibold text-ink">
                Parent Curriculum Unit
              </label>
              <select
                id="lesson-unit-select"
                className={inputClass}
                value={
                  lessonUnitId ||
                  (selectedUnitId !== 'all'
                    ? selectedUnitId
                    : filteredUnits[0]?.id ?? curriculumState.units[0]?.id ?? '')
                }
                onChange={(e) => setLessonUnitId(e.target.value)}
                required
              >
                <option value="">Select a parent unit</option>
                {sortManagedUnits(curriculumState.units).map((unit) => {
                  const term = termById.get(unit.termId)
                  return (
                    <option key={unit.id} value={unit.id}>
                      {term ? `${unit.title} (${term.title})` : unit.title}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="lesson-title-input"
                  className="block text-xs font-semibold text-ink"
                >
                  Lesson Title
                </label>
                <input
                  id="lesson-title-input"
                  type="text"
                  className={inputClass}
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g., Lesson 1: Aqueous Solutions"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="lesson-order-input"
                  className="block text-xs font-semibold text-ink"
                >
                  Display Order
                </label>
                <input
                  id="lesson-order-input"
                  type="number"
                  min={1}
                  className={inputClass}
                  value={lessonOrder}
                  onChange={(e) => setLessonOrder(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="lesson-slug-input" className="block text-xs font-semibold text-ink">
                Lesson Slug (URL-safe identifier)
              </label>
              <input
                id="lesson-slug-input"
                type="text"
                className={inputClass}
                value={lessonSlug}
                onChange={(e) => setLessonSlug(e.target.value)}
                placeholder="Auto-generated from title if left empty"
              />
            </div>

            <div>
              <label
                htmlFor="lesson-description-input"
                className="block text-xs font-semibold text-ink"
              >
                Lesson Description
              </label>
              <textarea
                id="lesson-description-input"
                rows={3}
                className={inputClass}
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Short summary of the lesson objectives and topics..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => resetLessonForm()}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  )
}
