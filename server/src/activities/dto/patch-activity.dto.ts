import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for PATCH /activities/:id — MVP activity edit.
 *
 * This single DTO covers all three activity categories (hiking, climbing, expedition).
 * Only the fields that are valid for the existing record's category are applied by the
 * service; extra fields from another category are accepted by the DTO but unused.
 *
 * MVP immutable fields are NOT declared here. The global ValidationPipe is configured
 * with { forbidNonWhitelisted: true, whitelist: true }, so any attempt to send an
 * undeclared field (category, isOfficial, userId, clubId, createdAt, or routeId for
 * climbing) results in an automatic 400 Bad Request before the service is called.
 *
 * All fields are optional: the client only needs to send the fields that change.
 * The service merges each provided value with the existing record's stored value.
 *
 * Official activities: the service re-validates all EOOA rules against the merged
 * (effective) field values and recalculates points.
 * Personal activities: flexible validation; points remain null.
 */
export class PatchActivityDto {
  // ── Shared across all categories ──────────────────────────────────────────

  /** Activity date in ISO 8601 format: "YYYY-MM-DD". */
  @IsOptional()
  @IsDateString()
  date?: string

  /** Number of participants. Must be >= 1. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  participantsNum?: number

  /**
   * Difficulty grade.
   * Hiking: "pezoporia" | "F-" | "F" | "F+" | … | "AD+"
   * Climbing: UIAA/Alpine grade (e.g. "VI", "TD") or French (e.g. "7a") when paired with difficultyScale.
   * Expedition: same grade list as hiking but uses different scoring coefficients.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  difficultyGrade?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  privateNotes?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  publicNotes?: string

  // ── Shared between hiking and expedition ──────────────────────────────────

  /**
   * Total elevation gain in metres.
   * Hiking: must be > 0 for official activities.
   * Expedition: must be > 0 for official activities.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  totalElevationGain?: number

  // ── Shared between climbing and expedition ────────────────────────────────

  /**
   * Season.
   * Climbing: "summer" | "winter"
   * Expedition: "summer" | "winter"
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  season?: string

  /**
   * Altitude in metres.
   * Climbing: altitude of the climb; must be > 0 for official.
   * Expedition: summit altitude; must be > 0 for official.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  altitude?: number

  // ── Hiking-specific ────────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mountain?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  startPoint?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  endPoint?: string

  /** Maximum altitude reached (metres). Hiking only. Must be >= 0 (> 0 for official). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxAltitude?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  distanceLength?: number

  /** Terrain type. Hiking only. Official allowed: "normal" | "winter_conditions" | "ski_mountaineering". */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fieldType?: string

  // ── Climbing-specific ─────────────────────────────────────────────────────

  /** Repetition type (climbing only). Allowed: "new" | "repeat". */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  repetitionType?: string

  /** Route length in metres (climbing only). Official: must be > 0. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  routeLength?: number

  /** Difficulty scale (climbing only). Allowed: "uiaa" | "alpine" | "french". */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  difficultyScale?: string

  /** Mixed/ice grade (climbing only). e.g. "M4", "WI4". */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  mixedClimbing?: string

  /** Completion style (climbing, personal tracking). Allowed: "on_sight" | "flash" | "red_point" | "top_rope". */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  completionType?: string

  /** Participant names (climbing only, official records when participantsNum > 1). */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  participantsText?: string

  // ── Expedition-specific ───────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mountainRange?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  summit?: string

  /**
   * Route name / description (expedition only).
   * Note: the climbing route snapshot (routeName on climbingDetail) is immutable and
   * cannot be changed. This field only applies to expedition activities.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  routeName?: string

  /** Organization type (expedition only). Allowed: "no" | "europe" | "africa" | "other_continents". */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  organizationType?: string
}
