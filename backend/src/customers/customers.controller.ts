import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CustomersService } from './customers.service';
import { assertNotDemo } from '../common/assert-not-demo';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class MergeCustomerDto {
  @IsString()
  targetId!: string;
}

class CreateWithDedupDto extends CreateCustomerDto {
  @IsOptional()
  @IsBoolean()
  forceDistinct?: boolean; // true = "ce n'est PAS la même personne, crée quand même"
}

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@RequirePermission('clients')
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get('check-name')
  checkName(@Query('name') name: string) {
    return this.customersService.checkNameExists(name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: { id: string }) {
    return this.customersService.create(dto, user.id);
  }

  // Utilisé par "Nouvelle vente" : gère la détection de doublon (§ demande utilisateur)
  @Post('dedup')
  createWithDedup(@Body() dto: CreateWithDedupDto, @CurrentUser() user: { id: string }) {
    return this.customersService.createWithDedup(dto, !!dto.forceDistinct, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() user: { id: string }) {
    return this.customersService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    assertNotDemo('Deleting a customer');
    return this.customersService.remove(id, user.id);
  }

  // Fusion réservée à ADMIN/RESPONSABLE — action sensible sur l'historique client
  @Roles('ADMIN', 'RESPONSABLE')
  @Post(':id/merge')
  merge(@Param('id') id: string, @Body() dto: MergeCustomerDto, @CurrentUser() user: { id: string }) {
    assertNotDemo('Merging customers');
    return this.customersService.merge(id, dto.targetId, user.id);
  }
}
