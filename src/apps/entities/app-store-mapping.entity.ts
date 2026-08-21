import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';

import { App } from './app.entity';
import { RevenueSource } from '../../revenue/entities/revenue-record.entity';

@Entity('app_store_mappings')
@Unique(['source', 'externalAppId'])
export class AppStoreMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => App, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  app: App;

  @Column({
    type: 'enum',
    enum: RevenueSource,
  })
  source: RevenueSource;

  @Column()
  externalAppId: string;

  @Column({ nullable: true })
  externalSku: string;

  @CreateDateColumn()
  createdAt: Date;
}