import type { Repository } from 'typeorm';

import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { type JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly _userRepository: Repository<User>,
    private readonly _jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | undefined> {
    const user = await this._userRepository.findOne({
      where: { email, is_active: true, is_deleted: false },
      relations: ['user_roles', 'user_roles.role'],
    });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      return user;
    }
    return undefined;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this._userRepository.update(user.id, {
      last_login_at: new Date(),
      last_login_ip: loginDto.ip_address,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      roles: user.user_roles?.map((ur) => ur.role.code) || [],
    };

    return {
      access_token: this._jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        tenant_id: user.tenant_id,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: Partial<User> }> {
    // Check if user already exists
    const existingUser = await this._userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = this._userRepository.create({
      ...registerDto,
      password_hash: passwordHash,
      tenant_id: registerDto.tenant_id,
    });

    const savedUser = await this._userRepository.save(user);

    // Generate JWT
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      tenant_id: savedUser.tenant_id,
      roles: [],
    };

    return {
      access_token: this._jwtService.sign(payload),
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        tenant_id: savedUser.tenant_id,
      },
    };
  }

  async refreshToken(user: User): Promise<{ access_token: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      roles: user.user_roles?.map((ur) => ur.role.code) || [],
    };

    return {
      access_token: this._jwtService.sign(payload),
    };
  }
}
