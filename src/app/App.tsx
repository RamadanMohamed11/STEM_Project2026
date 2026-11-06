import { AuthProvider } from '@/features/auth/AuthProvider'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/app/routes'
import { useDocumentLocale } from '@/hooks/useDocumentLocale'

export default function App() {
  useDocumentLocale()

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
