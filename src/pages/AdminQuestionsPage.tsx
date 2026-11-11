import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileQuestion,
  History,
  Layers,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { MultipleChoiceQuestion } from '@/types/assessment'
import type { ExperimentDifficulty } from '@/types/experiment'
import { useAuth } from '@/features/auth/authContext'
import type { SupabaseLikeClient } from '@/features/curriculum/lib/curriculumManagementRepository'
import { QuizProgressBar } from '@/features/assessments/components/QuizProgressBar'
import { QuizQuestionCard } from '@/features/assessments/components/QuizQuestionCard'
import {
  getOrderedAssessmentQuestions,
  getOrderedQuestionOptions,
} from '@/features/assessments/lib/assessmentSelectors'
import {
  assertQuestionBankAdminAccess,
  createInitialAdminQuestionBankState,
  filterManagedAssessments,
  previewAssessmentQuiz,
  validateAssessmentPublishReadiness,
  type AdminQuestionBankState,
  type AssessmentPublicationStatus,
  type ManagedAssessmentRecord,
  type QuestionEditorInput,
  type QuestionOptionInput,
  type QuizPreviewOutcome,
} from '@/features/assessments/lib/questionBankManagement'
import {
  createQuestionBankRepository,
  getActiveManagedQuestionBankState,
  setActiveManagedQuestionBankState,
} from '@/features/assessments/lib/questionBankRepository'
import { mockExperiments } from '@/features/experiments/data/mockExperiments'
import { getActiveManagedExperimentState } from '@/features/experiments/lib/experimentManagementRepository'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface AdminQuestionsPageProps {
  initialState?: AdminQuestionBankState
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

function createBlankOptions(prefix: string): QuestionOptionInput[] {
  return [
    { id: `${prefix}-opt-1`, text: '', order: 1 },
    { id: `${prefix}-opt-2`, text: '', order: 2 },
    { id: `${prefix}-opt-3`, text: '', order: 3 },
    { id: `${prefix}-opt-4`, text: '', order: 4 },
  ]
}

function getStatusBadgeClasses(status: AssessmentPublicationStatus): string {
  switch (status) {
    case 'published':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    case 'reviewed':
      return 'border-teal/30 bg-teal-soft/50 text-teal-dark'
    case 'archived':
      return 'border-line-strong bg-surface-muted text-slate'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-900'
  }
}

function formatPublicationLabel(status: AssessmentPublicationStatus): string {
  switch (status) {
    case 'published':
      return 'Published'
    case 'reviewed':
      return 'Reviewed'
    case 'archived':
      return 'Archived'
    default:
      return 'Draft'
  }
}

function getAvailableExperiments(): {
  id: string
  title: string
  objectives: readonly { id: string; text: string }[]
}[] {
  const managedExp = getActiveManagedExperimentState()
  if (managedExp && managedExp.experiments.length > 0) {
    return managedExp.experiments.map((exp) => ({
      id: exp.id,
      title: exp.title,
      objectives: exp.objectives,
    }))
  }
  return mockExperiments.map((exp) => ({
    id: exp.id,
    title: exp.title,
    objectives: exp.learning?.objectives ?? [],
  }))
}

export function AdminQuestionsPage({ initialState }: AdminQuestionsPageProps = {}) {
  usePageTitle('Admin — Question Bank')
  const { state: authState } = useAuth()

  const repository = useMemo(() => {
    const client = getSupabaseClient() as unknown as SupabaseLikeClient | null
    return createQuestionBankRepository(client)
  }, [])

  const [bankState, setBankState] = useState<AdminQuestionBankState>(() => {
    if (initialState) {
      return initialState
    }
    return getActiveManagedQuestionBankState() ?? createInitialAdminQuestionBankState()
  })

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    () => bankState.assessments[0]?.id ?? 'assessment-salt-water-001',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [experimentFilter, setExperimentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<AssessmentPublicationStatus | 'all'>(
    'all',
  )

  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  // New assessment creation modal/drawer state
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false)
  const [newAssessmentTitle, setNewAssessmentTitle] = useState('')
  const [newAssessmentDescription, setNewAssessmentDescription] = useState('')
  const [newAssessmentExperimentId, setNewAssessmentExperimentId] =
    useState('exp-salt-water-001')

  // Assessment metadata editor state
  const selectedRecord: ManagedAssessmentRecord | undefined = useMemo(
    () =>
      bankState.assessments.find((item) => item.id === selectedAssessmentId) ??
      bankState.assessments[0],
    [bankState.assessments, selectedAssessmentId],
  )

  const [assessmentTitleDraft, setAssessmentTitleDraft] = useState(
    selectedRecord?.assessment.title ?? '',
  )
  const [assessmentDescriptionDraft, setAssessmentDescriptionDraft] = useState(
    selectedRecord?.assessment.description ?? '',
  )

  // Question editor state ('add' or 'edit')
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionPrompt, setQuestionPrompt] = useState('')
  const [questionDifficulty, setQuestionDifficulty] =
    useState<ExperimentDifficulty>('beginner')
  const [questionObjectiveId, setQuestionObjectiveId] = useState('')
  const [questionExplanation, setQuestionExplanation] = useState('')
  const [questionOptions, setQuestionOptions] = useState<QuestionOptionInput[]>(() =>
    createBlankOptions('new-q'),
  )
  const [correctOptionId, setCorrectOptionId] = useState<string>('new-q-opt-1')

  // Non-persisting Quiz Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0)
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({})
  const [previewOutcome, setPreviewOutcome] = useState<QuizPreviewOutcome | null>(null)

  const availableExperiments = getAvailableExperiments()

  useEffect(() => {
    if (initialState) {
      setActiveManagedQuestionBankState(initialState)
      return
    }
    let active = true
    void repository.loadAdminState(authState).then((res) => {
      if (!active || !res.ok) return
      setBankState(res.state)
    })
    return () => {
      active = false
    }
  }, [authState, initialState, repository])

  const syncSelectedAssessmentDrafts = (record: ManagedAssessmentRecord | undefined) => {
    if (!record) return
    setAssessmentTitleDraft(record.assessment.title)
    setAssessmentDescriptionDraft(record.assessment.description)
  }

  const handleSelectAssessment = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId)
    const found = bankState.assessments.find((item) => item.id === assessmentId)
    syncSelectedAssessmentDrafts(found)
    setIsPreviewOpen(false)
    setPreviewOutcome(null)
    setPreviewAnswers({})
    setPreviewQuestionIndex(0)
    resetQuestionEditorToAdd(found?.experimentId ?? 'exp-salt-water-001')
  }

  const resetQuestionEditorToAdd = (expId?: string) => {
    const prefix = `${expId ?? selectedRecord?.experimentId ?? 'exp'}-q-${
      (selectedRecord?.assessment.questions.length ?? 0) + 1
    }`
    const blankOpts = createBlankOptions(prefix)
    setEditorMode('add')
    setEditingQuestionId(null)
    setQuestionPrompt('')
    setQuestionDifficulty('beginner')
    setQuestionObjectiveId('')
    setQuestionExplanation('')
    setQuestionOptions(blankOpts)
    setCorrectOptionId(blankOpts[0].id!)
  }

  const handleLoadQuestionForEdit = (question: MultipleChoiceQuestion) => {
    const orderedOpts = getOrderedQuestionOptions(question).map((opt) => ({
      id: opt.id,
      text: opt.text,
      order: opt.order,
    }))
    setEditorMode('edit')
    setEditingQuestionId(question.id)
    setQuestionPrompt(question.prompt)
    setQuestionDifficulty(question.difficulty ?? 'beginner')
    setQuestionObjectiveId(question.learningObjectiveId ?? '')
    setQuestionExplanation(question.explanation)
    setQuestionOptions(orderedOpts)
    setCorrectOptionId(question.correctOptionId)
    setFeedbackBanner(null)
  }

  const filteredAssessments = useMemo(
    () =>
      filterManagedAssessments(bankState, {
        searchQuery,
        experimentId: experimentFilter,
        publicationStatus: statusFilter,
      }),
    [bankState, experimentFilter, searchQuery, statusFilter],
  )

  const orderedQuestions = useMemo(
    () =>
      selectedRecord ? getOrderedAssessmentQuestions(selectedRecord.assessment) : [],
    [selectedRecord],
  )

  const selectedExperimentInfo = useMemo(
    () =>
      availableExperiments.find((exp) => exp.id === selectedRecord?.experimentId) ??
      availableExperiments[0],
    [availableExperiments, selectedRecord?.experimentId],
  )

  const publishReadiness = useMemo(() => {
    if (!selectedRecord) return { valid: false, issues: [] }
    return validateAssessmentPublishReadiness(selectedRecord.assessment)
  }, [selectedRecord])

  const totalQuestionsAcrossBank = useMemo(
    () =>
      bankState.assessments.reduce(
        (sum, rec) => sum + rec.assessment.questions.length,
        0,
      ),
    [bankState.assessments],
  )

  const accessCheck = assertQuestionBankAdminAccess(authState)
  if (!accessCheck.ok) {
    return (
      <section
        aria-label="Unauthorized question bank access"
        className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-rose-950 shadow-card"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-6 text-rose-700" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Administrator Authorization Required</h2>
        </div>
        <p className="mt-2 text-sm text-rose-900">{accessCheck.message}</p>
      </section>
    )
  }

  const handleCreateAssessment = async (event: React.FormEvent) => {
    event.preventDefault()
    const result = await repository.createAssessment(
      bankState,
      {
        title: newAssessmentTitle,
        description: newAssessmentDescription,
        experimentId: newAssessmentExperimentId,
        publicationStatus: 'draft',
      },
      authState,
    )

    if (!result.ok) {
      setFeedbackBanner({ tone: 'error', message: result.message })
      return
    }

    setBankState(result.state)
    setSelectedAssessmentId(result.data.id)
    syncSelectedAssessmentDrafts(result.data)
    setIsCreatingAssessment(false)
    setNewAssessmentTitle('')
    setNewAssessmentDescription('')
    setFeedbackBanner({
      tone: 'success',
      message: `Created draft assessment "${result.data.assessment.title}".`,
    })
  }

  const handleSaveAssessmentMetadata = async (
    targetStatus?: AssessmentPublicationStatus,
  ) => {
    if (!selectedRecord) return

    const metaResult = await repository.updateAssessmentMetadata(
      bankState,
      {
        assessmentId: selectedRecord.id,
        title: assessmentTitleDraft,
        description: assessmentDescriptionDraft,
      },
      authState,
    )

    if (!metaResult.ok) {
      setFeedbackBanner({ tone: 'error', message: metaResult.message })
      return
    }

    let currentState = metaResult.state
    let statusMessage = `Saved assessment "${metaResult.data.assessment.title}" (v${metaResult.data.assessment.version}).`

    if (targetStatus && targetStatus !== metaResult.data.publicationStatus) {
      const statusResult = await repository.setPublicationStatus(
        currentState,
        selectedRecord.id,
        targetStatus,
        authState,
      )
      if (!statusResult.ok) {
        setBankState(currentState)
        setFeedbackBanner({ tone: 'error', message: statusResult.message })
        return
      }
      currentState = statusResult.state
      statusMessage = `Assessment "${statusResult.data.assessment.title}" marked as ${formatPublicationLabel(targetStatus)} (v${statusResult.data.assessment.version}).`
    }

    setBankState(currentState)
    setFeedbackBanner({ tone: 'success', message: statusMessage })
  }

  const handleSetPublicationStatus = async (
    nextStatus: AssessmentPublicationStatus,
  ) => {
    if (!selectedRecord) return
    const result = await repository.setPublicationStatus(
      bankState,
      selectedRecord.id,
      nextStatus,
      authState,
    )
    if (!result.ok) {
      setFeedbackBanner({ tone: 'error', message: result.message })
      return
    }
    setBankState(result.state)
    setFeedbackBanner({
      tone: 'success',
      message: `Assessment "${result.data.assessment.title}" is now ${formatPublicationLabel(nextStatus)} (v${result.data.assessment.version}).`,
    })
  }

  const handleOptionTextChange = (index: number, nextText: string) => {
    setQuestionOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? { ...opt, text: nextText } : opt)),
    )
  }

  const handleAddOptionRow = () => {
    if (questionOptions.length >= 6) return
    const nextOrder = questionOptions.length + 1
    const basePrefix = editingQuestionId ?? `${selectedRecord?.experimentId ?? 'exp'}-q`
    setQuestionOptions((prev) => [
      ...prev,
      {
        id: `${basePrefix}-opt-${nextOrder}-${prev.length + 1}`,
        text: '',
        order: nextOrder,
      },
    ])
  }

  const handleRemoveOptionRow = (index: number) => {
    if (questionOptions.length <= 2) return
    const removed = questionOptions[index]
    const remaining = questionOptions
      .filter((_, idx) => idx !== index)
      .map((opt, idx) => ({ ...opt, order: idx + 1 }))
    setQuestionOptions(remaining)
    if (removed && removed.id === correctOptionId && remaining[0]?.id) {
      setCorrectOptionId(remaining[0].id)
    }
  }

  const handleSaveQuestion = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedRecord) return

    const input: QuestionEditorInput = {
      id: editingQuestionId ?? undefined,
      experimentId: selectedRecord.experimentId,
      prompt: questionPrompt,
      options: questionOptions,
      correctOptionId,
      explanation: questionExplanation,
      difficulty: questionDifficulty,
      learningObjectiveId: questionObjectiveId || undefined,
    }

    if (editorMode === 'edit' && editingQuestionId) {
      const result = await repository.updateQuestion(
        bankState,
        selectedRecord.id,
        editingQuestionId,
        input,
        authState,
      )
      if (!result.ok) {
        setFeedbackBanner({ tone: 'error', message: result.message })
        return
      }
      setBankState(result.state)
      setFeedbackBanner({
        tone: 'success',
        message: result.versionBumped
          ? `Updated question "${result.data.question.id}" and bumped assessment version from v${result.previousVersion} to v${result.data.record.assessment.version}.`
          : `Updated question "${result.data.question.id}".`,
      })
      resetQuestionEditorToAdd(selectedRecord.experimentId)
    } else {
      const result = await repository.addQuestion(
        bankState,
        selectedRecord.id,
        input,
        authState,
      )
      if (!result.ok) {
        setFeedbackBanner({ tone: 'error', message: result.message })
        return
      }
      setBankState(result.state)
      setFeedbackBanner({
        tone: 'success',
        message: result.versionBumped
          ? `Added question "${result.data.question.id}" and bumped assessment version from v${result.previousVersion} to v${result.data.record.assessment.version}.`
          : `Added question "${result.data.question.id}" to "${selectedRecord.assessment.title}".`,
      })
      resetQuestionEditorToAdd(selectedRecord.experimentId)
    }
  }

  const handleReorderQuestion = async (
    questionId: string,
    direction: 'up' | 'down',
  ) => {
    if (!selectedRecord) return
    const result = await repository.reorderQuestion(
      bankState,
      selectedRecord.id,
      questionId,
      direction,
      authState,
    )
    if (!result.ok) {
      setFeedbackBanner({ tone: 'error', message: result.message })
      return
    }
    setBankState(result.state)
  }

  const handleStartPreview = () => {
    if (!selectedRecord) return
    setIsPreviewOpen((prev) => !prev)
    setPreviewQuestionIndex(0)
    setPreviewAnswers({})
    setPreviewOutcome(null)
  }

  const handleEvaluatePreview = () => {
    if (!selectedRecord) return
    const res = previewAssessmentQuiz(
      selectedRecord.assessment,
      previewAnswers,
      authState,
    )
    if (!res.ok) {
      setFeedbackBanner({ tone: 'error', message: res.message })
      return
    }
    setPreviewOutcome(res.preview)
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <section
        aria-labelledby="question-bank-heading"
        className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal-soft/50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-dark">
              <FileQuestion className="size-3.5" aria-hidden="true" />
              <span>Questions Management Workspace</span>
            </div>
            <h2
              id="question-bank-heading"
              className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl"
            >
              Question Bank
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate">
              Author, validate, version, and publish post-experiment multiple-choice
              assessments for secondary school chemistry experiments. Reuses the unified
              assessment validation and automatic grading engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreatingAssessment((prev) => !prev)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-navy transition hover:border-teal/40 hover:bg-teal-soft/30"
            >
              <Plus className="size-4 text-teal-dark" aria-hidden="true" />
              <span>New Assessment</span>
            </button>
            <button
              type="button"
              onClick={handleStartPreview}
              disabled={!selectedRecord || orderedQuestions.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-teal/35 bg-teal-soft/45 px-4 py-2 text-xs font-semibold text-teal-dark transition hover:bg-teal-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye className="size-4" aria-hidden="true" />
              <span>Preview Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAssessmentMetadata('draft')}
              disabled={!selectedRecord}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-navy transition hover:bg-surface disabled:opacity-50"
            >
              <FileCheck2 className="size-4 text-slate" aria-hidden="true" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSetPublicationStatus('published')}
              disabled={!selectedRecord || !publishReadiness.valid}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="size-4 text-teal" aria-hidden="true" />
              <span>Publish Quiz</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface/60 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate">
              Total Assessments
            </p>
            <p className="mt-1 text-xl font-semibold text-navy">
              {bankState.assessments.length}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface/60 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate">
              Published Quizzes
            </p>
            <p className="mt-1 text-xl font-semibold text-emerald-800">
              {
                bankState.assessments.filter(
                  (item) => item.publicationStatus === 'published',
                ).length
              }
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface/60 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate">
              Validated Questions
            </p>
            <p className="mt-1 text-xl font-semibold text-navy">
              {totalQuestionsAcrossBank}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface/60 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate">
              Active Version
            </p>
            <p className="mt-1 text-xl font-semibold text-teal-dark">
              v{selectedRecord?.assessment.version ?? '1.0.0'}
            </p>
          </div>
        </div>

        {/* Practice Quiz Answer-Key Security Notice */}
        <aside
          aria-label="Practice assessment security notice"
          className="mt-4 rounded-xl border border-teal/25 bg-teal-soft/30 px-4 py-3 text-xs leading-relaxed text-ink/85"
        >
          <strong className="font-semibold text-navy">
            Practice Quiz Architecture &amp; Answer-Key Security:
          </strong>{' '}
          Published quizzes in this question bank are formative practice assessments (
          <code>isPracticeAssessment: true</code>) where question options and scientific
          explanations are delivered to the browser for immediate post-submission learning
          feedback. Unpublished (<code>Draft</code>, <code>Reviewed</code>,{' '}
          <code>Archived</code>) assessments and questions are hidden from students via
          PostgreSQL Row Level Security.
        </aside>
      </section>

      {feedbackBanner && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-medium ${
            feedbackBanner.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : feedbackBanner.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-teal/30 bg-teal-soft/40 text-navy'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.tone === 'error' ? (
              <AlertCircle className="size-4 shrink-0 text-rose-700" aria-hidden="true" />
            ) : (
              <CheckCircle2
                className="size-4 shrink-0 text-emerald-700"
                aria-hidden="true"
              />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Optional Create New Assessment Form */}
      {isCreatingAssessment && (
        <form
          onSubmit={(e) => void handleCreateAssessment(e)}
          aria-label="Create new assessment form"
          className="space-y-4 rounded-2xl border border-teal/35 bg-white p-6 shadow-card"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-navy">
              Create New Experiment Assessment
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingAssessment(false)}
              className="text-xs font-semibold text-slate hover:text-navy"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-semibold text-navy">
              <span>Assessment Title</span>
              <input
                type="text"
                required
                value={newAssessmentTitle}
                onChange={(e) => setNewAssessmentTitle(e.target.value)}
                placeholder="e.g., Acid-Base Indicators — Concept Check"
                className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-navy">
              <span>Associated Experiment</span>
              <select
                value={newAssessmentExperimentId}
                onChange={(e) => setNewAssessmentExperimentId(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
              >
                {availableExperiments.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.title} ({exp.id})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-xs font-semibold text-navy">
            <span>Assessment Description</span>
            <textarea
              required
              rows={2}
              value={newAssessmentDescription}
              onChange={(e) => setNewAssessmentDescription(e.target.value)}
              placeholder="Describe the learning concepts reviewed by this post-experiment quiz..."
              className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy/90"
            >
              Create Draft Assessment
            </button>
          </div>
        </form>
      )}

      {/* Non-Persisting Quiz Preview Mode */}
      {isPreviewOpen && selectedRecord && (
        <section
          aria-labelledby="quiz-preview-heading"
          className="space-y-5 rounded-2xl border-2 border-teal/40 bg-white p-6 shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-dark">
                Admin Quiz Preview Mode — Non-Persisting
              </span>
              <h3 id="quiz-preview-heading" className="text-lg font-semibold text-navy">
                Preview Quiz: {selectedRecord.assessment.title} (v
                {selectedRecord.assessment.version})
              </h3>
              <p className="text-xs text-slate">
                Responses and scores in Preview Quiz mode are evaluated in memory and are
                never saved to student progress or attempt records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEvaluatePreview}
                className="rounded-xl bg-teal-dark px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-dark/90"
              >
                Grade Preview Attempt
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-xl border border-line px-3.5 py-2 text-xs font-semibold text-navy hover:bg-surface"
              >
                Close Preview
              </button>
            </div>
          </div>

          {orderedQuestions.length > 0 && (
            <div className="space-y-4">
              <QuizProgressBar
                questions={orderedQuestions}
                currentIndex={previewQuestionIndex}
                answers={previewAnswers}
                onSelectIndex={(idx) => setPreviewQuestionIndex(idx)}
              />

              {orderedQuestions[previewQuestionIndex] && (
                <QuizQuestionCard
                  key={orderedQuestions[previewQuestionIndex].id}
                  question={orderedQuestions[previewQuestionIndex]}
                  questionIndex={previewQuestionIndex}
                  totalQuestions={orderedQuestions.length}
                  selectedOptionId={
                    previewAnswers[orderedQuestions[previewQuestionIndex].id]
                  }
                  onSelectOption={(qId, optId) =>
                    setPreviewAnswers((prev) => ({ ...prev, [qId]: optId }))
                  }
                  onClearOption={(qId) =>
                    setPreviewAnswers((prev) => {
                      const next = { ...prev }
                      delete next[qId]
                      return next
                    })
                  }
                  onPrevious={() =>
                    setPreviewQuestionIndex((idx) => Math.max(0, idx - 1))
                  }
                  onNext={() =>
                    setPreviewQuestionIndex((idx) =>
                      Math.min(orderedQuestions.length - 1, idx + 1),
                    )
                  }
                  onOpenReview={handleEvaluatePreview}
                  isFirst={previewQuestionIndex === 0}
                  isLast={previewQuestionIndex === orderedQuestions.length - 1}
                />
              )}
            </div>
          )}

          {previewOutcome && previewOutcome.gradingOutcome.ok && (
            <div className="rounded-xl border border-teal/30 bg-teal-soft/30 p-4 text-xs text-navy">
              <p className="font-semibold">
                Preview Grading Result: {previewOutcome.gradingOutcome.result.score} /{' '}
                {previewOutcome.gradingOutcome.result.maxScore} (
                {previewOutcome.gradingOutcome.result.percentage}%) · Student History
                Persisted: {String(previewOutcome.persistedToStudentHistory)}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Search & Filter Controls */}
      <section
        aria-label="Question bank filters"
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:grid-cols-3"
      >
        <label className="relative block">
          <span className="sr-only">Search assessments and questions</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, explanations, or titles..."
            className="w-full rounded-xl border border-line bg-surface/60 py-2 pl-10 pr-3 text-xs text-navy placeholder:text-slate"
          />
        </label>

        <label className="block">
          <span className="sr-only">Filter by experiment</span>
          <select
            aria-label="Filter by experiment"
            value={experimentFilter}
            onChange={(e) => setExperimentFilter(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface/60 px-3 py-2 text-xs font-medium text-navy"
          >
            <option value="all">All Experiments</option>
            {availableExperiments.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.title} ({exp.id})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Filter by publication status</span>
          <select
            aria-label="Filter by publication status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AssessmentPublicationStatus | 'all')
            }
            className="w-full rounded-xl border border-line bg-surface/60 px-3 py-2 text-xs font-medium text-navy"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="reviewed">Reviewed</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Assessments List & Version History */}
        <div className="space-y-4 lg:col-span-4">
          <section
            aria-labelledby="assessments-catalog-heading"
            className="rounded-2xl border border-line bg-white p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <h3
                id="assessments-catalog-heading"
                className="text-sm font-semibold uppercase tracking-wider text-navy"
              >
                Assessments ({filteredAssessments.length})
              </h3>
              <Layers className="size-4 text-teal-dark" aria-hidden="true" />
            </div>

            <div className="mt-3 space-y-2.5">
              {filteredAssessments.map((item) => {
                const isSelected = item.id === selectedRecord?.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectAssessment(item.id)}
                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-teal bg-teal-soft/35 shadow-sm'
                        : 'border-line bg-surface/40 hover:border-teal/35 hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-navy">
                        {item.assessment.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClasses(
                          item.publicationStatus,
                        )}`}
                      >
                        {formatPublicationLabel(item.publicationStatus)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate">
                      Experiment: <code>{item.experimentId}</code>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate">
                      <span>{item.assessment.questions.length} Questions</span>
                      <span>·</span>
                      <span>v{item.assessment.version}</span>
                      {item.versionHistory.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{item.versionHistory.length} Version Snapshot(s)</span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Version History Card */}
          {selectedRecord && (
            <section
              aria-labelledby="version-history-heading"
              className="rounded-2xl border border-line bg-white p-5 shadow-card"
            >
              <div className="flex items-center gap-2">
                <History className="size-4 text-teal-dark" aria-hidden="true" />
                <h3
                  id="version-history-heading"
                  className="text-sm font-semibold text-navy"
                >
                  Version History &amp; Attempt Integrity
                </h3>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate">
                Editing a published assessment automatically saves an immutable snapshot
                of the previous version and increments the semantic version so historical
                student attempts remain linked to their original version.
              </p>
              <ul className="mt-3 space-y-2 text-xs">
                {selectedRecord.versionHistory.length === 0 ? (
                  <li className="rounded-lg border border-line bg-surface/50 px-3 py-2 text-slate">
                    No published snapshots yet (current draft v
                    {selectedRecord.assessment.version}).
                  </li>
                ) : (
                  selectedRecord.versionHistory.map((snap) => (
                    <li
                      key={`${selectedRecord.id}-${snap.version}`}
                      className="flex items-center justify-between rounded-lg border border-line bg-surface/50 px-3 py-2 text-navy"
                    >
                      <span className="font-semibold">v{snap.version}</span>
                      <span className="text-slate">
                        {snap.assessment.questions.length} questions
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}
        </div>

        {/* Right Column: Selected Assessment Details, Question List, and Question Editor */}
        <div className="space-y-6 lg:col-span-8">
          {selectedRecord && (
            <>
              {/* Assessment Metadata & Status Workflow */}
              <section
                aria-labelledby="selected-assessment-heading"
                className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-dark">
                      Assessment Configuration · {selectedRecord.id}
                    </span>
                    <h3
                      id="selected-assessment-heading"
                      className="text-lg font-semibold text-navy"
                    >
                      {selectedRecord.assessment.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSetPublicationStatus('draft')}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy hover:bg-surface"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSetPublicationStatus('reviewed')}
                      className="rounded-lg border border-teal/35 bg-teal-soft/35 px-3 py-1.5 text-xs font-semibold text-teal-dark hover:bg-teal-soft"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSetPublicationStatus('published')}
                      disabled={!publishReadiness.valid}
                      className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Publish Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSetPublicationStatus('archived')}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate hover:bg-surface-muted"
                    >
                      Archive
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1 text-xs font-semibold text-navy">
                    <span>Quiz Title</span>
                    <input
                      type="text"
                      value={assessmentTitleDraft}
                      onChange={(e) => setAssessmentTitleDraft(e.target.value)}
                      className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
                    />
                  </label>
                  <div className="space-y-1 text-xs font-semibold text-navy">
                    <span>Linked Experiment</span>
                    <div className="rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-slate">
                      {selectedExperimentInfo?.title ?? selectedRecord.experimentId} (
                      <code>{selectedRecord.experimentId}</code>)
                    </div>
                  </div>
                </div>

                <label className="block space-y-1 text-xs font-semibold text-navy">
                  <span>Quiz Description</span>
                  <textarea
                    rows={2}
                    value={assessmentDescriptionDraft}
                    onChange={(e) => setAssessmentDescriptionDraft(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
                  />
                </label>

                {!publishReadiness.valid && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-950">
                    <p className="font-semibold">
                      Publication Readiness Checks ({publishReadiness.issues.length}{' '}
                      issue(s)):
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {publishReadiness.issues.map((issue, idx) => (
                        <li key={`${issue.code}-${idx}`}>{issue.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Questions List in Selected Assessment */}
              <section
                aria-labelledby="assessment-questions-heading"
                className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3
                      id="assessment-questions-heading"
                      className="text-base font-semibold text-navy"
                    >
                      Questions in Assessment ({orderedQuestions.length})
                    </h3>
                    <p className="text-xs text-slate">
                      Each question requires at least two unique options, a single{' '}
                      <strong>Correct Answer</strong>, and a scientific{' '}
                      <strong>Explanation</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetQuestionEditorToAdd(selectedRecord.experimentId)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-dark px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-dark/90"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    <span>Add Question</span>
                  </button>
                </div>

                {orderedQuestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line bg-surface/40 p-6 text-center text-xs text-slate">
                    No questions have been added to this assessment yet. Use the{' '}
                    <strong>Add Question</strong> form below to author the first question.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderedQuestions.map((question, idx) => {
                      const opts = getOrderedQuestionOptions(question)
                      return (
                        <article
                          key={question.id}
                          className="rounded-xl border border-line bg-surface/35 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate">
                                <span className="rounded bg-navy px-2 py-0.5 text-white">
                                  Q{idx + 1}
                                </span>
                                <code>{question.id}</code>
                                <span className="rounded-full border border-line bg-white px-2 py-0.5 capitalize text-navy">
                                  {question.difficulty}
                                </span>
                                {question.learningObjectiveId && (
                                  <span className="rounded-full border border-teal/30 bg-teal-soft/40 px-2 py-0.5 text-teal-dark">
                                    Objective: {question.learningObjectiveId}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-navy">
                                {question.prompt}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleReorderQuestion(question.id, 'up')
                                }
                                disabled={idx === 0}
                                aria-label={`Move question ${idx + 1} up`}
                                className="rounded-lg border border-line bg-white p-1.5 text-slate hover:text-navy disabled:opacity-40"
                              >
                                <ArrowUp className="size-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleReorderQuestion(question.id, 'down')
                                }
                                disabled={idx === orderedQuestions.length - 1}
                                aria-label={`Move question ${idx + 1} down`}
                                className="rounded-lg border border-line bg-white p-1.5 text-slate hover:text-navy disabled:opacity-40"
                              >
                                <ArrowDown className="size-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLoadQuestionForEdit(question)}
                                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-navy hover:border-teal/40 hover:bg-teal-soft/30"
                              >
                                <Pencil className="size-3" aria-hidden="true" />
                                <span>Edit Question</span>
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate">
                              Answer Options
                            </p>
                            <ul className="grid gap-1.5 sm:grid-cols-2">
                              {opts.map((opt, optIdx) => {
                                const isCorrect = opt.id === question.correctOptionId
                                return (
                                  <li
                                    key={opt.id}
                                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                                      isCorrect
                                        ? 'border-emerald-300 bg-emerald-50/80 font-semibold text-emerald-950'
                                        : 'border-line bg-white text-slate'
                                    }`}
                                  >
                                    <span className="font-bold">
                                      {OPTION_LETTERS[optIdx] ?? optIdx + 1}.
                                    </span>
                                    <span className="flex-1">{opt.text}</span>
                                    {isCorrect && (
                                      <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                                        Correct Answer
                                      </span>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>

                          <div className="mt-3 rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate">
                            <strong className="font-semibold text-navy">
                              Explanation:
                            </strong>{' '}
                            {question.explanation}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Question Editor Form (Add Question / Edit Question) */}
              <form
                onSubmit={(e) => void handleSaveQuestion(e)}
                aria-labelledby="question-editor-heading"
                className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-dark">
                      {editorMode === 'edit' ? 'Edit Question' : 'Add Question'}
                    </span>
                    <h3
                      id="question-editor-heading"
                      className="text-base font-semibold text-navy"
                    >
                      {editorMode === 'edit'
                        ? `Edit Question (${editingQuestionId})`
                        : 'Add Question to Assessment'}
                    </h3>
                  </div>
                  {editorMode === 'edit' && (
                    <button
                      type="button"
                      onClick={() =>
                        resetQuestionEditorToAdd(selectedRecord.experimentId)
                      }
                      className="text-xs font-semibold text-slate hover:text-navy"
                    >
                      Switch to Add Question
                    </button>
                  )}
                </div>

                <label className="block space-y-1 text-xs font-semibold text-navy">
                  <span>Question Text (Prompt)</span>
                  <textarea
                    rows={2}
                    required
                    value={questionPrompt}
                    onChange={(e) => setQuestionPrompt(e.target.value)}
                    placeholder="Enter a clear, unambiguous multiple-choice question for secondary school students..."
                    className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1 text-xs font-semibold text-navy">
                    <span>Difficulty Level</span>
                    <select
                      value={questionDifficulty}
                      onChange={(e) =>
                        setQuestionDifficulty(e.target.value as ExperimentDifficulty)
                      }
                      className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </label>

                  <label className="block space-y-1 text-xs font-semibold text-navy">
                    <span>Learning Objective (Optional)</span>
                    <select
                      value={questionObjectiveId}
                      onChange={(e) => setQuestionObjectiveId(e.target.value)}
                      className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
                    >
                      <option value="">General Experiment Review</option>
                      {(selectedExperimentInfo?.objectives ?? []).map((obj) => (
                        <option key={obj.id} value={obj.id}>
                          {obj.id} — {obj.text}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Answer Options & Correct Answer Selector */}
                <fieldset className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <legend className="text-xs font-semibold text-navy">
                      Answer Options &amp; Correct Answer Selection
                    </legend>
                    <button
                      type="button"
                      onClick={handleAddOptionRow}
                      disabled={questionOptions.length >= 6}
                      className="text-xs font-semibold text-teal-dark hover:underline disabled:opacity-40"
                    >
                      + Add Answer Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {questionOptions.map((opt, idx) => {
                      const optId = opt.id ?? `opt-${idx + 1}`
                      const isCorrect = correctOptionId === optId
                      return (
                        <div
                          key={optId}
                          className={`flex items-center gap-2.5 rounded-xl border p-2.5 ${
                            isCorrect
                              ? 'border-emerald-300 bg-emerald-50/50'
                              : 'border-line bg-surface/40'
                          }`}
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                            {OPTION_LETTERS[idx] ?? idx + 1}
                          </span>
                          <input
                            type="text"
                            required
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                            placeholder={`Option ${OPTION_LETTERS[idx] ?? idx + 1} text...`}
                            className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-navy"
                          />
                          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-navy">
                            <input
                              type="radio"
                              name="correctOptionId"
                              checked={isCorrect}
                              onChange={() => setCorrectOptionId(optId)}
                            />
                            <span>Correct Answer</span>
                          </label>
                          {questionOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionRow(idx)}
                              aria-label={`Remove option ${idx + 1}`}
                              className="rounded p-1 text-slate hover:text-rose-700"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </fieldset>

                {/* Scientific Explanation */}
                <label className="block space-y-1 text-xs font-semibold text-navy">
                  <span>Explanation</span>
                  <textarea
                    rows={3}
                    required
                    value={questionExplanation}
                    onChange={(e) => setQuestionExplanation(e.target.value)}
                    placeholder="Provide the scientific explanation shown to students after they submit the quiz..."
                    className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-sm text-navy"
                  />
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy/90"
                  >
                    {editorMode === 'edit' ? (
                      <>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span>Edit Question</span>
                      </>
                    ) : (
                      <>
                        <Plus className="size-3.5" aria-hidden="true" />
                        <span>Add Question</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
