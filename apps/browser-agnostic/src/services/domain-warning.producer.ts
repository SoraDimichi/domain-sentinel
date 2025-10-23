import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { BrowserType } from '../modules/domain-warning/models/domain-warning-feed.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DomainWarningProducer {
  private readonly logger = new Logger(DomainWarningProducer.name);
  private readonly browserType: BrowserType;

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {
    this.browserType = this.configService.get<BrowserType>('BROWSER_TYPE') || BrowserType.CHROME;
  }

  async publishDomainWarning(
    domain: { id: number; name: string },
    hasWarning: boolean,
    browserType: BrowserType = this.browserType,
  ): Promise<void> {
    const topic = 'domain-warning';
    const message = {
      domain,
      hasWarning,
      browserType,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`Publishing domain warning for ${domain.name} (ID: ${domain.id})`);

    try {
      await this.kafkaClient.emit(topic, message).toPromise();
      this.logger.log(`Domain warning published for ${domain.name}`);
    } catch (error) {
      this.logger.error(`Error publishing domain warning: ${error.message}`);
      throw error;
    }
  }
}
