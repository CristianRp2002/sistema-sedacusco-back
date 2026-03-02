import { Column } from 'typeorm';

export class CondicionOperativa {
  
  @Column({ type: 'varchar', length: 50, nullable: true })
  estado_telemetria: string; // "OK", "Falla", "Desconectado"

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  presion_ingreso: number; // 28.9
}