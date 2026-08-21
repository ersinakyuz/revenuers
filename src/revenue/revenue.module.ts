import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RevenueRecord } from './entities/revenue-record.entity';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RevenueRecord]),
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
})
export class RevenueModule {}