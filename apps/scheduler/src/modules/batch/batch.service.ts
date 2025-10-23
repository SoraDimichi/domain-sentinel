import { Injectable, Logger } from '@nestjs/common';
import { setImmediate } from 'timers/promises';
import { ConfigService } from '@nestjs/config';
import { DomainRepository } from '../repository/domain.repository';
import { createDomainBatchMessage } from './batch.model';
import { DomainBatchProducer } from './batch.producer';

@Injectable()
export class DomainBatchService {
  private readonly logger = new Logger(DomainBatchService.name);
  private readonly batchSize: number;

  constructor(
    private readonly domainRepository: DomainRepository,
    private readonly configService: ConfigService,
    private readonly domainBatchProducer: DomainBatchProducer,
  ) {
    this.batchSize = this.configService.get<number>('scheduler.batchSize', 10);
  }

  private async fetchAndSendBatch(batchIndex: number, batchCount: number): Promise<number> {
    const domains = await this.domainRepository.findAll({
      skip: batchIndex * this.batchSize,
      limit: this.batchSize,
    });

    if (domains.length === 0) {
      this.logger.warn(`No domains found for batch ${batchIndex + 1}`);
      return 0;
    }

    const batchMessage = createDomainBatchMessage({
      domains: domains.map((domain) => ({
        id: domain.id,
        name: domain.name,
        status: domain.status as 'active' | 'inactive' | 'pending',
      })),
    });

    this.logger.debug(`Preparing batch ${batchIndex + 1}/${batchCount} with ${domains.length} domains`);

    this.domainBatchProducer.sendMessage(batchMessage);
    this.logger.log(`Successfully sent batch ${batchIndex + 1}/${batchCount} with ${domains.length} domains`);

    return domains.length;
  }

  async sendDomainBatch(): Promise<void> {
    const totalDomains = await this.domainRepository.count();

    if (totalDomains === 0) {
      return this.logger.warn('No domains found in the database');
    }

    this.logger.log(`Processing ${totalDomains} domains in batches of ${this.batchSize}`);

    const batchCount = Math.ceil(totalDomains / this.batchSize);
    this.logger.log(`Will send ${batchCount} batches in this cycle`);

    let processedDomains = 0;

    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const domainsProcessed = await this.fetchAndSendBatch(batchIndex, batchCount);
      processedDomains += domainsProcessed;

      this.logger.debug(
        `Batch ${batchIndex + 1}/${batchCount} processing completed (${processedDomains}/${totalDomains} domains processed)`,
      );

      if (batchIndex < batchCount - 1) {
        this.logger.debug('Resetting event loop to free memory with setImmediate');
        await setImmediate();
      }
    }

    this.logger.log(`Completed sending all ${batchCount} batches (${processedDomains}/${totalDomains} domains processed)`);
  }
}
