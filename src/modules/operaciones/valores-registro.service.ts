import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValorRegistro } from './entities/valor-registro.entity';
import { CampoTipoActivo } from './entities/campo-tipo-activo.entity';
import { Activo } from './entities/activo.entity';

@Injectable()
export class ValoresRegistroService {
  constructor(
    @InjectRepository(ValorRegistro)
    private readonly valorRepo: Repository<ValorRegistro>,

    @InjectRepository(CampoTipoActivo)
    private readonly campoRepo: Repository<CampoTipoActivo>,

    @InjectRepository(Activo)
    private readonly activoRepo: Repository<Activo>,
  ) {}

  // Guarda todos los valores de un parte diario de una sola vez
  async guardarBulk(datos: {
    parte_diario_id: string;
    valores: {
      activo_id: string;
      campo_id: string;
      valor: string;
    }[];
  }): Promise<ValorRegistro[]> {

    // Validar que los campos requeridos estén llenos
    await this.validarRequeridos(datos.valores);

    // Eliminar valores anteriores del mismo parte — por si es una edición
    await this.valorRepo.delete({ parte_diario_id: datos.parte_diario_id });

    // Crear y guardar los nuevos valores
    const entidades = datos.valores
      .filter(v => v.valor !== null && v.valor !== undefined && v.valor !== '')
      .map(v =>
        this.valorRepo.create({
          parte_diario_id: datos.parte_diario_id,
          activo_id:       v.activo_id,
          campo_id:        v.campo_id,
          valor:           v.valor,
        })
      );

    return this.valorRepo.save(entidades);
  }

  // Obtiene todos los valores de un parte diario agrupados por activo
  async getByParte(parteDiarioId: string): Promise<any[]> {
    const valores = await this.valorRepo.find({
      where: { parte_diario_id: parteDiarioId },
      relations: ['activo', 'activo.tipoActivo', 'campo'],
      order: { activo_id: 'ASC' },
    });

    // Agrupar por activo para facilitar el trabajo en el frontend
    const agrupado = new Map<string, any>();

    for (const v of valores) {
      const key = v.activo_id;
      if (!agrupado.has(key)) {
        agrupado.set(key, {
          activo:  v.activo,
          valores: [],
        });
      }
      agrupado.get(key).valores.push({
        campo_id:    v.campo_id,
        campo:       v.campo,
        valor:       v.valor,
      });
    }

    return Array.from(agrupado.values());
  }

  // Obtiene el historial de un activo — útil para reportes
  async getHistorialActivo(activoId: string, limit = 30): Promise<any[]> {
    return this.valorRepo.find({
      where: { activo_id: activoId },
      relations: ['campo', 'parteDiario'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  // ── PRIVADOS ──────
  private async validarRequeridos(valores: {
    activo_id: string;
    campo_id:  string;
    valor:     string;
  }[]): Promise<void> {
    const campoIds = valores.map(v => v.campo_id);
    if (campoIds.length === 0) return;

    const campos = await this.campoRepo
      .createQueryBuilder('c')
      .where('c.id IN (:...ids)', { ids: campoIds })
      .getMany();

    for (const campo of campos) {
      const envio = valores.find(v => v.campo_id === campo.id);
      const valor = envio?.valor;

      // 1. Validar requerido
      if (campo.requerido && (!valor || valor === '')) {
        throw new BadRequestException(
          `El campo "${campo.etiqueta}" es requerido y no tiene valor`
        );
      }

      if (!valor || valor === '') continue; // vacío pero no requerido → ok

      // 2. Validar rangos para números
      if (campo.tipo_input === 'numero' && campo.config) {
        const num = parseFloat(valor);
        if (isNaN(num)) {
          throw new BadRequestException(
            `El campo "${campo.etiqueta}" debe ser un número`
          );
        }
        if (campo.config.min !== undefined && num < campo.config.min) {
          throw new BadRequestException(
            `"${campo.etiqueta}" no puede ser menor a ${campo.config.min}${campo.unidad ? ' ' + campo.unidad : ''}`
          );
        }
        if (campo.config.max !== undefined && num > campo.config.max) {
          throw new BadRequestException(
            `"${campo.etiqueta}" no puede ser mayor a ${campo.config.max}${campo.unidad ? ' ' + campo.unidad : ''}`
          );
        }
      }

      // 3. Validar que el valor esté entre las opciones del selector
      if (campo.tipo_input === 'selector' && campo.config?.opciones) {
        if (!campo.config.opciones.includes(valor)) {
          throw new BadRequestException(
            `"${campo.etiqueta}": valor inválido. Opciones: ${campo.config.opciones.join(', ')}`
          );
        }
      }
    }
  }
}