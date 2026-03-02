import { Column } from 'typeorm';

export class LecturaHidraulica {
  
  @Column({ type: 'time', nullable: true })
  hora_registro: string; 

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  nivel_cisterna: number; // 3.95

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  presion_linea: number; // 0.85

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  presion_jatun_huaylla: number; 

  @Column({ type: 'bigint', nullable: true }) 
  totalizador: number; 
}