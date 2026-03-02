import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  nombre: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsOptional() // Es opcional, no pasa nada si no lo envían
  descripcion?: string;
}   