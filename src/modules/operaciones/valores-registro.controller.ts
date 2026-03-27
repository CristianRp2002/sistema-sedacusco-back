import {
  Controller, Get, Post,
  Param, Body, ParseUUIDPipe,
} from '@nestjs/common';
import { ValoresRegistroService } from './valores-registro.service';

@Controller('valores-registro')
export class ValoresRegistroController {
  constructor(private readonly valoresRegistroService: ValoresRegistroService) {}

  // POST /valores-registro/bulk — guarda todos los valores del parte de una vez
  @Post('bulk')
  guardarBulk(@Body() datos: {
    parte_diario_id: string;
    valores: {
      activo_id: string;
      campo_id: string;
      valor: string;
    }[];
  }) {
    return this.valoresRegistroService.guardarBulk(datos);
  }

  // GET /valores-registro/parte/:id — valores de un parte diario agrupados por activo
  @Get('parte/:id')
  getByParte(@Param('id', ParseUUIDPipe) id: string) {
    return this.valoresRegistroService.getByParte(id);
  }

  // GET /valores-registro/activo/:id/historial — historial de un equipo
  @Get('activo/:id/historial')
  getHistorial(@Param('id', ParseUUIDPipe) id: string) {
    return this.valoresRegistroService.getHistorialActivo(id);
  }
} 