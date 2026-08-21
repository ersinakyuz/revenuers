import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppsService } from './apps.service';

@Controller('apps')
export class AppsController {
  constructor(
    private readonly appsService: AppsService,
  ) {}

  @Get()
  findAll() {
    return this.appsService.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      bundleId?: string;
    },
  ) {
    return this.appsService.create(
      body.name,
      body.bundleId,
    );
  }
}