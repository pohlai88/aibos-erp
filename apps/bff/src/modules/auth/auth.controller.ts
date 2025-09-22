import type { User } from './entities/user.entity';

import { type AuthService } from './auth.service';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';
import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    return this._authService.login(loginDto);
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    return this._authService.register(registerDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req: { user: User }): Promise<Record<string, unknown>> {
    return {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      avatar_url: req.user.avatar_url,
      tenant_id: req.user.tenant_id,
      roles: req.user.user_roles?.map((ur) => ur.role.code) || [],
      created_at: req.user.created_at,
      last_login_at: req.user.last_login_at,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('refresh')
  async refreshToken(@Request() req: { user: User }): Promise<{ access_token: string }> {
    return this._authService.refreshToken(req.user);
  }
}
