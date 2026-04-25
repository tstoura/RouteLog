import { Outlet, useLocation } from 'react-router-dom'
import { PublicHeader } from './PublicHeader.tsx'
import { Footer } from './Footer.tsx'
import { ScrollToTop } from './ScrollToTop.tsx'

export function PublicLayout() {
  const { pathname } = useLocation()
  const hideFooter = pathname === '/login' || pathname === '/register'

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9f8] text-[#1a1c1e]">
      <ScrollToTop />
      <PublicHeader />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      {hideFooter ? null : <Footer />}
    </div>
  )
}
