import { Module } from '@nestjs/common';
import { SystemController, DemoReseedController } from './system.controller';
import { SystemService } from './system.service';
import { DemoSeedService } from './demo-seed.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SystemController, DemoReseedController],
  providers: [SystemService, DemoSeedService],
})
export class SystemModule {}
