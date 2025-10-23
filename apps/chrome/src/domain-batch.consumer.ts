import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DomainProcessorService } from './services/domain-processor.service';
import { domainBatchMessageSchema } from './modules/domain-warning/models/domain-batch-message';

@Controller()
export class DomainBatchConsumer {
  private readonly logger = new Logger(DomainBatchConsumer.name);

  constructor(private readonly domainProcessorService: DomainProcessorService) {}

  @MessagePattern('domain-batches')
  async handleDomainBatch(@Payload() message: unknown) {
    try {
      const parsedMessage = domainBatchMessageSchema.parse(message);
      const correlationId = parsedMessage.batchId;

      this.logger.log({
        message: `Received domain batch`,
        correlationId,
        domainsCount: parsedMessage.domains.length,
        timestamp: parsedMessage.timestamp,
      });

      for (const domain of parsedMessage.domains) {
        await this.domainProcessorService.processDomain(domain, correlationId);
      }

      this.logger.log({
        message: `Successfully processed domain batch`,
        correlationId,
        domainsCount: parsedMessage.domains.length,
      });
    } catch (error) {
      this.logger.error(`Error processing domain batch: ${error.message}`);
    }
  }
}
