import {
  Controller, Get, Post, Put, Delete,
  Param, Body, ParseUUIDPipe,
} from '@nestjs/common';
import { ActivosService } from './activos.service';

@Controller('activos')
export class ActivosController {
  constructor(private readonly activosService: ActivosService) {}

  @Get('tipos')
  getTipos() {
    return this.activosService.getTipos();
  }

  @Get('estacion/:id')
  getByEstacion(@Param('id', ParseUUIDPipe) id: string) {
    return this.activosService.getByEstacion(id);
  }

  @Post()
  crear(@Body() datos: any) {
    return this.activosService.crear(datos);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: any,
  ) {
    return this.activosService.actualizar(id, datos);
  }

  @Delete(':id')
  desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.activosService.desactivar(id);
  }

  @Post('tipos')
  crearTipo(@Body() datos: any) {
    return this.activosService.crearTipo(datos);
  }
  @Put('tipos/:id')
  actualizarTipo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: any,
  ) {
    return this.activosService.actualizarTipo(id, datos);
  }

  @Delete('tipos/:id')
  eliminarTipo(@Param('id', ParseUUIDPipe) id: string) {
    return this.activosService.eliminarTipo(id);
  }
}