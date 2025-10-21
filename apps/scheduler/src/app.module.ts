import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database.config';
import { BatchModule } from './modules/batch/batch.module';
import { DomainRepositoryModule } from './modules/repository/domain.module';
import { SynchronizationModule } from './modules/synchronization/synchronization.module';
import { HealthController } from './health.controller';
import { SchedulerService } from './scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync(getDatabaseConfig()),
    BatchModule,
    DomainRepositoryModule,
    SynchronizationModule,
  ],
  controllers: [HealthController],
  providers: [SchedulerService],
})
export class AppModule {}
