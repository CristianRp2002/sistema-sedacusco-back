import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOperacionesDto } from './dto/create-operaciones.dto';
import { UpdateOperacionesDto } from './dto/update-operaciones.dto';

// ENTIDADES
import { ParteDiario } from './entities/parte-diario.entity';
import { DetalleBombeo } from './entities/detalle-bombeo.entity';
import { TurnoOperador } from './entities/turno-operador.entity';
import { VerificacionTablero } from './entities/verificacion-tablero.entity';

@Injectable()
export class OperacionesService {
  constructor(
    @InjectRepository(ParteDiario)
    private readonly parteDiarioRepository: Repository<ParteDiario>,

    private readonly dataSource: DataSource, // Motor para transacciones robustas
  ) {}

  /**
   * CREAR: Guarda un Parte Diario con todas sus listas anidadas
   * utilizando una transacción (O se guarda todo, o nada).
   */
  async create(createOperacionesDto: CreateOperacionesDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Extraemos las listas y el ID de estación del DTO
      const { operadores, bombeos, tableros, estacion_id, ...datosParte } = createOperacionesDto;

      // --- TAREA B: VALIDAR CONTINUIDAD ---
      await this.validarContinuidad(estacion_id, datosParte.totalizador_inicial);

      // --- TAREA C: CÁLCULO DE PRODUCCIÓN ---
      const produccionCalculada = datosParte.totalizador_final - datosParte.totalizador_inicial;

      // 2. Creamos la cabecera (Parte Diario) con el cálculo de producción
      const nuevoParte = queryRunner.manager.create(ParteDiario, {
        ...datosParte,
        produccion_calculada: produccionCalculada, 
        estacion: { id: estacion_id } as any, // Relación ManyToOne
      });
      const parteGuardado = await queryRunner.manager.save(nuevoParte);

      // 3. Guardamos los Operadores (Relación OneToMany)
      if (operadores && operadores.length > 0) {
        const opEntities = operadores.map(op => {
          // Usamos el manager para crear el objeto
          return queryRunner.manager.create(TurnoOperador, {
            // Usamos 'nombre_operador' porque la BD dice que esa columna es Not-Null
            // Le pasamos el usuario_id (o el nombre si lo tuvieras)
            nombre_operador: op.usuario_id, 
            
            // El turno como string para evitar el error de tipos que vimos antes
            turno: op.numero_turno.toString(), 
            
            // Vinculamos al parte diario padre
            parteDiario: parteGuardado
          });
        });
        
        await queryRunner.manager.save(opEntities);
      }

      // --- TAREA A: CÁLCULO DE HORAS DE BOMBEO ---
      if (bombeos && bombeos.length > 0) {
        const bombeosEntities = bombeos.map(b => {
          // 1. Calculamos las horas
          const horas = this.calcularHoras(b.encendido, b.apagado);

          // 2. Rescatamos la fecha de manera segura para evitar el error NaN
          let fechaBase = "";
          if (typeof datosParte.fecha_folio === 'string') {
              fechaBase = datosParte.fecha_folio.substring(0, 10);
          } else {
              fechaBase = new Date(datosParte.fecha_folio).toISOString().substring(0, 10);
          }

          // 3. Construimos las fechas forzando el formato correcto
          const fechaEncendido = new Date(`${fechaBase}T${b.encendido}:00`);
          const fechaApagado = new Date(`${fechaBase}T${b.apagado}:00`);

          if (fechaApagado < fechaEncendido) {
              fechaApagado.setDate(fechaApagado.getDate() + 1);
          }

          // 4. Creamos la entidad
          return queryRunner.manager.create(DetalleBombeo, {
            encendido: fechaEncendido,
            apagado: fechaApagado,
            horometro_inicial: b.horometro_inicial,
            horometro_final: b.horometro_final,
            bomba: { id: b.bomba_id } as any, // Mapeo de la bomba
            horas_bombeo: horas, // Asignamos el cálculo automático
            parteDiario: parteGuardado
          });
        });
        
        await queryRunner.manager.save(bombeosEntities);
      }

      // 5. Guardamos Tableros (Usando el nombre de tu relación: verificacionesTablero)
      if (tableros && tableros.length > 0) {
        const tabEntities = tableros.map(t => queryRunner.manager.create(VerificacionTablero, {
          ...t,
          parteDiario: parteGuardado
        }));
        await queryRunner.manager.save(tabEntities);
      }

      // Confirmamos todos los cambios en la BD
      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message: 'Parte Diario creado exitosamente',
        data: parteGuardado
      };

    } catch (error) {
      // Si algo falla, revertimos todo
      await queryRunner.rollbackTransaction();
      
      // Si es un error de validación manual, lo lanzamos como BadRequest
      if (error instanceof BadRequestException) throw error;
      
      throw new InternalServerErrorException('Error al crear el registro: ' + error.message);
    } finally {
      // Liberamos el túnel de conexión
      await queryRunner.release();
    }
  }

  /**
   * LISTAR: Trae todos los partes con sus relaciones completas
   */
  async findAll() {
    return await this.parteDiarioRepository.find({
      relations: ['operadores', 'detallesBombeo', 'verificacionesTablero', 'estacion'],
      order: { fecha_folio: 'DESC' }
    });
  }

  /**
   * BUSCAR POR ID
   */
  async findOne(id: string) {
    const registro = await this.parteDiarioRepository.findOne({
      where: { id },
      relations: ['operadores', 'detallesBombeo', 'verificacionesTablero', 'estacion']
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
        id: id,
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

  // --- MÉTODOS PRIVADOS DE LÓGICA ---

  private calcularHoras(inicio: string, fin: string): number {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);

    let totalInicio = h1 * 60 + m1;
    let totalFin = h2 * 60 + m2;

    // Si el fin es menor al inicio, pasó a la madrugada del día siguiente
    if (totalFin < totalInicio) {
        totalFin += 24 * 60; 
    }

    return (totalFin - totalInicio) / 60; 
  }
  
  private async validarContinuidad(estacionId: string, totalizadorInicialHoy: number) {
    const ultimoParte = await this.parteDiarioRepository.findOne({
      where: { estacion: { id: estacionId } },
      order: { fecha_folio: 'DESC' },
    });

    if (ultimoParte) {
      // Convertimos a número para asegurar la comparación
      const finalAyer = Number(ultimoParte.totalizador_final);
      if (finalAyer !== totalizadorInicialHoy) {
        throw new BadRequestException(
          `Discrepancia de totalizador: El final de ayer fue ${finalAyer}, pero hoy envían ${totalizadorInicialHoy}.`
        );
      }
    }
  }
}