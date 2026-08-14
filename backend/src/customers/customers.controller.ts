import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class MergeCustomerDto {
  @IsString()
  targetId!: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RESPONSABLE', 'VENDEUR')
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: { id: string }) {
    return this.customersService.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() user: { id: string }) {
    return this.customersService.update(id, dto, user.id);
  }

  // Fusion réservée à ADMIN/RESPONSABLE — action sensible sur l'historique client
  @Roles('ADMIN', 'RESPONSABLE')
  @Post(':id/merge')
  merge(@Param('id') id: string, @Body() dto: MergeCustomerDto, @CurrentUser() user: { id: string }) {
    return this.customersService.merge(id, dto.targetId, user.id);
  }
}
