import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import { RevenueRecord } from '../revenue/entities/revenue-record.entity';
import { AppMetric } from '../metrics/entities/app-metric.entity';
import { App } from '../apps/entities/app.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RevenueRecord,
      AppMetric,
      App,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}