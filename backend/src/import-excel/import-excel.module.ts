import { Module } from '@nestjs/common';
import { ImportExcelService } from './import-excel.service';
import { ImportExcelController } from './import-excel.controller';

@Module({
  providers: [ImportExcelService],
  controllers: [ImportExcelController],
})
export class ImportExcelModule {}
