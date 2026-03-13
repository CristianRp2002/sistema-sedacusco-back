import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { CreateOperacionesDto } from './dto/create-operaciones.dto';
import { UpdateOperacionesDto } from './dto/update-operaciones.dto';

// ENTIDADES
import { ParteDiario } from './entities/parte-diario.entity';
import { DetalleBombeo } from './entities/detalle-bombeo.entity';
import { TurnoOperador } from './entities/turno-operador.entity';
import { VerificacionTablero } from './entities/verificacion-tablero.entity';

// Convierte string vacío a null — evita error "sintaxis inválida para tipo time: «»"
function nullIfEmpty(value: any): any {
  if (value === '' || value === undefined) return null;
  return value;
}

@Injectable()
export class OperacionesService {
  constructor(
    @InjectRepository(ParteDiario)
    private readonly parteDiarioRepository: Repository<ParteDiario>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * CREAR
   */
  async create(createOperacionesDto: CreateOperacionesDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { operadores, bombeos, tableros, estacion_id, ...datosParte } = createOperacionesDto;

      await this.validarContinuidad(estacion_id, datosParte.totalizador_inicial);

      const produccionCalculada = datosParte.totalizador_final - datosParte.totalizador_inicial;

      // ── Sanitizar campos TIME y opcionales antes de insertar ──
      const datosLimpios = {
        ...datosParte,
        // Campos TIME: si vienen vacíos deben ser null
        inicialHora_registro:    nullIfEmpty(datosParte.lectura_inicial?.hora_registro),
        finalHora_registro:      nullIfEmpty(datosParte.lectura_final?.hora_registro),
        // Campos numéricos opcionales
        nivel_cisterna_final:    nullIfEmpty(datosParte.nivel_cisterna_final),
        presion_linea_final:     nullIfEmpty(datosParte.presion_linea_final),
        // Tensiones opcionales
        llegadaFase_r: nullIfEmpty(datosParte.tension_llegada?.fase_R),
        llegadaFase_s: nullIfEmpty(datosParte.tension_llegada?.fase_S),
        llegadaFase_t: nullIfEmpty(datosParte.tension_llegada?.fase_T),
        tableroFase_r: nullIfEmpty(datosParte.tension_tablero?.fase_R),
        tableroFase_s: nullIfEmpty(datosParte.tension_tablero?.fase_S),
        tableroFase_t: nullIfEmpty(datosParte.tension_tablero?.fase_T),
        // Lecturas iniciales y finales
        inicialNivel_cisterna:        nullIfEmpty(datosParte.lectura_inicial?.nivel_cisterna),
        inicialPresion_linea:         nullIfEmpty(datosParte.lectura_inicial?.presion_linea),
        inicialPresion_jatun_huaylla: nullIfEmpty(datosParte.lectura_inicial?.presion_jatun_huaylla),
        inicialTotalizador:           nullIfEmpty(datosParte.lectura_inicial?.totalizador),
        finalNivel_cisterna:          nullIfEmpty(datosParte.lectura_final?.nivel_cisterna),
        finalPresion_linea:           nullIfEmpty(datosParte.lectura_final?.presion_linea),
        finalPresion_jatun_huaylla:   nullIfEmpty(datosParte.lectura_final?.presion_jatun_huaylla),
        finalTotalizador:             nullIfEmpty(datosParte.lectura_final?.totalizador),
        // Condiciones (strings opcionales)
        habilitacionEstado_telemetria: nullIfEmpty(datosParte.condicion_habilitacion?.estado_telemetria),
        habilitacionPresion_ingreso:   nullIfEmpty(datosParte.condicion_habilitacion?.presion_ingreso),
        desactivacionEstado_telemetria: nullIfEmpty(datosParte.condicion_desactivacion?.estado_telemetria),
        desactivacionPresion_ingreso:   nullIfEmpty(datosParte.condicion_desactivacion?.presion_ingreso),
      };

      const nuevoParte = queryRunner.manager.create(ParteDiario, {
        ...datosLimpios,
        produccion_calculada: produccionCalculada,
        estacion: { id: estacion_id } as any,
      });
      const parteGuardado = await queryRunner.manager.save(nuevoParte);

      if (operadores && operadores.length > 0) {
        const opEntities = operadores.map((op: any) =>
          queryRunner.manager.create(TurnoOperador, {
            nombre_operador: op.nombre_operador,
            turno: op.numero_turno.toString(),
            parteDiario: parteGuardado
          })
        );
        await queryRunner.manager.save(opEntities);
      }

      if (bombeos && bombeos.length > 0) {
        const bombeosEntities = bombeos.map(b => {
          const horas = this.calcularHoras(b.encendido, b.apagado);

          let fechaBase = '';
          if (typeof datosParte.fecha_folio === 'string') {
            fechaBase = datosParte.fecha_folio.substring(0, 10);
          } else {
            fechaBase = new Date(datosParte.fecha_folio).toISOString().substring(0, 10);
          }

          const fechaEncendido = new Date(`${fechaBase}T${b.encendido}:00`);
          const fechaApagado   = new Date(`${fechaBase}T${b.apagado}:00`);

          if (fechaApagado < fechaEncendido) {
            fechaApagado.setDate(fechaApagado.getDate() + 1);
          }

          return queryRunner.manager.create(DetalleBombeo, {
            encendido:         fechaEncendido,
            apagado:           fechaApagado,
            horometro_inicial: b.horometro_inicial,
            horometro_final:   b.horometro_final,
            bomba:             { id: b.bomba_id } as any,
            horas_bombeo:      horas,
            parteDiario:       parteGuardado
          });
        });
        await queryRunner.manager.save(bombeosEntities);
      }

      if (tableros && tableros.length > 0) {
        const tabEntities = tableros.map(t =>
          queryRunner.manager.create(VerificacionTablero, {
            momento:                    t.momento,
            interruptor_estado:         nullIfEmpty(t.interruptor_estado),
            selector_estado:            nullIfEmpty(t.selector_estado),
            parada_emergencia_estado:   nullIfEmpty(t.parada_emergencia_estado),
            variador_estado:            nullIfEmpty(t.variador_estado),
            alarma_estado:              nullIfEmpty(t.alarma_estado),
            tablero:                    { id: t.tablero_id } as any,
            parteDiario:                parteGuardado
          })
        );
        await queryRunner.manager.save(tabEntities);
      }

      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message: 'Parte Diario creado exitosamente',
        data: parteGuardado
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error al crear el registro: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * LISTAR CON FILTROS
   */
  async findAll(filtros?: { mes?: string; anio?: string; estacionId?: string }) {
    const where: any = {};

    if (filtros?.mes && filtros?.anio) {
      const mes  = parseInt(filtros.mes);
      const anio = parseInt(filtros.anio);
      where.fecha_folio = Between(
        new Date(anio, mes - 1, 1),
        new Date(anio, mes, 0, 23, 59, 59)
      );
    } else if (filtros?.anio) {
      const anio = parseInt(filtros.anio);
      where.fecha_folio = Between(
        new Date(anio, 0, 1),
        new Date(anio, 11, 31, 23, 59, 59)
      );
    }

    if (filtros?.estacionId) {
      where.estacion = { id: filtros.estacionId };
    }

    return await this.parteDiarioRepository.find({
      where,
      relations: [
        'operadores',
        'detallesBombeo',
        'detallesBombeo.bomba',
        'verificacionesTablero',
        'verificacionesTablero.tablero',
        'estacion'
      ],
      order: { fecha_folio: 'DESC' }
    });
  }

  /**
   * BUSCAR POR ID
   */
  async findOne(id: string) {
    const registro = await this.parteDiarioRepository.findOne({
      where: { id },
      relations: [
        'operadores',
        'detallesBombeo',
        'detallesBombeo.bomba',
        'verificacionesTablero',
        'verificacionesTablero.tablero',
        'estacion'
      ]
    });

    if (!registro) throw new NotFoundException(`El Parte Diario con ID ${id} no existe`);
    return registro;
  }

  /**
   * ACTUALIZAR
   */
  async update(id: string, updateOperacionesDto: UpdateOperacionesDto) {
    await this.findOne(id);
    const { operadores, bombeos, tableros, ...datosAActualizar } = updateOperacionesDto;

    try {
      const parteActualizado = await this.parteDiarioRepository.preload({
        id,
        ...datosAActualizar,
      });

      if (!parteActualizado) throw new NotFoundException(`No se pudo encontrar el registro ${id}`);
      return await this.parteDiarioRepository.save(parteActualizado);
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar: ' + error.message);
    }
  }

  /**
   * ELIMINAR
   */
  async remove(id: string) {
    const registro = await this.findOne(id);
    await this.parteDiarioRepository.remove(registro);
    return { message: `Registro ${id} eliminado correctamente` };
  }

  // ── MÉTODOS PRIVADOS ──

  private calcularHoras(inicio: string, fin: string): number {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);

    let totalInicio = h1 * 60 + m1;
    let totalFin    = h2 * 60 + m2;

    if (totalFin < totalInicio) totalFin += 24 * 60;

    return (totalFin - totalInicio) / 60;
  }

  private async validarContinuidad(estacionId: string, totalizadorInicialHoy: number) {
    const ultimoParte = await this.parteDiarioRepository.findOne({
      where: { estacion: { id: estacionId } },
      order: { fecha_folio: 'DESC' },
    });

    if (ultimoParte) {
      const finalAyer = Number(ultimoParte.totalizador_final);
      if (finalAyer !== totalizadorInicialHoy) {
        throw new BadRequestException(
          `Discrepancia de totalizador: El final de ayer fue ${finalAyer}, pero hoy envían ${totalizadorInicialHoy}.`
        );
      }
    }
  }
}