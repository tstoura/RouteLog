import { IsUUID } from 'class-validator'

/**
 * Body for POST /auth/me/club-membership.
 *
 * Only `clubId` is accepted. Any `role`, `userId`, or other fields
 * sent by the client are not declared here and are silently ignored
 * by NestJS's validation pipe (whitelist mode).
 *
 * The role is always hardcoded to "member" in the service layer.
 * The userId is always taken from the JWT (`req.user.sub`).
 */
export class JoinClubDto {
  @IsUUID()
  clubId: string
}
