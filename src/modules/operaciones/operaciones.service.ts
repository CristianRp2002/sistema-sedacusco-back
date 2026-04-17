import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, QueryRunner } from 'typeorm';
import { CreateOperacionesDto } from './dto/create-operaciones.dto';
import { UpdateOperacionesDto } from './dto/update-operaciones.dto';

// Entidades
import { ParteDiario } from './entities/parte-diario.entity';
import { DetalleBombeo } from './entities/detalle-bombeo.entity';
import { TurnoOperador } from './entities/turno-operador.entity';

import { VerificacionTablero } from './entities/verificacion-tablero.entity'; 
import { RegistroActivo } from './entities/registro-activo.entity';           
import { ValorRegistro } from './entities/valor-registro.entity';             

// UTILIDADES

function nullIfEmpty(value: any): any {
  if (value === '' || value === undefined) return null;
  return value;
}

/**
 * ALGORITMO PARA HORÓMETROS
 */
interface HorometroDiario {
  horometro_inicial: number;
  horometro_final: number;
  dias_horas_ini?: number;
  dias_horas_fin?: number;
}

function calcularHorasBombeoConSaltoDia(
  horometro_inicial: number,
  horometro_final: number,
  diasHorasIni?: number,
  diasHorasFin?: number
): { horas: number; requiereAlerta: boolean } {
  const MAX_HOROMETRO = 9999;
  let horas = 0;
  let requiereAlerta = false;

  if (horometro_final >= horometro_inicial) {
    horas = horometro_final - horometro_inicial;
  } else {
    // SALTO DE DÍA: horómetro reinició (9999 → 0)
    horas = horometro_final + (MAX_HOROMETRO - horometro_inicial);
    requiereAlerta = true;
  }

  return { horas, requiereAlerta };
}

// SERVICIO

@Injectable()
export class OperacionesService {
  constructor(
    @InjectRepository(ParteDiario)
    private readonly parteDiarioRepository: Repository<ParteDiario>,
    private readonly dataSource: DataSource,
  ) {}

  async verificarParteExistente(estacionId: string, fecha: string | Date) {
    const fechaStr =
      fecha instanceof Date
        ? fecha.toISOString().substring(0, 10)
        : fecha.substring(0, 10);

    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    
    const inicioDiaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')} 00:00:00`;
    const finDiaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')} 23:59:59`;

    const parteExistente = await this.parteDiarioRepository.findOne({
      where: {
        estacion: { id: estacionId },
        fecha_folio: Between(inicioDiaStr, finDiaStr) as any,
      },
    });

    if (parteExistente) {
      return {
        existe: true,
        parte: {
          id: parteExistente.id,
          cambios_realizados: parteExistente.cambios_realizados || 0,
          fecha_folio: parteExistente.fecha_folio,
        },
      };
    }

    return { existe: false };
  }

