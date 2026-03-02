import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;


  @IsString()
  @IsNotEmpty()
  rol_id: string; 

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}