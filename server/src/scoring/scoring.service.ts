import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  CLIMBING_MIXED_COEFFICIENTS,
  CLIMBING_REPETITION_COEFFICIENTS,
  CLIMBING_SEASON_COEFFICIENTS,
  CLIMBING_UIAA_COEFFICIENTS,
  EXPEDITION_DIFFICULTY_COEFFICIENTS,
  EXPEDITION_ORGANIZATION_COEFFICIENTS,
  EXPEDITION_SEASON_COEFFICIENTS,
  HIKING_DIFFICULTY_COEFFICIENTS,
  HIKING_FIELD_COEFFICIENTS,
} from './constants'
import { ScoringError } from './scoring.errors'
import {
  ClimbingPointsInput,
  ExpeditionPointsInput,
  HikingPointsInput,
} from './scoring.types'

@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Hiking / Ski Mountaineering ─────────────────────────────────────────────

  /**
   * Calculates EOOA points for a Hiking / Ski Mountaineering activity.
   * Source: docs/eooa-rules-alignment.md §2.5
   *
   * Excel-compatible zeroing rule (§2.5):
   *   If fieldCoefficient < 1.7 AND participantsNum < 3 → points = 0
   *   (applies to "normal" and "winter_conditions"; not to "ski_mountaineering")
   */
  calculateHikingPoints(input: HikingPointsInput): number {
    const { maxAltitude, totalElevationGain, distanceLength, fieldType, difficultyGrade, participantsNum } = input

    const fieldCoeff = HIKING_FIELD_COEFFICIENTS[fieldType as keyof typeof HIKING_FIELD_COEFFICIENTS]
    if (fieldCoeff === undefined) {
      throw new ScoringError(`Unknown hiking field type: "${fieldType}". Allowed values: normal, winter_conditions, ski_mountaineering.`)
    }

    const diffCoeff = HIKING_DIFFICULTY_COEFFICIENTS[difficultyGrade as keyof typeof HIKING_DIFFICULTY_COEFFICIENTS]
    if (diffCoeff === undefined) {
      throw new ScoringError(`Unknown hiking difficulty grade: "${difficultyGrade}". Allowed values: pezoporia, F-, F, F+, PD-, PD, PD+, AD-, AD, AD+.`)
    }

    // Excel-compatible zeroing rule: low-effort field + small group = 0 points.
    if (fieldCoeff < 1.7 && participantsNum < 3) {
      return 0
    }

    const distanceFactor = Math.sqrt(Math.max(distanceLength / 15, 1))
    const participantsFactor = Math.sqrt(participantsNum)

    return (
      (maxAltitude / 2000) *
      (totalElevationGain / 1000) *
      distanceFactor *
      fieldCoeff *
      diffCoeff *
      participantsFactor
    )
  }

  // ── Rock Climbing ───────────────────────────────────────────────────────────

  /**
   * Resolves a French climbing grade to its UIAA/Alpine equivalent
   * using the grade_mappings table.
   *
   * Call this BEFORE calculateClimbingPoints() when difficultyScale = "french".
   * The result should be persisted to climbing_activity_details.mapped_scale /
   * .mapped_grade at activity submission time (Phase 7B).
   *
   * Throws ScoringError when the grade_mappings table has no verified entry
   * for the given French grade. See VERIFIED_GRADE_MAPPINGS in
   * server/prisma/seed/grade-mappings.seed.ts — entries must be added after
   * manual review before French-scale activities can be scored.
   */
  async resolveClimbingGrade(frenchGrade: string): Promise<{ mappedScale: string; mappedGrade: string }> {
    const mapping = await this.prisma.gradeMapping.findFirst({
      where: {
        sourceScale: 'french',
        sourceGrade: frenchGrade.trim(),
        targetScale: 'uiaa',
      },
    })

    if (!mapping) {
      throw new ScoringError(
        `French climbing grade "${frenchGrade}" has no verified UIAA/Alpine mapping. ` +
        `Add a verified entry to VERIFIED_GRADE_MAPPINGS in prisma/seed/grade-mappings.seed.ts ` +
        `and re-seed before accepting French-scale activities.`,
      )
    }

    return { mappedScale: mapping.targetScale, mappedGrade: mapping.targetGrade }
  }

  /**
   * Calculates EOOA points for a Rock Climbing activity.
   * Source: docs/eooa-rules-alignment.md §3.13
   *
   * Key rules:
   *   - Season coefficient is applied ONLY when altitude > 1000 (§3.12).
   *   - finalDifficultyCoefficient = max(regular, mixed) (§3.9).
   *   - routeLengthFactor = max(routeLength, 100) / 1500 (§3.11).
   *   - altitudeFactor = sqrt(max(altitude / 1000, 1)) (§3.10).
   *   - If difficultyScale = "french" and mappedGrade is null → ScoringError.
   *   - At least one of (difficultyGrade or mixedClimbing) must be present.
   */
  calculateClimbingPoints(input: ClimbingPointsInput): number {
    const { altitude, routeLength, season, repetitionType, participantsNum, difficultyScale, difficultyGrade, mappedGrade, mixedClimbing } = input

    // ── Validate French scale ────────────────────────────────────────────────
    if (difficultyScale === 'french' && !mappedGrade) {
      throw new ScoringError(
        `French difficulty grade "${difficultyGrade}" cannot be scored without a verified UIAA/Alpine mapping. ` +
        `Call resolveClimbingGrade() first, or use a UIAA/Alpine grade directly.`,
      )
    }

    // ── Validate: at least one difficulty must be present ───────────────────
    const hasRegularDifficulty = !!(difficultyScale && (mappedGrade ?? difficultyGrade))
    const hasMixedDifficulty = !!mixedClimbing
    if (!hasRegularDifficulty && !hasMixedDifficulty) {
      throw new ScoringError(
        'At least one difficulty must be present: either (difficultyScale + difficultyGrade) or mixedClimbing.',
      )
    }

    // ── Regular difficulty coefficient ───────────────────────────────────────
    // Use mapped_grade when difficultyScale = "french"; otherwise use difficultyGrade.
    let regularDiffCoeff = 0
    const gradeForLookup = mappedGrade ?? difficultyGrade
    if (gradeForLookup) {
      const coeff = CLIMBING_UIAA_COEFFICIENTS[gradeForLookup as keyof typeof CLIMBING_UIAA_COEFFICIENTS]
      if (coeff === undefined) {
        throw new ScoringError(`Unknown UIAA/Alpine difficulty grade: "${gradeForLookup}".`)
      }
      regularDiffCoeff = coeff
    }

    // ── Mixed / ice difficulty coefficient ───────────────────────────────────
    let mixedDiffCoeff = 0
    if (mixedClimbing) {
      const coeff = CLIMBING_MIXED_COEFFICIENTS[mixedClimbing as keyof typeof CLIMBING_MIXED_COEFFICIENTS]
      if (coeff === undefined) {
        throw new ScoringError(`Unknown mixed/ice climbing grade: "${mixedClimbing}". Expected M1–M12 or WI1–WI12.`)
      }
      mixedDiffCoeff = coeff
    }

    // ── Final difficulty coefficient (§3.9) ──────────────────────────────────
    const finalDiffCoeff = Math.max(regularDiffCoeff, mixedDiffCoeff)

    // ── Season validation (always validate, even when not applied) ──────────
    if (!(season in CLIMBING_SEASON_COEFFICIENTS)) {
      throw new ScoringError(`Unknown climbing season: "${season}". Allowed values: summer, winter.`)
    }

    // ── Season coefficient — only applied when altitude > 1000 (§3.12) ──────
    const seasonCoeff = altitude > 1000
      ? CLIMBING_SEASON_COEFFICIENTS[season as keyof typeof CLIMBING_SEASON_COEFFICIENTS]
      : 1

    // ── Repetition coefficient ───────────────────────────────────────────────
    const repetitionCoeff = CLIMBING_REPETITION_COEFFICIENTS[repetitionType as keyof typeof CLIMBING_REPETITION_COEFFICIENTS]
    if (repetitionCoeff === undefined) {
      throw new ScoringError(`Unknown repetition type: "${repetitionType}". Allowed values: repeat, new.`)
    }

    // ── Factors ──────────────────────────────────────────────────────────────
    const altitudeFactor = Math.sqrt(Math.max(altitude / 1000, 1))
    const routeLengthFactor = Math.max(routeLength, 100) / 1500

    return (
      seasonCoeff *
      repetitionCoeff *
      altitudeFactor *
      finalDiffCoeff *
      routeLengthFactor *
      participantsNum
    )
  }

  // ── Expeditions Abroad ──────────────────────────────────────────────────────

  /**
   * Calculates EOOA points for an Expedition Abroad activity.
   * Source: docs/eooa-rules-alignment.md §4.7
   *
   * Key rules:
   *   - Organization coefficient is ADDED at the end, not multiplied (§4.6).
   *   - No minimum participants threshold (§4.5).
   *   - Expedition difficulty uses its OWN coefficient table — do NOT reuse hiking (§4.3).
   *   - elevationFactor = sqrt(totalElevationGain / max(altitude, 1)) (§4.4).
   *   - altitudeFactor = (altitude / 2000)^2 (§4.4).
   */
  calculateExpeditionPoints(input: ExpeditionPointsInput): number {
    const { altitude, totalElevationGain, season, difficultyGrade, participantsNum, organizationType } = input

    const seasonCoeff = EXPEDITION_SEASON_COEFFICIENTS[season as keyof typeof EXPEDITION_SEASON_COEFFICIENTS]
    if (seasonCoeff === undefined) {
      throw new ScoringError(`Unknown expedition season: "${season}". Allowed values: summer, winter.`)
    }

    const diffCoeff = EXPEDITION_DIFFICULTY_COEFFICIENTS[difficultyGrade as keyof typeof EXPEDITION_DIFFICULTY_COEFFICIENTS]
    if (diffCoeff === undefined) {
      throw new ScoringError(
        `Unknown expedition difficulty grade: "${difficultyGrade}". ` +
        `Allowed values: pezoporia, F-, F, F+, PD-, PD, PD+, AD-, AD, AD+, D-, D, D+, TD-, TD, TD+, ED-, ED, ED+.`,
      )
    }

    const orgCoeff = EXPEDITION_ORGANIZATION_COEFFICIENTS[organizationType as keyof typeof EXPEDITION_ORGANIZATION_COEFFICIENTS]
    if (orgCoeff === undefined) {
      throw new ScoringError(`Unknown organization type: "${organizationType}". Allowed values: no, europe, africa, other_continents.`)
    }

    const elevationFactor = Math.sqrt(totalElevationGain / Math.max(altitude, 1))
    const altitudeFactor = Math.pow(altitude / 2000, 2)
    const participantsFactor = Math.sqrt(participantsNum)

    return (
      seasonCoeff *
      elevationFactor *
      altitudeFactor *
      diffCoeff *
      participantsFactor
      + orgCoeff
    )
  }
}
