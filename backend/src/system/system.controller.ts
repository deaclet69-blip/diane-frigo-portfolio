import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { SystemService } from './system.service';
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

  // Réservé à ADMIN — vérifié deux fois : par le rôle (RolesGuard) et par le
  // mot de passe de la personne connectée (voir SystemService.resetAllData).
  @Roles('ADMIN')
  @Post('reset-data')
  resetData(@Body() dto: ResetDataDto, @CurrentUser() user: { id: string }) {
    return this.systemService.resetAllData(user.id, dto.password);
  }
}
