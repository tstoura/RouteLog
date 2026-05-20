import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ACTIVITY_CATEGORIES } from '../activities.constants'

/**
 * Query parameters for GET /activities.
 *
 * Temporary auth note:
 *   userId is a required query param until JWT auth is implemented.
 *   Once auth guards are added, userId will come from the token and this
 *   field will be removed.
 */
export class GetActivitiesDto {
  /**
   * ID of the user whose activities to retrieve.
   * Temporary — will be replaced by the JWT-decoded user id.
   */
  @IsUUID()
  userId: string

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
