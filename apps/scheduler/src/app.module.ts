import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { BatchModule } from './modules/batch/batch.module';
import { DomainRepositoryModule } from './modules/repository/domain.module';
import { SynchronizationModule } from './modules/synchronization/synchronization.module';
import { HealthController } from './health.controller';
import { SchedulerService } from './scheduler';
import { getMongoDBConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync(getMongoDBConfig()),
    BatchModule,
    DomainRepositoryModule,
    SynchronizationModule,
  ],
  controllers: [HealthController],
  providers: [SchedulerService],
})
export class AppModule {}
