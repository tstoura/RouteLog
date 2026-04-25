# RouteLog — Project documentation (current state)

This document describes the **RouteLog** codebase as implemented in the repository: UI, client-side logic, mock data, and routing. It is written for reporting and onboarding; it does not assume production backend or real authentication.

---

## 1. Project overview

### Purpose

**RouteLog** is a **club-oriented mountain activity journal** (Greek UI: “Ορειβατικό Ημερολόγιο”). It presents a **marketing landing**, **sign-in / sign-up flows**, an **authenticated-style app shell**, a **prototype admin area** for club-level oversight (UI + mock data only), and **prototype forms** to log activities (hiking, rock climbing, expeditions), browse **mock routes**, and view **mock history** and **detail** pages.

### Problem it addresses (conceptually)

- Central place to **record** outings and climbs aligned with a **mountaineering club** context.
- **Discover routes** and open a **route detail** view.
- **Pre-fill** a rock-climbing activity from a **known route** (slug or combobox selection).
- **Surface** “official vs personal” participation and scoring hints in the UI (mock).

### Target users (as implied by the UI)

- **Club members** logging official or personal activities.
- **Club administrators** (prototype) reviewing mock members and official activities and triggering a **mock “Excel export”** flow (no file generation).
- Users who **pick a route** from a catalog or **define a new climbing route** in a modal (client-side only).

### Main features implemented (front end only)

- **Landing** with hero, features, CTA.
- **Login** and **Register** (UI + **mock navigation** on submit).
- **Onboarding** after registration (club membership questions; **mock** completion → app).
- **App home** with shortcuts to record activity, history, routes.
- **Activity type hub** (`/app/new`) and **three activity forms** (hiking, rock climbing, expedition) with rich sections and **mock submit** → success banner.
- **Rock climbing**: **route combobox** (always typeable/searchable), **auto-fill** from route selection with **Βουνό / Πεδίο** locked while “locked” to that pick; **create route modal**; **activity-type tabs** (any click, including the active tab, resets the form or navigates — see **`ActivityTypeTabs`** / form pages).
- **Routes list** with filters and links to **route detail**.
- **Route detail** with CTA to **open climbing form with `?route=` slug**; **`RouteDetailModel`** can hide hero, history sidebar link, or reviews “community” badge per slug without forking the page component.
- **History list** with filters, optional **chronological sort** (Όλες + specific year), and links to **activity detail**.
- **Activity detail** and **route detail** layouts with sidebar metrics and sections.
- **Admin panel** (`/admin`, `/admin/members`, `/admin/activities`): dashboard with summary cards and recent official activities table, members directory with search, activities list with year/month filters, **export modal** (checkboxes, mock success message — no real Excel or API).

---

## 2. Tech stack

| Area | Choice |
|------|--------|
| **Framework** | **React 19** (function components) |
| **Build tool** | **Vite 6** |
| **Language** | **TypeScript** (project references: `tsconfig.app.json`, `tsconfig.node.json`) |
| **Styling** | **Tailwind CSS v4** via `@tailwindcss/vite` |
| **Routing** | **React Router DOM v7** — `createBrowserRouter`, `RouterProvider`, nested routes |
| **State management** | **React local state** (`useState`, `useMemo`, `useCallback`). **No** Redux, Zustand, or React Query. |
| **Icons** | **lucide-react** |
| **Forms** | Native `<form>` + controlled/uncontrolled inputs; **no** react-hook-form / Formik |
| **HTTP / API** | **None** — no `fetch` layer for a real backend in the described files |
| **Lint** | ESLint + TypeScript ESLint |

---

## 3. Project structure

### Repository root (high level)

- **`src/`** — application source.
- **`public/`** — static assets (e.g. brand images referenced by constants).
- **`vite.config.ts`**, **`index.html`**, **`package.json`** — tooling and entry.
- **`README.md`** — quick start for developers.
- **`DOCUMENTATION.md`** — this full project documentation.

### `src/app/`

- **`App.tsx`** — mounts `RouterProvider` with the app router.
- **`router.tsx`** — **single source of truth** for all routes and layouts.

### `src/pages/`

- **`public/`** — unauthenticated marketing and auth: `LandingPage`, `LoginPage`, `RegisterPage`.
- **`public/OnboardingPage.tsx`** — mounted **outside** `PublicLayout` at `/onboarding`.
- **`app/`** — authenticated shell pages: `HomePage`, `NewActivityPage`, form pages, `RoutesPage`, `RouteDetailPage`, `HistoryPage`, `ActivityDetailPage`.
- **`admin/`** — admin shell pages: `AdminDashboardPage`, `AdminMembersPage`, `AdminActivitiesPage`.

### `src/components/`

