import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { OperacionesService } from 'src/modules/operaciones/operaciones.service';

@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly operacionesService: OperacionesService,
  ) {}

  @Get('parte/:id')
  async generarParte(@Param('id') id: string, @Res() res: Response) {
    const parte = await this.operacionesService.findOne(id);
    const html = this.pdfService.generarHtmlParte(parte);
    const pdf = await this.pdfService.generarPdf(html);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Parte_${parte.estacion?.nombre}_${parte.fecha_folio}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.end(pdf);
  }
}