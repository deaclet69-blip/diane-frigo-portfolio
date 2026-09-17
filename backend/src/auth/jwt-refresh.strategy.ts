import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.strategy';
import { requireEnv } from '../common/require-env';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnv('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role, permissions: payload.permissions ?? [] };
  }
}
