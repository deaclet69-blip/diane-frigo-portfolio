import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { requireEnv } from '../common/require-env';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.issueTokens(user.id, user.email, user.role.name, user.permissions);
  }

  async refresh(userId: string) {
    // On recharge depuis la base (et pas depuis le payload du refresh token)
    // pour que rôle/permissions/désactivation soient toujours à jour, même
    // si l'admin les a changés pendant que l'utilisateur était connecté.
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account not found or disabled');
    }
    return this.issueTokens(user.id, user.email, user.role.name, user.permissions);
  }

  private issueTokens(userId: string, email: string, role: string, permissions: string[]) {
    const payload = { sub: userId, email, role, permissions };

    const accessToken = this.jwtService.sign(payload, {
      secret: requireEnv('JWT_ACCESS_SECRET'),
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: requireEnv('JWT_REFRESH_SECRET'),
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role, permissions },
    };
  }
}
