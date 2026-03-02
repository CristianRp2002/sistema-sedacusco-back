import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Buscar usuario con password incluido
    const user = await this.usersService.findOneByUsernameWithPassword(loginDto.username);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // 2. Validar password con bcrypt
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Contraseña incorrecta');

    // 3. Crear el token
    const payload = { id: user.id, username: user.username, role: user.rol?.nombre };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        username: user.username,
        nombre: user.nombre_completo,
        rol: user.rol?.nombre
      }
    };
  }
}