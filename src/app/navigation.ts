import {
  BookOpenText,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  House,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { matchPath } from 'react-router'
import { routePaths } from './paths.ts'

export const primaryNavigation = [
  { id: 'home', label: 'Home', to: routePaths.home, icon: House },
  { id: 'safety', label: 'Safety Procedures', to: routePaths.safety, icon: ShieldCheck },
  { id: 'grades', label: 'Choose Your Grade', to: routePaths.grades, icon: GraduationCap },
  { id: 'terms', label: 'Choose Your Term', to: routePaths.terms, icon: CalendarDays },
  { id: 'experiments', label: 'Experiments', to: routePaths.experiments, icon: BookOpenText },
  { id: 'lab', label: 'Virtual Lab', to: routePaths.laboratoryPreview, icon: FlaskConical },
] as const

export const accountNavigation = [
  { id: 'signup', label: 'Sign Up', to: routePaths.signUp, icon: UserPlus },
  { id: 'login', label: 'Login', to: routePaths.login, icon: LogIn },
] as const

export const navigationSections = [
  { label: 'Explore', items: primaryNavigation },
  { label: 'Account', items: accountNavigation },
] as const

export function getActiveNavigationId(pathname: string) {
  const path = pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
  if (matchPath(routePaths.forgotPassword, path) || matchPath(routePaths.resetPassword, path))
    return 'login'
  if (matchPath(routePaths.profile, path)) return 'profile'
  if (matchPath(routePaths.account, path)) return 'profile'
  if (matchPath(routePaths.authCallback, path)) return 'login'
  if (matchPath(routePaths.laboratory, path)) return 'lab'
  if (
    [routePaths.experimentDetails, routePaths.experimentQuiz, routePaths.quizResults].some(
      (pattern) => matchPath(pattern, path),
    )
  )
    return 'experiments'
  const item = [...primaryNavigation, ...accountNavigation].find(
    (candidate) => candidate.to.toLowerCase() === path.toLowerCase(),
  )
  if (item) return item.id
  return null
}

export function getPageContext(pathname: string) {
  if (matchPath(routePaths.account, pathname) || matchPath(routePaths.profile, pathname))
    return 'Your Profile'
  if (matchPath(routePaths.authCallback, pathname)) return 'Confirm Your Email'
  if (matchPath(routePaths.forgotPassword, pathname)) return 'Forgot Password'
  if (matchPath(routePaths.resetPassword, pathname)) return 'Reset Password'
  if (matchPath(routePaths.quizResults, pathname)) return 'Quiz Results'
  if (matchPath(routePaths.experimentQuiz, pathname)) return 'Experiment Quiz'
  if (matchPath(routePaths.experimentDetails, pathname)) return 'Experiment Details'
  const current = getActiveNavigationId(pathname)
  return (
    [...primaryNavigation, ...accountNavigation].find((item) => item.id === current)?.label ??
    'Page not found'
  )
}
