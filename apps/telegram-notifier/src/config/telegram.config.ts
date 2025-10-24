import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModuleAsyncOptions } from 'nestjs-telegraf';

export const getTelegramConfig = (): TelegrafModuleAsyncOptions => {
  return {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const token = configService.get<string>('TELEGRAM_BOT_TOKEN', 'telegram-bot-token');
      if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

      return { token };
    },
  };
};
