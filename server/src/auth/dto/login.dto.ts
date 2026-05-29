import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'

export class LoginDto {
  /** Email address. Normalized to lowercase + trimmed. */
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string
}
