import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DomainSentinelModule } from './domain-sentinel.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { BrowserType } from './modules/domain-warning/models/domain-warning-feed.entity';

async function bootstrap() {
  const app = await NestFactory.create(DomainSentinelModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const browserType = configService.get<BrowserType>('BROWSER_TYPE') || BrowserType.CHROME;
  logger.log(`Starting browser-agnostic service with ${browserType} browser`);

  app.connectMicroservice<MicroserviceOptions>({
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
  });

  await app.startAllMicroservices();
  await app.listen(3005);
  logger.log(`Browser-agnostic service is running on port 3005`);
}

bootstrap();
