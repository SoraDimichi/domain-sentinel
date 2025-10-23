import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModuleAsyncOptions } from 'nestjs-telegraf';

export const getTelegramConfig = (): TelegrafModuleAsyncOptions => {
  return {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const token = configService.get<string>('TELEGRAM_BOT_TOKEN', '8388900730:AAF93QAQ8yYW4bdLr4JSzJyQyJ0yQQILRjw');
      if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

      return { token };
    },
  };
};
