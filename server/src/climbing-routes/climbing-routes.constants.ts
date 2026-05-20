/**
 * Allowed values for routes.category.
 * Source: docs/backend-decisions.md §10, docs/database/database-schema.md §8
 *
 * MVP value is always "climbing". The field is kept as a String (not enum)
 * so hiking/expedition route types can be added later without a migration.
 */
export const ROUTE_CATEGORIES = ['climbing'] as const
export type RouteCategory = (typeof ROUTE_CATEGORIES)[number]

/**
 * Allowed values for routes.default_scale (and climbing_activity_details.difficulty_scale).
 * "uiaa"   — UIAA/Alpine grades (IV, V-, ..., XI+, D-, ..., ED+)
 * "french" — French sport grades (6a, 6c+, 7b, ...) — requires grade_mappings lookup.
 */
export const ROUTE_DIFFICULTY_SCALES = ['uiaa', 'french'] as const
export type RouteDifficultyScale = (typeof ROUTE_DIFFICULTY_SCALES)[number]

/**
 * Normalises a route name for exact-duplicate detection.
 *
 * Rules applied:
 *   1. Trim leading/trailing whitespace.
 *   2. Collapse any run of internal whitespace to a single space.
 *   3. Convert to lowercase.
 *
 * Example:
 *   "  Interstellar  " → "interstellar"
 *   "Le  Voyage" → "le voyage"
 *
 * The result is stored in routes.normalized_name.
 * It is a technical field and must never be shown to the user.
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}
