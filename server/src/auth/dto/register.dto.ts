import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class RegisterDto {
  /** Email address. Normalized to lowercase + trimmed before use. */
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string

  /** Plain-text password — will be hashed before storage. Never stored or logged. */
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(200)
  password: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string

  /**
   * Optional club to join at registration.
   * If provided, a ClubMembership with role = "member" is created.
   * MVP: at most one club per user at registration.
   * The user cannot self-assign club_admin or super_admin.
   */
  @IsOptional()
  @IsUUID()
  clubId?: string
}
