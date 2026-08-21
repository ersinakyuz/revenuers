import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { App } from '../../apps/entities/app.entity';
import { RevenueSource } from '../../revenue/entities/revenue-record.entity';

@Entity('app_metrics')
export class AppMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => App, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  app: App;

  @Column({
    type: 'enum',
    enum: RevenueSource,
  })
  source: RevenueSource;

  @Column({ type: 'date' })
  date: string;

  @Column()
  metricType: string;

  @Column({ type: 'int' })
  units: number;

  @Column({ nullable: true, length: 2 })
  country: string;

  @Column({ nullable: true })
  productTypeIdentifier: string;

  @Column({ nullable: true })
  externalProductId: string;

  @Column({ unique: true })
  externalId: string;

  @CreateDateColumn()
  createdAt: Date;
}