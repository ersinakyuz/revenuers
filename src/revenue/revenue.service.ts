import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  RevenueRecord,
  RevenueSource,
  RevenueType,
} from './entities/revenue-record.entity';

import { App } from '../apps/entities/app.entity';

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(RevenueRecord)
    private readonly revenueRepository: Repository<RevenueRecord>,

    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
  ) {}

  findAll() {
    return this.revenueRepository.find({
      relations: {
        app: true,
      },
    });
  }

  async create(data: {
    appId: number;
    source: RevenueSource;
    type: RevenueType;
    date: string;
    country?: string;
    grossAmount: string;
    netAmount?: string;
    currency: string;
    externalId?: string;
  }) {
    if (data.externalId) {
      const existing = await this.revenueRepository.findOne({
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
    }

    const app = await this.appRepository.findOne({
      where: {
        id: data.appId,
      },
    });

    if (!app) {
      throw new NotFoundException(
        `App ${data.appId} not found`,
      );
    }

    const record = this.revenueRepository.create({
      app,
      source: data.source,
      type: data.type,
      date: data.date,
      country: data.country,
      grossAmount: data.grossAmount,
      netAmount: data.netAmount,
      currency: data.currency,
      externalId: data.externalId,
    });

    const saved = await this.revenueRepository.save(record);

    return {
      record: saved,
      created: true,
    };
  }
}