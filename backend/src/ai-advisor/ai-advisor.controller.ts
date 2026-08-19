import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AiAdvisorService } from './ai-advisor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

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

// Gouverné par la case à cocher "assistant" (Paramètres > Utilisateurs) —
// les données envoyées à l'IA couvrent finances et clients, donc à cocher
// avec discernement.
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('assistant')
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
