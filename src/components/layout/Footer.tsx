import { Link, useLocation } from 'react-router-dom'

const linkClass = 'hover:text-[#022c22] transition-colors'

export function Footer() {
  const { pathname } = useLocation()
  const onLanding = pathname === '/'

  // On the landing page use native anchors so the browser hash-scrolls smoothly.
  // From any other page use React Router <Link> to navigate there first.
  const FeaturesLink = onLanding
    ? <a href="#features" className={linkClass}>ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ</a>
    : <Link to="/#features" className={linkClass}>ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ</Link>

  const AboutLink = onLanding
    ? <a href="#about" className={linkClass}>ΣΧΕΤΙΚΑ</a>
    : <Link to="/#about" className={linkClass}>ΣΧΕΤΙΚΑ</Link>

  return (
    <footer className="relative bg-[#ebeeeb] px-6 py-12 shadow-[0px_-4px_30px_-10px_rgba(0,95,86,0.08)]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-[#022c22]">RouteLog</span>
          <span className="text-xs font-medium tracking-[-0.3px] text-[#64748b]">
            © 2026 RouteLog.
          </span>
          <span className="text-xs font-medium tracking-[-0.3px] text-[#64748b]">
            Designed by Theodora Stoura.
          </span>
        </div>

        <div className="flex flex-wrap gap-8 text-xs font-medium tracking-[-0.3px] text-[#64748b]">
          {FeaturesLink}
          {AboutLink}
        </div>

        <div className="flex flex-wrap gap-8 text-xs font-medium tracking-[-0.3px] text-[#64748b]">
          <span className="cursor-default">Πολιτική Απορρήτου</span>
          <span className="cursor-default">Όροι Χρήσης</span>
          <span className="cursor-default">Υποστήριξη</span>
        </div>
      </div>
    </footer>
  )
}
