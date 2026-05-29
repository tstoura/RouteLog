/**
 * Input / output types for the EOOA scoring service.
 * All numeric values are plain JavaScript numbers — callers are responsible
 * for converting Prisma Decimal fields with Number(decimalValue).
 */

// ── Hiking / Ski Mountaineering ───────────────────────────────────────────────

/** Input to calculateHikingPoints(). All required fields must be present. */
export interface HikingPointsInput {
  /** Maximum altitude reached (metres). Must be > 0 for official activities. */
  maxAltitude: number
  /** Total elevation gain (metres). Must be > 0 for official activities. */
  totalElevationGain: number
  /** Route distance (km). distanceFactor = sqrt(max(distance_length / 15, 1)). */
  distanceLength: number
  /** Backend value: "normal" | "winter_conditions" | "ski_mountaineering" */
  fieldType: string
  /**
   * Backend value: "pezoporia" | "F-" | "F" | "F+" | "PD-" | "PD" | "PD+" |
   *                "AD-" | "AD" | "AD+"
   */
  difficultyGrade: string
  /** Must be > 0. */
  participantsNum: number
}

// ── Rock Climbing ─────────────────────────────────────────────────────────────

/** Input to calculateClimbingPoints(). */
export interface ClimbingPointsInput {
  /** Altitude of the route (metres). Affects altitudeFactor and seasonCoeff rule. */
  altitude: number
  /** Route length (metres). routeLengthFactor = max(routeLength, 100) / 1500. */
  routeLength: number
  /** Backend value: "summer" | "winter". Season coeff applied only when altitude > 1000. */
  season: string
  /** Backend value: "repeat" | "new". */
  repetitionType: string
  /** Must be > 0. */
  participantsNum: number
  /**
   * Difficulty scale. "uiaa" or "french".
   * If "french", mappedGrade must be provided (pre-resolved via resolveClimbingGrade).
   */
  difficultyScale?: string | null
  /** Raw user-entered grade in the chosen scale (e.g. "VII+", "6c"). */
  difficultyGrade?: string | null
  /**
   * UIAA/Alpine grade resolved from a French-scale input.
   * Must be present when difficultyScale = "french".
   * Null when difficultyScale is "uiaa" or when no regular grade is provided.
   */
  mappedGrade?: string | null
  /**
   * Mixed or ice grade (e.g. "M4", "WI4").
   * At least one of (difficultyScale + difficultyGrade) or mixedClimbing must be present.
   */
  mixedClimbing?: string | null
}

// ── Expeditions Abroad ────────────────────────────────────────────────────────

/** Input to calculateExpeditionPoints(). */
export interface ExpeditionPointsInput {
  /** Summit altitude (metres). Must be > 0 for official activities. */
  altitude: number
  /** Total elevation gain (metres). elevationFactor = sqrt(TEG / max(altitude, 1)). */
  totalElevationGain: number
  /** Backend value: "summer" | "winter". */
  season: string
  /**
   * Backend value: "pezoporia" | "F-" | … | "ED+"
   * Uses expedition-specific coefficients — different from hiking.
   */
  difficultyGrade: string
  /** Must be > 0. No minimum threshold for expeditions (unlike hiking). */
  participantsNum: number
  /**
   * Backend value: "no" | "europe" | "africa" | "other_continents".
   * The organization coefficient is ADDED at the end, not multiplied.
   */
  organizationType: string
}
