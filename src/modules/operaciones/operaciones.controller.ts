import { Controller, Get, Post, Body, Patch, Param, Delete,ParseUUIDPipe } from '@nestjs/common';
import { OperacionesService } from './operaciones.service';
import { CreateOperacionesDto } from './dto/create-operaciones.dto';
import { UpdateOperacionesDto } from './dto/update-operaciones.dto';

@Controller('operaciones')
export class OperacionesController {
  constructor(private readonly operacionesService: OperacionesService) {}

  @Post()
  create(@Body() createOperacioneDto: CreateOperacionesDto) {
    return this.operacionesService.create(createOperacioneDto);
  }

  @Get()
  findAll() {
    return this.operacionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.operacionesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateOperacioneDto: UpdateOperacionesDto) {
    return this.operacionesService.update(id, updateOperacioneDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.operacionesService.remove(id);
  }
}
