# Routes Tab — Behavior and Architecture

**Status:** Implemented  
**Implemented in:** Phase 10F — Routes Tab Backend Integration

---

## What the Routes Tab Is

The **Διαδρομές** (Routes) tab is a shared catalogue of canonical climbing routes.
It is **not** the user's activity history.

Key distinction:
- A *route* is a named climbing line on a rock face. It is shared across all users
  and clubs. Multiple activities can reference the same route.
- An *activity* is a single dated climb by a specific user. Activities reference routes
  by `routeId`.

---

## Route Creation

Routes can be created from two places:

### A) Rock Climbing activity form modal

When filling in a climbing activity form, if no matching route is found, the user can
open **"+ Νέα Διαδρομή"** which opens a `CreateRouteModal`.  
On success, the new route UUID is automatically selected in the form (prefill).

### B) Routes tab (standalone)

The Routes tab has a **"+ Νέα Διαδρομή"** button that opens the same `CreateRouteModal`
directly from the catalogue page.

Both paths call the same API endpoint:

```
POST /climbing-routes
```

---

## API Endpoints Used

| Action | Endpoint |
|---|---|
| List all routes | `GET /climbing-routes` |
| Get route detail + reviews | `GET /climbing-routes/:id` |
| Create a new route | `POST /climbing-routes` |

### GET /climbing-routes

Returns an array of route objects. Client-side filtering and pagination are applied in
`RoutesPage.tsx`. Backend pagination will be added when the route catalogue grows beyond
~100 routes.

### GET /climbing-routes/:id

Returns route detail plus an aggregated list of user reviews. Reviews are sourced from
the `publicNotes` field of climbing activities that reference the route. Private notes
(`privateNotes`) are **never** included in route reviews.

---

## "Καταχώρησε νέα ανάβαση" Button

On the route detail page, the **"Καταχώρησε νέα ανάβαση"** button navigates to the
Rock Climbing activity form, passing the route UUID as a URL/state parameter.

The form autofills from the route's stored data (name, mountain/area, climbing field,
default scale/grade, altitude, route length) when a route UUID is present.

---

## Reviews

- Reviews are assembled from `publicNotes` of all climbing activities linked to the route.
- There is no separate `route_reviews` table.
- User display names on review cards are currently omitted (requires a
  `GET /users/:id/profile` endpoint or embedding the user name in the activity response —
  deferred to the auth/profile phase).

---

## Remaining TODOs

| Item | Notes |
|---|---|
| Backend pagination for `GET /climbing-routes` | Add `skip`/`take` when DB grows beyond ~100 routes |
| URL `?field=` param alignment | Legacy `metropolis`/`panagia`/`galazio` key system should be replaced with real `climbingField` values once form links are updated |
| User display names on reviews | Requires auth/profile phase |
| Admin route editing | Restricted to `super_admin`; not yet exposed via UI |
| Better filters | Current filters are client-side; consider server-side `?q=&field=` params |
