import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulerService } from '../../scheduler';
import { DomainBatchProducer } from './batch.producer';
import { DomainBatchService } from './batch.service';
import { getSchedulerConfig } from '../../config/scheduler.config';
import { DomainRepositoryModule } from '../repository/domain.module';

@Module({
  imports: [
    ConfigModule.forFeature(getSchedulerConfig),
    ClientsModule.registerAsync([
      {
        name: 'DOMAIN_BATCH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'scheduler-domain',
              brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
            },
            producerOnlyMode: true,
            producer: { allowAutoTopicCreation: true },
          },
        }),
      },
    ]),
    DomainRepositoryModule,
  ],
  providers: [SchedulerService, DomainBatchProducer, DomainBatchService],
  exports: [DomainBatchService],
})
export class BatchModule {}
