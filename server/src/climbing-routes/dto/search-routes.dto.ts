import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ROUTE_CATEGORIES } from '../climbing-routes.constants'

export class SearchRoutesDto {
  /**
   * Partial name search (case-insensitive).
   * Matched against routes.name (the human-readable display name).
   */
  @IsOptional()
  @IsString()
  q?: string

  /** Filter by mountain or climbing area (case-insensitive, partial match). */
  @IsOptional()
  @IsString()
  mountainOrArea?: string

  /** Filter by climbing field / sector (case-insensitive, partial match). */
  @IsOptional()
  @IsString()
  climbingField?: string

  /** Filter by category. Defaults to "climbing". */
  @IsOptional()
  @IsIn(ROUTE_CATEGORIES)
  category?: string

  /** Number of results to return. Default 20, max 100. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  take?: number

  /** Number of results to skip for pagination. Default 0. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number
}
