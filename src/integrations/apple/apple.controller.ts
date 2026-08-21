import { Controller, Get, Query } from '@nestjs/common';
import { AppleService } from './apple.service';

@Controller('apple')
export class AppleController {
  constructor(
    private readonly appleService: AppleService,
  ) {}

  @Get('token-test')
  async tokenTest() {
    const token = await this.appleService.generateToken();

    return {
      ok: true,
      tokenLength: token.length,
    };
  }

  @Get('apps-test')
    async appsTest() {
    return this.appleService.getApps();
    }

    @Get('sales-test')
    async salesTest(
    @Query('date') date?: string,
    ) {
    const reportDate =
        date ??
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    const report =
        await this.appleService.getDailySalesReport(
        reportDate,
        );

    const rows =
        this.appleService.parseSalesReport(report);

    return {
        date: reportDate,
        count: rows.length,
        rows: rows.slice(0, 10),
    };
    }


    @Get('sync-apps')
    async syncApps() {
    return this.appleService.syncApps();
    }
    


    @Get('normalize-test')
    async normalizeTest(
    @Query('date') date: string,
    ) {
    const report =
        await this.appleService.getDailySalesReport(date);

    const rows =
        this.appleService.parseSalesReport(report);

    const normalized: unknown[] = [];

    for (const row of rows) {
        const item =
        await this.appleService.normalizeSalesRow(row);

        if (item) {
        normalized.push(item);
        }
    }

    return normalized;
    }


    @Get('import-sales')
    async importSales(
    @Query('date') date: string,
    ) {
    return this.appleService.importDailySalesReport(date);
    }



    @Get('import-sales-range')
    async importSalesRange(
    @Query('from') from: string,
    @Query('to') to: string,
    ) {
    return this.appleService.importSalesRange(
        from,
        to,
    );
    }


    @Get('sync-daily-test')
        async syncDailyTest() {
        await this.appleService.syncDailyAppleSales();

        return {
            ok: true,
        };
        }


}