import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppMetric } from './entities/app-metric.entity';
import { App } from '../apps/entities/app.entity';
import { RevenueSource } from '../revenue/entities/revenue-record.entity';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(AppMetric)
    private readonly metricRepository: Repository<AppMetric>,
  ) {}

  async create(data: {
    app: App;
    source: RevenueSource;
    date: string;
    metricType: string;
    units: number;
    country?: string;
    productTypeIdentifier?: string;
    externalProductId?: string;
    externalId: string;
  }) {
    const existing = await this.metricRepository.findOne({
      where: {
        externalId: data.externalId,
      },
    });

    if (existing) {
      return {
        record: existing,
        created: false,
      };
    }

    const metric = this.metricRepository.create(data);

    const saved = await this.metricRepository.save(metric);

    return {
      record: saved,
      created: true,
    };
  }
}