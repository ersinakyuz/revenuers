import { Body, Controller, Get, Post } from '@nestjs/common';

import { RevenueService } from './revenue.service';
import {
  RevenueSource,
  RevenueType,
} from './entities/revenue-record.entity';

@Controller('revenue')
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
  ) {}

  @Get()
  findAll() {
    return this.revenueService.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      appId: number;
      source: RevenueSource;
      type: RevenueType;
      date: string;
      country?: string;
      grossAmount: string;
      netAmount?: string;
      currency: string;
      externalId?: string;
    },
  ) {
    return this.revenueService.create(body);
  }
}