import { useEffect } from 'react'
import { defaultLocale } from '@/app/locale'

export function useDocumentLocale() {
  useEffect(() => {
    document.documentElement.lang = defaultLocale.language
    document.documentElement.dir = defaultLocale.direction
  }, [])
}