  // CREAR CON TRANSACCIÓN COMPLETA
  async create(createOperacionesDto: CreateOperacionesDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const {
        operadores,
        bombeos,
        tableros,
        registros_activo,
        estacion_id,
        ...datosParte
      } = createOperacionesDto;

      // ✅ VALIDACIÓN: Verificar si ya existe un parte para hoy
      const verificacion = await this.verificarParteExistente(
        estacion_id,
        datosParte.fecha_folio
      );

      if (verificacion.existe) {
        throw new BadRequestException(
          `❌ Ya existe un parte diario para esta estación en la fecha ${datosParte.fecha_folio}. ` +
          `Solo se permite un parte por estación por día. ` +
          `Si deseas modificarlo, edita el parte existente (ID: ${verificacion.parte?.id}).`
        );
      }

      // 1. VALIDACIÓN PREVIA
      const totalizadorParaValidar =
        datosParte.totalizador_general_ini ?? datosParte.totalizador_inicial;

      await this.validarContinuidadRobusta(
        estacion_id,
        totalizadorParaValidar,
        datosParte.fecha_folio,
        queryRunner
      );

      // 2. CÁLCULO DE PRODUCCIÓN
      const produccionCalculada =
        datosParte.totalizador_final - datosParte.totalizador_inicial;

      // 3. SANITIZACIÓN DE DATOS
      const datosLimpios = {
        ...datosParte,
        inicialHora_registro:           nullIfEmpty(datosParte.lectura_inicial?.hora_registro),
        finalHora_registro:             nullIfEmpty(datosParte.lectura_final?.hora_registro),
        nivel_cisterna_final:           nullIfEmpty(datosParte.nivel_cisterna_final),
        presion_linea_final:            nullIfEmpty(datosParte.presion_linea_final),
        llegadaFase_r:                  nullIfEmpty(datosParte.tension_llegada?.fase_R),
        llegadaFase_s:                  nullIfEmpty(datosParte.tension_llegada?.fase_S),
        llegadaFase_t:                  nullIfEmpty(datosParte.tension_llegada?.fase_T),
        tableroFase_r:                  nullIfEmpty(datosParte.tension_tablero?.fase_R),
        tableroFase_s:                  nullIfEmpty(datosParte.tension_tablero?.fase_S),
        tableroFase_t:                  nullIfEmpty(datosParte.tension_tablero?.fase_T),
        inicialNivel_cisterna:          nullIfEmpty(datosParte.lectura_inicial?.nivel_cisterna),
        inicialPresion_linea:           nullIfEmpty(datosParte.lectura_inicial?.presion_linea),
        inicialPresion_jatun_huaylla:   nullIfEmpty(datosParte.lectura_inicial?.presion_jatun_huaylla),
        inicialTotalizador:             nullIfEmpty(datosParte.lectura_inicial?.totalizador),
        finalNivel_cisterna:            nullIfEmpty(datosParte.lectura_final?.nivel_cisterna),
        finalPresion_linea:             nullIfEmpty(datosParte.lectura_final?.presion_linea),
        finalPresion_jatun_huaylla:     nullIfEmpty(datosParte.lectura_final?.presion_jatun_huaylla),
        finalTotalizador:               nullIfEmpty(datosParte.lectura_final?.totalizador),
        habilitacionEstado_telemetria:  nullIfEmpty(datosParte.condicion_habilitacion?.estado_telemetria),
        habilitacionPresion_ingreso:    nullIfEmpty(datosParte.condicion_habilitacion?.presion_ingreso),
        desactivacionEstado_telemetria: nullIfEmpty(datosParte.condicion_desactivacion?.estado_telemetria),
        desactivacionPresion_ingreso:   nullIfEmpty(datosParte.condicion_desactivacion?.presion_ingreso),
        kv_rs:                          nullIfEmpty(datosParte.kv_rs),
        kv_st:                          nullIfEmpty(datosParte.kv_st),
        kv_tr:                          nullIfEmpty(datosParte.kv_tr),
        presion_tanque_ariete_ini:      nullIfEmpty(datosParte.presion_tanque_ariete_ini),
        presion_tanque_ariete_fin:      nullIfEmpty(datosParte.presion_tanque_ariete_fin),
        produccion_total_m3:            nullIfEmpty(datosParte.produccion_total_m3),
        horas_bombeo_total:             nullIfEmpty(datosParte.horas_bombeo_total),
        cloro_total_kg:                 nullIfEmpty(datosParte.cloro_total_kg),
        totalizador_general_ini:        nullIfEmpty(datosParte.totalizador_general_ini),
        totalizador_general_fin:        nullIfEmpty(datosParte.totalizador_general_fin),
        fecha_hasta:                    nullIfEmpty(datosParte.fecha_hasta),
      };

      // 4. CREAR Y GUARDAR PARTE DIARIO
      const nuevoParte = queryRunner.manager.create(ParteDiario, {
        ...datosLimpios,
        produccion_calculada: produccionCalculada,
        estacion: { id: estacion_id } as any,
      });
      const parteGuardado = await queryRunner.manager.save(ParteDiario, nuevoParte);

      // 5. GUARDAR OPERADORES
      if (operadores?.length > 0) {
        const opEntities = operadores.map((op) =>
          queryRunner.manager.create(TurnoOperador, {
            nombre_operador:     op.nombre_operador,
            turno:               op.numero_turno.toString(),
            horas_trabajadas:    nullIfEmpty(op.horas_trabajadas),
            horas_bombeo:        nullIfEmpty(op.horas_bombeo),
            produccion_turno_m3: nullIfEmpty(op.produccion_turno_m3),
            parteDiario:         parteGuardado,
          })
        );
        await queryRunner.manager.save(opEntities);
      }

      // 6. GUARDAR BOMBEOS CON ALGORITMO "SALTO DE DÍA"
      if (bombeos?.length > 0) {
        const fechaBase =
          typeof datosParte.fecha_folio === 'string'
            ? datosParte.fecha_folio.substring(0, 10)
            : new Date(datosParte.fecha_folio).toISOString().substring(0, 10);

        const bombeosEntities = bombeos.map((b) => {
          const { horas, requiereAlerta } = calcularHorasBombeoConSaltoDia(
            Number(b.horometro_inicial),
            Number(b.horometro_final),
            b.dias_horas_ini ? Number(b.dias_horas_ini) : undefined,
            b.dias_horas_fin ? Number(b.dias_horas_fin) : undefined
          );

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
            horas_bombeo:      horas,
            observacion:       nullIfEmpty(b.observacion),
            numero_ciclo:      nullIfEmpty(b.numero_ciclo),
            dias_horas_ini:    nullIfEmpty(b.dias_horas_ini),
            dias_horas_fin:    nullIfEmpty(b.dias_horas_fin),
            estado_inicio:     nullIfEmpty(b.estado_inicio),
            estado_final:      nullIfEmpty(b.estado_final),
            requiere_revision: requiereAlerta,
            bomba:             { id: b.bomba_id } as any,
            parteDiario:       parteGuardado,
          });
        });

