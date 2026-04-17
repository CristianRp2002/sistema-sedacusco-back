import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { Estacion } from './estacion.entity';
import { DetalleBombeo } from './detalle-bombeo.entity';
import { VerificacionTablero } from './verificacion-tablero.entity'
import { User } from '../../users/entities/user.entity';
import { ParteDiarioOperador } from './parte-diario-operador.entity';
// Moldes 
import { LecturaTrifasica } from './lectura-trifasica.embedded';  
import { LecturaHidraulica } from './lectura-hidraulica.embedded'; 
import { CondicionOperativa } from './condicion-operativa.embedded';
import { TurnoOperador } from './turno-operador.entity';
import { RegistroActivo } from './registro-activo.entity';
import { ValorRegistro } from './valor-registro.entity';

@Entity('partes_diarios')
@Unique(['fecha_folio', 'estacion'])
export class ParteDiario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 0 })
  cambios_realizados: number;

  @Column({ type: 'date' })
  fecha_folio: string; 

  // Relación: Un parte pertenece a una estación
  @ManyToOne(() => Estacion)
  estacion: Estacion;

  // --- SECCIÓN I: TENSIONES ---
  @Column({ type: 'varchar', length: 50, nullable: true })
  interruptor_llegada_10kv_estado: string; 

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  transformador_temperatura: number;

  @Column(() => LecturaTrifasica, { prefix: 'llegada' })
  tension_llegada: LecturaTrifasica;

  @Column(() => LecturaTrifasica, { prefix: 'tablero' })
  tension_tablero: LecturaTrifasica;

  // --- SECCIÓN II: DATOS HIDRÁULICOS ---
  
  @Column(() => LecturaHidraulica, { prefix: 'inicial' })
  lectura_inicial: LecturaHidraulica;

  @Column(() => LecturaHidraulica, { prefix: 'final' })
  lectura_final: LecturaHidraulica;

  @Column(() => CondicionOperativa, { prefix: 'habilitacion' })
  condicion_habilitacion: CondicionOperativa; 

  @Column(() => CondicionOperativa, { prefix: 'desactivacion' })
  condicion_desactivacion: CondicionOperativa; 

  // --- SECCIÓN III y V: TOTALIZADOR ---
  @Column({ type: 'bigint' })
  totalizador_inicial: number;

  @Column({ type: 'timestamp', nullable: true }) 
  
  fecha_hora_lectura_inicial: Date; 

  @Column({ type: 'bigint' })
  totalizador_final: number;

  @Column({ type: 'timestamp', nullable: true })
  fecha_hora_lectura_final: Date;
  
  // --- SECCIÓN V: LECTURAS FINALES (HIDRÁULICAS) ---
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  nivel_cisterna_final: number; 

  @Column({ type: 'decimal', precision: 5, scale: 2,  nullable: true  })
  presion_linea_final: number; 

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  presion_cisterna_jatun_huaylla_final: number; 

  // --- CÁLCULO AUTOMÁTICO ---
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  produccion_calculada: number; // Se llena solo: Final - Inicial

  @OneToMany(() => DetalleBombeo, (detalle) => detalle.parteDiario)
  detallesBombeo: DetalleBombeo[];
  // --- VERIFICACIÓN ---
  @OneToMany(() => VerificacionTablero, (verif) => verif.parteDiario, { cascade: true })
  verificacionesTablero: VerificacionTablero[];
   

  @OneToMany(() => ParteDiarioOperador, (pdo) => pdo.parteDiario, { cascade: true })
  operadoresAsignados: ParteDiarioOperador[];

  @OneToMany(() => TurnoOperador, (turno) => turno.parteDiario, { cascade: true })
  operadores: TurnoOperador[];

  @OneToMany(() => RegistroActivo, (r) => r.parteDiario, { cascade: true })
registrosActivo: RegistroActivo[];

@OneToMany(() => ValorRegistro, (v) => v.parteDiario, { cascade: true })
valoresRegistro: ValorRegistro[];
}