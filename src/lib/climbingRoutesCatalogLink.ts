/**
 * Deep link to the Routes catalog: climbing tab + sector (climbing field) filter.
 * Returns null when the field is empty — callers should hide the CTA.
 *
 * Query params match `RoutesPage` (`category=climbing`, `sector=<climbingField>`).
 */
export function climbingSameFieldRoutesHref(climbingField: string | null | undefined): string | null {
  const f = climbingField?.trim()
  if (!f) return null
  const qs = new URLSearchParams({ category: 'climbing', sector: f })
  return `/app/routes?${qs.toString()}`
}
