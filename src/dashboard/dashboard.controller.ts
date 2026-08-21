import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import { RevenueSource } from '../revenue/entities/revenue-record.entity';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('summary')
  getSummary(
    @Query('from')
    from?: string,

    @Query('to')
    to?: string,

    @Query('source')
    source?: RevenueSource,
  ) {
    return this.dashboardService.getSummary(
      from,
      to,
      source,
    );
  }

  @Get('daily')
  getDaily(
    @Query('from')
    from?: string,

    @Query('to')
    to?: string,

    @Query('source')
    source?: RevenueSource,
  ) {
    return this.dashboardService.getDaily(
      from,
      to,
      source,
    );
  }

  @Get('apps')
  getApps(
    @Query('from')
    from?: string,

    @Query('to')
    to?: string,

    @Query('source')
    source?: RevenueSource,
  ) {
    return this.dashboardService.getApps(
      from,
      to,
      source,
    );
  }

  @Get('app/:appId/daily')
  getAppDaily(
    @Param(
      'appId',
      ParseIntPipe,
    )
    appId: number,

    @Query('from')
    from?: string,

    @Query('to')
    to?: string,

    @Query('source')
    source?: RevenueSource,
  ) {
    return this.dashboardService.getAppDaily(
      appId,
      from,
      to,
      source,
    );
  }
}