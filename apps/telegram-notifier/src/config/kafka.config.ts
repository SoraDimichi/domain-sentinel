import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModuleAsyncOptions, Transport } from '@nestjs/microservices';

export const getKafkaConfig = (): ClientsModuleAsyncOptions => {
  return [
    {
      name: 'DOMAIN_WARNING_SERVICE',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'telegram-notifier',
            brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
          },
          consumer: {
            groupId: 'telegram-notifier-consumer',
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
  ];
};
