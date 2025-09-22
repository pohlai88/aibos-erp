import { IsEmail, IsString, MinLength, IsUUID, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  first_name!: string;

  @IsString()
  @MinLength(2)
  last_name!: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsUUID()
  tenant_id!: string;
}
