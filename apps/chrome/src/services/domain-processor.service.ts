import { Injectable, Logger } from '@nestjs/common';
import { DomainWarningFeedRepository } from '../modules/domain-warning/repository/domain-warning-feed.repository';
import { BrowserService } from './browser.service';

@Injectable()
export class DomainProcessorService {
  private readonly logger = new Logger(DomainProcessorService.name);

  constructor(
    private readonly domainWarningFeedRepository: DomainWarningFeedRepository,
    private readonly browserService: BrowserService,
  ) {}

  async processDomain(domain: { id: number; name: string; status: string }, correlationId?: string): Promise<void> {
    this.logger.log({
      message: `Processing domain: ${domain.name} (ID: ${domain.id})`,
      correlationId,
    });

    try {
      const hasWarning = await this.browserService.checkDomainWithRetry(domain.name);

      await this.domainWarningFeedRepository.upsert(domain.id, hasWarning);

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

      await this.domainWarningFeedRepository.upsert(domain.id, false);
    }
  }
}
