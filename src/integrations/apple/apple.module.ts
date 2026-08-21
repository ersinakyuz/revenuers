import { Module } from '@nestjs/common';

import { AppsModule } from '../../apps/apps.module';
import { MetricsModule } from '../../metrics/metrics.module';
import { RevenueModule } from '../../revenue/revenue.module';

import { AppleService } from './apple.service';
import { AppleController } from './apple.controller';

@Module({
  imports: [
    AppsModule,
    MetricsModule,
    RevenueModule,
  ],
  controllers: [AppleController],
  providers: [AppleService],
  exports: [AppleService],
})
export class AppleModule {}