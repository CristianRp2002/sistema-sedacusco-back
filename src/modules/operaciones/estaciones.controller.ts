import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EstacionesService } from './estaciones.service'; // 👈 Importamos al cocinero

@Controller('estaciones')
@UseGuards(AuthGuard('jwt'))
export class EstacionesController {
  
  // 👈 Solo inyectamos el servicio, NADA de repositorios aquí
  constructor(private readonly estacionesService: EstacionesService) {} 

  @Get()
  findAll() {
    return this.estacionesService.findAll();
  }

  @Post()
  crear(@Body() body: { nombre: string }) {
    return this.estacionesService.crear(body);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() body: { nombre: string }) {
    return this.estacionesService.actualizar(id, body);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.estacionesService.eliminar(id);
  }

  @Post(':id/bombas')
  crearBomba(@Param('id') estacionId: string, @Body() body: any) {
    return this.estacionesService.crearBomba(estacionId, body);
  }

  @Patch('bombas/:id')
  actualizarBomba(@Param('id') id: string, @Body() body: any) {
    return this.estacionesService.actualizarBomba(id, body);
  }

  @Delete('bombas/:id')
  eliminarBomba(@Param('id') id: string) {
    return this.estacionesService.eliminarBomba(id);
  }

  @Post(':id/tableros')
  crearTablero(@Param('id') estacionId: string, @Body() body: any) {
    return this.estacionesService.crearTablero(estacionId, body);
  }

  @Patch('tableros/:id')
  actualizarTablero(@Param('id') id: string, @Body() body: any) {
    return this.estacionesService.actualizarTablero(id, body);
  }

  @Delete('tableros/:id')
  eliminarTablero(@Param('id') id: string) {
    return this.estacionesService.eliminarTablero(id);
  }
}