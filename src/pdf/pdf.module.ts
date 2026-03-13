import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { OperacionesModule } from 'src/modules/operaciones/operaciones.module';

@Module({
  imports: [OperacionesModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}