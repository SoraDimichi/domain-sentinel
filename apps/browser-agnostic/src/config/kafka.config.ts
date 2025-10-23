import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModuleAsyncOptions, Transport } from '@nestjs/microservices';

export const getKafkaConfig = (): ClientsModuleAsyncOptions => {
  return [
    {
      name: 'DOMAIN_BATCH_SERVICE',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: configService.get<string>('CLIENT_ID', 'browser-agnostic'),
            brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
          },
          consumer: {
            groupId: configService.get<string>('CONSUMER_GROUP_ID', 'browser-agnostic-consumer'),
            sessionTimeout: 30000,
            rebalanceTimeout: 60000,
            readUncommitted: true,
            allowAutoTopicCreation: true,
          },
          subscribe: {
            fromBeginning: true,
          },
        },
      }),
    },
    {
      name: 'KAFKA_CLIENT',
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
  ];
};
