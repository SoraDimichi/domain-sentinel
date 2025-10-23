import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DomainSentinelModule } from './domain-sentinel.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(DomainSentinelModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Main');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'chrome',
        brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
      },
      consumer: {
        groupId: 'chrome-consumer',
        allowAutoTopicCreation: true,
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        readUncommitted: true,
      },
      subscribe: {
        fromBeginning: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3001);
  logger.log('Domain Sentinel Chrome microservice is running on port 3001');
}

bootstrap();
