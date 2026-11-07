import {
  BarChart3,
  BookOpen,
  FileQuestion,
  FlaskConical,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { matchPath } from 'react-router'
import { routePaths } from '../../../app/paths.ts'
import type { BreadcrumbItem } from '../../../components/ui/Breadcrumbs.tsx'

export type AdminSectionId =
  | 'dashboard'
  | 'curriculum'
  | 'experiments'
  | 'questions'
  | 'students'
  | 'reports'

export interface AdminNavigationItem {
  id: AdminSectionId
  label: 'Dashboard' | 'Curriculum' | 'Experiments' | 'Questions' | 'Students' | 'Reports'
  pageTitle: string
  eyebrow: string
  to: string
  icon: LucideIcon
  exact?: boolean
  status: 'active' | 'planned'
  plannedTask?: string
  description: string
  plannedCapabilities?: readonly string[]
}

export const adminNavigationItems: readonly AdminNavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    pageTitle: 'Admin',
    eyebrow: 'Dashboard Overview',
    to: routePaths.admin,
    icon: LayoutDashboard,
    exact: true,
    status: 'active',
    description:
      'Authorized overview of experiment readiness, assessment availability, and platform administration.',
  },
  {
    id: 'curriculum',
    label: 'Curriculum',
    pageTitle: 'Curriculum',
    eyebrow: 'Academic Structure',
    to: routePaths.adminCurriculum,
    icon: BookOpen,
    status: 'planned',
    plannedTask: 'T32',
    description:
      'Organize secondary school grades, academic terms, chemistry units, and lesson associations.',
    plannedCapabilities: [
      'Review and structure First, Second, and Third Secondary Grade curriculum trees',
      'Assign chemistry units and lessons to First Term and Second Term schedules',
      'Link verified virtual laboratory experiments to approved curriculum lessons',
    ],
  },
  {
    id: 'experiments',
    label: 'Experiments',
    pageTitle: 'Experiments',
    eyebrow: 'Laboratory Catalog',
    to: routePaths.adminExperiments,
    icon: FlaskConical,
    status: 'planned',
    plannedTask: 'T33',
    description:
      'Inspect and manage 3D laboratory experiment metadata, learning objectives, safety rules, and publication status.',
    plannedCapabilities: [
      'Manage experiment learning objectives, safety requirements, and stage explanations',
      'Review 3D simulation readiness before transitioning experiments from draft to published',
      'Maintain equipment and chemical reagent reference descriptions',
    ],
  },
  {
    id: 'questions',
    label: 'Questions',
    pageTitle: 'Questions',
    eyebrow: 'Assessment Bank',
    to: routePaths.adminQuestions,
    icon: FileQuestion,
    status: 'planned',
    plannedTask: 'T34',
    description:
      'Author, validate, and version post-experiment multiple-choice assessment questions and explanations.',
    plannedCapabilities: [
      'Author and review multiple-choice questions linked to specific experiment learning objectives',
      'Configure answer explanations, option ordering, and passing threshold policies',
      'Publish versioned assessment packages with integrity validation checks',
    ],
  },
  {
    id: 'students',
    label: 'Students',
    pageTitle: 'Students',
    eyebrow: 'Directory & Roles',
    to: routePaths.adminStudents,
    icon: Users,
    status: 'planned',
    plannedTask: 'T35',
    description:
      'View authorized student directory summaries and manage audited role assignments under Row Level Security.',
    plannedCapabilities: [
      'View authorized account role assignments with full audit trail visibility',
      'Assign or revoke instructor and administrator roles through audited database procedures',
      'Respect strict student privacy boundaries enforced by PostgreSQL Row Level Security',
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    pageTitle: 'Reports',
    eyebrow: 'Educational Insights',
    to: routePaths.adminReports,
    icon: BarChart3,
    status: 'planned',
    plannedTask: 'T35',
    description:
      'Review aggregated experiment completion trends, assessment readiness, and role governance audit logs.',
    plannedCapabilities: [
      'Inspect aggregated experiment completion and practice quiz performance summaries',
      'Review immutable administrative role change audit logs (admin_role_audit_log)',
      'Export curriculum and assessment readiness summaries for academic review',
    ],
  },
] as const

export function getActiveAdminNavItem(pathname: string): AdminNavigationItem {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
  for (const item of adminNavigationItems) {
    if (item.exact) {
      if (matchPath({ path: item.to, end: true }, normalized)) {
        return item
      }
    } else if (matchPath({ path: item.to, end: false }, normalized)) {
      return item
    }
  }
  return adminNavigationItems[0]
}

export function getAdminBreadcrumbs(pathname: string): readonly BreadcrumbItem[] {
  const active = getActiveAdminNavItem(pathname)
  if (active.id === 'dashboard') {
    return [{ label: 'Admin', to: routePaths.admin }, { label: 'Dashboard' }]
  }
  return [
    { label: 'Admin', to: routePaths.admin },
    { label: 'Dashboard', to: routePaths.admin },
    { label: active.label },
  ]
}
