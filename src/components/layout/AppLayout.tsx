import { Outlet } from 'react-router-dom'
import { APP_LAYOUT_CREDIT } from '../../constants/appCredit.ts'
import { AppSidebar } from './AppSidebar.tsx'
import { AppTopBar } from './AppTopBar.tsx'
import { BottomNavigation } from './BottomNavigation.tsx'
import { ScrollToTop } from './ScrollToTop.tsx'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#f9f9fc] pb-20 text-[#1a1c1e] md:pb-0">
      <ScrollToTop />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-10 md:py-12">
          <Outlet />
          <p className="mt-10 text-center text-[9px] font-bold uppercase leading-relaxed tracking-[0.12em] text-[#94a3b8] md:hidden">
            {APP_LAYOUT_CREDIT}
          </p>
        </main>
      </div>
      <BottomNavigation />
    </div>
  )
}
