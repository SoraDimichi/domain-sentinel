import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserType } from '../modules/domain-warning/models/domain-warning-feed.entity';
import { DomainWarningFeedRepository } from '../modules/domain-warning/repository/domain-warning-feed.repository';
import { BrowserService } from './browser.service';
import { DomainWarningProducer } from './domain-warning.producer';

@Injectable()
export class DomainProcessorService {
  private readonly logger = new Logger(DomainProcessorService.name);
  private readonly browserType: BrowserType;

  constructor(
    private readonly domainWarningFeedRepository: DomainWarningFeedRepository,
    private readonly browserService: BrowserService,
    private readonly domainWarningProducer: DomainWarningProducer,
    private readonly configService: ConfigService,
  ) {
    this.browserType = this.configService.get<BrowserType>('BROWSER_TYPE') || BrowserType.CHROME;
  }

  async processDomain(domain: { id: number; name: string; status: string }, correlationId?: string): Promise<void> {
    this.logger.log({
      message: `Processing domain: ${domain.name} (ID: ${domain.id})`,
      correlationId,
    });

    try {
      const hasWarning = await this.browserService.checkDomainWithRetry(domain.name);

      await this.domainWarningFeedRepository.upsert(domain.id, hasWarning);

      if (hasWarning) {
        await this.domainWarningProducer.publishDomainWarning(
          { id: domain.id, name: domain.name },
          hasWarning,
          this.browserType
        );
      }

      this.logger.log({
        message: `Domain ${domain.name} processed: ${hasWarning ? 'Warning detected' : 'No warning'}`,
        correlationId,
        domainId: domain.id,
        hasWarning,
        browserType: this.browserType,
      });
    } catch (error) {
      this.logger.error({
        message: `Error processing domain ${domain.name}: ${error.message}`,
        correlationId,
        domainId: domain.id,
        error: error.stack,
        browserType: this.browserType,
      });

      await this.domainWarningFeedRepository.upsert(domain.id, false);
    }
  }
}
