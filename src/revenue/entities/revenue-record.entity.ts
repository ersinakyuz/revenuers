import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum RevenueSource {
  APPLE = 'APPLE',
  AMAZON = 'AMAZON',
  GOOGLE_PLAY = 'GOOGLE_PLAY',
  ADMOB = 'ADMOB',
  PATREON = 'PATREON',
  ITCH = 'ITCH',
}

export enum RevenueType {
  APP_SALE = 'APP_SALE',
  IAP = 'IAP',
  SUBSCRIPTION = 'SUBSCRIPTION',
  AD = 'AD',
  DONATION = 'DONATION',
  OTHER = 'OTHER',
}

@Entity('revenue_records')
export class RevenueRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: RevenueSource,
  })
  source: RevenueSource;

  @Column({
    type: 'enum',
    enum: RevenueType,
  })
  type: RevenueType;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  country: string;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 4,
  })
  grossAmount: string;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 4,
    nullable: true,
  })
  netAmount: string;

  @Column({ length: 3 })
  currency: string;

  @Column({ nullable: true })
  externalId: string;

  @CreateDateColumn()
  createdAt: Date;
}