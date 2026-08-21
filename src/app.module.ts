import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueModule } from './revenue/revenue.module';
import { AppsModule } from './apps/apps.module';
import { AppleModule } from './integrations/apple/apple.module';
import { MetricsModule } from './metrics/metrics.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',

        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),

        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),

        autoLoadEntities: true,

        // Local development sırasında kullanacağız.
        // Production'da migration'a geçeceğiz.
        synchronize: true,
      }),
    }),

    RevenueModule,

    AppsModule,

    AppleModule,

    MetricsModule,

    DashboardModule,
  ],
})
export class AppModule {}