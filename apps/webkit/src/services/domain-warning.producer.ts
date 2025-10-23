import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { BrowserType } from '../modules/domain-warning/models/domain-warning-feed.entity';

@Injectable()
export class DomainWarningProducer {
  private readonly logger = new Logger(DomainWarningProducer.name);

  constructor(@Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientProxy) {}

  async publishDomainWarning(domain: { id: number; name: string }, hasWarning: boolean, browserType: BrowserType): Promise<void> {
    try {
      if (!hasWarning) {
        // Only publish warnings, not non-warnings
        return;
      }

      const message = {
        domainId: domain.id,
        domainName: domain.name,
        hasWarning,
        browserType,
        timestamp: new Date(),
      };

      this.logger.log(`Publishing domain warning for ${domain.name} to Kafka`);

      await this.kafkaClient.emit('domain-warnings', message).toPromise();

      this.logger.log(`Successfully published domain warning for ${domain.name}`);
    } catch (error) {
      this.logger.error(`Error publishing domain warning: ${error.message}`, error.stack);
    }
  }
}
