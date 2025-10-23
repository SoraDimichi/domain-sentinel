import { Injectable, Logger } from '@nestjs/common';
import { BrowserType } from '../modules/domain-warning/models/domain-warning-feed.entity';
import { DomainWarningFeedRepository } from '../modules/domain-warning/repository/domain-warning-feed.repository';
import { BrowserService } from './browser.service';
import { DomainWarningProducer } from './domain-warning.producer';

@Injectable()
export class DomainProcessorService {
  private readonly logger = new Logger(DomainProcessorService.name);

  constructor(
    private readonly domainWarningFeedRepository: DomainWarningFeedRepository,
    private readonly browserService: BrowserService,
    private readonly domainWarningProducer: DomainWarningProducer,
  ) {}

  async processDomain(domain: { id: number; name: string; status: string }, correlationId?: string): Promise<void> {
    this.logger.log({
      message: `Processing domain: ${domain.name} (ID: ${domain.id})`,
      correlationId,
    });

    try {
      // Check if domain has a warning
      const hasWarning = await this.browserService.checkDomainWithRetry(domain.name);

      // Save result using repository
      await this.domainWarningFeedRepository.upsert(domain.id, hasWarning);

      // If a warning is detected, publish it to Kafka for the Telegram bot
      if (hasWarning) {
        await this.domainWarningProducer.publishDomainWarning(
          { id: domain.id, name: domain.name },
          hasWarning,
          BrowserType.WEBKIT
        );
      }

      this.logger.log({
        message: `Domain ${domain.name} processed: ${hasWarning ? 'Warning detected' : 'No warning'}`,
        correlationId,
        domainId: domain.id,
        hasWarning,
      });
    } catch (error) {
      this.logger.error({
        message: `Error processing domain ${domain.name}: ${error.message}`,
        correlationId,
        domainId: domain.id,
        error: error.stack,
      });

      // Save error result using repository
      await this.domainWarningFeedRepository.upsert(domain.id, false);
    }
  }
}
