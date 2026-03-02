import { SetMetadata } from '@nestjs/common';

// Definimos la clave que usaremos para guardar los roles en los metadatos
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);