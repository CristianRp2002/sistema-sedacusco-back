import { PartialType } from '@nestjs/mapped-types';
import { CreateOperacionesDto } from './create-operaciones.dto';

export class UpdateOperacionesDto extends PartialType(CreateOperacionesDto) {}