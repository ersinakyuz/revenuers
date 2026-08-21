import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppMetric } from './entities/app-metric.entity';
import { MetricsService } from './metrics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppMetric]),
  ],
  providers: [MetricsService],
  exports: [
    MetricsService,
    TypeOrmModule,
  ],
})
export class MetricsModule {}