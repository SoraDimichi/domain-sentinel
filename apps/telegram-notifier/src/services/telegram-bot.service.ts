import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly chatId: string;

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly configService: ConfigService,
  ) {
    // Get the chat ID from environment variables
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID', '');

    if (!this.chatId) {
      this.logger.warn('TELEGRAM_CHAT_ID is not set. Notifications will not be sent.');
    }
  }

  /**
   * Send a domain warning notification to the configured Telegram group
   * @param domain The domain information
   * @param browserType The browser type that detected the warning
   */
  async sendDomainWarningNotification(domain: { id: number; name: string }, browserType: string): Promise<void> {
    try {
      if (!this.chatId) {
        this.logger.warn('Cannot send notification: TELEGRAM_CHAT_ID is not set');
        return;
      }

      const message = `⚠️ *DOMAIN WARNING DETECTED* ⚠️\n\n` +
        `*Domain:* ${domain.name}\n` +
        `*ID:* ${domain.id}\n` +
        `*Browser:* ${browserType}\n` +
        `*Detected at:* ${new Date().toISOString()}\n\n` +
        `This domain has been flagged for security concerns.`;

      await this.bot.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`Notification sent to Telegram chat ${this.chatId} for domain ${domain.name}`);
    } catch (error) {
      this.logger.error(`Failed to send Telegram notification: ${error.message}`, error.stack);
    }
  }
}
