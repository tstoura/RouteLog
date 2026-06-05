import { PrismaClient } from '@prisma/client'

/**
 * Seed data for the `routes` table — climbing route catalog.
 *
 * ── DATA SOURCE ───────────────────────────────────────────────────────────────
 * Derived from the original frontend mock route list (`src/data/mockRoutes.ts`,
 * deleted in commit a15a237 "Integrate routes tab with backend") and the mock
 * route detail (`src/data/mockRouteDetails.ts`).
 *
 * These represent real climbing routes in the Patras/Καλόγρια area used by
 * ΕΟΣ Πατρών members.
 *
 * ── IDEMPOTENCY ───────────────────────────────────────────────────────────────
 * Uses `upsert` keyed on the DB unique constraint
 * `route_identity_unique (normalizedName, mountainOrArea, climbingField)`.
 *
 * Re-running the seed never creates duplicates. On conflict, non-identity
 * fields (grade, altitude, routeLength) are refreshed to the values below.
 *
 * ── GRADE NOTES ───────────────────────────────────────────────────────────────
 * All routes use defaultScale = 'french'.
 * Grade values are lowercase French notation (e.g. '6c', '7a+') matching the
 * grade_mappings table and the frontend FRENCH_GRADE_OPTIONS constant.
 *
 * The route "Λούκυ Λουκ" was originally labeled "6C+ / 7A" (boundary grade).
 * Stored as '7a' — the higher of the two, which is more commonly cited.
 */

/** Mirrors normalizeName() in climbing-routes.constants.ts */
function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

type RouteSeed = {
  name: string
  climbingField: string
  mountainOrArea: string
  defaultScale: string
  defaultGrade: string
  altitude?: number
  routeLength?: number
}

const CLIMBING_ROUTES: RouteSeed[] = [
  // ── Κύριο Πεδίο - Metropolis (Κλεισούρα) ─────────────────────────────────
  {
    name: 'Πτυχιούχος',
    climbingField: 'Κύριο Πεδίο - Metropolis',
    mountainOrArea: 'Κλεισούρα',
    defaultScale: 'french',
    defaultGrade: '6c',
    altitude: 720,
    routeLength: 25,
  },
  {
    name: 'Kid Loco',
    climbingField: 'Κύριο Πεδίο - Metropolis',
    mountainOrArea: 'Κλεισούρα',
    defaultScale: 'french',
    defaultGrade: '7a',
  },
  {
    name: 'Αγράμματος',
    climbingField: 'Κύριο Πεδίο - Metropolis',
    mountainOrArea: 'Κλεισούρα',
    defaultScale: 'french',
    defaultGrade: '7a+',
  },
  {
    name: 'Και ο Zoro Ζορίζεται',
    climbingField: 'Κύριο Πεδίο - Metropolis',
    mountainOrArea: 'Κλεισούρα',
    defaultScale: 'french',
    defaultGrade: '7b+',
  },
  {
    name: 'Space Cake',
    climbingField: 'Κύριο Πεδίο - Metropolis',
    mountainOrArea: 'Κλεισούρα',
    defaultScale: 'french',
    defaultGrade: '8a',
  },
  {
    name: 'Interstellar',
    climbingField: 'Κύριο Πεδίο - Metropolis',
    mountainOrArea: 'Κλεισούρα',
    defaultScale: 'french',
    defaultGrade: '8a+',
  },
  {
    name: 'Crystallization',
    climbingField: 'Κύριο Πεδίο - Metropolis',
    mountainOrArea: 'Κλεισούρα',
    defaultScale: 'french',
    defaultGrade: '8b',
  },
  {
    name: 'Φαλακροdaemon',
    climbingField: 'Κύριο Πεδίο - Metropolis',
    mountainOrArea: 'Κλεισούρα',
    defaultScale: 'french',
    defaultGrade: '8b+',
  },
  // ── Στροφιλιά - «Γαλάζιο Όνειρο» (Καλόγρια) ────────────────────────────
  {
    name: 'Λούκυ Λουκ',
    climbingField: 'Στροφιλιά - «Γαλάζιο Όνειρο»',
    mountainOrArea: 'Καλόγρια',
    defaultScale: 'french',
    defaultGrade: '7a',   // originally labeled "6C+ / 7A"; stored as 7a
  },
  // ── Παναγιά (Καλόγρια) ──────────────────────────────────────────────────
  {
    name: 'Βραχομανία',
    climbingField: 'Παναγιά',
    mountainOrArea: 'Καλόγρια',
    defaultScale: 'french',
    defaultGrade: '6c',
  },
]

export async function seedClimbingRoutes(prisma: PrismaClient): Promise<void> {
  console.log('  climbing-routes: upserting catalog…')

  let inserted = 0
  let updated = 0

  for (const route of CLIMBING_ROUTES) {
    const normalizedName = normalizeName(route.name)

    const result = await prisma.route.upsert({
      where: {
        route_identity_unique: {
          normalizedName,
          mountainOrArea: route.mountainOrArea,
          climbingField: route.climbingField,
        },
      },
      update: {
        // Refresh non-identity fields so re-seeding keeps data current.
        // Identity fields (name, normalizedName, mountainOrArea, climbingField)
        // are intentionally omitted from update — see docs/backend-decisions.md §10.
        defaultScale: route.defaultScale,
        defaultGrade: route.defaultGrade,
        altitude: route.altitude ?? null,
        routeLength: route.routeLength ?? null,
      },
      create: {
        name: route.name,
        normalizedName,
        mountainOrArea: route.mountainOrArea,
        climbingField: route.climbingField,
        defaultScale: route.defaultScale,
        defaultGrade: route.defaultGrade,
        altitude: route.altitude ?? null,
        routeLength: route.routeLength ?? null,
        category: 'climbing',
        createdByUserId: null,
      },
    })

    // Distinguish new inserts from updates by checking createdAt ≈ updatedAt.
    // If the row was just created both timestamps are equal (within a second).
    const isNew = Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000
    if (isNew) {
      inserted++
      console.log(`  climbing-routes: inserted "${route.name}" (${result.id})`)
    } else {
      updated++
      console.log(`  climbing-routes: exists  "${route.name}" (${result.id})`)
    }
  }

  const total = CLIMBING_ROUTES.length
  console.log(
    `  climbing-routes: done — ${inserted} inserted / ${updated} refreshed / ${total} total`,
  )
}
