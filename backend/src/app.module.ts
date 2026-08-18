import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { CustomersModule } from './customers/customers.module';
import { SalesModule } from './sales/sales.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DepositsModule } from './deposits/deposits.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FinancesModule } from './finances/finances.module';
import { ReportsModule } from './reports/reports.module';
import { ImportExcelModule } from './import-excel/import-excel.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AiAdvisorModule } from './ai-advisor/ai-advisor.module';
import { PricingModule } from './pricing/pricing.module';
import { LossesModule } from './losses/losses.module';
import { LoansModule } from './loans/loans.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    // Sécurité (§19) : max 100 requêtes / minute / IP par défaut — le
    // login est en plus protégé individuellement (voir auth.controller.ts).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    StockModule,
    CustomersModule,
    SalesModule,
    InvoicesModule,
    DepositsModule,
    ExpensesModule,
    FinancesModule,
    ReportsModule,
    ImportExcelModule,
    AuditLogsModule,
    AiAdvisorModule,
    PricingModule,
    LossesModule,
    LoansModule,
    SuppliersModule,
    DashboardModule,
    SystemModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
