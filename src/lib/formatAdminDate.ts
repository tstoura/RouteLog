/**
 * Format an ISO date string (YYYY-MM-DD or full ISO timestamp) as DD/MM/YYYY.
 * Handles both "2026-04-12" and "2026-04-12T00:00:00.000Z".
 */
export function formatAdminDateDisplay(iso: string): string {
  const dateOnly = iso.slice(0, 10)
  const parts = dateOnly.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}
