import {
  Controller, Get, Post, Put, Delete,
  Param, Body, ParseUUIDPipe,
} from '@nestjs/common';
import { CamposService } from './campos.service';
import { TipoInput } from './entities/campo-tipo-activo.entity';

@Controller('campos')
export class CamposController {
  constructor(private readonly camposService: CamposService) {}

  // GET /campos/tipos — todos los tipos con sus campos
  @Get('tipos')
  getTiposConCampos() {
    return this.camposService.getTiposConCampos();
  }

  // GET /campos/tipo/:id — campos de un tipo específico
  @Get('tipo/:id')
  getCamposByTipo(@Param('id', ParseUUIDPipe) id: string) {
    return this.camposService.getCamposByTipo(id);
  }

  // POST /campos — crear campo nuevo
  @Post()
  crear(@Body() datos: {
    tipo_activo_id: string;
    nombre_campo: string;
    etiqueta: string;
    tipo_input: TipoInput;
    requerido: boolean;
    orden: number;
    unidad?: string;
  }) {
    return this.camposService.crear(datos);
  }

  // PUT /campos/:id — actualizar campo
  @Put(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: any,
  ) {
    return this.camposService.actualizar(id, datos);
  }

  // DELETE /campos/:id — eliminar campo
  @Delete(':id')
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.camposService.eliminar(id);
  }

  // PUT /campos/reordenar — recibe array de IDs en el nuevo orden
  @Put('reordenar/batch')
  reordenar(@Body() body: { ids: string[] }) {
    return this.camposService.reordenar(body.ids);
  }
}