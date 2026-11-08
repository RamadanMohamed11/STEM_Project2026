import { lazy, Suspense } from 'react'
import { AuthFeedback } from '@/features/auth/components/AuthFeedback'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { RequireAdmin } from '@/features/auth/RequireRole'
import { AdminLayout } from '@/features/admin/components/AdminLayout'

import { Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ExperimentRouteLayout } from '@/components/layout/ExperimentRouteLayout'
import { StudentRouteBoundary } from '@/app/StudentRouteBoundary'
import { routePaths } from '@/app/paths'

import { HomePage } from '@/pages/HomePage'

const AdminCurriculumPage = lazy(() =>
  import('@/pages/AdminCurriculumPage').then((module) => ({ default: module.AdminCurriculumPage })),
)
const AdminExperimentsPage = lazy(() =>
  import('@/pages/AdminExperimentsPage').then((module) => ({
    default: module.AdminExperimentsPage,
  })),
)
const AdminFoundationPage = lazy(() =>
  import('@/pages/AdminFoundationPage').then((module) => ({ default: module.AdminFoundationPage })),
)
const AdminQuestionsPage = lazy(() =>
  import('@/pages/AdminQuestionsPage').then((module) => ({ default: module.AdminQuestionsPage })),
)
const AdminStudentsPage = lazy(() =>
  import('@/pages/AdminStudentsPage').then((module) => ({ default: module.AdminStudentsPage })),
)
const AdminReportsPage = lazy(() =>
  import('@/pages/AdminReportsPage').then((module) => ({ default: module.AdminReportsPage })),
)
const StudentProfilePage = lazy(() =>
  import('@/pages/StudentProfilePage').then((module) => ({ default: module.StudentProfilePage })),
)
const AuthCallbackPage = lazy(() =>
  import('@/pages/AuthCallbackPage').then((module) => ({ default: module.AuthCallbackPage })),
)
const PasswordRecoveryPage = lazy(() =>
  import('@/pages/PasswordRecoveryPage').then((module) => ({
    default: module.PasswordRecoveryPage,
  })),
)
const ChooseGradePage = lazy(() =>
  import('@/pages/ChooseGradePage').then((module) => ({ default: module.ChooseGradePage })),
)
const ChooseTermPage = lazy(() =>
  import('@/pages/ChooseTermPage').then((module) => ({ default: module.ChooseTermPage })),
)
const CurriculumPage = lazy(() =>
  import('@/pages/CurriculumPage').then((module) => ({ default: module.CurriculumPage })),
)
const CurriculumLessonPage = lazy(() =>
  import('@/pages/CurriculumLessonPage').then((module) => ({
    default: module.CurriculumLessonPage,
  })),
)
const ExperimentDetailsPage = lazy(() =>
  import('@/pages/ExperimentDetailsPage').then((module) => ({
    default: module.ExperimentDetailsPage,
  })),
)
const ExperimentQuizPage = lazy(() =>
  import('@/pages/ExperimentQuizPage').then((module) => ({ default: module.ExperimentQuizPage })),
)
const ExperimentsPage = lazy(() =>
  import('@/pages/ExperimentsPage').then((module) => ({ default: module.ExperimentsPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)
const SafetyPage = lazy(() =>
  import('@/pages/SafetyPage').then((module) => ({ default: module.SafetyPage })),
)
const SignUpPage = lazy(() =>
  import('@/pages/SignUpPage').then((module) => ({ default: module.SignUpPage })),
)
const QuizResultsPage = lazy(() =>
  import('@/pages/QuizResultsPage').then((module) => ({ default: module.QuizResultsPage })),
)
const ExperimentResultsPage = lazy(() =>
  import('@/pages/ExperimentResultsPage').then((module) => ({
    default: module.ExperimentResultsPage,
  })),
)
const StudentProgressPage = lazy(() =>
  import('@/pages/StudentProgressPage').then((module) => ({ default: module.StudentProgressPage })),
)
const VirtualLabPage = lazy(() =>
  import('@/pages/VirtualLabPage').then((module) => ({ default: module.VirtualLabPage })),
)

export function AppRoutes() {
  return (
    <Suspense fallback={<AuthFeedback kind="loading">Loading page…</AuthFeedback>}>
      <Routes>
        <Route path={routePaths.admin} element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminFoundationPage />} />
            <Route path="curriculum" element={<AdminCurriculumPage />} />
            <Route path="experiments" element={<AdminExperimentsPage />} />
            <Route path="questions" element={<AdminQuestionsPage />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path={routePaths.authCallback} element={<AuthCallbackPage />} />
          <Route element={<RequireAuth />}>
            <Route path={routePaths.account} element={<StudentProfilePage />} />
            <Route path={routePaths.profile} element={<StudentProfilePage />} />
          </Route>
          <Route path={routePaths.signUp} element={<SignUpPage />} />
          <Route path={routePaths.login} element={<LoginPage />} />
          <Route
            path={routePaths.forgotPassword}
            element={<PasswordRecoveryPage mode="forgot" />}
          />
          <Route path={routePaths.resetPassword} element={<PasswordRecoveryPage mode="reset" />} />
          <Route path={routePaths.safety} element={<SafetyPage />} />
          <Route element={<StudentRouteBoundary />}>
            <Route path={routePaths.grades} element={<ChooseGradePage />} />
            <Route path={routePaths.terms} element={<ChooseTermPage />} />
            <Route path={routePaths.curriculum} element={<CurriculumPage />} />
            <Route path={routePaths.curriculumLesson} element={<CurriculumLessonPage />} />
            <Route path={routePaths.experiments} element={<ExperimentsPage />} />
            <Route path={routePaths.progress} element={<StudentProgressPage />} />
            <Route path={routePaths.laboratory} element={<VirtualLabPage />} />
            <Route path={routePaths.experimentDetails} element={<ExperimentRouteLayout />}>
              <Route index element={<ExperimentDetailsPage />} />
              <Route path="results" element={<ExperimentResultsPage />} />
              <Route path="quiz" element={<ExperimentQuizPage />} />
              <Route path="quiz/results" element={<QuizResultsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
