import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for POST /activities/expedition.
 *
 * All expedition_activity_details columns are non-nullable, so every detail
 * field is required in this DTO for both official and personal activities.
 *
 * Validation strategy:
 *   - DTO: basic type/format validation (always).
 *   - Service: EOOA-specific allowed-value and numeric-range checks for officials.
 *   - season and organization_type are validated against allowed values for all
 *     activities (official and personal) — the allowed sets are small and fixed,
 *     and storing unknown values would corrupt future export.
 *   - difficulty_grade is validated against the EOOA expedition list for official
 *     activities only; personal activities accept any non-empty string.
 *
 * Organization rule (§4.6):
 *   organization_type reflects whether the expedition was organized by the user's club.
 *   If it was NOT organized by the club, use "no".
 *
 * Auth: userId comes from the verified JWT (req.user.sub). Not accepted in the body.
 */
export class CreateExpeditionActivityDto {
  // ── Activity base fields ───────────────────────────────────────────────────

  @IsBoolean()
  @Type(() => Boolean)
  isOfficial: boolean

  /** Activity date. "YYYY-MM-DD" ISO format. */
  @IsDateString()
  date: string

  // ── Expedition detail fields — always required (non-nullable in DB) ────────

  /** Country where the expedition took place. Example: "Νεπάλ". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string

  /**
   * Mountain range / massif. Example: "Ιμαλάια".
   * Required for official activities; optional for personal (stored as "" when absent).
   */
  @ValidateIf((o) => o.isOfficial === true || Boolean(o.mountainRange))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mountainRange?: string

  /** Mountain name. Example: "Έβερεστ". Always required. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mountain: string

  /**
   * Summit / peak reached.
   * Required for official activities; optional for personal (stored as "" when absent).
   */
  @ValidateIf((o) => o.isOfficial === true || Boolean(o.summit))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  summit?: string

  /**
   * Route name / description. 
   * Required for official activities; optional for personal (stored as "" when absent).
   */
  @ValidateIf((o) => o.isOfficial === true || Boolean(o.routeName))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  routeName?: string

  /**
   * Season.
   * Allowed values: "summer" | "winter"
   * Note: ski-mountaineering conditions are treated as "winter" (§4.2).
   * Validated against the allowed list for all activities (official and personal).
   */
  @IsString()
  @IsNotEmpty()
  season: string

  /**
   * Summit altitude in metres.
   * Official: required, must be > 0 (service enforces).
   * Personal: optional. If provided, must be >= 1.
   *           If omitted, stored as 0 (Phase A compromise; Phase B will make column nullable).
   */
  @ValidateIf((o) => o.isOfficial === true || o.altitude !== undefined)
  @IsInt()
  @Min(1)
  @Type(() => Number)
  altitude?: number

  /**
   * Total elevation gain for the expedition (metres).
   * Official: required, must be > 0 (service enforces).
   * Personal: optional. If provided, must be >= 0.
   *           If omitted, stored as 0 (Phase A compromise; Phase B will make column nullable).
   */
  @ValidateIf((o) => o.isOfficial === true || o.totalElevationGain !== undefined)
  @IsInt()
  @Min(0)
  @Type(() => Number)
  totalElevationGain?: number

  /**
   * Difficulty grade.
   * Official allowed values: pezoporia, F-, F, F+, PD-, PD, PD+, AD-, AD, AD+,
   *                          D-, D, D+, TD-, TD, TD+, ED-, ED, ED+
   *   (validated in service against EXPEDITION_DIFFICULTY_GRADES).
   * Note: expedition difficulty uses DIFFERENT coefficients from hiking.
   * Personal: optional. If provided must still be a valid grade. Stored as "" when absent.
   */
  @ValidateIf((o) => o.isOfficial === true || Boolean(o.difficultyGrade))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  difficultyGrade?: string

  /**
   * Number of participants.
   * Must be >= 1 (always at least the submitting user).
   * No minimum threshold: even 1 participant is valid for expeditions (§4.5).
   */
  @IsInt()
  @Min(1)
  @Type(() => Number)
  participantsNum: number

  /**
   * Organization type.
   * Allowed values: "no" | "europe" | "africa" | "other_continents"
   *   "no"              → expedition was NOT organized by the club (org coefficient = 0).
   *   "europe"          → organized by the club in Europe (org coefficient = 4).
   *   "africa"          → organized by the club in Africa (org coefficient = 6).
   *   "other_continents"→ organized by the club elsewhere (org coefficient = 12).
   *
   * The organization coefficient is ADDED at the end of the scoring formula,
   * not multiplied. Validated for all activities (official and personal).
   */
  @IsString()
  @IsNotEmpty()
  organizationType: string

  // ── Always optional ────────────────────────────────────────────────────────

  /** Private notes visible only to the user. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  privateNotes?: string

  /** Public notes (future: visible to club). */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  publicNotes?: string
}
