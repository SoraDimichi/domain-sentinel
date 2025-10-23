import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoDBConfig, getPlaywrightConfig } from './config';
import { DomainBatchConsumer } from './domain-batch.consumer';
import { BrowserService } from './services/browser.service';
import { DomainProcessorService } from './services/domain-processor.service';
import { WarningDetectorService } from './services/warning-detector.service';
import { DomainWarningProducer } from './services/domain-warning.producer';
import { HealthController } from './health.controller';
import { DomainWarningModule } from './modules/domain-warning/domain-warning.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync(getMongoDBConfig()),
    DomainWarningModule,
    getPlaywrightConfig(),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: `${configService.get<string>('CLIENT_ID', 'browser-agnostic')}-producer`,
              brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
            },
            producer: {
              allowAutoTopicCreation: true,
              idempotent: true,
              transactionalId: `${configService.get<string>('CLIENT_ID', 'browser-agnostic')}-tx`,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [DomainBatchConsumer, HealthController],
  providers: [BrowserService, DomainProcessorService, WarningDetectorService, DomainWarningProducer],
})
export class DomainSentinelModule {}
