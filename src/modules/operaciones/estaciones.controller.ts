import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estacion } from './entities/estacion.entity';
import { Bomba } from './entities/bomba.entity';
import { Tablero } from './entities/tablero.entity';

@Controller('estaciones')
@UseGuards(AuthGuard('jwt'))
export class EstacionesController {
  constructor(
    @InjectRepository(Estacion)
    private readonly estacionRepo: Repository<Estacion>,
    @InjectRepository(Bomba)
    private readonly bombaRepo: Repository<Bomba>,
    @InjectRepository(Tablero)
    private readonly tableroRepo: Repository<Tablero>,
  ) {}

  // ESTACIONES
  @Get()
  findAll() {
    return this.estacionRepo.find({ relations: ['bombas', 'tableros'] });
  }

  @Post()
  crear(@Body() body: { nombre: string }) {
    const estacion = this.estacionRepo.create(body);
    return this.estacionRepo.save(estacion);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() body: { nombre: string }) {
    return this.estacionRepo.update(id, body);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.estacionRepo.delete(id);
  }

  // BOMBAS
  @Post(':id/bombas')
  crearBomba(@Param('id') estacionId: string, @Body() body: { nombre: string }) {
    const bomba = this.bombaRepo.create({
      nombre: body.nombre,
      estacion: { id: estacionId } as any
    });
    return this.bombaRepo.save(bomba);
  }

  @Patch('bombas/:id')
  actualizarBomba(@Param('id') id: string, @Body() body: any) {
    return this.bombaRepo.update(id, body);
  }

  @Delete('bombas/:id')
  eliminarBomba(@Param('id') id: string) {
    return this.bombaRepo.delete(id);
  }

  // TABLEROS
  @Post(':id/tableros')
  crearTablero(@Param('id') estacionId: string, @Body() body: { nombre: string, tipo: string }) {
    const tablero = this.tableroRepo.create({
      ...body,
      estacion: { id: estacionId } as any
    });
    return this.tableroRepo.save(tablero);
  }

  @Patch('tableros/:id')
  actualizarTablero(@Param('id') id: string, @Body() body: any) {
    return this.tableroRepo.update(id, body);
  }

  @Delete('tableros/:id')
  eliminarTablero(@Param('id') id: string) {
    return this.tableroRepo.delete(id);
  }
}