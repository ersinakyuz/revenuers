import { Injectable,Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { importPKCS8, SignJWT } from 'jose';

import { AppsService } from '../../apps/apps.service';
import { MetricsService } from '../../metrics/metrics.service';
import { RevenueService } from '../../revenue/revenue.service';

import { Cron, CronExpression } from '@nestjs/schedule';

import {
  RevenueSource,
  RevenueType,
} from '../../revenue/entities/revenue-record.entity';

export interface AppleSalesRow {
  Provider: string;
  'Provider Country': string;
  SKU: string;
  Developer: string;
  Title: string;
  Version: string;
  'Product Type Identifier': string;
  Units: string;
  'Developer Proceeds': string;
  'Begin Date': string;
  'End Date': string;
  'Customer Currency': string;
  'Country Code': string;
  'Currency of Proceeds': string;
  'Apple Identifier': string;
  'Customer Price': string;
  'Parent Identifier': string;
}

@Injectable()
export class AppleService {

      private readonly logger = new Logger(AppleService.name);  
  constructor(
    private readonly configService: ConfigService,
    private readonly appsService: AppsService,
    private readonly metricsService: MetricsService,
    private readonly revenueService: RevenueService,

    
  ) {}

  async generateToken(): Promise<string> {
    const issuerId =
      this.configService.get<string>('APPLE_ISSUER_ID');

    const keyId =
      this.configService.get<string>('APPLE_KEY_ID');

    const privateKeyPath =
      this.configService.get<string>(
        'APPLE_PRIVATE_KEY_PATH',
      );

    if (!issuerId || !keyId || !privateKeyPath) {
      throw new Error(
        'Apple API configuration is incomplete',
      );
    }

    const privateKeyPem = await readFile(
      privateKeyPath,
      'utf8',
    );

    const privateKey = await importPKCS8(
      privateKeyPem,
      'ES256',
    );

    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({})
      .setProtectedHeader({
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT',
      })
      .setIssuer(issuerId)
      .setAudience('appstoreconnect-v1')
      .setIssuedAt(now)
      .setExpirationTime(now + 10 * 60)
      .sign(privateKey);
  }

  async getApps() {
    const token = await this.generateToken();

    const response = await fetch(
      'https://api.appstoreconnect.apple.com/v1/apps?limit=200',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Apple API error ${response.status}: ${errorText}`,
      );
    }

    return response.json();
  }

  async syncApps() {
    const response = await this.getApps();

    const data = response as {
      data: Array<{
        id: string;
        attributes: {
          name: string;
          bundleId: string;
          sku: string;
        };
      }>;
    };

    const synced: unknown[] = [];

    for (const appleApp of data.data) {
      const result =
        await this.appsService.syncAppleApp({
          appleId: appleApp.id,
          name: appleApp.attributes.name,
          bundleId: appleApp.attributes.bundleId,
          sku: appleApp.attributes.sku,
        });

      synced.push(result);
    }

    return synced;
  }

async getDailySalesReport(reportDate: string) {
    const token = await this.generateToken();

    const vendorNumber =
        this.configService.get<string>(
        'APPLE_VENDOR_NUMBER',
        );

    if (!vendorNumber) {
        throw new Error(
        'APPLE_VENDOR_NUMBER is missing',
        );
    }

    const params = new URLSearchParams({
        'filter[frequency]': 'DAILY',
        'filter[reportDate]': reportDate,
        'filter[reportSubType]': 'SUMMARY',
        'filter[reportType]': 'SALES',
        'filter[vendorNumber]': vendorNumber,
    });

    const response = await fetch(
        `https://api.appstoreconnect.apple.com/v1/salesReports?${params.toString()}`,
        {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        },
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
        `Apple Sales API error ${response.status}: ${errorText}`,
        );
    }

    const buffer = Buffer.from(
        await response.arrayBuffer(),
    );

    // gzip magic bytes: 1f 8b
    const isGzip =
        buffer.length >= 2 &&
        buffer[0] === 0x1f &&
        buffer[1] === 0x8b;

    if (isGzip) {
        return gunzipSync(buffer).toString('utf8');
    }

    return buffer.toString('utf8');
    }

  parseSalesReport(tsv: string): AppleSalesRow[] {
  const cleaned = tsv.replace(/^\uFEFF/, '');

  const lines = cleaned
    .trim()
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0]
    .split('\t')
    .map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split('\t');

    return Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index]?.trim() ?? '',
      ]),
    ) as unknown as AppleSalesRow;
  });
}

    private appleDateToIso(
    date: string,
    ): string {
    const [month, day, year] =
        date.split('/');

    return `${year}-${month.padStart(
        2,
        '0',
    )}-${day.padStart(2, '0')}`;
    }

    async normalizeSalesRow(
    row: AppleSalesRow,
    ) {
    const appleIdentifier =
        row['Apple Identifier']?.trim();

    const parentIdentifier =
        row['Parent Identifier']?.trim();

    if (!appleIdentifier) {
        return null;
    }

    // Önce doğrudan Apple app ID ile dene.
    let app =
        await this.appsService.findByStoreMapping(
        RevenueSource.APPLE,
        appleIdentifier,
        );

    // IAP / subscription gibi child product ise
    // Parent Identifier üzerinden ana uygulamayı bul.
    if (!app && parentIdentifier) {
        app =
        await this.appsService.findByStoreSku(
            RevenueSource.APPLE,
            parentIdentifier,
        );
    }

    if (!app) {
        return null;
    }

    return {
        app,
        source: RevenueSource.APPLE,
        date: this.appleDateToIso(
        row['Begin Date'],
        ),
        units: Number(row.Units),
        country: row['Country Code'],
        productTypeIdentifier:
        row['Product Type Identifier'],
        developerProceeds:
        row['Developer Proceeds'],
        proceedsCurrency:
        row['Currency of Proceeds'],
        customerPrice:
        row['Customer Price'],
        customerCurrency:
        row['Customer Currency'],

        // Burada IAP'ın kendi Apple ID'sini koruyoruz.
        appleIdentifier,

        parentIdentifier,
        sku: row.SKU,
        title: row.Title,
    };
    }

    async importDailySalesReport(
    reportDate: string,
    ) {
    const report =
        await this.getDailySalesReport(
        reportDate,
        );

    const rows =
        this.parseSalesReport(report);

    let metricsCreated = 0;
    let metricsExisting = 0;
    let revenuesCreated = 0;
    let revenuesExisting = 0;
    let skipped = 0;

    for (const row of rows) {
        const normalized =
        await this.normalizeSalesRow(row);

        if (!normalized) {
        skipped++;
        continue;
        }

        const metricExternalId = [
        'APPLE',
        'METRIC',
        normalized.date,
        normalized.appleIdentifier,
        normalized.sku,
        normalized.country,
        normalized.productTypeIdentifier,
        normalized.units,
        normalized.developerProceeds,
        ].join(':');

        const metricResult = await this.metricsService.create({
        app: normalized.app,
        source: RevenueSource.APPLE,
        date: normalized.date,
        metricType: 'UNITS',
        units: normalized.units,
        country: normalized.country,
        productTypeIdentifier: normalized.productTypeIdentifier,
        externalProductId: normalized.appleIdentifier,
        externalId: metricExternalId,
        });

        if (metricResult.created) {
        metricsCreated++;
        } else {
        metricsExisting++;
        }

        const proceedsPerUnit = Number(
        normalized.developerProceeds,
        );

        const customerPricePerUnit = Number(
        normalized.customerPrice,
        );

        const totalProceeds =
        normalized.units * proceedsPerUnit;

        const totalCustomerPrice =
        normalized.units * customerPricePerUnit;

        const revenueType = this.mapRevenueType(
        normalized.productTypeIdentifier,
        );

        if (
        totalProceeds === 0 ||
        revenueType === null
        ) {
        continue;
        }

        const revenueExternalId = [
        'APPLE',
        'REVENUE',
        normalized.date,
        normalized.appleIdentifier,
        normalized.sku,
        normalized.country,
        normalized.productTypeIdentifier,
        normalized.units,
        normalized.developerProceeds,
        ].join(':');

        const revenueResult = await this.revenueService.create({
        appId: normalized.app.id,
        source: RevenueSource.APPLE,
        type: revenueType,
        date: normalized.date,
        country: normalized.country,
        grossAmount: totalCustomerPrice.toFixed(4),
        netAmount: totalProceeds.toFixed(4),
        currency: normalized.proceedsCurrency,
        externalId: revenueExternalId,
        });

        if (revenueResult.created) {
        revenuesCreated++;
        } else {
        revenuesExisting++;
        }
    }

        return {
        reportDate,
        rows: rows.length,
        metricsCreated,
        metricsExisting,
        revenuesCreated,
        revenuesExisting,
        skipped,
        };
    }

    async importSalesRange(
  from: string,
  to: string,
) {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error('Invalid date range');
  }

  if (start > end) {
    throw new Error(
      '`from` date cannot be after `to` date',
    );
  }

    const results: Array<{
    date: string;
    ok: boolean;
    reportDate?: string;
    rows?: number;
    metricsCreated?: number;
    metricsExisting?: number;
    revenuesCreated?: number;
    revenuesExisting?: number;
    skipped?: number;
    error?: string;
    }> = [];

  const current = new Date(start);

  while (current <= end) {
    const date = current
      .toISOString()
      .slice(0, 10);

    try {
      const result =
        await this.importDailySalesReport(date);

      results.push({
        date,
        ok: true,
        ...result,
      });
    } catch (error) {
      results.push({
        date,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }

    current.setUTCDate(
      current.getUTCDate() + 1,
    );
  }

  return {
    from,
    to,
    days: results.length,
    results,
  };
}

    private mapRevenueType(
    productTypeIdentifier: string,
    ): RevenueType | null {
    switch (productTypeIdentifier) {
        // Paid/free app purchases
        case '1':
        case '1F':
        case '1T':
        case 'F1':
        case '1E':
        case '1EP':
        case '1EU':
        return RevenueType.APP_SALE;

        // In-App Purchases
        case 'IA1':
        case 'IA1-M':
        case 'FI1':
        case 'IA3':
        return RevenueType.IAP;

        // Subscriptions
        case 'IA9':
        case 'IA9-M':
        case 'IAY':
        case 'IAY-M':
        return RevenueType.SUBSCRIPTION;

        // Updates / redownloads don't create revenue records
        case '3':
        case '3F':
        case '7':
        case '7F':
        case '7T':
        case 'F7':
        return null;

        default:
        return RevenueType.OTHER;
    }
    }
    @Cron(CronExpression.EVERY_DAY_AT_6AM, {
  timeZone: 'Europe/Berlin',
})
async syncDailyAppleSales() {
  const date = new Date();

  // Apple raporunun hazır olmasını garantiye almak için
  // iki gün geriye gidiyoruz.
  date.setDate(date.getDate() - 2);

  const reportDate = date
    .toISOString()
    .slice(0, 10);

  try {
    const result =
      await this.importDailySalesReport(reportDate);

    this.logger.log(
      `Apple sales sync completed for ${reportDate}: ${JSON.stringify(result)}`,
    );
  } catch (error) {
    this.logger.error(
      `Apple sales sync failed for ${reportDate}`,
      error instanceof Error
        ? error.stack
        : String(error),
    );
  }
}
}