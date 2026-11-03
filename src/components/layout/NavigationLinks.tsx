import { Link, useLocation } from 'react-router'
import { getActiveNavigationId, primaryNavigation } from '@/app/navigation'

interface NavigationLinksProps {
  variant: 'sidebar' | 'drawer'
  onNavigate?: () => void
}

export function NavigationLinks({ variant, onNavigate }: NavigationLinksProps) {
  const { pathname } = useLocation()
  const activeId = getActiveNavigationId(pathname)

  return (
    <nav aria-label={variant === 'sidebar' ? 'Main navigation' : 'Mobile main navigation'}>
      <ul className="space-y-1.5">
        {primaryNavigation.map(({ id, label, to, icon: Icon }) => {
          const active = id === activeId
          const desktop = variant === 'sidebar'

          return (
            <li key={id}>
              <Link
                to={to}
                onClick={onNavigate}
                aria-label={desktop ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex min-h-12 items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                  desktop ? 'justify-center px-3 xl:justify-start xl:px-4' : 'px-4'
                } ${
                  active
                    ? 'bg-white/13 font-semibold text-white'
                    : 'text-white/75 hover:bg-white/9 hover:text-white'
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-y-3 start-0 w-[3px] rounded-e-full bg-teal-light"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.1 : 1.8}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span className={desktop ? 'hidden xl:inline' : undefined}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
