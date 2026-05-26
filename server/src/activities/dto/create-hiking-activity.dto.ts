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

/**
 * DTO for POST /activities/hiking.
 *
 * Validation strategy:
 *   - All hiking_activity_details fields are always required in this DTO because
 *     the DB columns are non-nullable. The service layer adds EOOA-specific
 *     allowed-value checks for official activities.
 *   - club_id is required only for official activities (via @ValidateIf).
 *   - Basic type validators (@IsInt, @IsString, etc.) always run.
 *
 * Auth note:
 *   userId is included in the body until JWT auth is implemented in a later phase.
 *   At that point it will be read from the decoded token instead.
 */
export class CreateHikingActivityDto {
  // ── Auth (temporary until JWT phase) ───────────────────────────────────────

  /**
   * ID of the user submitting the activity.
   * Will be replaced by the JWT-decoded user id once auth guards are added.
   */
  @IsUUID()
  userId: string

  // ── Activity base fields ───────────────────────────────────────────────────

  /**
   * Whether this activity participates in official EOOA records.
   * true  → all official fields required; points calculated and stored.
   * false → personal record; club_id optional; points remain null.
   */
  @IsBoolean()
  @Type(() => Boolean)
  isOfficial: boolean

  /** Activity date in ISO 8601 format: "YYYY-MM-DD". Always required. */
  @IsDateString()
  date: string

  /**
   * Club this activity belongs to.
   * Required when isOfficial = true (official activities must have a club).
   * Optional when isOfficial = false (personal activities may be club-less).
   */
  @ValidateIf((o) => o.isOfficial === true || o.clubId !== undefined)
  @IsUUID()
  clubId?: string

  // ── Hiking detail fields — always required (non-nullable in DB) ────────────

  /** Mountain or area name. Examples: "Παρνασσός", "Ολυμπος". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mountain: string

  /**
   * Starting location. Example: "Αράχωβα".
   * Required for official activities; optional for personal (stored as "" when absent).
   */
  @ValidateIf((o) => o.isOfficial === true || Boolean(o.startPoint))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  startPoint?: string

  /**
   * Summit or finishing point. Example: "Λιακούρα".
   * Required for official activities; optional for personal (stored as "" when absent).
   */
  @ValidateIf((o) => o.isOfficial === true || Boolean(o.endPoint))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  endPoint?: string

  /**
   * Maximum altitude reached (metres).
   * Official: must be > 0 (enforced in service).
   * Personal: must be >= 0.
   */
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxAltitude: number

  /**
   * Total elevation gain for the entire route (metres).
   * Official: must be > 0 (enforced in service).
   * Personal: must be >= 0.
   */
  @IsInt()
  @Min(0)
  @Type(() => Number)
  totalElevationGain: number

  /**
   * Route distance (km). Used in scoring formula: sqrt(max(dist/15, 1)).
   * Official: must be >= 0.
   * Stores up to 2 decimal places.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  distanceLength: number

  /**
   * Terrain / field type.
   * Official allowed values: "normal" | "winter_conditions" | "ski_mountaineering"
   *   (validated in service against HIKING_FIELD_TYPES).
   * Personal: any non-empty string accepted by the DTO.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fieldType: string

  /**
   * Difficulty grade.
   * Official allowed values: "pezoporia" | "F-" | "F" | "F+" | "PD-" | "PD" |
   *   "PD+" | "AD-" | "AD" | "AD+"  (validated in service).
   * Personal: any non-empty string accepted by the DTO.
   * Note: "pezoporia" is the normalized backend value for "ΠΕΖΟΠΟΡΙΑ".
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  difficultyGrade: string

  /**
   * Number of participants.
   * Must be >= 1 (always at least the submitting user).
   */
  @IsInt()
  @Min(1)
  @Type(() => Number)
  participantsNum: number

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
