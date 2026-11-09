import { AuthProvider } from '@/features/auth/AuthProvider'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/app/routes'
import { useDocumentLocale } from '@/hooks/useDocumentLocale'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { ProgressAccountSync } from '@/features/progress/components/ProgressAccountSync'
import { RouteAnnouncement } from '@/components/layout/RouteAnnouncement'

export default function App() {
  useDocumentLocale()

  return (
    <AuthProvider>
      <ProgressAccountSync />
      <BrowserRouter>
        <ScrollToTop />
        <RouteAnnouncement />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
