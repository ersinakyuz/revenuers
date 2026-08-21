import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RevenueRecord } from './entities/revenue-record.entity';
import { App } from '../apps/entities/app.entity';

import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RevenueRecord,
      App,
    ]),
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}