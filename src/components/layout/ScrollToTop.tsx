import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * On route change, scroll the window to the top (shared app behavior).
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])
  return null
}