        await queryRunner.manager.save(bombeosEntities);
      }

      // 7. GUARDAR VERIFICACIONES DE TABLERO
      if (tableros?.length > 0) {
        const tabEntities = tableros.map((t) =>
          queryRunner.manager.create(VerificacionTablero, {
            momento:                  t.momento,
            interruptor_estado:       nullIfEmpty(t.interruptor_estado),
            selector_estado:          nullIfEmpty(t.selector_estado),
            parada_emergencia_estado: nullIfEmpty(t.parada_emergencia_estado),
            variador_estado:          nullIfEmpty(t.variador_estado),
            alarma_estado:            nullIfEmpty(t.alarma_estado),
            tablero:                  { id: t.tablero_id } as any,
            parteDiario:              parteGuardado,
          })
        );
        await queryRunner.manager.save(tabEntities);
      }

      // 8. GUARDAR REGISTROS DE ACTIVOS
      if (Array.isArray(registros_activo) && registros_activo.length > 0) {
        const registros = registros_activo.map((r) =>
          queryRunner.manager.create(ValorRegistro, {
            ...r,
            parte_diario_id: parteGuardado.id,
          })
        );
        await queryRunner.manager.save(registros);
      }

      await queryRunner.commitTransaction();

      return {
        status:  'success',
        message: 'Parte Diario creado exitosamente',
        data:    parteGuardado,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error;
      console.error('❌ Error en transacción create():', error);
      throw new InternalServerErrorException(
        'Error al crear el registro: ' + error.message
      );
    } finally {
      await queryRunner.release();
    }
  }

  // ACTUALIZAR CON TRANSACCIÓN
  async update(id: string, updateOperacionesDto: UpdateOperacionesDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const parteExistente = await queryRunner.manager.findOne(ParteDiario, {
        where: { id },
        relations: ['estacion'],
      });

      if (!parteExistente) {
        throw new NotFoundException(`El Parte Diario con ID ${id} no existe`);
      }

      // ✅ VALIDACIÓN: Verificar límite de cambios (máximo 3)
      const LIMITE_CAMBIOS = 3;
      const cambiosActuales = parteExistente.cambios_realizados || 0;

      if (cambiosActuales >= LIMITE_CAMBIOS) {
        throw new BadRequestException(
          `❌ Has alcanzado el límite de ${LIMITE_CAMBIOS} cambios permitidos por día. ` +
          `No se pueden realizar más modificaciones a este parte diario.`
        );
      }

      const {
        operadores,
        bombeos,
        tableros,
        registros_activo,
        estacion_id,
        ...datosAActualizar
      } = updateOperacionesDto;

      // Validar continuidad si se modifica el totalizador_inicial
      if (datosAActualizar.totalizador_inicial !== undefined) {
        const totalizadorParaValidar =
          datosAActualizar.totalizador_general_ini ?? datosAActualizar.totalizador_inicial;

        const fechaValidacion = datosAActualizar.fecha_folio ?? parteExistente.fecha_folio;

        await this.validarContinuidadRobusta(
          estacion_id ?? parteExistente.estacion.id,
          totalizadorParaValidar,
          fechaValidacion,
          queryRunner
        );
      }

      // SANITIZAR DATOS
      const datosLimpios = {
        ...datosAActualizar,
        nivel_cisterna_final:           nullIfEmpty(datosAActualizar.nivel_cisterna_final),
        presion_linea_final:            nullIfEmpty(datosAActualizar.presion_linea_final),
        inicialHora_registro:           nullIfEmpty(datosAActualizar.lectura_inicial?.hora_registro),
        finalHora_registro:             nullIfEmpty(datosAActualizar.lectura_final?.hora_registro),
        llegadaFase_r:                  nullIfEmpty(datosAActualizar.tension_llegada?.fase_R),
        llegadaFase_s:                  nullIfEmpty(datosAActualizar.tension_llegada?.fase_S),
        llegadaFase_t:                  nullIfEmpty(datosAActualizar.tension_llegada?.fase_T),
        tableroFase_r:                  nullIfEmpty(datosAActualizar.tension_tablero?.fase_R),
        tableroFase_s:                  nullIfEmpty(datosAActualizar.tension_tablero?.fase_S),
        tableroFase_t:                  nullIfEmpty(datosAActualizar.tension_tablero?.fase_T),
        kv_rs:                          nullIfEmpty(datosAActualizar.kv_rs),
        kv_st:                          nullIfEmpty(datosAActualizar.kv_st),
        kv_tr:                          nullIfEmpty(datosAActualizar.kv_tr),
        presion_tanque_ariete_ini:      nullIfEmpty(datosAActualizar.presion_tanque_ariete_ini),
        presion_tanque_ariete_fin:      nullIfEmpty(datosAActualizar.presion_tanque_ariete_fin),
        produccion_total_m3:            nullIfEmpty(datosAActualizar.produccion_total_m3),
        horas_bombeo_total:             nullIfEmpty(datosAActualizar.horas_bombeo_total),
        cloro_total_kg:                 nullIfEmpty(datosAActualizar.cloro_total_kg),
        totalizador_general_ini:        nullIfEmpty(datosAActualizar.totalizador_general_ini),
        totalizador_general_fin:        nullIfEmpty(datosAActualizar.totalizador_general_fin),
        fecha_hasta:                    nullIfEmpty(datosAActualizar.fecha_hasta),
      };

      // ACTUALIZAR PARTE PRINCIPAL
      const parteActualizado = await queryRunner.manager.preload(ParteDiario, {
        id,
        ...datosLimpios,
      });

      if (!parteActualizado) {
        throw new NotFoundException(`No se encontró el registro ${id}`);
      }

      const parteSaved = await queryRunner.manager.save(ParteDiario, parteActualizado);

      // ACTUALIZAR OPERADORES
      if (Array.isArray(operadores) && operadores.length > 0) {
        await queryRunner.manager.delete(TurnoOperador, { parteDiario: { id } });

        const opEntities = operadores.map((op) =>
          queryRunner.manager.create(TurnoOperador, {
            nombre_operador:     op.nombre_operador,
            turno:               op.numero_turno.toString(),
            horas_trabajadas:    nullIfEmpty(op.horas_trabajadas),
            horas_bombeo:        nullIfEmpty(op.horas_bombeo),
            produccion_turno_m3: nullIfEmpty(op.produccion_turno_m3),
            parteDiario:         parteSaved,
          })
        );
        await queryRunner.manager.save(opEntities);
      }

      // ACTUALIZAR BOMBEOS
      if (Array.isArray(bombeos) && bombeos.length > 0) {
        await queryRunner.manager.delete(DetalleBombeo, { parteDiario: { id } });

        const fechaBase = datosAActualizar.fecha_folio
          ? (typeof datosAActualizar.fecha_folio === 'string'
              ? datosAActualizar.fecha_folio.substring(0, 10)
              : new Date(datosAActualizar.fecha_folio).toISOString().substring(0, 10))
          : new Date(parteExistente.fecha_folio).toISOString().substring(0, 10);

        const bombeosEntities = bombeos.map((b) => {
          const { horas, requiereAlerta } = calcularHorasBombeoConSaltoDia(
            Number(b.horometro_inicial),
            Number(b.horometro_final),
            b.dias_horas_ini ? Number(b.dias_horas_ini) : undefined,
            b.dias_horas_fin ? Number(b.dias_horas_fin) : undefined
          );

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
            horas_bombeo:      horas,
            observacion:       nullIfEmpty(b.observacion),
            numero_ciclo:      nullIfEmpty(b.numero_ciclo),
            dias_horas_ini:    nullIfEmpty(b.dias_horas_ini),
            dias_horas_fin:    nullIfEmpty(b.dias_horas_fin),
            estado_inicio:     nullIfEmpty(b.estado_inicio),
            estado_final:      nullIfEmpty(b.estado_final),
            requiere_revision: requiereAlerta,
            bomba:             { id: b.bomba_id } as any,
            parteDiario:       parteSaved,
          });
        });

        await queryRunner.manager.save(bombeosEntities);
      }

      // ACTUALIZAR TABLEROS
      if (Array.isArray(tableros) && tableros.length > 0) {
        await queryRunner.manager.delete(VerificacionTablero, { parteDiario: { id } });

        const tabEntities = tableros.map((t) =>
          queryRunner.manager.create(VerificacionTablero, {
            momento:                  t.momento,
            interruptor_estado:       nullIfEmpty(t.interruptor_estado),
            selector_estado:          nullIfEmpty(t.selector_estado),
            parada_emergencia_estado: nullIfEmpty(t.parada_emergencia_estado),
            variador_estado:          nullIfEmpty(t.variador_estado),
            alarma_estado:            nullIfEmpty(t.alarma_estado),
            tablero:                  { id: t.tablero_id } as any,
            parteDiario:              parteSaved,
          })
        );
        await queryRunner.manager.save(tabEntities);
      }

      // ACTUALIZAR REGISTROS DE ACTIVOS
      if (Array.isArray(registros_activo) && registros_activo.length > 0) {
        await queryRunner.manager.delete(RegistroActivo, { parte_diario_id: id });

        const registros = registros_activo.map((r) =>
          queryRunner.manager.create(RegistroActivo, {
            ...r,
            parte_diario_id: parteSaved.id,
          })
        );
        await queryRunner.manager.save(registros);
      }

      // ✅ INCREMENTAR CONTADOR DE CAMBIOS
      parteSaved.cambios_realizados = cambiosActuales + 1;
      await queryRunner.manager.save(ParteDiario, parteSaved);

      await queryRunner.commitTransaction();

      return {
        status:  'success',
        message: `Parte Diario actualizado exitosamente (Cambio ${parteSaved.cambios_realizados}/${LIMITE_CAMBIOS})`,
        data:    parteSaved,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Error en transacción update():', error);
      throw new InternalServerErrorException(
        'Error al actualizar: ' + error.message
      );
    } finally {
      await queryRunner.release();
    }
  }

  // ELIMINAR CON VALIDACIÓN DE INTEGRIDAD
  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const registro = await queryRunner.manager.findOne(ParteDiario, {
        where: { id },
        relations: [
          'operadores',
          'detallesBombeo',
          'verificacionesTablero',
          'registrosActivo',
        ],
      });

      if (!registro) {
        throw new NotFoundException(`El Parte Diario con ID ${id} no existe`);
      }

      await queryRunner.manager.remove(registro);
      await queryRunner.commitTransaction();

      return {
        status:  'success',
        message: `Parte Diario ${id} eliminado correctamente`,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Error en transacción remove():', error);
      throw new InternalServerErrorException(
        'Error al eliminar: ' + error.message
      );
    } finally {
      await queryRunner.release();
    }
  }

  // LISTAR CON FILTROS
  async findAll(filtros?: { mes?: string; anio?: string; estacionId?: string }) {
    const where: any = {};

    if (filtros?.mes && filtros?.anio) {
      const mes = filtros.mes.padStart(2, '0');
      const anio = filtros.anio;
      const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();

      where.fecha_folio = Between(`${anio}-${mes}-01`, `${anio}-${mes}-${ultimoDia}`);
    } else if (filtros?.anio) {
      const anio = filtros.anio;
      where.fecha_folio = Between(`${anio}-01-01`, `${anio}-12-31`);
    }

    if (filtros?.estacionId) {
      where.estacion = { id: filtros.estacionId };
    }

    return this.parteDiarioRepository.find({
      where,
      relations: [
        'operadores',
        'detallesBombeo',
        'detallesBombeo.bomba',
        'verificacionesTablero',
        'verificacionesTablero.tablero',
        'estacion',
        'registrosActivo',
        'registrosActivo.activo',
        'registrosActivo.activo.tipoActivo',
      ],
      order: { fecha_folio: 'DESC' },
    });
  }

  // BUSCAR POR ID
  async findOne(id: string) {
    const registro = await this.parteDiarioRepository.findOne({
      where: { id },
      relations: [
        'operadores',
        'detallesBombeo',
        'detallesBombeo.bomba',
        'verificacionesTablero',
        'verificacionesTablero.tablero',
        'estacion',
        'registrosActivo',
        'registrosActivo.activo',
        'registrosActivo.activo.tipoActivo',
        'valoresRegistro',
        'valoresRegistro.activo',
        'valoresRegistro.campo',
      ],
    });

    if (!registro) {
      throw new NotFoundException(`El Parte Diario con ID ${id} no existe`);
    }

    return registro;
  }

  // MÉTODOS PRIVADOS

  /**
   * VALIDACIÓN DE CONTINUIDAD HÍDRICA
   */
  private async validarContinuidadRobusta(
    estacionId: string,
    totalizadorInicialHoy: number,
    fechaHoy: string | Date,
    queryRunner: QueryRunner
  ): Promise<void> {
    const fechaStr =
      fechaHoy instanceof Date
        ? fechaHoy.toISOString().substring(0, 10)
        : fechaHoy.substring(0, 10);

    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const fecha     = new Date(anio, mes - 1, dia);
    const fechaAyer = new Date(anio, mes - 1, dia - 1);

    try {
      const inicioDiaAyerStr = `${fechaAyer.getFullYear()}-${String(fechaAyer.getMonth() + 1).padStart(2, '0')}-${String(fechaAyer.getDate()).padStart(2, '0')} 00:00:00`;
      const finDiaAyerStr = `${fechaAyer.getFullYear()}-${String(fechaAyer.getMonth() + 1).padStart(2, '0')}-${String(fechaAyer.getDate()).padStart(2, '0')} 23:59:59`;

      const parteAyer = await queryRunner.manager.findOne(ParteDiario, {
        where: {
          estacion:    { id: estacionId },
          fecha_folio: Between(inicioDiaAyerStr, finDiaAyerStr) as any,
        },
      });

      if (!parteAyer) {
        console.warn(
          `⚠️ No hay parte anterior para ${fechaAyer.toLocaleDateString()} en estación ${estacionId}`
        );
        return;
      }

      const totalizadorFinalAyer     = Number(parteAyer.totalizador_final);
      const totalizadorInicialHoyNum = Number(totalizadorInicialHoy);

      if (totalizadorFinalAyer !== totalizadorInicialHoyNum) {
        throw new BadRequestException(
          `❌ ERROR DE CONTINUIDAD HÍDRICA:\n` +
          `   Día ${fechaAyer.toLocaleDateString()} cerró con totalizador: ${totalizadorFinalAyer}\n` +
          `   Día ${fecha.toLocaleDateString()} abre con: ${totalizadorInicialHoyNum}\n` +
          `   ¡Diferencia de ${Math.abs(totalizadorFinalAyer - totalizadorInicialHoyNum)} unidades!\n` +
          `   Revise: reinicio de equipo, error de lectura, o manipulación no autorizada.`
        );
      }

      console.log(
        `✅ Continuidad validada: ${fechaAyer.toLocaleDateString()} → ${fecha.toLocaleDateString()} (Totalizador: ${totalizadorFinalAyer})`
      );

    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('❌ Error en validación de continuidad:', error);
      throw new InternalServerErrorException(
        'Error al validar continuidad: ' + error.message
      );
    }
  }

  /**
   * CÁLCULO DE HORAS
   */
  private calcularHoras(inicio: string, fin: string): number {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let totalInicio = h1 * 60 + m1;
    let totalFin    = h2 * 60 + m2;
    if (totalFin < totalInicio) totalFin += 24 * 60;
    return (totalFin - totalInicio) / 60;
  }
}