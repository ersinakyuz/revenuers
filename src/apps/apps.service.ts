import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { App } from './entities/app.entity';
import { AppStoreMapping } from './entities/app-store-mapping.entity';
import { RevenueSource } from '../revenue/entities/revenue-record.entity';

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,

    @InjectRepository(AppStoreMapping)
    private readonly mappingRepository: Repository<AppStoreMapping>,
  ) {}

  findAll() {
    return this.appRepository.find();
  }

  create(name: string, bundleId?: string) {
    const app = this.appRepository.create({
      name,
      bundleId,
    });

    return this.appRepository.save(app);
  }

    async syncAppleApp(data: {
    appleId: string;
    name: string;
    bundleId: string;
    sku: string;
    }) {
    let mapping = await this.mappingRepository.findOne({
        where: {
        source: RevenueSource.APPLE,
        externalAppId: data.appleId,
        },
        relations: {
        app: true,
        },
    });

    if (mapping) {
        mapping.externalSku = data.sku;

        mapping.app.name = data.name;
        mapping.app.bundleId = data.bundleId;

        await this.appRepository.save(mapping.app);

        return this.mappingRepository.save(mapping);
    }

    const app = this.appRepository.create({
        name: data.name,
        bundleId: data.bundleId,
    });

    await this.appRepository.save(app);

    mapping = this.mappingRepository.create({
        app,
        source: RevenueSource.APPLE,
        externalAppId: data.appleId,
        externalSku: data.sku,
    });

    return this.mappingRepository.save(mapping);
    }

    async findByStoreMapping(
    source: RevenueSource,
    externalAppId: string,
    ) {
    if (!externalAppId) {
        return null;
    }

    const mapping =
        await this.mappingRepository.findOne({
        where: {
            source,
            externalAppId,
        },
        relations: {
            app: true,
        },
        });

    return mapping?.app ?? null;
    }

    async findByStoreSku(
    source: RevenueSource,
    externalSku: string,
    ) {
    if (!externalSku) {
        return null;
    }

    const mapping = await this.mappingRepository.findOne({
        where: {
        source,
        externalSku,
        },
        relations: {
        app: true,
        },
    });

    return mapping?.app ?? null;
    }

}