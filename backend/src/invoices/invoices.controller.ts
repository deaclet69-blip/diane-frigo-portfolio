import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { AddPaymentDto } from './dto/add-payment.dto';
import { VoidInvoiceDto } from './dto/void-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { assertNotDemo } from '../common/assert-not-demo';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@RequirePermission('ventes')
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.invoicesService.findAll({ customerId, status, from, to });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body() dto: AddPaymentDto, @CurrentUser() user: { id: string }) {
    return this.invoicesService.addPayment(id, dto, user.id);
  }

  // Annulation réservée ADMIN/RESPONSABLE (action sensible, cf. §7)
  @Roles('ADMIN', 'RESPONSABLE')
  @Post(':id/void')
  voidInvoice(@Param('id') id: string, @Body() dto: VoidInvoiceDto, @CurrentUser() user: { id: string }) {
    assertNotDemo('Voiding an invoice');
    return this.invoicesService.voidInvoice(id, dto, user.id);
  }
}
