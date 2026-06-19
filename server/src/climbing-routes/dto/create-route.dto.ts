import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ROUTE_CATEGORIES, ROUTE_DIFFICULTY_SCALES } from '../climbing-routes.constants'

export class CreateRouteDto {
  /** Display name — shown to users. normalized_name is generated from this. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string

  /** Mountain or climbing area, e.g. "Βαρδούσια", "Καλύτερη". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mountainOrArea: string

  /** Specific climbing sector / field, e.g. "Αριστερός Πύργος". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  climbingField: string

  /**
   * Preferred difficulty scale for this route.
   * Allowed values: uiaa | alpine | french
   */
  @IsIn(ROUTE_DIFFICULTY_SCALES)
  defaultScale: string

  /**
   * Default difficulty grade in the chosen scale, e.g. "VII+", "6c".
   * Not validated against the full grade list here — the scoring
   * service (Phase 6) will validate grades at activity submission time.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  defaultGrade: string

  /**
   * Optional altitude in metres. May be unknown at route creation time.
   * Required in an official climbing activity (enforced in Phase 7B).
   */
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  altitude?: number

  /**
   * Optional route length in metres. May be unknown at route creation time.
   * Required in an official climbing activity (enforced in Phase 7B).
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  routeLength?: number

  /**
   * Route category. Defaults to "climbing" for MVP.
   * Kept as a field to support hiking/expedition routes in the future.
   */
  @IsOptional()
  @IsIn(ROUTE_CATEGORIES)
  category?: string

}
