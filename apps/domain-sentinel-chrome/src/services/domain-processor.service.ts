import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DomainWarningFeed, DomainWarningFeedDocument, BrowserType } from '../models/domain-warning-feed.entity';
import { BrowserService } from './browser.service';

@Injectable()
export class DomainProcessorService {
  private readonly logger = new Logger(DomainProcessorService.name);

  constructor(
    @InjectModel(DomainWarningFeed.name)
    private readonly domainWarningFeedModel: Model<DomainWarningFeedDocument>,
    private readonly browserService: BrowserService,
  ) {}

  async processDomain(domain: { id: number; name: string; status: string }, correlationId?: string): Promise<void> {
    this.logger.log({
      message: `Processing domain: ${domain.name} (ID: ${domain.id})`,
      correlationId,
    });

    try {
      // Check if domain has a warning
      const hasWarning = await this.browserService.checkDomainWithRetry(domain.name);

      // Save result to feed schema
      const domainWarningFeed = new this.domainWarningFeedModel({
        domainId: domain.id,
        hasWarning: hasWarning,
        browserType: BrowserType.CHROME,
      });
      await domainWarningFeed.save();

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

      // Save error result
      const domainWarningFeed = new this.domainWarningFeedModel({
        domainId: domain.id,
        hasWarning: false,
        browserType: BrowserType.CHROME,
      });
      await domainWarningFeed.save();
    }
  }
}
