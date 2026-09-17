import { Body, Controller, ForbiddenException, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { SystemService } from './system.service';
import { DemoSeedService } from './demo-seed.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class ResetDataDto {
  @IsString()
  @MinLength(1)
  password!: string;
}

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private systemService: SystemService) {}

  // Désactivé dans cette version démo (voir DangerZonePage) — le mot de
  // passe de démo étant public, cette route resterait autrement exploitable
  // directement même sans passer par l'interface.
  @Roles('ADMIN')
  @Post('reset-data')
  resetData() {
    throw new ForbiddenException(
      'This action is disabled in the public demo version.',
    );
  }
}

// Endpoint SÉPARÉ, volontairement SANS JwtAuthGuard — pensé pour être
// appelé automatiquement par un service de cron externe (pas de connexion
// possible pour un tel service), protégé uniquement par une clé secrète
// (DEMO_RESEED_KEY, jamais partagée publiquement, contrairement au mot de
// passe démo). Régénère les données démo, ancrées sur la date réelle du
// moment de l'appel, pour que "Aujourd'hui" / "Ce mois-ci" restent toujours
// remplis (voir demo-seed.service.ts).
@Controller('system')
export class DemoReseedController {
  constructor(
    private demoSeedService: DemoSeedService,
    private prisma: PrismaService,
  ) {}

  // Endpoint de "réveil" — sans rien vérifier, juste pour forcer Render à
  // sortir le service gratuit de veille avant l'appel de reseed qui suit
  // (Render met ~30-60s à se réveiller ; cron-job.org abandonne après ~30s ;
  // ce petit appel séparé, quelques minutes avant, absorbe ce délai).
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // "health" seul ne réveille QUE le serveur Render, pas forcément la base
  // Neon (qui a son propre état de veille séparé). Celui-ci interroge
  // réellement PostgreSQL via Prisma, pour réveiller les deux avant le
  // reseed qui suit.
  @Get('health-db')
  async healthDb() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  }

  // La clé passait avant en paramètre d'URL (?key=...) — visible dans les
  // journaux de Render, l'historique du navigateur, et tout proxy
  // intermédiaire. Désormais transmise dans un en-tête HTTP dédié, jamais
  // journalisé par défaut.
  @Post('reseed-demo')
  async reseedDemo(@Headers('x-demo-reseed-key') key: string) {
    const expected = process.env.DEMO_RESEED_KEY;
    if (!expected || key !== expected) {
      throw new ForbiddenException('Invalid or missing key.');
    }
    return this.demoSeedService.reseed();
  }
}
