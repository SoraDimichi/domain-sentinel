import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TelegramBotService } from './telegram-bot.service';
import { z } from 'zod';

const domainWarningMessageSchema = z.object({
  domainId: z.number().int().positive(),
  domainName: z.string().min(1),
  hasWarning: z.boolean(),
  browserType: z.string().min(1),
  timestamp: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

@Controller()
export class DomainWarningConsumer {
  private readonly logger = new Logger(DomainWarningConsumer.name);

  constructor(private readonly telegramBotService: TelegramBotService) {}

  @MessagePattern('domain-warnings')
  async handleDomainWarning(@Payload() message: unknown) {
    try {
      this.logger.log(`Received domain warning message: ${JSON.stringify(message)}`);

      const parsedMessage = domainWarningMessageSchema.parse(message);

      if (parsedMessage.hasWarning) {
        await this.telegramBotService.sendDomainWarningNotification(
          {
            id: parsedMessage.domainId,
            name: parsedMessage.domainName,
          },
          parsedMessage.browserType,
        );

        this.logger.log(`Notification sent for domain ${parsedMessage.domainName}`);
      } else {
        this.logger.log(`No warning for domain ${parsedMessage.domainName}, notification not sent`);
      }
    } catch (error) {
      this.logger.error(`Error processing domain warning message: ${error.message}`, error.stack);
    }
  }
}
