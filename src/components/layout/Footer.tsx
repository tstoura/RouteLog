import { Link } from 'react-router-dom'

export function Footer() {
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
          <Link to="/#features" className="hover:text-[#022c22]">
            ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ
          </Link>
          <span className="cursor-default">ΣΧΕΤΙΚΑ</span>
          <span className="cursor-default">ΠΕΡΙΟΔΙΚΟ</span>
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
