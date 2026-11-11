import { create } from 'zustand'

interface SidebarState {
  isCollapsed: boolean
  toggleSidebar: () => void
  setCollapsed: (collapsed: boolean) => void
}

const STORAGE_KEY = 'stem_sidebar_collapsed'

function getInitialCollapsedState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      return saved === 'true'
    }
    // Default to collapsed on mid screens (768px-1279px) and expanded on wide screens (>= 1280px)
    return window.innerWidth < 1280
  } catch {
    return false
  }
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: getInitialCollapsedState(),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.isCollapsed
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // Storage access may be blocked
      }
      return { isCollapsed: next }
    }),
  setCollapsed: (collapsed) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // Storage access may be blocked
    }
    set({ isCollapsed: collapsed })
  },
}))
