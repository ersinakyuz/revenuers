import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import {
  RevenueRecord,
  RevenueSource,
} from '../revenue/entities/revenue-record.entity';

import { AppMetric } from '../metrics/entities/app-metric.entity';
import { App } from '../apps/entities/app.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(RevenueRecord)
    private readonly revenueRepository: Repository<RevenueRecord>,

    @InjectRepository(AppMetric)
    private readonly metricRepository: Repository<AppMetric>,

    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
  ) {}

  private applyDateFilter<T extends object>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    from?: string,
    to?: string,
  ) {
    if (from) {
      qb.andWhere(
        `${alias}.date >= :from`,
        {
          from,
        },
      );
    }

    if (to) {
      qb.andWhere(
        `${alias}.date <= :to`,
        {
          to,
        },
      );
    }

    return qb;
  }

  private applySourceFilter<T extends object>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    source?: RevenueSource,
  ) {
    if (source) {
      qb.andWhere(
        `${alias}.source = :source`,
        {
          source,
        },
      );
    }

    return qb;
  }

  async getSummary(
    from?: string,
    to?: string,
    source?: RevenueSource,
  ) {
    //
    // Revenue totals by currency
    //
    const revenueTotalsQuery =
      this.revenueRepository
        .createQueryBuilder('revenue')
        .select(
          'revenue.currency',
          'currency',
        )
        .addSelect(
          'SUM(revenue.grossAmount)',
          'grossAmount',
        )
        .addSelect(
          'SUM(revenue.netAmount)',
          'netAmount',
        )
        .groupBy('revenue.currency');

    this.applyDateFilter(
      revenueTotalsQuery,
      'revenue',
      from,
      to,
    );

    this.applySourceFilter(
      revenueTotalsQuery,
      'revenue',
      source,
    );

    const revenueTotals =
      await revenueTotalsQuery.getRawMany();

    //
    // Total units
    //
    const metricTotalsQuery =
      this.metricRepository
        .createQueryBuilder('metric')
        .select(
          'COALESCE(SUM(metric.units), 0)',
          'totalUnits',
        );

    this.applyDateFilter(
      metricTotalsQuery,
      'metric',
      from,
      to,
    );

    this.applySourceFilter(
      metricTotalsQuery,
      'metric',
      source,
    );

    const metricTotals =
      await metricTotalsQuery.getRawOne();

    //
    // Revenue by source
    //
    const revenueBySourceQuery =
      this.revenueRepository
        .createQueryBuilder('revenue')
        .select(
          'revenue.source',
          'source',
        )
        .addSelect(
          'revenue.currency',
          'currency',
        )
        .addSelect(
          'SUM(revenue.grossAmount)',
          'grossAmount',
        )
        .addSelect(
          'SUM(revenue.netAmount)',
          'netAmount',
        )
        .groupBy('revenue.source')
        .addGroupBy('revenue.currency');

    this.applyDateFilter(
      revenueBySourceQuery,
      'revenue',
      from,
      to,
    );

    this.applySourceFilter(
      revenueBySourceQuery,
      'revenue',
      source,
    );

    const revenueBySource =
      await revenueBySourceQuery.getRawMany();

    //
    // Revenue by type
    //
    const revenueByTypeQuery =
      this.revenueRepository
        .createQueryBuilder('revenue')
        .select(
          'revenue.type',
          'type',
        )
        .addSelect(
          'revenue.currency',
          'currency',
        )
        .addSelect(
          'SUM(revenue.grossAmount)',
          'grossAmount',
        )
        .addSelect(
          'SUM(revenue.netAmount)',
          'netAmount',
        )
        .groupBy('revenue.type')
        .addGroupBy('revenue.currency');

    this.applyDateFilter(
      revenueByTypeQuery,
      'revenue',
      from,
      to,
    );

    this.applySourceFilter(
      revenueByTypeQuery,
      'revenue',
      source,
    );

    const revenueByType =
      await revenueByTypeQuery.getRawMany();

    //
    // Revenue by app
    //
    const revenueByAppQuery =
      this.revenueRepository
        .createQueryBuilder('revenue')
        .innerJoin(
          'revenue.app',
          'app',
        )
        .select(
          'app.id',
          'appId',
        )
        .addSelect(
          'app.name',
          'appName',
        )
        .addSelect(
          'revenue.currency',
          'currency',
        )
        .addSelect(
          'SUM(revenue.grossAmount)',
          'grossAmount',
        )
        .addSelect(
          'SUM(revenue.netAmount)',
          'netAmount',
        )
        .groupBy('app.id')
        .addGroupBy('app.name')
        .addGroupBy('revenue.currency');

    this.applyDateFilter(
      revenueByAppQuery,
      'revenue',
      from,
      to,
    );

    this.applySourceFilter(
      revenueByAppQuery,
      'revenue',
      source,
    );

    const revenueByApp =
      await revenueByAppQuery.getRawMany();

    //
    // Units by app
    //
    const unitsByAppQuery =
      this.metricRepository
        .createQueryBuilder('metric')
        .innerJoin(
          'metric.app',
          'app',
        )
        .select(
          'app.id',
          'appId',
        )
        .addSelect(
          'app.name',
          'appName',
        )
        .addSelect(
          'SUM(metric.units)',
          'units',
        )
        .groupBy('app.id')
        .addGroupBy('app.name');

    this.applyDateFilter(
      unitsByAppQuery,
      'metric',
      from,
      to,
    );

    this.applySourceFilter(
      unitsByAppQuery,
      'metric',
      source,
    );

    const unitsByApp =
      await unitsByAppQuery.getRawMany();

    return {
      from: from ?? null,
      to: to ?? null,
      source: source ?? null,

      revenueTotals,

      totalUnits: Number(
        metricTotals?.totalUnits ?? 0,
      ),

      revenueBySource,
      revenueByType,
      revenueByApp,
      unitsByApp,
    };
  }

  async getDaily(
    from?: string,
    to?: string,
    source?: RevenueSource,
  ) {
    //
    // Units grouped by day
    //
    const unitsQuery =
      this.metricRepository
        .createQueryBuilder('metric')
        .select(
          "DATE_FORMAT(metric.date, '%Y-%m-%d')",
          'date',
        )
        .addSelect(
          'SUM(metric.units)',
          'units',
        )
        .groupBy('metric.date')
        .orderBy('metric.date', 'ASC');

    this.applyDateFilter(
      unitsQuery,
      'metric',
      from,
      to,
    );

    this.applySourceFilter(
      unitsQuery,
      'metric',
      source,
    );

    const unitRows =
      await unitsQuery.getRawMany<{
        date: string;
        units: string;
      }>();

    //
    // Revenue grouped by day + currency
    //
    const revenueQuery =
      this.revenueRepository
        .createQueryBuilder('revenue')
        .select(
          "DATE_FORMAT(revenue.date, '%Y-%m-%d')",
          'date',
        )
        .addSelect(
          'revenue.currency',
          'currency',
        )
        .addSelect(
          'SUM(revenue.grossAmount)',
          'grossAmount',
        )
        .addSelect(
          'SUM(revenue.netAmount)',
          'netAmount',
        )
        .groupBy('revenue.date')
        .addGroupBy('revenue.currency')
        .orderBy('revenue.date', 'ASC');

    this.applyDateFilter(
      revenueQuery,
      'revenue',
      from,
      to,
    );

    this.applySourceFilter(
      revenueQuery,
      'revenue',
      source,
    );

    const revenueRows =
      await revenueQuery.getRawMany<{
        date: string;
        currency: string;
        grossAmount: string;
        netAmount: string;
      }>();

    const dateMap = new Map<
      string,
      {
        date: string;
        units: number;
        revenue: Array<{
          currency: string;
          grossAmount: string;
          netAmount: string;
        }>;
      }
    >();

    for (const row of unitRows) {
      const date = String(row.date);

      dateMap.set(date, {
        date,
        units: Number(row.units),
        revenue: [],
      });
    }

    for (const row of revenueRows) {
      const date = String(row.date);

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          units: 0,
          revenue: [],
        });
      }

      dateMap.get(date)!.revenue.push({
        currency: row.currency,
        grossAmount: row.grossAmount,
        netAmount: row.netAmount,
      });
    }

    const days = Array.from(
      dateMap.values(),
    ).sort(
      (a, b) =>
        a.date.localeCompare(b.date),
    );

    return {
      from: from ?? null,
      to: to ?? null,
      source: source ?? null,
      days,
    };
  }

  async getApps(
    from?: string,
    to?: string,
    source?: RevenueSource,
  ) {
    const apps =
      await this.appRepository.find({
        order: {
          name: 'ASC',
        },
      });

    //
    // Units per app
    //
    const unitsQuery =
      this.metricRepository
        .createQueryBuilder('metric')
        .innerJoin(
          'metric.app',
          'app',
        )
        .select(
          'app.id',
          'appId',
        )
        .addSelect(
          'SUM(metric.units)',
          'units',
        )
        .groupBy('app.id');

    this.applyDateFilter(
      unitsQuery,
      'metric',
      from,
      to,
    );

    this.applySourceFilter(
      unitsQuery,
      'metric',
      source,
    );

    const unitRows =
      await unitsQuery.getRawMany<{
        appId: number;
        units: string;
      }>();

    //
    // Revenue per app + source + currency
    //
    const revenueQuery =
      this.revenueRepository
        .createQueryBuilder('revenue')
        .innerJoin(
          'revenue.app',
          'app',
        )
        .select(
          'app.id',
          'appId',
        )
        .addSelect(
          'revenue.source',
          'source',
        )
        .addSelect(
          'revenue.currency',
          'currency',
        )
        .addSelect(
          'SUM(revenue.grossAmount)',
          'grossAmount',
        )
        .addSelect(
          'SUM(revenue.netAmount)',
          'netAmount',
        )
        .groupBy('app.id')
        .addGroupBy('revenue.source')
        .addGroupBy('revenue.currency');

    this.applyDateFilter(
      revenueQuery,
      'revenue',
      from,
      to,
    );

    this.applySourceFilter(
      revenueQuery,
      'revenue',
      source,
    );

    const revenueRows =
      await revenueQuery.getRawMany<{
        appId: number;
        source: string;
        currency: string;
        grossAmount: string;
        netAmount: string;
      }>();

    const unitsMap = new Map<
      number,
      number
    >();

    for (const row of unitRows) {
      unitsMap.set(
        Number(row.appId),
        Number(row.units),
      );
    }

    const revenueMap = new Map<
      number,
      Array<{
        source: string;
        currency: string;
        grossAmount: string;
        netAmount: string;
      }>
    >();

    for (const row of revenueRows) {
      const appId =
        Number(row.appId);

      if (!revenueMap.has(appId)) {
        revenueMap.set(
          appId,
          [],
        );
      }

      revenueMap
        .get(appId)!
        .push({
          source: row.source,
          currency: row.currency,
          grossAmount:
            row.grossAmount,
          netAmount:
            row.netAmount,
        });
    }

    return {
      from: from ?? null,
      to: to ?? null,
      source: source ?? null,

      apps: apps.map((app) => ({
        id: app.id,
        name: app.name,
        bundleId: app.bundleId,

        units:
          unitsMap.get(app.id) ?? 0,

        revenue:
          revenueMap.get(app.id) ?? [],
      })),
    };
  }

  async getAppDaily(
    appId: number,
    from?: string,
    to?: string,
    source?: RevenueSource,
  ) {
    //
    // Verify app exists
    //
    const app =
      await this.appRepository.findOne({
        where: {
          id: appId,
        },
      });

    if (!app) {
      throw new NotFoundException(
        `App ${appId} not found`,
      );
    }

    //
    // App units grouped by day
    //
    const unitsQuery =
      this.metricRepository
        .createQueryBuilder('metric')
        .select(
          "DATE_FORMAT(metric.date, '%Y-%m-%d')",
          'date',
        )
        .addSelect(
          'SUM(metric.units)',
          'units',
        )
        .where(
          'metric.appId = :appId',
          {
            appId,
          },
        )
        .groupBy('metric.date')
        .orderBy(
          'metric.date',
          'ASC',
        );

    this.applyDateFilter(
      unitsQuery,
      'metric',
      from,
      to,
    );

    this.applySourceFilter(
      unitsQuery,
      'metric',
      source,
    );

    const unitRows =
      await unitsQuery.getRawMany<{
        date: string;
        units: string;
      }>();

    //
    // App revenue grouped by day + currency
    //
    const revenueQuery =
      this.revenueRepository
        .createQueryBuilder('revenue')
        .select(
          "DATE_FORMAT(revenue.date, '%Y-%m-%d')",
          'date',
        )
        .addSelect(
          'revenue.currency',
          'currency',
        )
        .addSelect(
          'SUM(revenue.grossAmount)',
          'grossAmount',
        )
        .addSelect(
          'SUM(revenue.netAmount)',
          'netAmount',
        )
        .where(
          'revenue.appId = :appId',
          {
            appId,
          },
        )
        .groupBy('revenue.date')
        .addGroupBy(
          'revenue.currency',
        )
        .orderBy(
          'revenue.date',
          'ASC',
        );

    this.applyDateFilter(
      revenueQuery,
      'revenue',
      from,
      to,
    );

    this.applySourceFilter(
      revenueQuery,
      'revenue',
      source,
    );

    const revenueRows =
      await revenueQuery.getRawMany<{
        date: string;
        currency: string;
        grossAmount: string;
        netAmount: string;
      }>();

    //
    // Merge units + revenue
    //
    const dateMap = new Map<
      string,
      {
        date: string;
        units: number;
        revenue: Array<{
          currency: string;
          grossAmount: string;
          netAmount: string;
        }>;
      }
    >();

    for (const row of unitRows) {
      const date =
        String(row.date);

      dateMap.set(date, {
        date,
        units:
          Number(row.units),
        revenue: [],
      });
    }

    for (const row of revenueRows) {
      const date =
        String(row.date);

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          units: 0,
          revenue: [],
        });
      }

      dateMap
        .get(date)!
        .revenue
        .push({
          currency:
            row.currency,

          grossAmount:
            row.grossAmount,

          netAmount:
            row.netAmount,
        });
    }

    const days =
      Array.from(
        dateMap.values(),
      ).sort(
        (a, b) =>
          a.date.localeCompare(
            b.date,
          ),
      );

    return {
      app: {
        id: app.id,
        name: app.name,
        bundleId: app.bundleId,
      },

      from: from ?? null,
      to: to ?? null,
      source: source ?? null,

      days,
    };
  }
}