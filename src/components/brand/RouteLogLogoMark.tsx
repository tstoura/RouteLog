import { Link } from 'react-router-dom'

type Props = {
  className?: string
  to?: string
  /** Tailwind height class for the raster mark (wordmark + tagline). */
  size?: 'md' | 'lg' | 'xl' | 'sidebar'
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  md: 'h-12 w-auto sm:h-14',
  lg: 'h-14 w-auto sm:h-16',
  xl: 'h-16 w-auto sm:h-[4.5rem] md:h-[5rem]',
  sidebar: 'h-auto w-full max-h-[72px]',
}

/**
 * Raster mark. Uses responsive srcset to serve:
 *   1× displays → routelog-logo-1x.webp  (248×80,  ~9 KB)
 *   2× retina   → routelog-logo.webp     (496×160, ~29 KB)
 * PNG fallback for browsers without WebP support.
 * width/height reflect the 1× display size; the browser reserves the
 * correct aspect-ratio space before the image loads (prevents CLS).
 */
export function RouteLogLogoMark({ className = '', to = '/', size = 'lg', onClick }: Props) {
  return (
    <Link
      to={to}
      className={`inline-flex shrink-0 items-center ${className}`}
      aria-label="RouteLog — αρχική"
      onClick={onClick}
    >
      <picture>
        <source
          srcSet="/brand/routelog-logo-1x.webp 1x, /brand/routelog-logo.webp 2x"
          type="image/webp"
        />
        <img
          src="/brand/routelog-logo.png"
          alt="RouteLog Logo - Track Your Adventures"
          width={248}
          height={80}
          className={`${sizeClass[size]} object-contain object-left`}
          decoding="async"
        />
      </picture>
    </Link>
  )
}
