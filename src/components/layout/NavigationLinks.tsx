import { AuthAccountControl } from '@/features/auth/AuthAccountControl'
import { Link, useLocation } from 'react-router'
import { getActiveNavigationId, navigationSections } from '@/app/navigation'

interface NavigationLinksProps {
  variant: 'sidebar' | 'drawer'
  isCollapsed?: boolean
  onNavigate?: () => void
}

export function NavigationLinks({ variant, isCollapsed = false, onNavigate }: NavigationLinksProps) {
  const { pathname } = useLocation()
  const activeId = getActiveNavigationId(pathname)
  const isDesktopCollapsed = variant === 'sidebar' && isCollapsed

  return (
    <nav aria-label={variant === 'sidebar' ? 'Main navigation' : 'Mobile main navigation'}>
      {navigationSections.map((section, sectionIndex) => (
        <div
          key={section.label}
          className={sectionIndex > 0 ? 'mt-6 border-t border-white/15 pt-4' : undefined}
        >
          {sectionIndex > 0 && (
            <p
              className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 ${
                isDesktopCollapsed ? 'sr-only' : 'block'
              }`}
            >
              {section.label}
            </p>
          )}
          <ul className="space-y-1.5">
            {section.items.map(({ id, label, to, icon: Icon }) => {
              const active = id === activeId

              return (
                <li key={id}>
                  <Link
                    to={to}
                    onClick={onNavigate}
                    title={label}
                    aria-label={label}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex min-h-12 items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-teal-light focus-visible:outline-offset-2 active:scale-[0.98] ${
                      isDesktopCollapsed
                        ? 'justify-center px-2'
                        : 'justify-start px-3.5'
                    } ${
                      active
                        ? 'bg-white/14 font-semibold text-white shadow-sm'
                        : 'text-white/75 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute inset-y-2.5 start-0 w-[3px] rounded-e-full bg-teal-light shadow-[0_0_8px_rgba(168,197,224,0.8)]"
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.1 : 1.8}
                      className="shrink-0 transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
                      aria-hidden="true"
                    />
                    <span className={isDesktopCollapsed ? 'sr-only' : 'truncate'}>{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <AuthAccountControl isCollapsed={isDesktopCollapsed} />
    </nav>
  )
}
