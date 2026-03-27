import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampoTipoActivo, TipoInput } from './entities/campo-tipo-activo.entity';
import { TipoActivo } from './entities/tipo-activo.entity';

@Injectable()
export class CamposService {
  constructor(
    @InjectRepository(CampoTipoActivo)
    private readonly campoRepo: Repository<CampoTipoActivo>,

    @InjectRepository(TipoActivo)
    private readonly tipoActivoRepo: Repository<TipoActivo>,
  ) {}

  // Lista todos los tipos con sus campos — para la pantalla de administración
  async getTiposConCampos(): Promise<TipoActivo[]> {
    return this.tipoActivoRepo.find({
      where: { activo: true },
      relations: ['campos'],
      order: { nombre: 'ASC' },
    });
  }

  // Campos de un tipo específico — para construir el formulario del operador
  async getCamposByTipo(tipoActivoId: string): Promise<CampoTipoActivo[]> {
    return this.campoRepo.find({
      where: { tipo_activo_id: tipoActivoId, activo: true },
      order: { orden: 'ASC' },
    });
  }

  // Crear campo nuevo
  async crear(datos: {
    tipo_activo_id: string;
    nombre_campo: string;
    etiqueta: string;
    tipo_input: TipoInput;
    requerido: boolean;
    orden: number;
    unidad?: string;
  }): Promise<CampoTipoActivo> {
    const campo = this.campoRepo.create(datos);
    return this.campoRepo.save(campo);
  }

  // Actualizar campo
  async actualizar(id: string, datos: Partial<CampoTipoActivo>): Promise<CampoTipoActivo> {
    const campo = await this.campoRepo.findOne({ where: { id } });
    if (!campo) throw new NotFoundException(`Campo ${id} no encontrado`);
    Object.assign(campo, datos);
    return this.campoRepo.save(campo);
  }

  // Eliminar campo
  async eliminar(id: string): Promise<{ message: string }> {
    const campo = await this.campoRepo.findOne({ where: { id } });
    if (!campo) throw new NotFoundException(`Campo ${id} no encontrado`);
    await this.campoRepo.remove(campo);
    return { message: `Campo ${campo.etiqueta} eliminado` };
  }

  // Reordenar campos — cuando el admin arrastra para cambiar el orden
  async reordenar(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.campoRepo.update(ids[i], { orden: i + 1 });
    }
  }
}