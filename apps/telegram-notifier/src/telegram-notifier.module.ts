import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TelegramBotService } from './services/telegram-bot.service';
import { DomainWarningConsumer } from './domain-warning.consumer';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configure Telegraf (Telegram Bot)
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('TELEGRAM_BOT_TOKEN');
        if (!token) {
          throw new Error('TELEGRAM_BOT_TOKEN is not defined');
        }
        return {
          token,
        };
      },
    }),

    // Configure Kafka client
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
            },
            consumer: {
              groupId: 'telegram-notifier-consumer',
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [HealthController, DomainWarningConsumer],
  providers: [TelegramBotService],
})
export class TelegramNotifierModule {}
