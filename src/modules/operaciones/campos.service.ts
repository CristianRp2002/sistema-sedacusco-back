import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampoTipoActivo, TipoInput, ConfigCampo } from './entities/campo-tipo-activo.entity';
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
    config?: ConfigCampo; 
  }): Promise<CampoTipoActivo> {
    // Validar config antes de crear
    this.validarConfigCampo(datos.tipo_input, datos.config);
    
    const campo = this.campoRepo.create(datos);
    return this.campoRepo.save(campo);
  }

  // Actualizar campo
  async actualizar(id: string, datos: Partial<CampoTipoActivo>): Promise<CampoTipoActivo> {
    const campo = await this.campoRepo.findOne({ where: { id } });
    if (!campo) throw new NotFoundException(`Campo ${id} no encontrado`);
    
    if (datos.tipo_input || datos.config) {
      const tipoFinal   = datos.tipo_input ?? campo.tipo_input;
      const configFinal = datos.config     ?? campo.config;
      this.validarConfigCampo(tipoFinal, configFinal);
    }
    
    Object.assign(campo, datos);
    return this.campoRepo.save(campo);
  }

  private validarConfigCampo(tipo: TipoInput, config?: ConfigCampo): void {
    if (!config) return;

    if (tipo === TipoInput.SELECTOR) {
      if (!config.opciones || config.opciones.length < 2) {
        throw new BadRequestException(
          'Un campo tipo selector debe tener al menos 2 opciones'
        );
      }
    }

    if (tipo === TipoInput.NUMERO) {
      if (config.min !== undefined && config.max !== undefined) {
        if (config.min >= config.max) {
          throw new BadRequestException(
            `El valor mínimo (${config.min}) debe ser menor al máximo (${config.max})`
          );
        }
      }
      if (config.decimales !== undefined && config.decimales < 0) {
        throw new BadRequestException('Los decimales no pueden ser negativos');
      }
    }

    // opciones no tiene sentido en campos que no sean selector
    if (tipo !== TipoInput.SELECTOR && config.opciones) {
      throw new BadRequestException(
        `Solo los campos tipo selector pueden tener opciones`
      );
    }
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