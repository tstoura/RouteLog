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
 * Verified French → UIAA/Alpine grade mappings.
 *
 * Currently empty — awaiting review and approval of an authoritative
 * French-to-UIAA conversion table before any entries are added.
 *
 * TODO: populate this array after the conversion table has been verified
 *       and approved. Document the source table in a comment above each entry
 *       or entry group.
 */
const VERIFIED_GRADE_MAPPINGS: GradeMapping[] = [
  // Add verified French → UIAA mappings here after approval.
  // Example format (do not uncomment without verification):
  //   { sourceScale: 'french', sourceGrade: '6c', targetScale: 'uiaa', targetGrade: 'VII+' },
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
