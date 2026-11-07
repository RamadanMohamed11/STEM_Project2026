import { NavLink } from 'react-router'
import { adminNavigationItems } from '../config/adminNavigation'

interface AdminNavigationListProps {
  variant: 'sidebar' | 'drawer'
  onNavigate?: () => void
}

export function AdminNavigationList({ variant, onNavigate }: AdminNavigationListProps) {
  return (
    <nav aria-label={variant === 'sidebar' ? 'Admin navigation' : 'Admin mobile navigation links'}>
      <ul className="space-y-1.5">
        {adminNavigationItems.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.id}>
              <NavLink
                to={item.to}
                end={item.exact}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group flex min-h-11 items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-teal-light focus-visible:outline-offset-2 ${
                    isActive
                      ? 'bg-teal text-white font-semibold shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.status === 'planned' && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/75 uppercase">
                    Planned
                  </span>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
