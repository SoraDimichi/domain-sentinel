import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ClientsModule } from '@nestjs/microservices';
import { getKafkaConfig, getTelegramConfig } from './config';
import { TelegramBotService } from './telegram-bot.service';
import { DomainWarningConsumer } from './domain-warning.consumer';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync(getTelegramConfig()),
    ClientsModule.registerAsync(getKafkaConfig()),
  ],
  controllers: [HealthController, DomainWarningConsumer],
  providers: [TelegramBotService],
})
export class TelegramNotifierModule {}
