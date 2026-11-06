import { Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ExperimentRouteLayout } from '@/components/layout/ExperimentRouteLayout'
import { StudentRouteBoundary } from '@/app/StudentRouteBoundary'
import { routePaths } from '@/app/paths'
import { ChooseGradePage } from '@/pages/ChooseGradePage'
import { ChooseTermPage } from '@/pages/ChooseTermPage'
import { ExperimentDetailsPage } from '@/pages/ExperimentDetailsPage'
import { ExperimentQuizPage } from '@/pages/ExperimentQuizPage'
import { ExperimentsPage } from '@/pages/ExperimentsPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SafetyPage } from '@/pages/SafetyPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { QuizResultsPage } from '@/pages/QuizResultsPage'
import { VirtualLabPage } from '@/pages/VirtualLabPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path={routePaths.signUp} element={<SignUpPage />} />
        <Route path={routePaths.login} element={<LoginPage />} />
        <Route path={routePaths.safety} element={<SafetyPage />} />
        <Route element={<StudentRouteBoundary />}>
          <Route path={routePaths.grades} element={<ChooseGradePage />} />
          <Route path={routePaths.terms} element={<ChooseTermPage />} />
          <Route path={routePaths.experiments} element={<ExperimentsPage />} />
          <Route path={routePaths.laboratory} element={<VirtualLabPage />} />
          <Route path={routePaths.experimentDetails} element={<ExperimentRouteLayout />}>
            <Route index element={<ExperimentDetailsPage />} />
            <Route path="quiz" element={<ExperimentQuizPage />} />
            <Route path="quiz/results" element={<QuizResultsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
