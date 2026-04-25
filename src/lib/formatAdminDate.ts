/** Format ISO YYYY-MM-DD as DD/MM/YYYY for display. */
export function formatAdminDateDisplay(iso: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}
