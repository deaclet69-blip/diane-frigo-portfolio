import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { requireEnv } from '../common/require-env';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnv('JWT_ACCESS_SECRET'),
    });
  }

  // Ce que retourne validate() devient `request.user` (voir CurrentUser decorator)
  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role, permissions: payload.permissions ?? [] };
  }
}