- **`layout/`** — `PublicLayout`, `PublicHeader`, `Footer`, `AppLayout`, `AppSidebar`, `AppTopBar`, `BottomNavigation`, `AppPageHeading`, `AppScreenNav`, etc.
- **`landing/`** — `HeroSection`, `FeaturesSection`, `CTASection`, `FeatureCard`.
- **`auth/`** — `AuthPageShell`, `AuthModalCard`, `AuthLabeledField`, `GoogleSignInButton`, dividers, backdrop.
- **`forms/`** — activity forms, `RouteCombobox`, `CreateRouteModal`, `ActivityFormLayout`, `ActivitySuccessBanner`, `AutoFilledBadge`, shared `FormBuildingBlocks`, etc.
- **`ui/`** — primitives: `Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `FormSection`, `EmptyState`, etc.
- **`routes/`**, **`history/`**, **`detail/`**, **`brand/`**, **`icons/`** — feature-specific UI.
- **`components/admin/`** — `AdminLayout`, `AdminSidebar`, `AdminTopBar`, `AdminBottomNavigation`, `ExportDataModal` (same visual language as the main app: green palette, sidebar + top bar).

### `src/data/`

- **`mockRoutes.ts`**, **`mockRouteDetails.ts`**, **`mockHistoryCards.ts`**, **`mockActivities.ts`**, **`climbingFormRoutes.ts`** — mock catalogs and detail payloads.
- **`mockAdminUsers.ts`**, **`mockOfficialActivities.ts`** — mock members and official activities for the admin UI.

### `src/types/`

- TypeScript models: `route.ts`, `climbingRouteForm.ts`, `historyCard.ts`, `routeDetail.ts`, `activityDetail.ts`, `activity.ts`, **`adminMock.ts`** (admin list row types), etc.

### `src/lib/` & `src/constants/`

- **`lib/activityRoutePrefill.ts`** — maps a route **slug** to climbing form values.
- **`lib/historyCardDateSort.ts`** — parses **`HistoryCard.dateLabel`** (`DD/MM/YYYY`) and sorts cards **newest → oldest** for the history list when applicable.
- **`lib/formatAdminDate.ts`** — formats ISO dates for admin tables (`DD/MM/YYYY`).
- **`constants/climbingFormOptions.ts`** — grade/scale options for forms and modal.
- **`constants/landingAssets.ts`**, **`constants/appHomeAssets.ts`** — static image paths under `public/`.

### Key files (roles)

| File | Role |
|------|------|
| `src/main.tsx` | React root render |
| `src/app/router.tsx` | Route table |
| `src/components/layout/AppLayout.tsx` | Sidebar + top bar + outlet + bottom nav |
| `src/components/forms/RockClimbingActivityForm.tsx` | Full rock climbing form + auto-fill logic |
| `src/components/forms/RouteCombobox.tsx` | Searchable route picker |
| `src/components/forms/CreateRouteModal.tsx` | Modal to define a new route (mock save) |
| `src/pages/app/RockClimbingFormPage.tsx` | URL `?route=`, success banner, form remounting, **`onActivityTabSelect`** (tab reset / navigate) |
| `src/lib/activityRoutePrefill.ts` | Slug → `ClimbingRouteFormRecord` for prefill |
| `src/lib/historyCardDateSort.ts` | History list: sort by **`dateLabel`** descending |
| `src/pages/app/HistoryPage.tsx` | Filters + conditional sort when **Όλες** + concrete year |
| `src/components/admin/AdminLayout.tsx` | Admin shell: sidebar, top bar, outlet, mobile bottom nav |
| `src/pages/admin/AdminDashboardPage.tsx` | Admin dashboard (cards, recent table, export entry points) |
| `src/components/admin/ExportDataModal.tsx` | Mock federation export: member checkboxes, confirm → success banner only |

---

## 4. UI screens implemented

Routes come from **`router.tsx`**. Public routes use **`PublicLayout`**; the member app lives under **`/app`** with **`AppLayout`**; the **admin** area is a separate branch under **`/admin`** with **`AdminLayout`** (no nested layout inside `AppLayout`). Each screen below lists **content**, **main components**, and **interactions**.

### Landing (`/`)

- **Content:** Hero, feature grid, final CTA (Greek marketing copy). Hero eyebrow uses **`Badge`** (**«Πλατφορμα Καταγραφης Δραστηριοτητων»**) with **`w-fit` / `self-start`** so the pill hugs the text in the flex column (no stretched pill).
- **Components:** `LandingPage` → `HeroSection`, `FeaturesSection`, `CTASection`.
- **Interactions:** Links to sign up / login / app as wired in those sections (see `HeroSection` / `CTASection` for exact targets). Primary hero CTAs use **`cursor-pointer`** for clear affordance.

### Login — Σύνδεση (`/login`)

- **Content:** Centered card with icon, title, username/email, password (show/hide), primary submit, cancel, forgot-password stub, link to register, link home.
- **Components:** `LoginPage`, `AuthPageShell`, `AuthModalCard`, `AuthLabeledField`, `AuthIconCircle`, Lucide icons.
- **Interactions (prototype routing only):** Submit **`preventDefault`**. If the **username/email** field (trimmed, case-insensitive) equals **`admin`** → **`navigate('/admin')`**. **Any other** value → **`navigate('/app')`**. Password is **ignored**. There is **no** real authentication.
- **UX:** Interactive controls (submit, cancel, forgot link, password toggle, **`Link`**) use **`cursor-pointer`** where applicable; shared **`Button`** / **`GoogleSignInButton`** include pointer styling when those primitives are used.

### Register — Δημιουργία λογαριασμού (`/register`)

- **Content:** Google button (stub), divider, name fields, email, password + confirm, activity preference (hiking vs climbing), submit, cancel, links to login and home.
- **Components:** `RegisterPage`, `GoogleSignInButton` (`onClick` empty handler), `AuthDividerWithLabel`, `AuthLabeledField`, etc.
- **Interactions:** Submit → **`navigate('/onboarding')`** — **no persistence**. Preference chips and other click targets use **`cursor-pointer`** for consistency with login.

### Onboarding — first login (`/onboarding`)

- **Content:** Welcome header, “club member?” yes/no, conditional club select + registry number, finish button.
- **Components:** `OnboardingPage`, `AuthModalCard`, `RouteLogLogoMark`, `Select` (mock clubs).
- **Interactions:** Local state for answers; completion → **`navigate('/app')`** — **not saved**.

### App home (`/app`)

- **Content:** Personalized greeting, large cards for **Καταγραφή Δράσης**, **Ιστορικό**, **Διαδρομές**, plus additional promo/sections using Figma asset constants.
- **Components:** `HomePage`, images from `APP_HOME_ASSETS` (`public/app-home/`).
- **Interactions:** `Link` to `/app/new`, `/app/history`, `/app/routes`, etc.

### Activity type hub (`/app/new`)

- **Content:** Page heading (same pattern as other app headings), list of three activity types with descriptions.
- **Components:** `NewActivityPage`, `AppPageHeading`, `Card`, `Link`.
- **Interactions:** Navigate to `/app/new/hiking`, `/app/new/climbing`, `/app/new/expedition`.

### Hiking activity form (`/app/new/hiking`)

- **Content:** `ActivityFormLayout` (back link + `AppPageHeading`), then `HikingActivityForm`: **activity-type tab bar**, sections (basics, technical, participation, notes, official block), score card column, submit.
- **Components:** `HikingFormPage`, `HikingActivityForm`, `FormSection`, `FormBuildingBlocks` (date, selects, notes, etc.).
- **Interactions:** Submit triggers parent **`onMockSubmitSuccess`** → success banner, URL replace, form **remount** via `key`. **`HikingFormPage`** passes **`onActivityTabSelect`**: any tab click clears the success banner; clicking **Ορειβασία** again remounts the hiking form; other tabs **`navigate`** to the corresponding **`/app/new/...`** URL.

### Rock climbing activity form (`/app/new/climbing`)

- **Content:** Same layout pattern; `RockClimbingActivityForm` with **Διαδρομή** combobox (aligned with **Ημερομηνία** on wide viewports via grid placement), mountain, field, season/repeat, technical (completion, scale, grade, mixed, altitude, length), participation, notes, official section, actions, sidebar score card.
- **Components:** `RockClimbingFormPage`, `RockClimbingActivityForm`, `RouteCombobox`, `CreateRouteModal`, `AutoFilledBadge`, `FormFieldHelperText`, `activityAutofillCopy` string, modals, tabs.
- **Interactions:** See **Section 6**; URL query **`?route=slug`** supported; mock submit same as hiking. **`RockClimbingFormPage`** passes **`onActivityTabSelect`**: clicking **Αναρρίχηση Βράχου** again **`navigate('/app/new/climbing', { replace: true })`** (clears **`?route=`**) and bumps **`formKey`** to remount the form.

### Expedition activity form (`/app/new/expedition`)

- **Content:** Multi-section expedition-oriented fields (dates, region, transport, difficulty, etc.), **activity-type tab bar**, notes, official block, score card.
- **Components:** `ExpeditionFormPage`, `ExpeditionActivityForm`.
- **Interactions:** Same mock submit / banner pattern as hiking. **`ExpeditionFormPage`** passes **`onActivityTabSelect`** with the same “re-click active tab = remount + clear banner” behavior as the other two forms.

### Routes list (`/app/routes`)

- **Content:** Heading, category tabs (**Ορειβασία / Ορειβατικό Σκι**, **Αναρρίχηση Βράχου**, **Αποστολές Εξωτερικού**), search, **category-aware filters and CTA**, grid of `RouteCard`, empty state when no results.
- **Components:** `RoutesPage`, `RouteCard`, `EmptyState`, `Input`, `Select`, `AppPageHeading`.
- **Interactions:** Filter mock `mockRoutes` by `activityKind`; links to **`/app/routes/:routeSlug`**.
- **Category-specific UI (not global):**
  - **«+ Νέα Διαδρομή»** and the helper line *«Δεν βρίσκεις τη διαδρομή; …»* appear **only** when **Αναρρίχηση Βράχου** is selected. For **Ορειβασία** and **Αποστολές**, that block is hidden; the empty-state description omits the “add with the button above” wording and does not show a **Νέα Διαδρομή** action.
  - **Αναρρίχηση Βράχου:** filters **Πεδίο**, **Βαθμός Δυσκολίας**, **Βουνό / Περιοχή** (unchanged).
  - **Ορειβασία** and **Αποστολές Εξωτερικού:** only **Βαθμός Δυσκολίας** and **Βουνό / Περιοχή** — the **Πεδίο** filter is hidden (field filter is climbing-specific).

### Route detail (`/app/routes/:routeSlug`)

- **Content:** `DetailPageLayout` with sidebar + main column. **Main:** `DetailHeader` (back to routes, title, field / mountain lines, difficulty `DetailBadge`), optional **hero image** (see flags below), a **CTA card** with primary button **«Καταχώρησε νέα ανάβαση»** (compact, content-sized) and helper text **«Ξεκίνα νέα καταγραφή με τα στοιχεία της διαδρομής προσυμπληρωμένα.»**, then sections **Βασικά Στοιχεία**, **Τεχνικά Χαρακτηριστικά**, **Αξιολογήσεις Χρηστών** (user review cards). **Sidebar:** difficulty `DetailSidebarMetricCard`; optional **`DetailSidebarLinkCard`** to history (see flags).
- **Components:** `RouteDetailPage`, `DetailPageLayout`, `DetailHeader`, `DetailSectionCard`, `DetailInfoGrid`, `DetailSidebarMetricCard`, `DetailSidebarLinkCard`, `DetailBadge`, `Button`, `Card`, Lucide icons.
- **Interactions:** CTA → **`/app/new/climbing?route=<slug>`** (URL-encoded). Unknown slug → **«Η διαδρομή δεν βρέθηκε.»** with link back to the list.
- **Per-route UI flags (`RouteDetailModel`, mock-driven):** Some routes can turn off pieces of the shared template without changing components globally:
  - **`showHeroImage`** — if `false`, no hero image is shown even when **`heroImageSrc`** is set. Default: show hero when `heroImageSrc` exists and this flag is not `false`.
  - **`showHistorySidebarLink`** — if `false`, the sidebar link **«Δες σχετικές καταχωρήσεις στο Ιστορικό»** is omitted. Default: shown when not `false`.
  - **`showReviewsCommunityBadge`** — if `false`, the small **«ΟΡΑΤΗ ΑΠΟ ΤΗΝ ΚΟΙΝΟΤΗΤΑ»** badge next to **Αξιολογήσεις Χρηστών** is omitted. Default: shown when not `false`.
- **Example:** Mock **`ptychiouchos`** sets all three flags to **`false`** (cleaner club reference page: no hero, no history sidebar card, no community badge on reviews).

### History (`/app/history`)

- **Content:** Heading, category pills (links; query **`?kind=`** for `hiking` | `rock_climbing` | `expedition` or all), search, year filter (**Όλα τα έτη**, **2026**, **2025**, **2023**), responsive grid of **`HistoryActivityCard`**.
- **Components:** `HistoryPage`, `mockHistoryCards`, `Input`, `Select`, **`sortHistoryCardsByActivityDateDesc`** (`historyCardDateSort.ts`).
- **Interactions:** Search matches title, location, metric, people, **`styleBadge`**, and **`categoryLabel`**. Cards link to **`/app/history/:activitySlug`** when **`detailSlug`** is set (e.g. climbing **Πτυχιούχος**).
- **Ordering:** When **Κατηγορία = Όλες** and the year is **not** **Όλα τα έτη**, after category + search + year filters the list is sorted by **`dateLabel`** (**`DD/MM/YYYY`**) **descending** (newest first). With **Όλα τα έτη**, order stays the **mock array order** (after the same filters). A single **`useMemo`** in **`HistoryPage`** applies filters then optional sort — no per-category duplicate sort paths.
- **Mock hiking sample:** With filter **Ορειβασία / Ορειβατικό Σκι**, three cards illustrate skiing / conditions tags via **`styleBadge`** (**ΟΡΕΙΒΑΤΙΚΟ ΣΚΙ**, **ΚΑΝΟΝΙΚΕΣ ΣΥΝΘΗΚΕΣ**) alongside **`categoryLabel`** **ΟΡΕΙΒΑΣΙΑ**, mountain, elevation, and people lines.

### Activity detail (`/app/history/:activitySlug`)

- **Content:** Full detail template: header badges, sections, sidebar score + deep link to routes.
- **Components:** `ActivityDetailPage`, detail components, `getActivityDetailBySlug`.
- **Interactions:** Read-only display; links out to filtered routes view.

### Success state banner (not a route)

- **Content:** Green success panel with check icon, short message, **“Νέα Διαδρομή”** (resets climbing flow) and **“Προβολή στο Ιστορικό”**.
- **Components:** `ActivitySuccessBanner`.
- **Where:** Injected as **`beforeContent`** of `ActivityFormLayout` on **all three** form pages after mock submit.

### Admin — Πίνακας διαχείρισης (`/admin`)

- **Content:** Dashboard title **«Πίνακας Διαχείρισης»**, subtitle about managing members and official club activities, three summary cards (**Μέλη Συλλόγου**, **Επίσημες Δράσεις**, **Εξαγωγή Δεδομένων** CTA), **recent official activities** table (user, category, route/location, date, **Επίσημη** badge), button **«Εξαγωγή Δεδομένων (Excel)»** opening the export modal.
- **Components:** `AdminDashboardPage`, `AdminLayout`, `Card`, `Button`, `ExportDataModal`, data from **`mockAdminUsers`** / **`mockOfficialActivities`**.
- **Interactions:** Export confirm closes modal and shows inline success **«Η εξαγωγή ολοκληρώθηκε επιτυχώς»** (timed dismiss); **no** file download or server call.

### Admin — Μέλη (`/admin/members`)

- **Content:** Title **«Μέλη Συλλόγου»**; search field (filters **name** or **email** client-side); table columns **Όνομα**, **Email**, **Σύνολο Δράσεων**, **Επίσημες Δράσεις** (mock counts). No edit or approval actions.
- **Components:** `AdminMembersPage`, `mockAdminUsers`.
- **Interactions:** Search only; read-only table.

### Admin — Δράσεις (`/admin/activities`)

- **Content:** Title **«Δράσεις Μελών»**; filters **έτος**, **μήνας**, reset **«Όλες»**; full table (Χρήστης, Κατηγορία, Διαδρομή/Τοποθεσία, Ημερομηνία, **Επίσημη** badge); **«Εξαγωγή Δεδομένων (Excel)»** → same **`ExportDataModal`** as dashboard.
- **Components:** `AdminActivitiesPage`, `Select`, `Card`, `Button`, `mockOfficialActivities`, **`formatAdminDateDisplay`**.
- **Interactions:** Client-side filter by selected year and/or month; export modal + mock success message.

### Admin shell (layout, not a separate “screen” route name)

- **`AdminLayout`:** Mirrors **`AppLayout`**: **`AdminSidebar`** (md+), **`AdminTopBar`**, scrollable **`Outlet`**, **`AdminBottomNavigation`** (mobile).
- **`AdminSidebar`:** **Dashboard** → `/admin` (`LayoutDashboard` icon); **Χρήστες** → `/admin/members` (`Users`); **Δράσεις** → `/admin/activities` (`ClipboardList`); footer **Βοήθεια** (disabled, same as main app stub), **Αποσύνδεση** → **`/login`**. Active item uses the same gradient highlight as **`AppSidebar`**. Logo links to **`/admin`**.
- **`AdminTopBar`:** Dynamic title from pathname (**Πίνακας Διαχείρισης** / **Μέλη Συλλόγου** / **Δράσεις Μελών**); right cluster **«Διαχειριστής»** + avatar image (reuse Figma asset); optional **Settings** icon (no-op). Page body may repeat a longer heading on the dashboard; the top bar title stays short for consistency.

---

## 5. Core reusable components

### Form building blocks (`FormBuildingBlocks.tsx`)

- **`FieldLabel`, `FieldHint`, `FieldHints`** — consistent label and muted helper text.
- **`DateInputWithCalendar`** — date input + calendar icon (static default/placeholder values in forms).
- **`SelectField`** — label + uncontrolled `Select` with `defaultValue`.
- **`SelectFieldControlled`** — label optional + controlled select; supports **`disabled`** with readable disabled styles.
- **`RadioGroupField`** — segmented radio group.
- **`ActivityTypeTabs`** — three **`button`** tabs (not router **`Link`**s); requires **`onTabSelect(kind: ActivityFormTabKind)`** from the parent (type exported from the same module). Each **`HikingFormPage`**, **`RockClimbingFormPage`**, and **`ExpeditionFormPage`** implements navigation and/or **`formKey`** remount so **every** tab press (including the already active type) resets local form state and clears the post-submit success banner where relevant.
- **`NotesSection`, `OfficialParticipationSection`, `FormActions`, `ScoreSummaryCard`** — larger form regions. **`NotesSection`** adds extra top margin before **«ΑΞΙΟΛΟΓΗΣΗ ΔΙΑΔΡΟΜΗΣ (ΠΡΟΑΙΡΕΤΙΚΑ)»** so it is visually separated from the personal-note hint above.
- **Used in:** All three activity forms.

### `Input` / `Select` / `Textarea` / `Button` / `Card` / `Badge` (`components/ui/`)

- Primitive styling for forms and layout.
- **`Button`:** includes **`cursor-pointer`** (with disabled styles unchanged).
- **`Badge`:** **`inline-flex`** with **`w-fit shrink-0 self-start`** so pills do not stretch to full width inside flex parents (landing hero, route cards).
- **Used across:** forms, auth, lists, detail pages.

### `FormSection`

- Section title + icon slot for long forms.
- **Used in:** Activity forms.

### `HistoryActivityCard`

- Renders a **`HistoryCard`**: category pill, date, title, optional **`styleBadge`**, gray info block (location, metric, people), footer status (**Επίσημη** / **Προσωπική**), chevron.
- Wraps in **`Link`** to **`/app/history/:detailSlug`** when **`detailSlug`** is set; otherwise a static **`article`**.

### `RouteCombobox`

- Combobox-style **text input** + **dropdown list** when the trimmed value is **non-empty**; filters **`ClimbingRouteFormRecord`** by name, mountain, or field substring (case-insensitive). The input is **always editable** (no **`readOnly`** lock on the combobox itself).
- **Footer:** “+ ΝΕΑ ΔΙΑΔΡΟΜΗ” opens create flow (text only, no plus icon in footer).
- **Empty state:** message + “Δημιουργία νέας διαδρομής” with plus icon.
- **Used in:** `RockClimbingActivityForm` only. Locking of **Βουνό / Πεδίο** after a list pick is handled in **`RockClimbingActivityForm`** via **`autofill`** + **`lockedRouteName`**; editing the route text so it no longer matches **`lockedRouteName`** clears **`autofill`** and unlocks those fields.

### `CreateRouteModal`

- Full-screen overlay + dialog: route name, field, mountain, scale, grade, optional altitude/length; **Save** builds a **`ClimbingRouteFormRecord`** with temporary `id` (`temp-<timestamp>`); **Cancel** / backdrop closes without saving.
- **Validation:** Save is a **no-op** if required fields are empty (no error toast).
- **Used in:** `RockClimbingActivityForm`.

### `AutoFilledBadge`

- Small green pill: “ΑΥΤΟΜΑΤΗ ΣΥΜΠΛΗΡΩΣΗ”.
- **Used in:** Rock form (route header row; scale/grade below selects; optional on altitude/length when values came from route).

### `FormFieldHelperText`

- Uppercase green helper line for route-driven auto-fill copy.
- **Used in:** Rock form under route / mountain / field when `autofill` is true.

### `ActivityFormLayout`

- Back link to `/app/new`, **`AppPageHeading`** (title + green bar + description), optional **`beforeContent`** (success banner), then children.
- **Used in:** All three `*FormPage` components.

### `ActivitySuccessBanner`

- Success messaging + two actions (callbacks).
- **Used in:** Hiking, rock, expedition form pages.

### Layout: `AppLayout`, `AppSidebar`, `AppTopBar`, `BottomNavigation`

- **`AppLayout`:** Sidebar (md+), top bar, scrollable main, bottom nav (mobile).
- **`AppSidebar`:** Logo, “Καταγραφή Δράσης”, “Διαδρομές”, “Ιστορικό”; **Βοήθεια** disabled; **Αποσύνδεση** links to **`/`** (landing), not a real sign-out.
- **`AppTopBar`:** Top chrome for app (see file for exact controls).
- **`BottomNavigation`:** Compact nav for small screens.

### `AppPageHeading`

- Large green title, **short green underline bar**, optional description paragraph.
- **Used in:** `NewActivityPage`, `ActivityFormLayout`, `HistoryPage`, `RoutesPage`, etc.

### Detail suite (`components/detail/*`)

- **`DetailPageLayout`**, **`DetailSectionCard`**, **`DetailInfoGrid`**, **`DetailSidebarMetricCard`**, **`DetailHeader`**, **`DetailBadge`**, **`DetailSidebarLinkCard`** — consistent route/activity detail presentation.
- **`DetailHeader`:** Optional **`heroImageSrc`**; optional **`showHeroImage`** — when **`false`**, suppresses the hero even if **`heroImageSrc`** is set (per-page / per-mock control). Back link and optional action buttons use pointer-friendly classes where relevant.
- **`DetailSectionCard`:** Optional **`badge`** slot in the section header row (e.g. community visibility chip on route detail reviews — gated from **`RouteDetailPage`** via mock flags).
- **`DetailSidebarLinkCard`:** Sidebar CTA **`Link`** to filtered history or routes; **`cursor-pointer`** on the card. Rendered from **`RouteDetailPage`** / **`ActivityDetailPage`** only when the route model does not disable it.

### Auth shell (`AuthPageShell`, `AuthModalCard`, …)

- Branded full-page frame for login/register.
- **`GoogleSignInButton`:** Full-width outline button with **`cursor-pointer`**.

### Admin layout (`components/admin/*`)

- **`AdminLayout`** — Root layout for all **`/admin/*`** routes; composes sidebar, top bar, main **`Outlet`**, bottom navigation.
- **`AdminSidebar`** — Primary navigation and footer actions; **`NavLink`** for active styling.
- **`AdminTopBar`** — Context title + administrator chip (label + circular avatar).
- **`AdminBottomNavigation`** — Three **`NavLink`** items for small viewports (same destinations as sidebar).
- **`ExportDataModal`** — Overlay dialog: title **«Εξαγωγή Δεδομένων»**, explanatory subtitle, checklist of **`MockAdminUser`** rows (all selected by default on each open via **remount `key`**), helper text about excluded users’ activities, **Ακύρωση** / **Εξαγωγή Excel**. **`onConfirmExport(selectedUserIds)`** is invoked for prototype hooks; parents only show success UI — **no** Excel binary, **no** API.
- **Used in:** `AdminDashboardPage`, `AdminActivitiesPage`.

---

## 6. Rock climbing form — detailed logic

### Data sources for routes

- **`getBaseClimbingFormRoutes()`** (`climbingFormRoutes.ts`): maps **`mockRoutes`** rock-climbing cards into **`ClimbingRouteFormRecord`**, plus **extra** mock entries.
- **`userRoutes`** state in **`RockClimbingActivityForm`**: routes **added in-session** via **`CreateRouteModal`** (combined as `[...base, ...user]`).

### Initial state from URL (`initialRouteSlug`)

- **`buildStateFromRouteSlug`** calls **`mapRouteToClimbingFormValues(slug)`** (`activityRoutePrefill.ts`).
- If slug matches a rock route in **`mockRoutes`**: fills **name, field (from sector), mountain, scale key (French default), coerced grade, route length** (from **`mockRouteDetails`** technical row containing “ΜΗΚΟΣ” if present), sets **`autofill: true`**, and flags whether altitude/length existed for badge display.
- If no slug or unknown slug: empty defaults, **`autofill: false`**.

### `Διαδρομή` combobox behavior

- **`value`** = `routeName` state; **`onChange`** runs **`handleRouteComboboxChange`**: updates **`routeName`**; if the text no longer equals **`lockedRouteName`** (the name last chosen from the list or from URL seed), **`autofill`** is cleared and **`lockedRouteName`** is reset so **Βουνό / Πεδίο** unlock.
- **Suggestions:** Shown only when **`open && value.trim().length > 0`**. Matches any route whose combined lowercase string of **name, mountainOrArea, field** contains the current **value** as substring.
- **Mouse:** hover sets active row styling; click selects route → **`applyRoute(route)`** → dropdown closes.
- **Click outside:** `mousedown` on document closes panel if outside container.
- The combobox input stays **fully editable** after a pick: user may clear, retype, and search again without a global read-only mode on **`RouteCombobox`**.

### When a route is selected (`applyRoute`)

- Sets: **route name, mountain, field, scale, grade, altitude, length** from the **`ClimbingRouteFormRecord`**.
- Sets **`autofillHadAlt` / `autofillHadLen`** from presence of altitude/length on the record.
- Sets **`autofill`** to **`true`** and **`lockedRouteName`** to **`r.name`**.

### Auto-fill: which fields are filled

From **`applyRoute`** / URL prefill:

- **Διαδρομή** (name), **Βουνό / Περιοχή**, **Πεδίο** (field), **Κλίμακα**, **Βαθμός**, **Υψόμετρο**, **Ανάπτυγμα** (when present on record / detail).

### Auto-fill: which fields are disabled / locked

- **Διαδρομή:** combobox stays **enabled**; only **Βουνό / Περιοχή** and **Πεδίο** use **`disabled={autofill}`** with **readable** colors (light gray background, non-faded text) while **`autofill`** is true.

### Auto-fill: which fields stay editable

- **Διαδρομή** (text), **Κλίμακα δυσκολίας**, **Βαθμός δυσκολίας**, **Υψόμετρο**, **Ανάπτυγμα διαδρομής** — user can change them; editing the route name away from **`lockedRouteName`** clears **`autofill`** so **Βουνό / Πεδίο** unlock (values remain until the user changes them).

### Helper copy and badges (auto-fill UX)

- Shared uppercase line **`AUTO_FILL_ROUTE_HELPER`** appears under **Διαδρομή** and **above** the muted hints for **Βουνό** and **Πεδίο** when `autofill`.
- **Διαδρομή** row: top-right **“+ ΝΕΑ ΔΙΑΔΡΟΜΗ”** only on first row; second row **label + badge**.
- **Κλίμακα / Βαθμός:** order is **label → select → badge (if autofill) → hints**.

### Empty state (no route found)

- When query is non-empty and **no matches**: message + CTA **“Δημιουργία νέας διαδρομής”** → opens modal via **`onEmptyCreateRoute`**.

### “Create new route” from dropdown (footer)

- When there **are** matches, list footer shows **“+ ΝΕΑ ΔΙΑΔΡΟΜΗ”** → **`onFooterNewRoute`** → same modal opener as header button (with current form values as **`modalSeed`**).

### “Create new route” from header button

- **`openCreateModal()`** seeds modal with current **route, field, mountain, scale, grade, altitude, length** (spread with optional `extra`).

### Modal → Save → Return → Auto-fill

- **`handleSaveNewRoute`:** appends route to **`userRoutes`**, calls **`applyRoute(r)`**, closes modal.
- New route becomes selectable in combobox and **locks** basics the same way as picking an existing route.

### Mock submit (rock page)

- Form **`onSubmit`** `preventDefault` → **`onMockSubmitSuccess`** on `RockClimbingFormPage`:

  - Sets success banner visible.
  - **`navigate('/app/new/climbing', { replace: true })`** — strips `?route=`.
  - Increments **`formKey`** to **remount** form (fresh state).
  - Scrolls to top.

---

## 7. Data models (mock data)

### `Route` (`types/route.ts`)

Used for **route cards** and list filtering:

- **Identifiers:** `id`, optional **`slug`**, **`fieldKey`**
- **Display / filters:** `name`, `distanceKm`, `elevationGainM`, `updatedAt`, `region`, `sector`, `mountain`, `difficultyLabel`, **`activityKind`** (`hiking` | `rock_climbing` | `expedition`)

### `ClimbingRouteFormRecord` (`types/climbingRouteForm.ts`)

Used by combobox, modal, and `applyRoute`:

- **`id`, `name`, `field`, `mountainOrArea`, `difficultyScale`, `difficultyGrade`**
- Optional **`altitude`, `routeLength`**
- **`difficultyScale`** is a Greek union: `'Γαλλική' | 'UIAA' | 'Alpine'`

### `RouteDetailModel` (`types/routeDetail.ts`)

Rich page model for **`RouteDetailPage`**: **`slug`**, display **`name`**, **`fieldLabel`**, **`mountainLabel`**, **`difficultyLabel`**, optional **`heroImageSrc`**, optional UI toggles **`showHeroImage`**, **`showHistorySidebarLink`**, **`showReviewsCommunityBadge`** (all omitted or defaulted for most mocks), **`basics`** / **`technical`** as **`DetailInfoGrid`** rows, **`userReviews`** (member, date, comment), **`sidebar`** (metric title/value/footnote for difficulty card).

### `HistoryCard` (`types/historyCard.ts`)

List cards: **`kind`**, **`categoryLabel`** (e.g. ΟΡΕΙΒΑΣΙΑ / ΑΝΑΡΡΙΧΗΣΗ), **`dateLabel`**, **`title`**, optional **`styleBadge`** (e.g. RED POINT, ΟΡΕΙΒΑΤΙΚΟ ΣΚΙ, ΚΑΝΟΝΙΚΕΣ ΣΥΝΘΗΚΕΣ), **`locationLine`**, **`metricLine`**, **`peopleLine`**, **`status`**, optional **`detailSlug`** for linking to **`/app/history/:activitySlug`**.

### Activity detail (`types/activityDetail.ts` + `mockActivities.ts`)

Structured blocks for **`ActivityDetailPage`** (header, sidebar score, sections, deep links).

### Climbing-specific helpers (`climbingFormRoutes.ts`)

- **`formatClimbingFieldDisplay`** — normalizes sector string for display.
- **`normalizeGradeLabel`** — grade string cleanup.
- **`getBaseClimbingFormRoutes`** — merges **`mockRoutes`** (rock only) + extras.

### Admin mock types (`types/adminMock.ts`)

- **`MockAdminUser`** — `id`, `name`, `email`, `club`, `totalActivities`, `officialActivities`.
- **`MockOfficialActivity`** — `id`, `userName`, `category` (e.g. Ορειβασία / Αναρρίχηση / Αποστολή), `routeOrLocation`, `date` (ISO `YYYY-MM-DD`), `status` (always **`official`** in current seed).

### Admin mock datasets

- **`mockAdminUsers.ts`** — static array of club members for tables and export checklist.
- **`mockOfficialActivities.ts`** — static array of official activity rows for dashboard “recent” slice, activities page table, and dashboard counts.

---

## 8. User flows (step-by-step)

### Flow 1: Register → Onboarding → App (Login is parallel)

1. User opens **`/register`**, optionally clicks Google (no effect), fills form, submits.
2. App navigates to **`/onboarding`**.
3. User answers club questions, submits → **`/app`**.
4. **Alternate — member login (mock):** **`/login`** → enter any username/email **except** the reserved **`admin`** string (after trim + lower-case) → submit → **`/app`** (password ignored; skips onboarding).

### Flow 1b: Prototype admin login (mock)

1. User opens **`/login`**.
2. Enters **`admin`** (case-insensitive; surrounding spaces trimmed) in the username/email field; any password.
3. Submit → **`/admin`** (admin dashboard). **No** session, **no** role checks, **no** server verification.

### Flow 2: Create new activity manually

1. From **`/app`** or nav → **`/app/new`**.
2. Choose type → e.g. **`/app/new/hiking`**.
3. Fill fields (mostly uncontrolled defaults); submit.
4. Success banner appears; form remounts empty on same URL.

### Flow 2b: Activity type tabs — reset / switch

1. On **`/app/new/hiking`**, **`/app/new/climbing`**, or **`/app/new/expedition`**, the user clicks any of the three **activity-type** tabs at the top of the form (including the tab for the **current** type).
2. The parent form page clears the success banner (if any) and either **`navigate`**s to another **`/app/new/...`** URL or remounts the same form via **`formKey`** (rock climbing also uses **`replace: true`** to strip **`?route=`** when re-selecting climbing).
3. All in-form client state (including rock **userRoutes** from the modal session) is reset by remount or navigation.

### Flow 3: Select existing route → auto-fill (rock climbing)

1. **`/app/new/climbing`** with empty query state.
2. User types in combobox until matches appear.
3. User clicks a route → **`applyRoute`** → fields filled, **`autofill` true**, **`lockedRouteName`** set; **Βουνό / Πεδίο** disabled; combobox stays editable; helpers/badges shown.
4. User may edit the route name (clears lock when text diverges), **Κλίμακα / Βαθμός / Υψόμετρο / Ανάπτυγμα**, and other fields as in **Section 6**.

### Flow 4: Create new route from dropdown (empty search result)

1. User types a string that matches **no** route.
2. Empty panel appears → **“Δημιουργία νέας διαδρομής”** → modal opens.
3. User saves → route appended to in-memory list and applied → auto-fill active.

### Flow 5: Create new route from modal button (header or footer)

1. User clicks **“+ ΝΕΑ ΔΙΑΔΡΟΜΗ”** (top row) or footer **“+ ΝΕΑ ΔΙΑΔΡΟΜΗ”** when list is open.
2. Modal opens with **seed** from current form.
3. Save → same as Flow 4 end state.

### Flow 6: Submit activity → success state

1. On any of the three forms, user submits.
2. Parent shows **`ActivitySuccessBanner`**, replaces URL to base new-activity path, remounts form.
3. User may click **Νέα Διαδρομή** (banner) to clear success and remount again, or **Ιστορικό** → **`/app/history`**.

### Flow 7: Route detail → prefilled activity form

1. User opens **`/app/routes/:routeSlug`** (valid slug from **`mockRouteDetails`** / list).
2. Clicks **«Καταχώρησε νέα ανάβαση»** in the CTA card.
3. Navigates to **`/app/new/climbing?route=<slug>`**.
4. **`RockClimbingFormPage`** passes slug into **`RockClimbingActivityForm`** → **`buildStateFromRouteSlug`** pre-fills and sets **`autofill`** when mapping succeeds.

**Optional:** Some slugs (e.g. **`ptychiouchos`**) omit hero, history sidebar link, and reviews community badge via **`RouteDetailModel`** flags — the same **`RouteDetailPage`** template is reused.

### Flow 8: Admin navigation and mock export

1. From **`/admin`**, use sidebar or mobile bottom nav to open **`/admin/members`** or **`/admin/activities`**.
2. On dashboard or activities page, click **«Εξαγωγή Δεδομένων (Excel)»** (or the dashboard third card).
3. In **`ExportDataModal`**, optionally uncheck members; confirm **«Εξαγωγή Excel»**.
4. Modal closes; a green inline message **«Η εξαγωγή ολοκληρώθηκε επιτυχώς»** appears briefly — **no** file is produced and selected IDs are not sent to a backend in this prototype.

---

## 9. Current limitations

### No real backend

- No REST/GraphQL client, no environment-based API base URL, no loading/error states for server data.

### No real authentication or persistence

- Login/register/onboarding only **change routes**.
- No JWT, cookies, session storage, or protected routes.
- **`AppLayout`** is not actually gated behind auth.
- **`/admin`** is **not** protected: anyone who knows the URL could open it; the only **convenience gate** is the **`admin`** username shortcut on the login form. There are **no** roles, permissions, pending approvals, or system settings in the admin UI.

### Mock data only

- Routes, history, activity detail, and “database” messages in the success banner are **static** or **in-memory** (new routes from modal exist until full page reload).

### Validation

- **CreateRouteModal:** silent failure if required fields missing.
- **Activity forms:** no field-level validation, no required markers on activity form (except modal).

### Rock combobox limitations

- Panel only when **trimmed value non-empty** — cannot open full browse with empty query.
- **Keyboard navigation** in list is minimal (hover-driven `activeIndex`; not full roving tabindex).

### Misc

- **Main app** sidebar: **Βοήθεια** disabled; **Αποσύνδεση** links to **`/`** (see `AppSidebar`) — prototype only, no session cleared.
- **Admin** sidebar: **Βοήθεια** disabled; **Αποσύνδεση** links to **`/login`** (prototype return to login screen).

### Admin-specific

- **Export “Excel”** is **UI-only**: no workbook generation, no download, no federation API.
- Admin **Βοήθεια** is a non-functional stub, same pattern as the member app.

---

## 10. Next steps (suggested)

### Backend integration

- Define REST or GraphQL resources: **users**, **clubs**, **routes**, **activities**, **attachments**.
- Replace **`getBaseClimbingFormRoutes`** / **`mockRouteDetails`** with API calls + caching (e.g. React Query).

### Data persistence

- Persist new routes and activities to server; optimistic UI for combobox.

### Auth flow

- Real OAuth / email flow; store session; **protect `/app/*`** and **`/admin/*`** with a loader or layout guard; post-login redirect to intended URL; replace the literal **`admin`** string gate with real roles/claims.

### API structure (illustrative)

- `GET /routes?kind=&q=&field=`
- `GET /routes/:slug`
- `POST /routes`
- `POST /activities` + `GET /activities` (history) + `GET /activities/:slug`
- Admin: `GET /admin/members`, `GET /admin/activities`, `POST /admin/export` (or job-based export) returning a real file or signed URL.

### UX/UI improvements

- Form validation messages; accessible combobox (Arrow keys, Escape).
- Unify **date** controls (currently static defaults in several places).
- Align **HomePage** “Καταγραφή Δράσης” typography with **`AppPageHeading`** if brand consistency is required globally.

---

## 11. Files created / modified (inventory summary)

This project is a **greenfield Vite app**; the meaningful application code lives under **`src/`** (~80+ TS/TSX files). Grouped summary:

### App entry and routing

- **`src/main.tsx`**, **`src/app/App.tsx`**, **`src/app/router.tsx`**

### Pages (`src/pages/public/*`, `src/pages/app/*`, `src/pages/admin/*`)

- Landing, login, register, onboarding; home, new activity, three form pages, routes list, route detail, history, activity detail; **admin** dashboard, members, activities.

### Layout and chrome

- **`src/components/layout/*`**, **`PublicLayout.tsx`**, **`PublicHeader.tsx`**, **`Footer.tsx`**

### Landing and marketing

- **`src/components/landing/*`**, **`src/constants/landingAssets.ts`**, **`src/constants/appHomeAssets.ts`**

### Auth UI

- **`src/components/auth/*`**, pages **`LoginPage.tsx`**, **`RegisterPage.tsx`**

### Forms (major surface area)

- **`RockClimbingActivityForm.tsx`**, **`HikingActivityForm.tsx`**, **`ExpeditionActivityForm.tsx`**
- **`RouteCombobox.tsx`**, **`CreateRouteModal.tsx`**, **`ActivityFormLayout.tsx`**, **`ActivitySuccessBanner.tsx`**
- **`AutoFilledBadge.tsx`**, **`FormFieldHelperText.tsx`**, **`activityAutofillCopy.ts`**
- **`src/components/forms/shared/FormBuildingBlocks.tsx`**

### UI primitives

- **`src/components/ui/*`** (Button, Input, Select, Card, Badge, FormSection, EmptyState, …)

### Domain lists and detail

- **`src/components/routes/RouteCard.tsx`**
- **`src/components/history/HistoryActivityCard.tsx`**
- **`src/components/detail/*`**

### Data and types

- **`src/data/mockRoutes.ts`**, **`mockRouteDetails.ts`**, **`mockHistoryCards.ts`**, **`mockActivities.ts`**, **`climbingFormRoutes.ts`**, **`mockAdminUsers.ts`**, **`mockOfficialActivities.ts`**
- **`src/types/*`** (includes **`adminMock.ts`**)
- **`src/lib/activityRoutePrefill.ts`**, **`src/lib/historyCardDateSort.ts`**, **`src/lib/formatAdminDate.ts`**
- **`src/constants/climbingFormOptions.ts`**

### Admin UI

- **`src/components/admin/*`** — layout, sidebar, top bar, bottom nav, export modal.
- **`src/pages/admin/*`** — dashboard, members, activities.

### Brand / icons

- **`src/components/brand/RouteLogLogoMark.tsx`**, **`src/components/icons/AppNavIcons.tsx`**

---

For a **full narrative** of features, screens, flows, and limitations, this file is the source of truth alongside the code. For **developer setup**, see **`README.md`**.
