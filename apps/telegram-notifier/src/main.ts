import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { TelegramNotifierModule } from './telegram-notifier.module';

async function bootstrap() {
  const logger = new Logger('TelegramNotifier');

  // Create the NestJS application
  const app = await NestFactory.create(TelegramNotifierModule);

  // Connect to Kafka as a microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      },
      consumer: {
        groupId: 'telegram-notifier-consumer',
        allowAutoTopicCreation: true,
      },
    },
  });

  // Start the microservice
  await app.startAllMicroservices();

  // Start the HTTP server
  await app.listen(3003);

  logger.log(`Telegram Notifier microservice is running on port 3003`);
}

bootstrap();
