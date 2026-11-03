import { BookOpenText, FlaskConical, House, ShieldCheck } from 'lucide-react'

export const primaryNavigation = [
  { id: 'home', label: 'Home', to: '/', icon: House },
  { id: 'experiments', label: 'Experiments', to: '/experiments', icon: BookOpenText },
  { id: 'lab', label: 'Virtual Lab', to: '/experiments/preview/lab', icon: FlaskConical },
  { id: 'safety', label: 'Safety Procedures', to: '/safety', icon: ShieldCheck },
] as const

export function getActiveNavigationId(pathname: string) {
  const path = pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
  if (path === '/') return 'home'
  if (path === '/experiments') return 'experiments'
  if (/^\/experiments\/[^/]+\/lab$/.test(path)) return 'lab'
  if (path === '/safety') return 'safety'
  return null
}

export function getPageContext(pathname: string) {
  const current = getActiveNavigationId(pathname)
  return primaryNavigation.find((item) => item.id === current)?.label ?? 'Page not found'
}
