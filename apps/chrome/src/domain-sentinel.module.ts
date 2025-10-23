import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { DomainBatchConsumer } from './domain-batch.consumer';
import { BrowserService } from './services/browser.service';
import { DomainProcessorService } from './services/domain-processor.service';
import { WarningDetectorService } from './services/warning-detector.service';
import { HealthController } from './health.controller';
import { DomainWarningModule } from './modules/domain-warning/domain-warning.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/domain_sentinel'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    DomainWarningModule,
    ClientsModule.registerAsync([
      {
        name: 'DOMAIN_BATCH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'chrome',
              brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
            },
            consumer: {
              groupId: 'chrome-consumer',
              sessionTimeout: 30000,
              rebalanceTimeout: 60000,
              readUncommitted: true,
            },
            subscribe: {
              fromBeginning: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [DomainBatchConsumer, HealthController],
  providers: [BrowserService, DomainProcessorService, WarningDetectorService],
})
export class DomainSentinelModule {}
