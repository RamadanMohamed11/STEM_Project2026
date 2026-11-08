import { AuthProvider } from '@/features/auth/AuthProvider'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/app/routes'
import { useDocumentLocale } from '@/hooks/useDocumentLocale'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

export default function App() {
  useDocumentLocale()

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
