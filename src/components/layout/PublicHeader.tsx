import { Link, useLocation } from 'react-router-dom'
import { RouteLogLogoMark } from '../brand/RouteLogLogoMark.tsx'

export function PublicHeader() {
  const { pathname } = useLocation()
  const onLanding = pathname === '/'

  const featuresClassName = onLanding
    ? 'border-b-2 border-[#064e3b] pb-1.5 text-[14px] font-semibold uppercase tracking-[0.35px] text-[#064e3b]'
    : 'pb-2 text-[14px] font-semibold uppercase tracking-[0.35px] text-[#475569] transition-colors hover:text-[#064e3b]'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5ebe8] bg-[rgba(240,244,242,0.95)] shadow-[0px_4px_30px_-10px_rgba(0,95,86,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-3">
        <RouteLogLogoMark size="xl" />

        <nav className="hidden items-center gap-8 md:flex">
          {onLanding ? (
            <a href="#features" className={featuresClassName}>
              ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ
            </a>
          ) : (
            <Link to="/#features" className={featuresClassName}>
              ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ
            </Link>
          )}
          {/* TODO: About / Magazine pages when content exists */}
          <span className="cursor-default pb-2 text-[14px] font-semibold uppercase tracking-[0.35px] text-[#475569]">
            ΣΧΕΤΙΚΑ
          </span>
          <span className="cursor-default pb-2 text-[14px] font-semibold uppercase tracking-[0.35px] text-[#475569]">
            ΠΕΡΙΟΔΙΚΟ
          </span>
        </nav>

        <Link
          to="/login"
          className="rounded bg-[#005f56] px-6 py-2.5 text-center text-[14px] font-semibold uppercase tracking-[0.35px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition hover:bg-[#004a43]"
        >
          ΣΥΝΔΕΣΗ
        </Link>
      </div>
    </header>
  )
}
