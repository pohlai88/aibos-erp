import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIP,
} from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIP()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
