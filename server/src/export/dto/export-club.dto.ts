import {
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  ArrayMinSize,
  Min,
  Max,
} from 'class-validator'

export class ExportClubDto {
  /**
   * IDs of club members whose official activities should be included.
   * These are request-time only — never persisted.
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  selectedUserIds!: string[]

  /**
   * Optional year filter (e.g. 2026).
   * If provided, only activities whose date falls within that calendar year are exported.
   * If omitted, all matching official activities are exported regardless of year.
   */
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number

  /**
   * TEMPORARY: required until JWT auth/guards are implemented.
   * The service verifies this user is a club_admin for the target club or a super_admin.
   * Will be replaced by the authenticated user extracted from the JWT token.
   */
  @IsUUID('4')
  requesterUserId!: string
}
