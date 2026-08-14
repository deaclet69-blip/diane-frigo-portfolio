import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportExcelService } from './import-excel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Import Excel réservé ADMIN — action irréversible qui crée des factures et
// mouvements de stock en masse (cf. §21 et matrice de permissions §7).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('import/excel')
export class ImportExcelController {
  constructor(private importExcelService: ImportExcelService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  preview(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: { id: string }) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    return this.importExcelService.preview(file.buffer, user.id);
  }

  @Post('confirm')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  confirm(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: { id: string }) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    return this.importExcelService.confirm(file.buffer, user.id);
  }
}
