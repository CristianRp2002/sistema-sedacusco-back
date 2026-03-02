import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common'; // Agregamos UseGuards
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator'; 
import { RolesGuard } from '../auth/guards/roles.guard';   

@Controller('users')
// 1. Aplicamos los guardias a nivel GLOBAL del controlador para que nadie entre sin Token
@UseGuards(AuthGuard('jwt'), RolesGuard) 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN') // Solo el administrador puede crear nuevos usuarios
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN', 'OPERADOR') // Ambos pueden ver la lista (o ajusta según tu necesidad)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERADOR')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN') // Solo el admin puede editar perfiles
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('ADMIN') // 2. Protección Crítica: Solo el admin puede borrar
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}