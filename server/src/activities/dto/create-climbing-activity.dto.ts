import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator'
import { Type } from 'class-transformer'
import {
  CLIMBING_COMPLETION_TYPES,
  CLIMBING_DIFFICULTY_SCALES,
  CLIMBING_MIXED_GRADES,
  CLIMBING_REPETITION_TYPES,
  CLIMBING_SEASONS,
} from '../../scoring/constants/climbing.constants'

/**
 * DTO for POST /activities/climbing.
 *
 * Key constraints:
 *   - route_id is always required (users must link to a canonical route).
 *   - route_name, mountain_or_area, climbing_field are NOT accepted from the client —
 *     they are fetched from the selected Route in the service and snapshotted.
 *   - altitude and route_length must come from the activity form (may be prefilled
 *     from the route in the UI, but the activity stores its own submitted values).
 *   - For official activities: at least one of
 *       (difficultyScale + difficultyGrade)  OR  mixedClimbing
 *     must be present.
 *   - completion_type is always optional; does not affect scoring.
 *   - French scale is accepted but will fail at service level while grade_mappings is empty.
 *
 * Validation strategy (same as Phase 7A):
 *   - DTO handles basic type/format validation (always).
 *   - Service handles EOOA-specific allowed-value and business-rule checks for officials.
 *
 * Auth: userId comes from the verified JWT (req.user.sub). Not accepted in the body.
 */
export class CreateClimbingActivityDto {
  // ── Activity base fields ───────────────────────────────────────────────────

  @IsBoolean()
  @Type(() => Boolean)
  isOfficial: boolean

  /** Activity date. "YYYY-MM-DD" ISO format. */
  @IsDateString()
  date: string

  // ── Route reference — always required ─────────────────────────────────────

  /**
   * ID of the canonical climbing route.
   * Required for all climbing activities (official and personal).
   * The service fetches the route and snapshots routeName, mountainOrArea,
   * climbingField into climbing_activity_details — clients must NOT send these.
   */
  @IsUUID()
  routeId: string

  // ── Climbing-specific fields ───────────────────────────────────────────────

  /**
   * Season.
   * Allowed values: "summer" | "winter"
   * Official: required and validated against allowed list.
   * Personal: required (non-nullable in DB) and validated against allowed list.
   * The EOOA season coefficient is applied only when altitude > 1000 (§3.12).
   */
  @IsString()
  @IsNotEmpty()
  season: string

  /**
   * Whether this is a first ascent or repeat.
   * Allowed values: "repeat" | "new"
   * Official and personal: required (non-nullable in DB).
   */
  @IsString()
  @IsNotEmpty()
  repetitionType: string

  /**
   * Altitude of the climb in metres (final altitude).
   * Official: optional — when omitted or below 1 m, the service applies the EOOA floor of 1000 m
   * (matches altitudeFactor = sqrt(max(alt/1000,1)) and season rule threshold §3.12).
   * Personal: optional; omitted or invalid → stored as 0.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  altitude?: number

  /**
   * Route length / ανάπτυγμα in metres.
   * Official: optional — when omitted or below 0.01 m, the service applies the EOOA floor of 100 m
   * (matches routeLengthFactor = max(length,100)/1500 §3.11).
   * Personal: optional; omitted or invalid → stored as 0.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  routeLength?: number

  /** Number of participants. Must be >= 1. */
  @IsInt()
  @Min(1)
  @Type(() => Number)
  participantsNum: number

  /**
   * Comma-separated or free-text participant names (additional climbing partners).
   * The current user is NOT included here — participantsNum=1 means solo.
   *
   * Required when isOfficial=true AND participantsNum > 1 (there are other partners
   * to name for the EOOA export column ΣΥΜ/ΝΤΕΣ).
   * Optional when isOfficial=true AND participantsNum = 1 (climbed alone).
   * Optional for personal records.
   *
   */
  @ValidateIf((o) => (o.isOfficial === true && o.participantsNum > 1) || o.participantsText !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  participantsText?: string

  // ── Difficulty ─────────────────────────────────────────────────────────────

  /**
   * Difficulty scale for regular (non-mixed) climbing.
   * Allowed values: "uiaa" | "alpine" | "french"
   *   "uiaa"   — UIAA grades: IV, IV+, V, V+, VI, VI+, VII … XI+
   *   "alpine" — Alpine adjectival grades: D-, D, D+, TD-, TD, TD+, ED-, ED, ED+
   *              Alpine grades share the same EOOA coefficient table as UIAA grades.
   *   "french" — French sport grades (e.g. 6c, 7a+). Triggers a DB lookup to map
   *              to UIAA/Alpine. Will fail while grade_mappings is empty (Phase 3 TODO).
   *
   * Must be supplied together with difficultyGrade.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  difficultyScale?: string

  /**
   * Grade in the chosen difficulty scale, e.g. "VI", "VII+", "6c".
   * Must be supplied together with difficultyScale.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  difficultyGrade?: string

  /**
   * Mixed or ice climbing grade, e.g. "M4" or "WI4".
   * Official allowed values: M1–M12, WI1–WI12 (validated in service).
   * Can co-exist with difficultyScale/difficultyGrade — the scoring formula
   * uses max(regular coefficient, mixed coefficient).
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  mixedClimbing?: string

  // ── Completion type (personal tracking, never exported) ───────────────────

  /**
   * Personal completion style. Optional in all cases.
   * Allowed values: "on_sight" | "flash" | "red_point" | "top_rope"
   * Does not affect scoring and is never exported to the EOOA Excel template.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  completionType?: string

  // ── Notes ──────────────────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  privateNotes?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  publicNotes?: string
}

// Re-export the allowed-value arrays so the service can reference them
// without importing directly from climbing.constants.
export { CLIMBING_COMPLETION_TYPES, CLIMBING_DIFFICULTY_SCALES, CLIMBING_MIXED_GRADES, CLIMBING_REPETITION_TYPES, CLIMBING_SEASONS }
