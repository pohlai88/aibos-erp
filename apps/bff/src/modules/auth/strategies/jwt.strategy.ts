import type { Repository } from "typeorm";

import { User } from "../entities/user.entity";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";

export interface JwtPayload {
  sub: string;
  email: string;
  tenant_id: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET", "your-secret-key"),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        tenant_id: payload.tenant_id,
        is_active: true,
        is_deleted: false,
      },
      relations: ["user_roles", "user_roles.role"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found or inactive");
    }

    return user;
  }
}
