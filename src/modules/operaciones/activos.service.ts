import { 
  Injectable, 
  NotFoundException, 
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Activo } from './entities/activo.entity';
import { TipoActivo } from './entities/tipo-activo.entity';

@Injectable()
export class ActivosService {
  constructor(
    @InjectRepository(Activo)
    private readonly activoRepo: Repository<Activo>,

    @InjectRepository(TipoActivo)
    private readonly tipoActivoRepo: Repository<TipoActivo>,
  ) {}
  
  getTipos(): Promise<TipoActivo[]> {
    return this.tipoActivoRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  getByEstacion(estacionId: string): Promise<Activo[]> {
    return this.activoRepo.find({
      where: { estacion_id: estacionId, activo: true },
      relations: ['tipoActivo', 'tipoActivo.campos'],
      order: { orden: 'ASC' },
    });
  }

  async crear(datos: any): Promise<any> {
    const activo = this.activoRepo.create(datos);
    return this.activoRepo.save(activo);
  }

  async actualizar(id: string, datos: Partial<Activo>): Promise<Activo> {
    const activo = await this.obtenerActivoOValidar(id);
    Object.assign(activo, datos);
    return this.activoRepo.save(activo);
  }

  async desactivar(id: string): Promise<{ message: string }> {
    const activo = await this.obtenerActivoOValidar(id);
    activo.activo = false;
    await this.activoRepo.save(activo);
    return { message: `Activo ${activo.nombre} desactivado` };
  }

  async crearTipo(datos: { nombre: string; codigo: string }): Promise<TipoActivo> {
    // 1. Validamos reglas de negocio antes de hacer nada
    await this.validarCodigoDisponible(datos.codigo);

    // 2. Ejecutamos la acción
    const tipo = this.tipoActivoRepo.create({ ...datos, activo: true });
    return this.tipoActivoRepo.save(tipo);
  }

  async actualizarTipo(id: string, datos: { nombre: string; codigo: string }): Promise<TipoActivo> {
    // 1. Obtenemos la entidad (falla automáticamente si no existe)
    const tipo = await this.obtenerTipoOValidar(id);
    
    // 2. Validamos el código solo si lo están intentando cambiar
    if (datos.codigo && datos.codigo !== tipo.codigo) {
      await this.validarCodigoDisponible(datos.codigo, id);
    }

    // 3. Ejecutamos la acción
    Object.assign(tipo, datos);
    return this.tipoActivoRepo.save(tipo);
  }

  async eliminarTipo(id: string): Promise<{ message: string }> {
    const tipo = await this.obtenerTipoOValidar(id);
    tipo.activo = false;
    await this.tipoActivoRepo.save(tipo);
    return { message: `Tipo ${tipo.nombre} eliminado` };
  }

  private async validarCodigoDisponible(codigo: string, excludeId?: string): Promise<void> {
    const query = excludeId 
      ? { codigo, id: Not(excludeId) } 
      : { codigo };

    const existe = await this.tipoActivoRepo.findOne({ where: query });
    
    if (existe) {
      throw new ConflictException(`El código "${codigo}" ya está registrado en el sistema. Por favor, utiliza uno diferente.`);
    }
  }

  private async obtenerTipoOValidar(id: string): Promise<TipoActivo> {
    const tipo = await this.tipoActivoRepo.findOne({ where: { id } });
    if (!tipo) {
      throw new NotFoundException(`El Tipo de Activo con ID ${id} no fue encontrado.`);
    }
    return tipo;
  }

  private async obtenerActivoOValidar(id: string): Promise<Activo> {
    const activo = await this.activoRepo.findOne({ where: { id } });
    if (!activo) {
      throw new NotFoundException(`El Activo con ID ${id} no fue encontrado.`);
    }
    return activo;
  }
}