import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { DomainWarningFeed, DomainWarningFeedSchema } from './models/domain-warning-feed.entity';
import { DomainBatchConsumer } from './domain-batch.consumer';
import { BrowserService } from './services/browser.service';
import { DomainProcessorService } from './services/domain-processor.service';
import { WarningDetectorService } from './services/warning-detector.service';
import { HealthController } from './health.controller';

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
    MongooseModule.forFeature([
      { name: DomainWarningFeed.name, schema: DomainWarningFeedSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'DOMAIN_BATCH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'domain-sentinel-chrome',
              brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
            },
            consumer: {
              groupId: 'domain-sentinel-chrome-consumer',
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
