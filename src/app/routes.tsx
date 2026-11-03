import { Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ExperimentsPage } from '@/pages/ExperimentsPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SafetyPage } from '@/pages/SafetyPage'
import { VirtualLabPage } from '@/pages/VirtualLabPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="experiments" element={<ExperimentsPage />} />
        <Route path="experiments/:experimentId/lab" element={<VirtualLabPage />} />
        <Route path="safety" element={<SafetyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
