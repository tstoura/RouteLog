import { PrismaClient } from '@prisma/client'

/**
 * Seed data for the grade_mappings table.
 *
 * HOW THIS TABLE IS USED AT RUNTIME:
 *   When a user submits a climbing activity with difficulty_scale = 'french',
 *   the ScoringService (Phase 6) queries this table to resolve the equivalent
 *   UIAA/Alpine grade, then looks up its coefficient in CLIMBING_UIAA_COEFFICIENTS.
 *
 *   Example (once mappings are added):
 *     difficulty_scale = 'french'  →  difficulty_grade = '6c'
 *     mapped_scale     = 'uiaa'    →  mapped_grade     = 'VII+'
 *     coefficient      = CLIMBING_UIAA_COEFFICIENTS['VII+']  →  14
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * IMPORTANT — DO NOT ADD MAPPINGS WITHOUT VERIFICATION
 *
 * French → UIAA/Alpine grade conversions are inherently approximate.
 * Different authoritative sources (UIAA, national federations, published
 * conversion charts) disagree on specific half-grade values (e.g. 7a+, 7b+).
 *
 * Mappings MUST be added to VERIFIED_GRADE_MAPPINGS only after:
 *   1. A specific conversion table has been reviewed and approved.
 *   2. The source of that table has been documented in a comment.
 *   3. Any uncertain grades have been explicitly noted as approximate.
 *
 * Until that review is complete, this array remains empty and no rows are
 * inserted into the database. The scoring service will return an error for
 * French-scale submissions until verified mappings are present.
 * ──────────────────────────────────────────────────────────────────────────────
 */

type GradeMapping = {
  sourceScale: string
  sourceGrade: string
  targetScale: string
  targetGrade: string
}

/**
 * Conservative MVP French → UIAA grade mappings.
 *
 * ── SCOPE ────────────────────────────────────────────────────────────────────
 * These are the minimum mappings required to score official climbing activities
 * for the current Patras/demo route set.  They are NOT intended to cover the
 * full French sport-climbing grade spectrum.
 *
 * ── MAPPING SOURCE ───────────────────────────────────────────────────────────
 * Derived from a widely-used French sport grade → UIAA comparison table.
 * Scoring coefficients come from the EOOA Excel UIAA Β.Δ. coefficient table.
 *
 * ── APPROXIMATION DISCLAIMER ─────────────────────────────────────────────────
 * French ↔ UIAA conversion is inherently approximate.  Different authoritative
 * sources (UIAA, national federations, published charts) disagree on specific
 * half-grade values (e.g. 7a+, 7b+).  These mappings represent the application
 * team's best-effort MVP assumption for the Patras/demo route set.
 *
 * ── FUTURE WORK ──────────────────────────────────────────────────────────────
 * Expand this mapping with an approved authoritative source, or make it
 * admin-maintainable via a dedicated back-office endpoint.
 *
 * ── TARGET GRADE VERIFICATION ────────────────────────────────────────────────
 * All targetGrade values below have been confirmed present in:
 *   CLIMBING_UIAA_GRADES  (climbing.constants.ts)
 *   CLIMBING_UIAA_COEFFICIENTS  (climbing.constants.ts)
 * with the following coefficients:
 *   V+    = 8   │  VII-  = 12  │  VII+  = 14  │  VIII- = 15  │  VIII  = 16
 *   VIII+ = 18  │  IX-   = 20  │  X-    = 26  │  X     = 28  │  X+    = 30
 */
const VERIFIED_GRADE_MAPPINGS: GradeMapping[] = [
  // ── Conservative MVP mappings for the Patras/demo route set ──────────────
  { sourceScale: 'french', sourceGrade: '5a+', targetScale: 'uiaa', targetGrade: 'V+' },
  { sourceScale: 'french', sourceGrade: '6a',  targetScale: 'uiaa', targetGrade: 'VII-' },
  { sourceScale: 'french', sourceGrade: '6c',  targetScale: 'uiaa', targetGrade: 'VII+' },
  { sourceScale: 'french', sourceGrade: '6c+', targetScale: 'uiaa', targetGrade: 'VIII-' },
  { sourceScale: 'french', sourceGrade: '7a',  targetScale: 'uiaa', targetGrade: 'VIII' },
  { sourceScale: 'french', sourceGrade: '7a+', targetScale: 'uiaa', targetGrade: 'VIII+' },
  { sourceScale: 'french', sourceGrade: '7b+', targetScale: 'uiaa', targetGrade: 'IX-' },
  { sourceScale: 'french', sourceGrade: '8a',  targetScale: 'uiaa', targetGrade: 'X-' },
  { sourceScale: 'french', sourceGrade: '8a+', targetScale: 'uiaa', targetGrade: 'X-' },
  { sourceScale: 'french', sourceGrade: '8b',  targetScale: 'uiaa', targetGrade: 'X' },
  { sourceScale: 'french', sourceGrade: '8b+', targetScale: 'uiaa', targetGrade: 'X+' },
]

export async function seedGradeMappings(prisma: PrismaClient): Promise<void> {
  if (VERIFIED_GRADE_MAPPINGS.length === 0) {
    console.log('  grade_mappings: skipped — no verified mappings to seed yet.')
    return
  }

  // createMany with skipDuplicates is idempotent: re-running the seed never
  // fails and never inserts a second copy of the same
  // (source_scale, source_grade, target_scale) triple.
  const result = await prisma.gradeMapping.createMany({
    data: VERIFIED_GRADE_MAPPINGS,
    skipDuplicates: true,
  })

  console.log(
    `  grade_mappings: ${result.count} inserted (${VERIFIED_GRADE_MAPPINGS.length} total, duplicates skipped).`,
  )
}
