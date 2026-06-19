import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ACTIVITY_CATEGORIES } from '../activities.constants'

/** Query parameters for GET /activities. userId comes from the JWT, not the query string. */
export class GetActivitiesDto {
  /**
   * Optional category filter.
   * Allowed values: "hiking" | "climbing" | "expedition"
   * If omitted, all categories are returned.
   * If an invalid value is provided, the global ValidationPipe returns 400.
   */
  @IsOptional()
  @IsIn(ACTIVITY_CATEGORIES)
  category?: string

  /**
   * Page size (default: 20, max: 100).
   * Activities are ordered by date descending.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  take?: number

  /** Offset / number of records to skip (default: 0). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number
}
