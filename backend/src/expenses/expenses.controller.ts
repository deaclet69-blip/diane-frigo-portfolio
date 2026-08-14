import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class ReclassifyDto {
  @IsIn(['FIXE', 'VARIABLE', 'EXCEPTIONNEL'])
  chargeType!: 'FIXE' | 'VARIABLE' | 'EXCEPTIONNEL';
}

// Finances : réservé ADMIN/RESPONSABLE (matrice de permissions §7)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RESPONSABLE')
@Controller('expenses')
export class ExpensesController {
  constructor(
    private expensesService: ExpensesService,
    private prisma: PrismaService,
  ) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('chargeType') chargeType?: string,
  ) {
    return this.expensesService.findAll({ from, to, chargeType });
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: { id: string }) {
    return this.expensesService.create(dto, user.id);
  }

  @Patch(':id/reclassify')
  reclassify(@Param('id') id: string, @Body() dto: ReclassifyDto, @CurrentUser() user: { id: string }) {
    return this.expensesService.reclassify(id, dto.chargeType, user.id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
  }
}
