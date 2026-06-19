import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { RouteLogLogoMark } from '../brand/RouteLogLogoMark.tsx'

type ActiveSection = 'features' | 'about' | null

const activeClass =
  'border-b-2 border-[#064e3b] pb-1.5 text-[14px] font-semibold uppercase tracking-[0.35px] text-[#064e3b]'
const inactiveClass =
  'pb-2 text-[14px] font-semibold uppercase tracking-[0.35px] text-[#475569] transition-colors hover:text-[#064e3b]'

const HEADER_HEIGHT = 72

export function PublicHeader() {
  const { pathname } = useLocation()
  const onLanding = pathname === '/'

  // null = user is at the top (hero), no section is active yet
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)

  useEffect(() => {
    if (!onLanding) {
      setActiveSection(null)
      return
    }

    const update = () => {
      const features = document.getElementById('features')
      const about = document.getElementById('about')
      if (!features || !about) return

      const aboutThreshold = about.offsetTop - HEADER_HEIGHT - 40
      const featuresThreshold = features.offsetTop - HEADER_HEIGHT - 40

      if (window.scrollY >= aboutThreshold) {
        setActiveSection('about')
      } else if (window.scrollY >= featuresThreshold) {
        setActiveSection('features')
      } else {
        setActiveSection(null)
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [onLanding])

  // When already on the landing page, intercept the logo click and
  // smooth-scroll back to the top instead of doing a no-op navigation.
  const handleLogoClick: React.MouseEventHandler<HTMLAnchorElement> = onLanding
    ? (e) => {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    : undefined!

  const featuresActive = onLanding && activeSection === 'features'
  const aboutActive = onLanding && activeSection === 'about'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5ebe8] bg-[rgba(240,244,242,0.95)] shadow-[0px_4px_30px_-10px_rgba(0,95,86,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 py-3">
        <RouteLogLogoMark size="xl" onClick={handleLogoClick} />

        <nav className="hidden items-center gap-8 md:flex">
          {onLanding ? (
            <a href="#features" className={featuresActive ? activeClass : inactiveClass}>
              ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ
            </a>
          ) : (
            <Link to="/#features" className={inactiveClass}>
              ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ
            </Link>
          )}

          {onLanding ? (
            <a href="#about" className={aboutActive ? activeClass : inactiveClass}>
              ΣΧΕΤΙΚΑ
            </a>
          ) : (
            <Link to="/#about" className={inactiveClass}>
              ΣΧΕΤΙΚΑ
            </Link>
          )}
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
