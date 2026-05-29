import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shortName?: string
}
