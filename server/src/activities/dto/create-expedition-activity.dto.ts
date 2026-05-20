import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
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
 * Auth note:
 *   userId is included in the body until JWT auth is implemented in a later phase.
 */
export class CreateExpeditionActivityDto {
  // ── Auth (temporary until JWT phase) ───────────────────────────────────────

  /** Will be replaced by the JWT-decoded user id once auth guards are added. */
  @IsUUID()
  userId: string

  // ── Activity base fields ───────────────────────────────────────────────────

  @IsBoolean()
  @Type(() => Boolean)
  isOfficial: boolean

  /** Activity date. "YYYY-MM-DD" ISO format. */
  @IsDateString()
  date: string

  /**
   * Required when isOfficial = true.
   * Optional when isOfficial = false.
   */
  @ValidateIf((o) => o.isOfficial === true || o.clubId !== undefined)
  @IsUUID()
  clubId?: string

  // ── Expedition detail fields — always required (non-nullable in DB) ────────

  /** Country where the expedition took place. Example: "Νεπάλ". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string

  /** Mountain range / massif. Example: "Ιμαλάια". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mountainRange: string

  /** Mountain name. Example: "Έβερεστ". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mountain: string

  /** Summit / peak reached. Example: "Κορυφή Χίλαρι". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  summit: string

  /** Route name / description. Example: "Νοτιοδυτική Ράχη". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  routeName: string

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
   * Official: must be > 0 (checked in service).
   * Personal: must be >= 1.
   */
  @IsInt()
  @Min(1)
  @Type(() => Number)
  altitude: number

  /**
   * Total elevation gain for the expedition (metres).
   * Official: must be > 0 (checked in service).
   * Personal: must be >= 0.
   */
  @IsInt()
  @Min(0)
  @Type(() => Number)
  totalElevationGain: number

  /**
   * Difficulty grade.
   * Official allowed values: pezoporia, F-, F, F+, PD-, PD, PD+, AD-, AD, AD+,
   *                          D-, D, D+, TD-, TD, TD+, ED-, ED, ED+
   *   (validated in service against EXPEDITION_DIFFICULTY_GRADES).
   * Note: expedition difficulty uses DIFFERENT coefficients from hiking.
   * Personal: any non-empty string accepted by the DTO.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  difficultyGrade: string

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
