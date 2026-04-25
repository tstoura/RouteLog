import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar.tsx'
import { AdminTopBar } from './AdminTopBar.tsx'
import { AdminBottomNavigation } from './AdminBottomNavigation.tsx'
import { ScrollToTop } from '../layout/ScrollToTop.tsx'

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#f9f9fc] pb-20 text-[#1a1c1e] md:pb-0">
      <ScrollToTop />
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-10 md:py-12">
          <Outlet />
        </main>
      </div>
      <AdminBottomNavigation />
    </div>
  )
}
