import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RevenueRecord } from './entities/revenue-record.entity';

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(RevenueRecord)
    private readonly revenueRepository: Repository<RevenueRecord>,
  ) {}

  findAll() {
    return this.revenueRepository.find();
  }
}