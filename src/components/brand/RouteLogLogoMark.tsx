import { Link } from 'react-router-dom'

const LOGO_SRC = '/brand/routelog-logo.png'

type Props = {
  className?: string
  to?: string
  /** Tailwind height class for the raster mark (wordmark + tagline). */
  size?: 'md' | 'lg' | 'xl' | 'sidebar'
}

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  md: 'h-12 w-auto sm:h-14',
  lg: 'h-14 w-auto sm:h-16',
  xl: 'h-16 w-auto sm:h-[4.5rem] md:h-[5rem]',
  sidebar: 'h-auto w-full max-h-[72px]',
}

/**
 * Raster mark (transparent PNG). Tweak `size` for header vs marketing.
 */
export function RouteLogLogoMark({ className = '', to = '/', size = 'lg' }: Props) {
  return (
    <Link
      to={to}
      className={`inline-flex shrink-0 items-center ${className}`}
      aria-label="RouteLog — αρχική"
    >
      <img
        src={LOGO_SRC}
        alt="RouteLog Logo - Track Your Adventures"
        className={`${sizeClass[size]} object-contain object-left`}
        decoding="async"
      />
    </Link>
  )
}
