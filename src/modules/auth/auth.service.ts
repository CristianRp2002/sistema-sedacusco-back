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
    const { username, password } = loginDto;
    const user = await this.usersService.findOneByUsernameWithPassword(username);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (Usuario)');
    }

    // ← Agrega esto
    if (!user.activo) {
      throw new UnauthorizedException('Usuario inactivo, contacta al administrador');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas (Password)');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.rol?.nombre
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id:              user.id,
        username:        user.username,
        nombre_completo: user.nombre_completo,
        rol: {
          id:     user.rol?.id,
          nombre: user.rol?.nombre
        }
      }
    };
  }
}