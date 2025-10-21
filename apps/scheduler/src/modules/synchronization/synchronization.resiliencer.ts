import { Injectable, Logger } from '@nestjs/common';
import { SynchronizationService } from './synchronization.service';

@Injectable()
export class SynchronizationResiliencer {
  private readonly logger = new Logger(SynchronizationResiliencer.name);

  private consecutiveFailures = 0;
  private readonly maxConsecutiveFailures = 3;

  constructor(private readonly domainsFetcherService: SynchronizationService) {}

  async sync() {
    this.logger.log('Starting domain synchronization process...');
    try {
      await this.domainsFetcherService.fetchDomains();

      if (this.consecutiveFailures > 0) {
        this.logger.log(`Resetting consecutive failures counter (was ${this.consecutiveFailures})`);
        this.consecutiveFailures = 0;
      }

      this.logger.log('Domain synchronization completed successfully');
    } catch (error) {
      this.consecutiveFailures++;

      this.logger.error(
        `Domain synchronization failed (attempt ${this.consecutiveFailures}/${this.maxConsecutiveFailures}): ${error.message}`,
        error.stack,
      );

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.logger.warn(
          `Reached maximum consecutive failures (${this.maxConsecutiveFailures}). Using database as fallback until API becomes available again.`,
        );
      }
    }
  }
}
