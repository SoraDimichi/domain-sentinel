import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database.config';
import { TokenBatchModule } from './modules/token-batch/token-batch.module';
import { DomainModule } from './modules/domain/domain.module';
import { DomainsFetcherModule } from './modules/domains-fetcher/domains-fetcher.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync(getDatabaseConfig()),
    TokenBatchModule,
    DomainModule,
    DomainsFetcherModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
