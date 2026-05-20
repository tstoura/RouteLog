import { IsBoolean, IsIn, IsOptional } from 'class-validator'
import { PREFERRED_ACTIVITIES } from '../users.constants'

export class UpdateUserDto {
  /**
   * Optional UI personalisation only — does not restrict activity access.
   * Send null to clear the preference.
   */
  @IsOptional()
  @IsIn([...PREFERRED_ACTIVITIES, null])
  preferredActivity?: string | null

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean
}
