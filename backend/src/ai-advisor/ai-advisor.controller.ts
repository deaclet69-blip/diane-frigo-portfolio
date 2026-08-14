import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AiAdvisorService } from './ai-advisor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

class ChatDto {
  @IsString()
  @MinLength(1)
  question!: string;

  @IsOptional()
  @IsArray()
  history?: ChatMessageDto[];
}

// Réservé ADMIN/RESPONSABLE — les données envoyées à l'IA couvrent finances
// et clients, sensibles (cf. matrice de permissions §7).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RESPONSABLE')
@Controller('ai-advisor')
export class AiAdvisorController {
  constructor(private aiAdvisorService: AiAdvisorService) {}

  @Get('summary')
  getSummary() {
    return this.aiAdvisorService.getSummary();
  }

  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.aiAdvisorService.chat(dto.question, dto.history);
  }
}
