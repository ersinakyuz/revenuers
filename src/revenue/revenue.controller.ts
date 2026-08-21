import { Controller, Get } from '@nestjs/common';
import { RevenueService } from './revenue.service';

@Controller('revenue')
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
  ) {}

  @Get()
  findAll() {
    return this.revenueService.findAll();
  }
}