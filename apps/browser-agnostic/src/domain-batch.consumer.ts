import { Controller, Logger } from '@nestjs/common';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import type { DomainBatchMessage } from './modules/domain-warning/models/domain-batch-message';
import { DomainProcessorService } from './services/domain-processor.service';

@Controller()
export class DomainBatchConsumer {
  private readonly logger = new Logger(DomainBatchConsumer.name);

  constructor(private readonly domainProcessorService: DomainProcessorService) {}

  @MessagePattern('domain-batches')
  async consumeDomainBatch(@Payload() message: DomainBatchMessage, @Ctx() context: KafkaContext): Promise<void> {
    const { correlationId, domains } = message;
    const originalMessage = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();

    this.logger.log({
      message: `Received domain batch with ${domains.length} domains`,
      correlationId,
      partition,
      topic,
      offset: originalMessage.offset,
    });

    for (const domain of domains) {
      await this.domainProcessorService.processDomain(domain, correlationId);
    }

    this.logger.log({
      message: `Processed domain batch with ${domains.length} domains`,
      correlationId,
    });
  }
}
