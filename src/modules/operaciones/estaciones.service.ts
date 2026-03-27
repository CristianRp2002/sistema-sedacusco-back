import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estacion } from './entities/estacion.entity';
import { Bomba } from './entities/bomba.entity';
import { Tablero } from './entities/tablero.entity';
import { DetalleBombeo } from './entities/detalle-bombeo.entity';
import { ParteDiario } from './entities/parte-diario.entity';

@Injectable()
export class EstacionesService {
  constructor(
    @InjectRepository(Estacion) private readonly estacionRepo: Repository<Estacion>,
    @InjectRepository(Bomba) private readonly bombaRepo: Repository<Bomba>,
    @InjectRepository(Tablero) private readonly tableroRepo: Repository<Tablero>,
    @InjectRepository(DetalleBombeo) private readonly registroRepo: Repository<DetalleBombeo>,
    @InjectRepository(ParteDiario) private readonly parteDiarioRepo: Repository<ParteDiario>, 
  ) {}

  // ── LOGICA DE ESTACIONES ──
  async findAll() {
    const estaciones = await this.estacionRepo.find({ 
      relations: [
        'bombas', 
        'tableros',
        'activos',
        'activos.tipoActivo',
        'activos.tipoActivo.campos',
      ] 
    });

    for (const estacion of estaciones) {
      const ultimoParte = await this.parteDiarioRepo.findOne({
        where: { estacion: { id: estacion.id } },
        order: { fecha_folio: 'DESC' },
      });

      (estacion as any).ultimo_totalizador = ultimoParte ? Number(ultimoParte.totalizador_final) : null;

      if (estacion.bombas) {
        for (const bomba of estacion.bombas) {
          const ultimoRegistro = await this.registroRepo.findOne({
            where: { bomba: { id: bomba.id } },  
            order: { id: 'DESC' },        
          });
          (bomba as any).ultimo_horometro = ultimoRegistro ? ultimoRegistro.horometro_final : 0;
        }
      }
    }
    return estaciones;
  }

  crear(body: { nombre: string }) {
    const estacion = this.estacionRepo.create(body);
    return this.estacionRepo.save(estacion);
  }

  actualizar(id: string, body: { nombre: string }) {
    return this.estacionRepo.update(id, body);
  }

  eliminar(id: string) {
    return this.estacionRepo.delete(id);
  }

  // ── LOGICA DE BOMBAS ──
  crearBomba(estacionId: string, body: { nombre: string, numero_serie: string, tipo: string, activa: boolean }) {
    const bomba = this.bombaRepo.create({
      ...body,
      activa: body.activa ?? true,
      estacion: { id: estacionId } as any
    });
    return this.bombaRepo.save(bomba);
  }

  actualizarBomba(id: string, body: any) {
    return this.bombaRepo.update(id, body);
  }

  eliminarBomba(id: string) {
    return this.bombaRepo.delete(id);
  }

  // ── LOGICA DE TABLEROS ──
  crearTablero(estacionId: string, body: { nombre: string, tipo: string }) {
    const tablero = this.tableroRepo.create({
      ...body,
      estacion: { id: estacionId } as any
    });
    return this.tableroRepo.save(tablero);
  }

  actualizarTablero(id: string, body: any) {
    return this.tableroRepo.update(id, body);
  }

  eliminarTablero(id: string) {
    return this.tableroRepo.delete(id);
  }
}