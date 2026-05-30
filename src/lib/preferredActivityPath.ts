const PREFERRED_ACTIVITY_ROUTES: Record<string, string> = {
  hiking: '/app/new/hiking',
  climbing: '/app/new/climbing',
  expedition: '/app/new/expedition',
}

/**
 * Returns the direct form route for the given preferredActivity value,
 * or the activity type selection page ('/app/new') when no preference is set.
 *
 * All "Καταγραφή Δράσης" entry points (home card, sidebar, bottom nav) must
 * use this helper to stay consistent.
 */
export function getPreferredActivityPath(
  preferredActivity: string | null | undefined,
): string {
  if (preferredActivity && PREFERRED_ACTIVITY_ROUTES[preferredActivity]) {
    return PREFERRED_ACTIVITY_ROUTES[preferredActivity]
  }
  return '/app/new'
}
