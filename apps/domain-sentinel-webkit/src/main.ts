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
        clientId: 'domain-sentinel-webkit',
        brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
      },
      consumer: {
        groupId: 'domain-sentinel-webkit-consumer',
        allowAutoTopicCreation: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3002);
  logger.log('Domain Sentinel WebKit microservice is running on port 3002');
}

bootstrap();
