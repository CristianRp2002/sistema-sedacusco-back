import { Column } from 'typeorm';

export class LecturaTrifasica {
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  fase_R: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  fase_S: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  fase_T: number;
}