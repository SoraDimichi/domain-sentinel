import { Injectable, Logger } from '@nestjs/common';
import { HttpClientProvider } from './http-client.provider';
import { DomainService } from '../domain/domain.repository';
import { z } from 'zod';
import { DomainData, domainSchema } from '../domain/domain.schema';

const domainsApiResponseSchema = z.array(domainSchema);

@Injectable()
export class DomainsFetcherService {
  private readonly logger = new Logger(DomainsFetcherService.name);
  private readonly apiKey = '16f64a5c0fabf9280f68eb708eb85a63';
  private readonly apiEndpoint = 'https://horcrux.info/admin_api/v1/domains';

  constructor(
    private readonly httpClient: HttpClientProvider,
    private readonly domainService: DomainService,
  ) {}

  async fetchDomains(): Promise<void> {
    try {
      this.logger.log('Fetching domains from API...');

      const domains = await this.httpClient.query(this.apiEndpoint, domainsApiResponseSchema, {
        api_key: this.apiKey,
      });

      this.logger.log(`Successfully fetched ${domains.length} domains`);

      for await (const domainData of domains) this.processDomain(domainData);

      this.logger.log('Domain synchronization completed successfully');
    } catch (error) {
      this.logger.error(`Failed to fetch domains: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async processDomain(domainData: DomainData): Promise<void> {
    try {
      const existingDomain = await this.domainService.findByName(domainData.name);

      if (existingDomain) {
        await this.domainService.update(existingDomain.id, domainData);
        this.logger.debug(`Updated domain: ${domainData.name}`);
      } else {
        await this.domainService.create(domainData);
        this.logger.debug(`Created new domain: ${domainData.name}`);
      }
    } catch (error) {
      this.logger.error(`Error processing domain ${domainData.name}: ${error.message}`);
    }
  }
}
