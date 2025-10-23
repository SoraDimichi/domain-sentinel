import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramBotService } from './telegram-bot.service';
import { DomainWarningConsumer } from './domain-warning.consumer';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('TELEGRAM_BOT_TOKEN', '8388900730:AAF93QAQ8yYW4bdLr4JSzJyQyJ0yQQILRjw');
        if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

        return { token };
      },
    }),
  ],
  controllers: [HealthController, DomainWarningConsumer],
  providers: [TelegramBotService],
})
export class TelegramNotifierModule {}
