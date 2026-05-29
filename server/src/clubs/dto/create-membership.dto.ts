import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { CLUB_ROLES } from '../clubs.constants'

export class CreateMembershipDto {
  @IsUUID()
  userId: string

  /**
   * Club-scoped role. Does NOT affect system_role.
   * Allowed values: member | club_admin
   */
  @IsIn(CLUB_ROLES)
  role: string

  /** EOOA / club registry membership number. Optional. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registryNumber?: string
}
