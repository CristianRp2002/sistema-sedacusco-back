import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtenemos los roles necesarios definidos en el controlador
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene @Roles, permitimos el acceso
    if (!requiredRoles) return true;

    // 2. Obtenemos el usuario de la petición (inyectado previamente por el JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // 3. Verificamos si el rol del usuario coincide con los permitidos
    const hasRole = requiredRoles.includes(user.rol?.nombre);

    if (!hasRole) {
      throw new ForbiddenException(
        `Tu cargo (${user.rol?.nombre || 'Sin Rol'}) no tiene permiso para esta acción.`
      );
    }
    
    return true;
  }
}