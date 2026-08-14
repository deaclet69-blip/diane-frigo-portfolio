import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController, ExpenseCategoriesController } from './expenses.controller';

@Module({
  providers: [ExpensesService],
  controllers: [ExpensesController, ExpenseCategoriesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}
