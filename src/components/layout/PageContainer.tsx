import type { ReactNode } from 'react'

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 xl:px-12 xl:py-12">
      {children}
    </div>
  )
}
