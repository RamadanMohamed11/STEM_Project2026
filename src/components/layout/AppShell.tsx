import { useState } from 'react'
import { Outlet, matchPath, useLocation } from 'react-router'
import { routePaths } from '@/app/paths'
import { demoCatalog } from '@/features/experiments/data/mockExperiments'
import {
  previewExperimentId,
  resolveSimulation,
} from '@/features/simulations/lib/simulationRegistry'
import { AppShellFooter } from '@/components/layout/AppShellFooter'
import { Header } from '@/components/layout/Header'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { SidebarNavigation } from '@/components/layout/SidebarNavigation'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const labId = matchPath(routePaths.laboratory, pathname)?.params.experimentId
  const immersive = Boolean(
    labId &&
    resolveSimulation(
      demoCatalog.experiments.find(
        (experiment) => experiment.id === (labId === 'preview' ? previewExperimentId : labId),
      ),
    ),
  )

  // The actual laboratory is a viewport application, not a long dashboard
  // article. Catalog, safety and unavailable routes retain the standard shell.
  if (immersive) {
    return (
      <main id="main-content" tabIndex={-1} className="h-dvh w-full overflow-hidden">
        <Outlet />
      </main>
    )
  }

  return (
    <div className="min-h-screen min-w-0 bg-canvas text-ink md:grid md:grid-cols-[80px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold text-navy focus:fixed focus:start-4 focus:top-4 focus:not-sr-only"
      >
        Skip to main content
      </a>

      <SidebarNavigation />

      <div className="flex min-h-screen min-w-0 flex-col">
        <Header menuOpen={menuOpen} onMenuOpen={() => setMenuOpen(true)} />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
        <AppShellFooter />
      </div>

      <MobileNavigation open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
